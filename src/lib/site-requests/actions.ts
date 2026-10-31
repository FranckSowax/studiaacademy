'use server'

// ============================================
// Demandes publiques du site → accusé WhatsApp + conversation /messagerie
// ============================================
// Appelées par les formulaires sans compte (Formations IA, devis entreprise,
// contact, partenariat). Chaque action valide ses entrées et limite les envois
// par IP : sans cela, un formulaire public servirait à spammer n'importe quel
// numéro depuis le WhatsApp de Studia.

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { consumeRateLimit, currentClientIp, RATE_LIMITS } from '@/lib/security/rate-limit'
import { isValidPhone, normalizePhone } from '@/lib/whatsapp'
import { acknowledgeSiteRequest } from '@/lib/inbox/site-request'
import { MAX_DETAILS_LENGTH } from '@/lib/inbox/site-request-rules'

export interface SiteRequestResult {
  success: boolean
  /** true si le client a reçu l'accusé WhatsApp (conversation ouverte dans /messagerie). */
  acknowledged?: boolean
  error?: string
}

/** Inscriptions Formations IA récentes seulement : un vieux code ne redéclenche rien. */
const FIA_ACK_WINDOW_MS = 15 * 60_000

const text = (max: number) => z.string().trim().max(max)
const phoneSchema = z
  .string()
  .transform((value) => normalizePhone(value))
  .refine(isValidPhone, 'Numéro WhatsApp invalide')

const ContactSchema = z.object({
  kind: z.enum(['contact', 'partenariat']),
  nom: text(120).min(1, 'Nom requis'),
  telephone: phoneSchema,
  email: z.union([z.literal(''), z.string().trim().email().max(200)]).optional(),
  sujet: text(200).optional(),
  message: text(MAX_DETAILS_LENGTH).min(1, 'Message requis'),
  page: text(200).optional(),
})

const DevisSchema = z.object({
  societe: text(200).min(1, 'Société requise'),
  contact: text(120).min(1, 'Contact requis'),
  fonction: text(120).optional(),
  telephone: phoneSchema,
  effectif: text(60).optional(),
  formations: z.array(text(10)).max(10),
  message: text(MAX_DETAILS_LENGTH).optional(),
  page: text(200).optional(),
})

async function withinIpQuota(): Promise<boolean> {
  return consumeRateLimit(`site:ip:${await currentClientIp()}`, RATE_LIMITS.siteRequestPerIp)
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Formulaire invalide'
}

/**
 * Formulaires Contact et Partenariat : la demande est transmise à l'équipe
 * sous forme de conversation WhatsApp (accusé de réception au client).
 *
 * @example
 * await submitContactRequest({ kind: 'contact', nom: 'Marie', telephone: '07 12 34 56', message: 'Bonjour' })
 */
export async function submitContactRequest(input: z.input<typeof ContactSchema>): Promise<SiteRequestResult> {
  const parsed = ContactSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }
  if (!(await withinIpQuota())) return { success: false, error: 'Trop de demandes. Réessayez plus tard.' }

  const data = parsed.data
  const details = [data.message, data.email ? `Email : ${data.email}` : null].filter(Boolean).join(' — ')
  const ack = await acknowledgeSiteRequest(data.telephone, {
    kind: data.kind,
    name: data.nom,
    title: data.sujet,
    details,
    page: data.page,
  })
  // WHY: ces formulaires n'ont pas de table propre ; si l'accusé échoue, la
  // demande serait perdue en silence. On le dit au visiteur pour qu'il écrive
  // directement sur WhatsApp.
  if (!ack.sent) {
    return { success: false, error: "Votre message n'a pas pu être transmis. Écrivez-nous directement sur WhatsApp." }
  }
  return { success: true, acknowledged: true }
}

/** Demande de devis / entretien entreprise (Formations IA). */
export async function submitDevisRequest(input: z.input<typeof DevisSchema>): Promise<SiteRequestResult> {
  const parsed = DevisSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }
  if (!(await withinIpQuota())) return { success: false, error: 'Trop de demandes. Réessayez plus tard.' }

  const data = parsed.data
  const { error } = await createAdminClient()
    .from('fia_leads_entreprises')
    .insert({
      societe: data.societe,
      contact: data.contact,
      fonction: data.fonction || null,
      telephone: data.telephone,
      effectif: data.effectif || null,
      formations: data.formations,
      message: data.message || null,
    })
  if (error) return { success: false, error: 'Envoi impossible' }

  const ack = await acknowledgeSiteRequest(data.telephone, {
    kind: 'devis',
    name: data.contact,
    title: data.societe,
    details: data.message,
    page: data.page,
  })
  return { success: true, acknowledged: ack.sent }
}

/**
 * Accusé d'une inscription Formations IA déjà enregistrée (RPC fia_inscrire).
 * Ne prend que le code public : numéro, nom et formation sont relus en base,
 * donc impossible de viser un numéro arbitraire.
 */
export async function acknowledgeFiaInscription(code: string): Promise<SiteRequestResult> {
  if (typeof code !== 'string' || !/^STU-[A-Z0-9]+-\d{4}$/.test(code)) {
    return { success: false, error: 'Code invalide' }
  }
  if (!(await withinIpQuota())) return { success: false, error: 'Trop de demandes' }

  const { data } = await createAdminClient()
    .from('fia_inscriptions')
    .select('prenom, telephone_whatsapp, created_at, fia_sessions(date, fia_formations(titre, slug))')
    .eq('code_public', code)
    .maybeSingle()
  if (!data) return { success: false, error: 'Inscription introuvable' }
  if (Date.now() - new Date(data.created_at).getTime() > FIA_ACK_WINDOW_MS) {
    return { success: false, error: 'Inscription trop ancienne' }
  }

  const session = data.fia_sessions as unknown as {
    date: string | null
    fia_formations: { titre: string; slug: string } | null
  } | null
  const formation = session?.fia_formations
  const date = session?.date
    ? new Date(session.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : null

  const ack = await acknowledgeSiteRequest(data.telephone_whatsapp, {
    kind: 'formation-ia',
    name: data.prenom,
    title: formation ? `${formation.titre}${date ? ` — ${date}` : ''}` : null,
    details: `Code d’inscription : ${code}`,
    page: formation ? `/formations-ia/${formation.slug}` : null,
  })
  return { success: true, acknowledged: ack.sent }
}
