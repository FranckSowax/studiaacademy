// ============================================
// Saisie d'une fiche collaborateur (pur) — validation et normalisation
// ============================================

import { z } from 'zod'
import { isValidPhone, normalizePhone } from '@/lib/whatsapp'
import { COLLABORATOR_ROLES, type CollaboratorRole } from './roles'

export interface CollaboratorInput {
  full_name: string
  email: string | null
  whatsapp_phone: string | null
  role: CollaboratorRole
}

const RawSchema = z.object({
  full_name: z.string().trim().min(1, 'Nom requis').max(120, 'Nom trop long'),
  email: z.string().trim().max(254).optional().default(''),
  whatsapp_phone: z.string().trim().max(32).optional().default(''),
  role: z.enum(COLLABORATOR_ROLES),
})

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Valide et normalise une fiche : email en minuscules, numéro au format
 * international. Il faut au moins un moyen de recevoir le code.
 *
 * @example
 * parseCollaboratorInput({ full_name: 'Awa', whatsapp_phone: '07 67 01 58', role: 'agent' })
 * // { ok: true, value: { …, whatsapp_phone: '24107670158', email: null } }
 */
export function parseCollaboratorInput(
  raw: unknown,
): { ok: true; value: CollaboratorInput } | { ok: false; error: string } {
  const parsed = RawSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Saisie invalide' }
  const { full_name, role } = parsed.data

  const email = parsed.data.email ? parsed.data.email.toLowerCase() : null
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: 'Email invalide' }

  let whatsapp_phone: string | null = null
  if (parsed.data.whatsapp_phone) {
    whatsapp_phone = normalizePhone(parsed.data.whatsapp_phone)
    if (!isValidPhone(whatsapp_phone)) return { ok: false, error: 'Numéro WhatsApp invalide' }
  }

  if (!email && !whatsapp_phone) {
    return { ok: false, error: 'Indiquez un numéro WhatsApp ou un email (pour recevoir le code de connexion)' }
  }
  return { ok: true, value: { full_name, email, whatsapp_phone, role } }
}
