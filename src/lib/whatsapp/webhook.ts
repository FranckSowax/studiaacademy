// ============================================
// Webhooks WAHA — vérification de signature et parsing
// (serveur uniquement)
// ============================================

import { createHmac, timingSafeEqual } from 'node:crypto'

/** Fenêtre d'acceptation d'un événement (anti-rejeu). */
const MAX_EVENT_AGE_MS = 5 * 60 * 1000

export interface WahaInboundMessage {
  eventId: string
  session: string
  messageId: string
  from: string
  body: string
  hasMedia: boolean
  timestamp: number
}

/**
 * Vérifie l'en-tête `X-Webhook-Hmac` (HMAC-SHA512 hex du corps brut)
 * envoyé par WAHA quand `WHATSAPP_HOOK_HMAC_KEY` est configurée.
 *
 * @example
 * verifyWahaSignature(rawBody, req.headers.get('x-webhook-hmac'), 'sha512', key)
 */
export function verifyWahaSignature(
  rawBody: string,
  signature: string | null,
  algorithm: string | null,
  key: string,
): boolean {
  if (!signature || !key) return false
  if (algorithm && algorithm.toLowerCase() !== 'sha512') return false
  const expected = createHmac('sha512', key).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature.trim().toLowerCase(), 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Extrait un message entrant exploitable d'un événement WAHA.
 * Ignore : autres événements, messages envoyés par nous, groupes,
 * statuts, événements trop anciens.
 */
export function parseInboundMessage(
  event: unknown,
  now: number = Date.now(),
): WahaInboundMessage | null {
  if (!event || typeof event !== 'object') return null
  const e = event as Record<string, unknown>
  if (e.event !== 'message') return null

  const ts = typeof e.timestamp === 'number' ? e.timestamp : null
  if (ts !== null && Math.abs(now - ts) > MAX_EVENT_AGE_MS) return null

  const p = e.payload as Record<string, unknown> | undefined
  if (!p || p.fromMe === true) return null
  const from = typeof p.from === 'string' ? p.from : ''
  // Contacts individuels uniquement (pas de groupes @g.us ni status@broadcast)
  if (!from.endsWith('@c.us')) return null
  if (typeof p.id !== 'string' || typeof e.id !== 'string') return null

  return {
    eventId: e.id,
    session: typeof e.session === 'string' ? e.session : 'default',
    messageId: p.id,
    from,
    body: typeof p.body === 'string' ? p.body.slice(0, 4000) : '',
    hasMedia: p.hasMedia === true,
    timestamp: typeof p.timestamp === 'number' ? p.timestamp : Math.floor(now / 1000),
  }
}
