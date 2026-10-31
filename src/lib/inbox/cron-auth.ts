// ============================================
// Authentification des tâches planifiées de la messagerie
// ============================================
// En-tête attendu : Authorization: Bearer <INBOX_CRON_SECRET>.
// Sans secret configuré, refus total : jamais de mode permissif.

import { timingSafeEqual } from 'node:crypto'

export type CronAuth = 'ok' | 'unconfigured' | 'denied'

export function checkCronAuth(authorization: string | null, secret: string | undefined = process.env.INBOX_CRON_SECRET): CronAuth {
  if (!secret || secret.length < 16) return 'unconfigured'
  const provided = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : ''
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b) ? 'ok' : 'denied'
}
