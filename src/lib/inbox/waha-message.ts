// ============================================
// Interprétation d'un message WAHA (webhook ou historique)
// ============================================
// Champs utilisés, vérifiés sur l'instance (WAHA 2026.10.1, moteur WEBJS) :
// id, timestamp (s), from, to, fromMe, body, hasMedia, media{url,mimetype,filename},
// ack, replyTo, _data.type, _data.caption, _data.mimetype.

import { wahaAckToStatus, type MessageStatus } from './acks'
import { isPrivateChatId } from './phones'

export type InboxMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'order'
  | 'product'
  | 'unknown'

export type MediaKind = 'image' | 'video' | 'audio' | 'document' | 'sticker'

export interface DescribedMessage {
  id: string
  chatId: string
  fromMe: boolean
  type: InboxMessageType
  /** Type brut du moteur (pour journaliser les types inconnus). */
  rawType: string | null
  text: string | null
  /** Chemin WAHA du fichier complet (/api/files/...), relayé par une route serveur. */
  mediaPath: string | null
  mediaKind: MediaKind | null
  mediaMimetype: string | null
  filename: string | null
  sentAt: Date
  status: MessageStatus | null
  senderName: string | null
  context: Record<string, unknown>
  preview: string
}

export type DescribeResult =
  | { kind: 'message'; message: DescribedMessage }
  | { kind: 'ignored'; reason: string }

/** Types WEBJS sans contenu utile pour la messagerie. */
const IGNORED_TYPES = new Set([
  'e2e_notification',
  'notification',
  'notification_template',
  'gp2',
  'call_log',
  'revoked',
  'reaction',
  'protocol',
  'ciphertext',
  'poll_creation',
  'poll_update',
  'album',
  'pinned_message',
  'keep_in_chat',
  'broadcast_notification',
])

const TYPE_MAP: Record<string, InboxMessageType> = {
  chat: 'text',
  interactive: 'text',
  buttons_response: 'text',
  list_response: 'text',
  template_button_reply: 'text',
  image: 'image',
  video: 'video',
  ptt: 'audio',
  audio: 'audio',
  document: 'document',
  sticker: 'sticker',
  location: 'location',
  vcard: 'contact',
  multi_vcard: 'contact',
  order: 'order',
  product: 'product',
}

const MEDIA_KIND: Partial<Record<InboxMessageType, MediaKind>> = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
  sticker: 'sticker',
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/** Garde uniquement le chemin /api/files/... (l'hôte WAHA interne n'est pas joignable du navigateur). */
export function wahaFilePath(url: unknown): string | null {
  const raw = str(url)
  if (!raw) return null
  try {
    const parsed = new URL(raw, 'http://waha.invalid')
    return parsed.pathname.startsWith('/api/files/') ? parsed.pathname + parsed.search : null
  } catch {
    return null
  }
}

function typeFromMime(mime: string | null): InboxMessageType {
  if (!mime) return 'document'
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'document'
}

/** Aperçu court affiché dans la liste des conversations. */
export function previewFor(type: InboxMessageType, text: string | null, filename: string | null): string {
  const t = text?.trim()
  switch (type) {
    case 'image':
      return t ? `📷 ${t}` : '📷 Photo'
    case 'video':
      return t ? `🎥 ${t}` : '🎥 Vidéo'
    case 'audio':
      return '🎤 Vocal'
    case 'document':
      return `📄 ${filename ?? t ?? 'Document'}`
    case 'sticker':
      return 'Autocollant'
    case 'location':
      return '📍 Position'
    case 'contact':
      return '👤 Contact'
    case 'order':
      return '🛒 Panier'
    case 'product':
      return t ? `🛍️ ${t}` : '🛍️ Produit'
    default:
      return t ?? 'Message'
  }
}

/**
 * Transforme un message WAHA en message de la messagerie, ou explique
 * pourquoi il est ignoré (groupe, chaîne, notification système…).
 *
 * @example
 * const r = describeWahaMessage(event.payload)
 * if (r.kind === 'message') await ingest(r.message)
 */
export function describeWahaMessage(raw: unknown): DescribeResult {
  const m = obj(raw)
  if (!m) return { kind: 'ignored', reason: 'payload invalide' }

  const id = str(m.id) ?? str(obj(m.id)?._serialized)
  if (!id) return { kind: 'ignored', reason: 'sans identifiant' }

  const fromMe = m.fromMe === true
  const chatId = fromMe ? str(m.to) : str(m.from)
  if (!isPrivateChatId(chatId)) return { kind: 'ignored', reason: 'discussion non privée' }

  const data = obj(m._data) ?? {}
  const rawType = str(data.type)
  if (rawType && IGNORED_TYPES.has(rawType)) return { kind: 'ignored', reason: `type ${rawType}` }

  const media = obj(m.media)
  const mediaMimetype = str(media?.mimetype) ?? str(data.mimetype)
  let type: InboxMessageType
  if (rawType) type = TYPE_MAP[rawType] ?? 'unknown'
  else if (m.hasMedia === true) type = typeFromMime(mediaMimetype)
  else type = 'text'

  const text = str(m.body) ?? str(data.caption)
  const filename = str(media?.filename)
  const mediaKind = MEDIA_KIND[type] ?? null
  const timestamp = typeof m.timestamp === 'number' ? m.timestamp : null

  const context: Record<string, unknown> = {}
  const reply = obj(m.replyTo)
  if (reply) {
    context.quoted = { id: str(reply.id), body: str(reply.body) }
  }
  // Publicité d'origine (« Envoyer un message ») — à confirmer sur un vrai clic :
  // non observé sur l'instance au 2026-10-31.
  const ad = obj(data.ctwaContext)
  if (ad) context.ad = ad

  return {
    kind: 'message',
    message: {
      id,
      chatId: chatId as string,
      fromMe,
      type,
      rawType,
      text,
      mediaPath: mediaKind ? wahaFilePath(media?.url) : null,
      mediaKind,
      mediaMimetype,
      filename,
      sentAt: timestamp !== null ? new Date(timestamp * 1000) : new Date(),
      status: fromMe ? wahaAckToStatus(m.ack) : null,
      senderName: fromMe ? null : str(data.notifyName),
      context,
      preview: previewFor(type, text, filename),
    },
  }
}
