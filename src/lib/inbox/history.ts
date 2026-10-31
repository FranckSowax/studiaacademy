// ============================================
// Reprise d'historique depuis WAHA (serveur uniquement)
// ============================================
// Rattrape les messages antérieurs à la mise en service et ceux que
// l'ingestion ignorait avant une correction. N'écrase JAMAIS un message
// connu (l'auteur enregistré est plus précis que celui du fournisseur).

import { createAdminClient } from '@/lib/supabase/admin'
import { fetchChatMessages } from '@/lib/whatsapp'
import type { MessageStatus } from './acks'
import { recomputeSummary, type ConversationStatus, type ThreadMessage } from './conversation-rules'
import { describeWahaMessage, previewFor, type InboxMessageType } from './waha-message'

const HISTORY_LIMIT = 100

export interface SyncResult {
  fetched: number
  added: number
}

/**
 * Récupère les 100 derniers messages de la discussion chez WAHA, ajoute ceux
 * qui manquent, puis recalcule le résumé de la conversation depuis le fil
 * complet (dernier message, non-lus, statut).
 */
export async function syncConversationHistory(conversationId: string): Promise<SyncResult> {
  const admin = createAdminClient()
  const { data: conv, error } = await admin
    .from('wa_conversations')
    .select('id, chat_id, status, last_message_at')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw new Error(`lecture conversation: ${error.code ?? ''}`)
  if (!conv) throw new Error('conversation introuvable')

  const raw = await fetchChatMessages(conv.chat_id, HISTORY_LIMIT)
  const rows = []
  for (const item of raw) {
    const d = describeWahaMessage(item)
    if (d.kind !== 'message') continue
    const m = d.message
    rows.push({
      id: m.id,
      conversation_id: conv.id,
      chat_id: conv.chat_id,
      from_me: m.fromMe,
      type: m.type,
      text: m.text,
      media_url: m.mediaPath,
      media_kind: m.mediaKind,
      media_mimetype: m.mediaMimetype,
      filename: m.filename,
      sender_name: m.senderName,
      sent_by: null,
      sent_at: m.sentAt.toISOString(),
      status: m.status,
      status_at: m.status ? new Date().toISOString() : null,
      context: m.context,
    })
  }

  let added = 0
  if (rows.length > 0) {
    // ignoreDuplicates : les messages déjà connus restent intacts.
    const { data: inserted, error: insertError } = await admin
      .from('wa_messages')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
      .select('id')
    if (insertError) throw new Error(`insertion historique: ${insertError.code ?? ''}`)
    added = inserted?.length ?? 0
  }

  const { data: thread, error: threadError } = await admin
    .from('wa_messages')
    .select('id, from_me, type, text, filename, sent_at, status')
    .eq('conversation_id', conv.id)
    .order('sent_at', { ascending: true })
    .limit(5000)
  if (threadError) throw new Error(`lecture fil: ${threadError.code ?? ''}`)

  const messages: ThreadMessage[] = (thread ?? []).map((t) => ({
    id: t.id as string,
    fromMe: t.from_me as boolean,
    text: (t.text as string | null) ?? null,
    preview: previewFor(t.type as InboxMessageType, (t.text as string | null) ?? null, (t.filename as string | null) ?? null),
    sentAt: new Date(t.sent_at as string),
    status: (t.status as MessageStatus | null) ?? null,
  }))

  const summary = recomputeSummary(messages, {
    status: conv.status as ConversationStatus,
    last_message_at: conv.last_message_at as string | null,
  })

  const { error: updateError } = await admin
    .from('wa_conversations')
    .update({ ...summary, history_synced_at: new Date().toISOString() })
    .eq('id', conv.id)
  if (updateError) throw new Error(`mise à jour résumé: ${updateError.code ?? ''}`)

  return { fetched: raw.length, added }
}
