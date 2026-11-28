'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { requireAdmin } from '@/lib/auth/require-admin'
import { isEmailConfigured, sendEmail } from '@/lib/email/send'
import { emailValide } from '@/lib/studia-live/suivi-regles'
import { createAdminClient } from '@/lib/supabase/admin'
import { composerEmailBilan, VALIDITE_JOURS, type ContenuEmailBilan } from './bilan'
import { preparerBilan } from './bilan-acces'
import { empreinteJeton, genererJeton } from './bilan-jeton'
import { estUuid } from './dossier-regles'

/**
 * Actions de l'admin sur le bilan envoyé à la direction : aperçu, envoi
 * et révocation d'un lien.
 *
 * Chaque action commence par requireAdmin(). Le bilan n'est envoyé qu'à
 * l'adresse saisie puis confirmée. Le jeton du lien n'est jamais conservé
 * en clair ni journalisé.
 */

type Echec = { ok: false; error: string }
const INTROUVABLE: Echec = { ok: false, error: 'Entreprise introuvable.' }
const MIGRATION = 'Appliquez la migration 20261207120000_company_reports.sql pour envoyer des bilans.'
const SITE_PAR_DEFAUT = 'https://www.studia.academy'

const texte = (v: unknown, max: number): string | null => {
  const t = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
  return t === '' ? null : t
}

/**
 * Adresse du site pour le lien : celle depuis laquelle l'admin envoie
 * (https, ou localhost en développement), sinon NEXT_PUBLIC_SITE_URL.
 */
async function adresseSite(): Promise<string> {
  const candidats = [(await headers()).get('origin'), process.env.NEXT_PUBLIC_SITE_URL]
  for (const c of candidats) {
    if (!c) continue
    try {
      const u = new URL(c)
      if (u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1') return u.origin
    } catch {
      // candidat suivant
    }
  }
  return SITE_PAR_DEFAUT
}

/** Aperçu de l'e-mail, sans créer de lien. */
export async function apercuBilan(
  id: string,
  saisie: { email: string; nom?: string | null },
): Promise<{ ok: true; destinataire: string; formations: number; apercu: ContenuEmailBilan } | Echec> {
  await requireAdmin()
  if (!estUuid(id)) return INTROUVABLE
  const destinataire = emailValide(saisie?.email)
  if (!destinataire) return { ok: false, error: 'Saisissez l’e-mail de la direction.' }
  const prepare = await preparerBilan(createAdminClient(), id)
  if (!prepare) return INTROUVABLE
  if (prepare.bilan.indicateurs.sessions === 0) {
    return { ok: false, error: 'Rattachez d’abord une session Studia Live clôturée : le bilan serait vide.' }
  }
  return {
    ok: true,
    destinataire,
    formations: prepare.bilan.formations.length,
    apercu: composerEmailBilan({ bilan: prepare.bilan, directionNom: texte(saisie.nom, 120), lien: null, expireLe: null }),
  }
}

/**
 * Fige le bilan, crée son lien secret (30 jours) et l'envoie à la
 * direction. Le lien est renvoyé une seule fois à l'admin, pour le copier.
 */
export async function envoyerBilan(
  id: string,
  saisie: { email: string; emailConfirme: string; nom?: string | null },
): Promise<{ ok: true; destinataire: string; lien: string } | Echec> {
  const { userId } = await requireAdmin()
  if (!estUuid(id)) return INTROUVABLE
  const destinataire = emailValide(saisie?.email)
  if (!destinataire) return { ok: false, error: 'Saisissez l’e-mail de la direction.' }
  if (emailValide(saisie.emailConfirme) !== destinataire) return { ok: false, error: 'Confirmez l’adresse de la direction avant l’envoi.' }
  if (!isEmailConfigured()) return { ok: false, error: 'L’envoi d’e-mails n’est pas configuré sur Studia Academy.' }

  const admin = createAdminClient()
  const maintenant = Date.now()
  const prepare = await preparerBilan(admin, id, maintenant)
  if (!prepare) return INTROUVABLE
  if (prepare.bilan.indicateurs.sessions === 0) {
    return { ok: false, error: 'Rattachez d’abord une session Studia Live clôturée : le bilan serait vide.' }
  }

  const jeton = genererJeton()
  const expireLe = new Date(maintenant + VALIDITE_JOURS * 24 * 3600 * 1000).toISOString()
  const creation = await admin
    .from('company_reports')
    .insert({ company_id: id, jeton_hash: empreinteJeton(jeton), contenu: prepare.bilan, destinataire, expire_le: expireLe, envoye_par: userId })
    .select('id')
    .single()
  if (creation.error || !creation.data) {
    console.error(`[entreprises] bilan non créé (${creation.error?.code})`)
    const absente = creation.error?.code === '42P01' || creation.error?.code === 'PGRST205'
    return { ok: false, error: absente ? MIGRATION : 'Le bilan n’a pas pu être préparé. Réessayez dans un instant.' }
  }
  const reportId = (creation.data as { id: string }).id

  const nom = texte(saisie.nom, 120)
  const lien = `${await adresseSite()}/bilan/${jeton}`
  const mail = composerEmailBilan({ bilan: prepare.bilan, directionNom: nom, lien, expireLe })
  const envoye = await sendEmail({ to: destinataire, subject: mail.sujet, text: mail.texte, html: mail.html })
  if (!envoye) {
    // Le bilan reste en base avec envoye = false : son lien n'est jamais servi.
    revalidatePath(`/admin/entreprise/${id}`)
    return { ok: false, error: 'L’e-mail n’a pas pu être envoyé. Réessayez dans un instant.' }
  }

  const [marque, fiche] = await Promise.all([
    admin.from('company_reports').update({ envoye: true }).eq('id', reportId),
    admin.from('company_profiles').update({ direction_email: destinataire, ...(nom ? { direction_nom: nom } : {}) }).eq('id', id),
  ])
  if (marque.error) {
    console.error(`[entreprises] bilan non marqué envoyé (${marque.error.code})`)
    return { ok: false, error: 'L’e-mail est parti mais le lien n’a pas pu être activé. Renvoyez le bilan.' }
  }
  if (fiche.error) console.error(`[entreprises] contact de direction non mis à jour (${fiche.error.code})`)
  revalidatePath(`/admin/entreprise/${id}`)
  return { ok: true, destinataire, lien }
}

/** Désactive un lien de bilan avant son expiration. */
export async function revoquerBilan(id: string, reportId: string): Promise<{ ok: true } | Echec> {
  await requireAdmin()
  if (!estUuid(id) || !estUuid(reportId)) return { ok: false, error: 'Bilan introuvable.' }
  const { data, error } = await createAdminClient()
    .from('company_reports')
    .update({ revoque_le: new Date().toISOString() })
    .eq('id', reportId)
    .eq('company_id', id)
    .select('id')
  if (error) {
    console.error(`[entreprises] bilan non révoqué (${error.code})`)
    return { ok: false, error: 'Le lien n’a pas pu être désactivé. Réessayez dans un instant.' }
  }
  if (!data || data.length === 0) return { ok: false, error: 'Bilan introuvable.' }
  revalidatePath(`/admin/entreprise/${id}`)
  return { ok: true }
}
