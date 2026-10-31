// ============================================
// Webhooks WAHA — vérification de signature et fraîcheur
// (serveur uniquement)
// ============================================

import { createHmac, timingSafeEqual } from 'node:crypto'

/** Fenêtre d'acceptation d'un événement (anti-rejeu). */
const MAX_EVENT_AGE_MS = 5 * 60 * 1000

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
 * Un événement signé mais trop ancien (ou daté du futur) est refusé :
 * une requête capturée ne peut pas être rejouée plus tard.
 * L'horodatage `timestamp` de l'enveloppe WAHA est en millisecondes.
 */
export function isFreshEvent(event: unknown, now: number = Date.now()): boolean {
  if (!event || typeof event !== 'object') return false
  const ts = (event as { timestamp?: unknown }).timestamp
  if (typeof ts !== 'number') return true // enveloppe sans horodatage : on s'appuie sur la signature
  return Math.abs(now - ts) <= MAX_EVENT_AGE_MS
}
