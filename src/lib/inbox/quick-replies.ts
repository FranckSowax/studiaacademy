// ============================================
// Phrases rapides de l'équipe (partagées, modifiables par les admins)
// ============================================
// Une phrase rapide REMPLIT le brouillon, elle n'envoie jamais : la personne
// relit avant d'envoyer.

import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const QUICK_REPLIES_KEY = 'inbox_quick_replies'
export const MAX_QUICK_REPLIES = 50
const MAX_TITLE = 60
const MAX_TEXT = 1000

export interface QuickReply {
  id: string
  title: string
  text: string
}

/**
 * Valide une liste lue en base ou reçue du navigateur : titres et textes non
 * vides et bornés, identifiants conservés ou créés, 50 au plus.
 */
export function sanitizeQuickReplies(value: unknown, makeId: () => string = randomUUID): QuickReply[] {
  if (!Array.isArray(value)) return []
  const out: QuickReply[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const title = typeof r.title === 'string' ? r.title.trim().slice(0, MAX_TITLE) : ''
    const text = typeof r.text === 'string' ? r.text.trim().slice(0, MAX_TEXT) : ''
    if (!title || !text) continue
    let id = typeof r.id === 'string' && /^[\w-]{1,64}$/.test(r.id) ? r.id : makeId()
    if (seen.has(id)) id = makeId()
    seen.add(id)
    out.push({ id, title, text })
    if (out.length >= MAX_QUICK_REPLIES) break
  }
  return out
}

export { fillTemplate } from './templates'

export async function getQuickReplies(): Promise<QuickReply[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('wa_settings').select('value').eq('key', QUICK_REPLIES_KEY).maybeSingle()
  return sanitizeQuickReplies(data?.value)
}

export async function saveQuickReplies(list: unknown): Promise<QuickReply[]> {
  const clean = sanitizeQuickReplies(list)
  const admin = createAdminClient()
  const { error } = await admin
    .from('wa_settings')
    .upsert({ key: QUICK_REPLIES_KEY, value: clean }, { onConflict: 'key' })
  if (error) throw new Error(`phrases rapides: ${error.code ?? ''}`)
  return clean
}
