'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'
import { isEmailConfigured, sendEmail } from '@/lib/email/send'
import { createAdminClient } from '@/lib/supabase/admin'
import { composerEmailRapport, type ContenuEmailRapport } from './email-rapport'
import { envoyerFinalesLive, lienRapportValide, RELANCE_MAX, type BilanFinales } from './pilotage'
import {
  journaliserEnvoi, lireFicheSuivi, lireResponsables, MIGRATION_SUIVI, rechargerSession, synchroniserSessionsLive,
  type BilanSynchronisation,
} from './suivi'
import { emailValide, estStatutSuivi } from './suivi-regles'

/**
 * Actions de l'admin sur les sessions clôturées de Studia Live.
 *
 * Chaque action commence par requireAdmin() : un compte non admin est
 * renvoyé avant toute lecture, tout appel signé et tout envoi. Les appels
 * à Studia Live partent d'ici (serveur), jamais du navigateur.
 */

type Echec = { ok: false; error: string }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LISTE = '/admin/studia-live'
const INTROUVABLE: Echec = { ok: false, error: 'Session introuvable dans le suivi. Lancez une synchronisation.' }

const texte = (v: unknown, max: number): string | null => {
  const t = typeof v === 'string' ? v.trim().slice(0, max) : ''
  return t === '' ? null : t
}

function revalider(id?: string) {
  revalidatePath(LISTE)
  if (id) revalidatePath(`${LISTE}/${id}`)
}

/** Bouton « Synchroniser avec Studia Live ». */
export async function synchroniserLive(): Promise<{ ok: true; bilan: BilanSynchronisation } | Echec> {
  await requireAdmin()
  const r = await synchroniserSessionsLive(createAdminClient())
  if (!r.ok) return { ok: false, error: r.message }
  revalider()
  return r
}

/** Recharge le détail d'une seule session depuis Studia Live. */
export async function actualiserSessionLive(id: string): Promise<{ ok: true } | Echec> {
  await requireAdmin()
  if (!UUID.test(id)) return INTROUVABLE
  const admin = createAdminClient()
  if (!(await lireFicheSuivi(admin, id))) return INTROUVABLE
  const r = await rechargerSession(admin, id)
  if (!r.ok) return { ok: false, error: r.message }
  revalider(id)
  return { ok: true }
}

export interface SuiviInput {
  statut_suivi: string
  commanditaire_nom?: string | null
  commanditaire_email?: string | null
  responsable_id?: string | null
  notes?: string | null
}

/** Bloc de suivi : statut, commanditaire, responsable, notes. */
export async function enregistrerSuivi(id: string, saisie: SuiviInput): Promise<{ ok: true } | Echec> {
  await requireAdmin()
  if (!UUID.test(id)) return INTROUVABLE
  if (!estStatutSuivi(saisie?.statut_suivi)) return { ok: false, error: 'Statut de suivi inconnu.' }

  const emailSaisi = texte(saisie.commanditaire_email, 254)
  const email = emailSaisi ? emailValide(emailSaisi) : null
  if (emailSaisi && !email) return { ok: false, error: 'L’e-mail du commanditaire n’est pas valide.' }

  const admin = createAdminClient()
  const responsable = texte(saisie.responsable_id, 36)
  if (responsable && !(await lireResponsables(admin)).some((r) => r.id === responsable)) {
    return { ok: false, error: 'Le responsable doit être un admin actif.' }
  }

  const { data, error } = await admin
    .from('live_sessions_suivi')
    .update({
      statut_suivi: saisie.statut_suivi,
      commanditaire_nom: texte(saisie.commanditaire_nom, 120),
      commanditaire_email: email,
      responsable_id: responsable,
      notes: texte(saisie.notes, 5000),
    })
    .eq('live_session_id', id)
    .select('live_session_id')
  if (error) {
    console.error(`[studia-live] suivi : mise à jour impossible (${error.code})`)
    return { ok: false, error: error.code === '42P01' ? MIGRATION_SUIVI : 'Enregistrement impossible. Réessayez dans un instant.' }
  }
  if (!data || data.length === 0) return INTROUVABLE
  revalider(id)
  return { ok: true }
}

/**
 * Aperçu de l'e-mail du rapport, à partir du dernier détail conservé.
 * Aucun lien n'est demandé ici : il le sera au moment de l'envoi.
 */
export async function apercuRapport(
  id: string,
  saisie: { email: string; nom?: string | null },
): Promise<{ ok: true; destinataire: string; apercu: ContenuEmailRapport } | Echec> {
  await requireAdmin()
  if (!UUID.test(id)) return INTROUVABLE
  const destinataire = emailValide(saisie?.email)
  if (!destinataire) return { ok: false, error: 'Saisissez l’e-mail du commanditaire.' }
  const fiche = await lireFicheSuivi(createAdminClient(), id)
  if (!fiche) return INTROUVABLE
  if (!fiche.donnees) return { ok: false, error: 'Le détail de cette session n’a pas encore été reçu. Actualisez la session.' }
  return {
    ok: true,
    destinataire,
    apercu: composerEmailRapport({ donnees: fiche.donnees, commanditaireNom: texte(saisie.nom, 120), lien: null, expireLe: null }),
  }
}

/**
 * Envoie le rapport de formation au commanditaire. L'adresse doit avoir
 * été saisie puis confirmée ; le lien est redemandé à Studia Live juste
 * avant l'envoi et n'est jamais conservé.
 */
