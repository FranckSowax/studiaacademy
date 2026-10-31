// ============================================
// Réglages de la messagerie : épingles (personnelles)
// ============================================
// Stockés dans wa_settings (clé/valeur jsonb). Le contenu étant du jsonb
// libre, il est TOUJOURS validé à la lecture.

import { createAdminClient } from '@/lib/supabase/admin'
import type { InboxIdentity } from './identity'

export const MAX_PINS = 50

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Clé des épingles d'une personne : personne d'autre ne les voit. */
export function pinsKey(identity: Pick<InboxIdentity, 'id' | 'role'>): string {
  return `inbox_pins:${identity.role}:${identity.id}`
}

/**
 * Nettoie une liste d'épingles lue en base : uuid seulement, sans doublon,
 * au plus MAX_PINS (les plus récentes en tête sont conservées).
 */
export function sanitizePins(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const v of value) {
    if (typeof v !== 'string' || !UUID_RE.test(v)) continue
    const id = v.toLowerCase()
    if (!out.includes(id)) out.push(id)
    if (out.length >= MAX_PINS) break
  }
  return out
}

/** Ajoute (en tête) ou retire une conversation des épingles. */
export function togglePin(pins: string[], conversationId: string, pinned: boolean): string[] {
  const id = conversationId.toLowerCase()
  const without = pins.filter((p) => p !== id)
  return sanitizePins(pinned ? [id, ...without] : without)
}

export async function getPins(identity: InboxIdentity): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('wa_settings').select('value').eq('key', pinsKey(identity)).maybeSingle()
  return sanitizePins(data?.value)
}

export async function setPinned(identity: InboxIdentity, conversationId: string, pinned: boolean): Promise<string[]> {
  const next = togglePin(await getPins(identity), conversationId, pinned)
  const admin = createAdminClient()
  const { error } = await admin
    .from('wa_settings')
    .upsert({ key: pinsKey(identity), value: next }, { onConflict: 'key' })
  if (error) throw new Error(`épingles: ${error.code ?? ''}`)
  return next
}
