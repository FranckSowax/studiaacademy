// ============================================
// Envoi depuis la messagerie (serveur uniquement)
// ============================================

import { createAdminClient } from '@/lib/supabase/admin'
import { markChatSeen, sendMediaToChat, sendTextToChat } from '@/lib/whatsapp'
import { toThreadMessage, type ThreadMessageDto } from './dto'
import type { InboxIdentity } from './identity'
import { ingestMessage } from './ingest'
import { mediaKindForMime, readLibraryFile } from './library'
import { describeWahaMessage } from './waha-message'

export const MAX_TEXT_LENGTH = 4096

export type InboxSendPayload =
  | { kind: 'text'; text: string }
  | { kind: 'library'; libraryId: string; caption?: string }

export class InboxSendError extends Error {}

/**
 * Inscrit dans le fil un message que NOUS venons d'envoyer, avec son auteur.
 * Crée la conversation au besoin et la marque répondue (via la règle
 * commune). Ne lève jamais : l'envoi WhatsApp est déjà parti, un échec
 * d'enregistrement ne doit pas le faire passer pour un échec d'envoi.
 *
 * @returns l'identifiant WAHA du message, ou null si non interprétable.
 */
export async function recordSentMessage(
  raw: unknown,
  author: Pick<InboxIdentity, 'id' | 'name'>,
): Promise<string | null> {
  try {
    const described = describeWahaMessage(raw)
    if (described.kind !== 'message') {
      console.warn('[inbox-send] réponse WAHA non interprétable:', described.reason)
      return null
    }
    await ingestMessage(described.message, { sentBy: author.id, senderName: author.name })
    return described.message.id
  } catch (error) {
    console.error('[inbox-send] enregistrement échoué:', error instanceof Error ? error.message : 'erreur')
    return null
  }
}

/**
 * Envoie un texte ou un fichier de la médiathèque dans une conversation,
 * l'inscrit avec son auteur, et attribue la conversation à la personne
 * si personne ne s'en occupait encore.
 */
export async function sendFromInbox(
  me: InboxIdentity,
  conversationId: string,
  payload: InboxSendPayload,
): Promise<ThreadMessageDto | null> {
  const admin = createAdminClient()
  const { data: conv } = await admin
    .from('wa_conversations')
    .select('id, chat_id, assigned_to')
    .eq('id', conversationId)
    .maybeSingle()
  if (!conv) throw new InboxSendError('Conversation introuvable')

  // Recommandation WAHA anti-blocage : « vu » avant de répondre.
  await markChatSeen(conv.chat_id)

  let raw: unknown
  if (payload.kind === 'text') {
    const text = payload.text.trim()
    if (!text) throw new InboxSendError('Message vide')
    if (text.length > MAX_TEXT_LENGTH) throw new InboxSendError('Message trop long (4096 caractères max)')
    raw = await sendTextToChat(conv.chat_id, text)
  } else {
    const file = await readLibraryFile(payload.libraryId)
    if (!file) throw new InboxSendError('Fichier introuvable dans la médiathèque')
    raw = await sendMediaToChat(
      conv.chat_id,
      mediaKindForMime(file.mime),
      { mimetype: file.mime, filename: file.filename, base64: Buffer.from(file.bytes).toString('base64') },
      (payload.caption ?? file.caption ?? '').trim().slice(0, 1000) || undefined,
    )
  }

  const messageId = await recordSentMessage(raw, me)

  // Première personne qui répond = responsable (sans bouton à cliquer avant).
  if (!conv.assigned_to) {
    await admin
      .from('wa_conversations')
      .update({ assigned_to: me.id, assigned_name: me.name, assigned_at: new Date().toISOString() })
      .eq('id', conv.id)
      .is('assigned_to', null)
  }

  if (!messageId) return null
  const { data: row } = await admin.from('wa_messages').select('*').eq('id', messageId).maybeSingle()
  return row ? toThreadMessage(row) : null
}
