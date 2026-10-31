// ============================================
// Règle de mise à jour d'une conversation — cœur de la messagerie
// ============================================
// Fonctions pures : aucune I/O. Utilisées par le webhook (message par message)
// et par la reprise d'historique (rejeu du fil complet).

import { isPoliteness } from './politeness'
import type { MessageStatus } from './acks'

export type ConversationStatus = 'open' | 'replied' | 'closed'

export interface ConversationState {
  status: ConversationStatus
  unread_count: number
  name: string | null
  last_message_at: string | null
  last_inbound_at: string | null
  last_outbound_at: string | null
}

export interface MessageFact {
  fromMe: boolean
  text: string | null
  preview: string
  sentAt: Date
  /** Nom affiché du client (poussé par WhatsApp), pour un message entrant. */
  senderName?: string | null
  status?: MessageStatus | null
}

export interface ConversationPatch {
  status?: ConversationStatus
  unread_count?: number
  name?: string
  last_message_at?: string
  last_message_preview?: string
  last_inbound_at?: string
  last_outbound_at?: string
  last_outbound_status?: MessageStatus | null
}

const PREVIEW_MAX = 160

function isAfterOrEqual(iso: string | null, date: Date): boolean {
  return iso === null || date.getTime() >= new Date(iso).getTime()
}

function laterIso(current: string | null, date: Date): string {
  if (current && new Date(current).getTime() > date.getTime()) return current
  return date.toISOString()
}

/**
 * Calcule la mise à jour d'une conversation après un message.
 *
 * - Message de nous (interface ou téléphone) : non-lus à 0, statut « répondue »
 *   — sauf conversation clôturée, qui le reste.
 * - Politesse du client sur une conversation répondue/clôturée : seuls l'aperçu
 *   et la date d'entrée bougent ; ni statut, ni non-lus.
 * - Tout autre message du client : statut « ouverte » (même clôturée), +1 non-lu,
 *   nom renseigné s'il manquait.
 *
 * Un message plus ancien que le dernier connu (livraison tardive) ne remplace
 * pas l'aperçu.
 *
 * @example
 * applyMessage(conv, { fromMe: false, text: 'Bonjour', preview: 'Bonjour', sentAt: new Date() })
 */
export function applyMessage(conv: ConversationState, msg: MessageFact): ConversationPatch {
  const patch: ConversationPatch = {}
  const isLatest = isAfterOrEqual(conv.last_message_at, msg.sentAt)
  if (isLatest) {
    patch.last_message_at = msg.sentAt.toISOString()
    patch.last_message_preview = msg.preview.slice(0, PREVIEW_MAX)
  }

  if (msg.fromMe) {
    patch.last_outbound_at = laterIso(conv.last_outbound_at, msg.sentAt)
    if (isAfterOrEqual(conv.last_outbound_at, msg.sentAt)) {
      patch.last_outbound_status = msg.status ?? null
    }
    // Une réponse plus ancienne que le dernier message du client ne le « traite » pas.
    if (isAfterOrEqual(conv.last_inbound_at, msg.sentAt)) {
      patch.unread_count = 0
      if (conv.status !== 'closed') patch.status = 'replied'
    }
    return patch
  }

  patch.last_inbound_at = laterIso(conv.last_inbound_at, msg.sentAt)
  if (!conv.name && msg.senderName) patch.name = msg.senderName

  const politeAfterReply =
    (conv.status === 'replied' || conv.status === 'closed') && isPoliteness(msg.text)
  if (politeAfterReply) return patch

  patch.status = 'open'
  patch.unread_count = conv.unread_count + 1
  return patch
}

export interface ThreadMessage extends MessageFact {
  id: string
}

export interface ConversationSummary {
  status: ConversationStatus
  unread_count: number
  last_message_at: string | null
  last_message_preview: string | null
  last_inbound_at: string | null
  last_outbound_at: string | null
  last_outbound_status: MessageStatus | null
}

/**
 * Recalcule le résumé d'une conversation depuis son fil COMPLET, en rejouant
 * la règle message par message (même logique que le temps réel, donc pas de
 * divergence). Une conversation clôturée le reste, sauf si un message du
 * client (hors politesse) est plus récent que ce que l'on connaissait.
 *
 * @param previous état connu avant la reprise (statut et date du dernier message)
 */
export function recomputeSummary(
  thread: ThreadMessage[],
  previous: { status: ConversationStatus; last_message_at: string | null },
): ConversationSummary {
  const sorted = [...thread].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())

  let state: ConversationState = {
    status: 'open',
    unread_count: 0,
    name: null,
    last_message_at: null,
    last_inbound_at: null,
    last_outbound_at: null,
  }
  let preview: string | null = null
  let outboundStatus: MessageStatus | null = null
  let lastReopeningInbound: Date | null = null

  for (const msg of sorted) {
    const patch = applyMessage(state, msg)
    if (!msg.fromMe && patch.status === 'open') lastReopeningInbound = msg.sentAt
    if (patch.last_message_preview !== undefined) preview = patch.last_message_preview
    if (patch.last_outbound_status !== undefined) outboundStatus = patch.last_outbound_status
    state = {
      status: patch.status ?? state.status,
      unread_count: patch.unread_count ?? state.unread_count,
      name: patch.name ?? state.name,
      last_message_at: patch.last_message_at ?? state.last_message_at,
      last_inbound_at: patch.last_inbound_at ?? state.last_inbound_at,
      last_outbound_at: patch.last_outbound_at ?? state.last_outbound_at,
    }
  }

  let status = state.status
  let unread = state.unread_count
  if (previous.status === 'closed') {
    const knownUntil = previous.last_message_at ? new Date(previous.last_message_at).getTime() : -Infinity
    const reopenedByNewMessage =
      status === 'open' && lastReopeningInbound !== null && lastReopeningInbound.getTime() > knownUntil
    if (!reopenedByNewMessage) {
      status = 'closed'
      unread = 0
    }
  }

  return {
    status,
    unread_count: unread,
    last_message_at: state.last_message_at,
    last_message_preview: preview,
    last_inbound_at: state.last_inbound_at,
    last_outbound_at: state.last_outbound_at,
    last_outbound_status: outboundStatus,
  }
}