export async function envoyerRapport(
  id: string,
  saisie: { email: string; emailConfirme: string; nom?: string | null },
): Promise<{ ok: true; destinataire: string } | Echec> {
  const { userId } = await requireAdmin()
  if (!UUID.test(id)) return INTROUVABLE
  const destinataire = emailValide(saisie?.email)
  if (!destinataire) return { ok: false, error: 'Saisissez l’e-mail du commanditaire.' }
  if (emailValide(saisie.emailConfirme) !== destinataire) {
    return { ok: false, error: 'Confirmez l’adresse du commanditaire avant l’envoi.' }
  }
  if (!isEmailConfigured()) return { ok: false, error: 'L’envoi d’e-mails n’est pas configuré sur Studia Academy.' }

  const admin = createAdminClient()
  if (!(await lireFicheSuivi(admin, id))) return INTROUVABLE
  const nom = texte(saisie.nom, 120)

  // Lien neuf à chaque envoi.
  const detail = await rechargerSession(admin, id)
  if (!detail.ok) return { ok: false, error: detail.message }
  const lien = lienRapportValide(detail.data.liens.rapport_direction)
  if (!lien) return { ok: false, error: 'Studia Live n’a pas fourni le lien du rapport de formation. Réessayez dans un instant.' }
  const expireLe = detail.data.liens.rapport_direction_expire_le

  const mail = composerEmailRapport({ donnees: detail.data, commanditaireNom: nom, lien, expireLe })
  const envoye = await sendEmail({ to: destinataire, subject: mail.sujet, text: mail.texte, html: mail.html })

  await journaliserEnvoi(admin, {
    liveSessionId: id,
    type: 'rapport_direction',
    destinataires: destinataire,
    resultat: { envoye, commanditaire_nom: nom, lien_expire_le: expireLe },
    par: userId,
  })
  if (!envoye) {
    revalider(id)
    return { ok: false, error: 'L’e-mail n’a pas pu être envoyé. Réessayez dans un instant.' }
  }

  const { error } = await admin
    .from('live_sessions_suivi')
    .update({ statut_suivi: 'rapport_envoye', commanditaire_email: destinataire, ...(nom ? { commanditaire_nom: nom } : {}) })
    .eq('live_session_id', id)
  if (error) console.error(`[studia-live] suivi : statut non mis à jour (${error.code})`)
  revalider(id)
  return { ok: true, destinataire }
}

/** « Envoyer les finales manquantes » : à tous ceux qui ne l'ont pas encore reçue. */
export async function envoyerFinalesManquantes(id: string): Promise<{ ok: true; bilan: BilanFinales } | Echec> {
  const { userId } = await requireAdmin()
  if (!UUID.test(id)) return INTROUVABLE
  const admin = createAdminClient()
  if (!(await lireFicheSuivi(admin, id))) return INTROUVABLE

  const r = await envoyerFinalesLive(id, { tous: true })
  await journaliserEnvoi(admin, {
    liveSessionId: id,
    type: 'finales',
    destinataires: 'Tous les participants sans finale',
    resultat: r.ok ? { ...r.data } : { echec: r.code },
    par: userId,
  })
  if (r.ok) await rechargerSession(admin, id)
  revalider(id)
  return r.ok ? { ok: true, bilan: r.data } : { ok: false, error: r.message }
}

/**
 * « Relancer » : renvoie la finale à une sélection de 50 participants au
 * plus, même s'ils l'ont déjà reçue. Exige une confirmation explicite ;
 * jamais toute une session d'un coup.
 */
export async function relancerParticipants(
  id: string,
  participantIds: string[],
  confirme: boolean,
): Promise<{ ok: true; bilan: BilanFinales } | Echec> {
  const { userId } = await requireAdmin()
  if (!UUID.test(id)) return INTROUVABLE
  if (confirme !== true) return { ok: false, error: 'Confirmez la relance avant l’envoi.' }
  const ids = [...new Set(Array.isArray(participantIds) ? participantIds : [])]
  if (ids.length === 0) return { ok: false, error: 'Sélectionnez au moins un participant.' }
  if (ids.length > RELANCE_MAX) return { ok: false, error: `Une relance porte sur ${RELANCE_MAX} participants au plus.` }

  const admin = createAdminClient()
  const fiche = await lireFicheSuivi(admin, id)
  if (!fiche) return INTROUVABLE
  const connus = new Map((fiche.donnees?.participants ?? []).map((p) => [p.id, p]))
  if (ids.some((p) => !UUID.test(p) || !connus.has(p))) {
    return { ok: false, error: 'La sélection contient un participant inconnu de cette session. Actualisez la session.' }
  }

  const r = await envoyerFinalesLive(id, { participantIds: ids, forcer: true })
  await journaliserEnvoi(admin, {
    liveSessionId: id,
    type: 'relance_finales',
    destinataires: ids.map((p) => connus.get(p)?.email ?? connus.get(p)?.prenom ?? 'sans e-mail').join(', '),
    resultat: r.ok ? { ...r.data, demandes: ids.length } : { echec: r.code, demandes: ids.length },
    par: userId,
  })
  if (r.ok) await rechargerSession(admin, id)
  revalider(id)
  return r.ok ? { ok: true, bilan: r.data } : { ok: false, error: r.message }
}
