// ============================================
// Formes échangées entre les routes de la messagerie et l'interface
// ============================================
// Aucune donnée interne inutile (identifiants WAHA, chemins de fichiers) ne
// sort vers le navigateur : les médias passent par un jeton opaque.

import type { MessageStatus } from './acks'
import type { ConversationStatus } from './conversation-rules'
import { formatPhone } from './list'

export interface ConversationListItem {
  id: string
  name: string | null
  phoneDisplay: string
  status: ConversationStatus
  unread: number
  assignedTo: string | null
  assignedName: string | null
  mine: boolean
  pinned: boolean
  lastMessageAt: string | null
  preview: string | null
  lastOutboundStatus: MessageStatus | null
  purchaseStage: string | null
  intent: number | null
}

export interface ConversationDetail extends ConversationListItem {
  note: string | null
  assignedAt: string | null
  source: { type: 'ad' | 'direct'; title: string | null; url: string | null } | null
  historySyncedAt: string | null
}

export interface ThreadMessageDto {
  ref: string
  fromMe: boolean
  type: string
  text: string | null
  mediaKind: 'image' | 'video' | 'audio' | 'document' | 'sticker' | null
  mediaUrl: string | null
  filename: string | null
  /** Auteur affiché pour nos messages ; null pour les messages du client. */
  author: string | null
  sentAt: string
  status: MessageStatus | null
  quoted: string | null
  ad: { title: string | null; body: string | null; url: string | null } | null
}

export interface InboxCounts {
  toReply: number
  mine: number
  pinned: number
}

type Row = Record<string, unknown>

const s = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null)
const n = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function toListItem(row: Row, meId: string, pins: Set<string>): ConversationListItem {
  const id = String(row.id)
  return {
    id,
    name: s(row.name),
    phoneDisplay: formatPhone(s(row.phone)),
    status: (s(row.status) ?? 'open') as ConversationStatus,
    unread: n(row.unread_count) ?? 0,
    assignedTo: s(row.assigned_to),
    assignedName: s(row.assigned_name),
    mine: row.assigned_to === meId,
    pinned: pins.has(id),
    lastMessageAt: s(row.last_message_at),
    preview: s(row.last_message_preview),
    lastOutboundStatus: s(row.last_outbound_status) as MessageStatus | null,
    purchaseStage: s(row.purchase_stage),
    intent: n(row.purchase_intent_score),
  }
}

function adFrom(value: unknown): { title: string | null; body: string | null; url: string | null } | null {
  if (!value || typeof value !== 'object') return null
  const a = value as Row
  // Champs WEBJS « ctwaContext » attendus (non encore observés sur l'instance)
  return { title: s(a.title), body: s(a.description), url: s(a.sourceUrl) }
}

export function toDetail(row: Row, meId: string, pins: Set<string>): ConversationDetail {
  const source = row.source && typeof row.source === 'object' ? (row.source as Row) : null
  const ad = source?.type === 'ad' ? adFrom(source.ad) : null
  return {
    ...toListItem(row, meId, pins),
    note: s(row.note),
    assignedAt: s(row.assigned_at),
    source: source ? { type: ad ? 'ad' : 'direct', title: ad?.title ?? null, url: ad?.url ?? null } : null,
    historySyncedAt: s(row.history_synced_at),
  }
}

export function toThreadMessage(row: Row): ThreadMessageDto {
  const context = row.context && typeof row.context === 'object' ? (row.context as Row) : {}
  const quoted = context.quoted && typeof context.quoted === 'object' ? s((context.quoted as Row).body) : null
  const fromMe = row.from_me === true
  const hasMedia = s(row.media_url) !== null
  return {
    ref: String(row.public_ref),
    fromMe,
    type: s(row.type) ?? 'text',
    text: s(row.text),
    mediaKind: s(row.media_kind) as ThreadMessageDto['mediaKind'],
    mediaUrl: hasMedia ? `/api/inbox/media/${encodeURIComponent(String(row.public_ref))}` : null,
    filename: s(row.filename),
    author: fromMe ? (s(row.sender_name) ?? (s(row.sent_by) ? 'Équipe' : 'Depuis le téléphone')) : null,
    sentAt: String(row.sent_at),
    status: s(row.status) as MessageStatus | null,
    quoted,
    ad: adFrom(context.ad),
  }
}
