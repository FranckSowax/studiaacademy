// ============================================
// Ingestion des messages WAHA dans les tables de suivi (serveur uniquement)
// ============================================
// Ne modifie jamais le fil WhatsApp : on SUIT ce que WAHA rapporte.

import { createAdminClient } from '@/lib/supabase/admin'
import { resolveLidToPhone } from '@/lib/whatsapp'
import { mergeStatus, wahaAckToStatus, type MessageStatus } from './acks'
import { applyMessage, type ConversationState, type ConversationStatus } from './conversation-rules'
import { phoneFromChatId } from './phones'
import type { DescribedMessage } from './waha-message'

type Admin = ReturnType<typeof createAdminClient>

const MIGRATION = '20261031120000_wa_inbox'

/** Erreur explicite quand le code tourne sur une base sans la migration. */
export class InboxMigrationMissingError extends Error {
  constructor() {
    super(`Migration ${MIGRATION} non appliquée : tables wa_* absentes`)
    this.name = 'InboxMigrationMissingError'
  }
}

function check(error: { code?: string; message?: string } | null, context: string): void {
  if (!error) return
  // 42P01 : relation inexistante (table absente)
  if (error.code === '42P01' || error.code === 'PGRST205') throw new InboxMigrationMissingError()
  throw new Error(`${context}: ${error.code ?? ''} ${error.message ?? ''}`.trim())
}

interface ConversationRow extends ConversationState {
  id: string
  chat_id: string
  phone: string | null
  source: unknown
}

async function findOrCreateConversation(
  admin: Admin,
  chatId: string,
  senderName: string | null,
): Promise<ConversationRow> {
  const { data: byChat, error } = await admin
    .from('wa_conversations')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle()
  check(error, 'lecture conversation')
  if (byChat) return byChat as ConversationRow

  // Même contact connu sous l'autre forme d'identifiant (@c.us ↔ @lid) ?
  const phone = phoneFromChatId(chatId) ?? (await resolveLidToPhone(chatId))
  if (phone) {
    const { data: byPhone, error: phoneError } = await admin
      .from('wa_conversations')
      .select('*')
      .eq('phone', phone)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    check(phoneError, 'lecture conversation par numéro')
    if (byPhone) {
      const row = byPhone as ConversationRow
      // WHY: WhatsApp rapporte désormais les discussions en @lid ; on aligne
      // l'identifiant pour que l'écho de nos envois retombe sur la même ligne.
      if (row.chat_id.endsWith('@c.us') && chatId.endsWith('@lid')) {
        const { error: alignError } = await admin
          .from('wa_conversations')
          .update({ chat_id: chatId })
          .eq('id', row.id)
        if (!alignError) row.chat_id = chatId
      }
      return row
    }
  }

  const { error: insertError } = await admin
    .from('wa_conversations')
    .upsert(
      { chat_id: chatId, phone, name: senderName, status: 'open', source: { type: 'direct' } },
      { onConflict: 'chat_id', ignoreDuplicates: true },
    )
  check(insertError, 'création conversation')

  const { data: created, error: reloadError } = await admin
    .from('wa_conversations')
    .select('*')
    .eq('chat_id', chatId)
    .single()
  check(reloadError, 'relecture conversation')
  return created as ConversationRow
}

export interface IngestOptions {
  /** Auteur côté équipe (id collaborateur ou 'admin') pour un envoi depuis l'interface. */
  sentBy?: string | null
  senderName?: string | null
}

export interface IngestResult {
  conversationId: string
  /** true si le message était déjà connu (écho, webhook rejoué, reprise d'historique). */
  duplicate: boolean
}

/**
 * Enregistre un message (dans les deux sens) et met à jour sa conversation.
 * Idempotent : l'identifiant WAHA est la clé primaire. Un message déjà connu
 * (écho de nos envois) ne voit ni son auteur ni son contenu écrasés ; seul son
 * accusé progresse.
 */
export async function ingestMessage(msg: DescribedMessage, options: IngestOptions = {}): Promise<IngestResult> {
  const admin = createAdminClient()
  const conv = await findOrCreateConversation(admin, msg.chatId, msg.fromMe ? null : msg.senderName)

  const { data: existing, error: existingError } = await admin
    .from('wa_messages')
    .select('id, status, media_url')
    .eq('id', msg.id)
    .maybeSingle()
  check(existingError, 'lecture message')

  if (existing) {
    const update: Record<string, unknown> = {}
    const merged = mergeStatus(existing.status as MessageStatus | null, msg.status)
    if (merged !== existing.status) {
      update.status = merged
      update.status_at = new Date().toISOString()
    }
    if (!existing.media_url && msg.mediaPath) update.media_url = msg.mediaPath
    if (Object.keys(update).length > 0) {
      const { error } = await admin.from('wa_messages').update(update).eq('id', msg.id)
      check(error, 'mise à jour message')
    }
    return { conversationId: conv.id, duplicate: true }
  }

  const { error: insertError } = await admin.from('wa_messages').upsert(
    {
      id: msg.id,
      conversation_id: conv.id,
      chat_id: msg.chatId,
      from_me: msg.fromMe,
      type: msg.type,
      text: msg.text,
      media_url: msg.mediaPath,
      media_kind: msg.mediaKind,
      media_mimetype: msg.mediaMimetype,
      filename: msg.filename,
      sender_name: options.senderName ?? msg.senderName,
      sent_by: options.sentBy ?? null,
      sent_at: msg.sentAt.toISOString(),
      status: msg.status,
      status_at: msg.status ? new Date().toISOString() : null,
      context: msg.context,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )
  check(insertError, 'insertion message')

  const patch: Record<string, unknown> = { ...applyMessage(conv, msg) }
  if (!msg.fromMe && msg.context.ad) patch.source = { type: 'ad', ad: msg.context.ad }
  const { error: updateError } = await admin.from('wa_conversations').update(patch).eq('id', conv.id)
  check(updateError, 'mise à jour conversation')

  return { conversationId: conv.id, duplicate: false }
}

/**
 * Applique un accusé de réception WAHA (événement message.ack).
 * Fusion monotone : un accusé ne fait jamais reculer un message.
 */
export async function applyAck(payload: unknown): Promise<void> {
  if (!payload || typeof payload !== 'object') return
  const p = payload as { id?: unknown; ack?: unknown }
  const id = typeof p.id === 'string' ? p.id : null
  const incoming = wahaAckToStatus(p.ack)
  if (!id || !incoming) return

  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('wa_messages')
    .select('id, status, sent_at, conversation_id')
    .eq('id', id)
    .maybeSingle()
  check(error, 'lecture message (accusé)')
  if (!row) return // message inconnu : il arrivera par l'événement message.any

  const merged = mergeStatus(row.status as MessageStatus | null, incoming)
  if (merged === row.status) return

  const { error: updateError } = await admin
    .from('wa_messages')
    .update({ status: merged, status_at: new Date().toISOString() })
    .eq('id', id)
  check(updateError, 'mise à jour accusé')

  // Coches de la liste : seulement si c'est notre dernier message sortant.
  const { error: convError } = await admin
    .from('wa_conversations')
    .update({ last_outbound_status: merged })
    .eq('id', row.conversation_id)
    .eq('last_outbound_at', row.sent_at)
  check(convError, 'mise à jour accusé conversation')
}

export type { ConversationStatus }
