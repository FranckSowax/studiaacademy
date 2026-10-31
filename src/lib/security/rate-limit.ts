// ============================================
// Rate limiting persistant (Postgres) — partagé entre instances
// (serveur uniquement, s'appuie sur public.check_rate_limit)
// ============================================

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export interface RateLimitRule {
  /** Nombre d'actions autorisées dans la fenêtre. */
  limit: number
  /** Durée de la fenêtre en secondes. */
  windowSeconds: number
}

/** Règles centralisées : ajuster ici plutôt que dans chaque route. */
export const RATE_LIMITS = {
  /** Envois WhatsApp vers un même numéro (tous parcours confondus). */
  whatsappPerRecipient: { limit: 5, windowSeconds: 3600 },
  /** Réservations présentiel depuis une même IP. */
  reservationPerIp: { limit: 5, windowSeconds: 3600 },
  /** Démarrages de devoir QCM depuis une même IP (anti-force brute du code classe). */
  qcmStartPerIp: { limit: 30, windowSeconds: 600 },
  /** Notifications parent déclenchées depuis une même IP. */
  parentNotifPerIp: { limit: 10, windowSeconds: 3600 },
  /** Démarrages de diagnostic entreprise depuis une même IP. */
  diagnosticStartPerIp: { limit: 20, windowSeconds: 3600 },
  /** Appels IA coûteux (OCR, extraction d'URL, génération) par utilisateur. */
  aiPerUser: { limit: 30, windowSeconds: 3600 },
  /** Envois de rapports WhatsApp par professeur. */
  teacherSendPerUser: { limit: 200, windowSeconds: 86_400 },
} as const satisfies Record<string, RateLimitRule>

/**
 * Consomme une unité du quota `key`. Retourne true si l'action est permise.
 * Échec fermé : si la base est indisponible, l'action est refusée.
 *
 * @example
 * if (!(await consumeRateLimit(`ai:${user.id}`, RATE_LIMITS.aiPerUser))) {
 *   return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
 * }
 */
export async function consumeRateLimit(key: string, rule: RateLimitRule): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('check_rate_limit', {
    p_key: key,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  })
  if (error) {
    // WHY: échec fermé — un quota non vérifiable ne doit pas ouvrir la porte au spam.
    console.error('[rate-limit] check_rate_limit indisponible:', error.code)
    return false
  }
  return data === true
}

/**
 * IP du client derrière le proxy Railway / Cloudflare.
 * Première valeur de X-Forwarded-For, sinon X-Real-IP.
 */
export function clientIpFrom(h: Headers): string {
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || h.get('x-real-ip')?.trim() || 'unknown'
}

/** Variante pour les server actions (lit les en-têtes de la requête courante). */
export async function currentClientIp(): Promise<string> {
  return clientIpFrom(await headers())
}
