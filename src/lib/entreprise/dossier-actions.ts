'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'
import { lireResponsables } from '@/lib/studia-live/suivi'
import { createAdminClient } from '@/lib/supabase/admin'
import { messageBase, recalculerEtiquettes } from './dossier'
import { estUuid, lireEntrepriseInput, type EntrepriseInput } from './dossier-regles'

/**
 * Actions de l'admin sur les dossiers entreprise : créer et modifier une
 * entreprise, lui rattacher des sessions, étiqueter les participants.
 *
 * Chaque action commence par requireAdmin() : un compte non admin est
 * renvoyé avant toute lecture ou écriture.
 */

type Echec = { ok: false; error: string }
const LISTE = '/admin/entreprise'
const INTROUVABLE: Echec = { ok: false, error: 'Entreprise introuvable.' }
/** Rattachements par envoi : garde l'action courte et relisible. */
const RATTACHEMENTS_MAX = 50

function revalider(id?: string) {
  revalidatePath(LISTE)
  if (id) revalidatePath(`${LISTE}/${id}`)
}

async function responsableValide(admin: ReturnType<typeof createAdminClient>, id: string | null): Promise<boolean> {
  return !id || (await lireResponsables(admin)).some((r) => r.id === id)
}

/** Crée une entreprise sans compte client ; renvoie son identifiant pour ouvrir la fiche. */
export async function creerEntreprise(saisie: EntrepriseInput): Promise<{ ok: true; id: string } | Echec> {
  const { userId } = await requireAdmin()
  const lu = lireEntrepriseInput(saisie)
  if (!lu.ok) return lu
  const admin = createAdminClient()
  if (!(await responsableValide(admin, lu.valeurs.responsable_id))) return { ok: false, error: 'Le responsable doit être un admin actif.' }

  const { data, error } = await admin
    .from('company_profiles')
    .insert({ ...lu.valeurs, cree_par_admin: userId })
    .select('id')
    .single()
  if (error || !data) {
    console.error(`[entreprises] création impossible (${error?.code})`)
    return { ok: false, error: messageBase(error?.code) }
  }
  revalider()
  return { ok: true, id: (data as { id: string }).id }
}

/** Met à jour la fiche d'une entreprise (créée par l'admin ou inscrite seule). */
export async function modifierEntreprise(id: string, saisie: EntrepriseInput): Promise<{ ok: true } | Echec> {
  await requireAdmin()
  if (!estUuid(id)) return INTROUVABLE
  const lu = lireEntrepriseInput(saisie)
  if (!lu.ok) return lu
  const admin = createAdminClient()
  if (!(await responsableValide(admin, lu.valeurs.responsable_id))) return { ok: false, error: 'Le responsable doit être un admin actif.' }

  const { data, error } = await admin.from('company_profiles').update(lu.valeurs).eq('id', id).select('id')
  if (error) {
    console.error(`[entreprises] mise à jour impossible (${error.code})`)
    return { ok: false, error: messageBase(error.code) }
  }
  if (!data || data.length === 0) return INTROUVABLE
  revalider(id)
  return { ok: true }
}

export interface SessionARattacher {
  source: 'live' | 'presentiel'
  session_id: string
}

/**
 * Rattache des sessions à une entreprise (Studia Live clôturées ou
 * événements), puis étiquette les participants reliés à un compte Academy.
 * Une session déjà rattachée ailleurs est refusée.
 */
export async function rattacherSessions(
  id: string,
  sessions: SessionARattacher[],
): Promise<{ ok: true; rattachees: number; etiquetes: number } | Echec> {
  const { userId } = await requireAdmin()
  if (!estUuid(id)) return INTROUVABLE
  const liste = Array.isArray(sessions) ? sessions : []
  if (liste.length === 0) return { ok: false, error: 'Sélectionnez au moins une session.' }
  if (liste.length > RATTACHEMENTS_MAX) return { ok: false, error: `Rattachez ${RATTACHEMENTS_MAX} sessions au plus à la fois.` }
  if (liste.some((s) => !estUuid(s?.session_id) || (s.source !== 'live' && s.source !== 'presentiel'))) {
    return { ok: false, error: 'La sélection contient une session inconnue.' }
  }

  const admin = createAdminClient()
  const entreprise = await admin.from('company_profiles').select('id').eq('id', id).maybeSingle()
  if (entreprise.error) return { ok: false, error: messageBase(entreprise.error.code) }
  if (!entreprise.data) return INTROUVABLE

  const uniques = [...new Map(liste.map((s) => [`${s.source}:${s.session_id}`, s])).values()]
  const { error } = await admin.from('company_sessions').insert(
    uniques.map((s) => ({
      company_id: id,
      live_session_id: s.source === 'live' ? s.session_id : null,
      presentiel_session_id: s.source === 'presentiel' ? s.session_id : null,
      rattachee_par: userId,
    })),
  )
  if (error) {
    console.error(`[entreprises] rattachement impossible (${error.code})`)
    if (error.code === '23505') return { ok: false, error: 'Une de ces sessions est déjà rattachée à une entreprise.' }
    if (error.code === '23503') return { ok: false, error: 'Une de ces sessions n’existe plus. Rechargez la page.' }
    return { ok: false, error: messageBase(error.code) }
  }

  const etiquettes = await recalculerEtiquettes(admin, id)
  if (!etiquettes.ok) console.error(`[entreprises] étiquettes non recalculées (${etiquettes.code})`)
  revalider(id)
  return { ok: true, rattachees: uniques.length, etiquetes: etiquettes.ok ? etiquettes.etiquetes : 0 }
}

/** Détache une session ; les participants qui ne viennent plus d'aucune session perdent l'étiquette. */
export async function detacherSession(id: string, lienId: string): Promise<{ ok: true } | Echec> {
  await requireAdmin()
  if (!estUuid(id) || !estUuid(lienId)) return INTROUVABLE
  const admin = createAdminClient()
  const { data, error } = await admin.from('company_sessions').delete().eq('id', lienId).eq('company_id', id).select('id')
  if (error) {
    console.error(`[entreprises] détachement impossible (${error.code})`)
    return { ok: false, error: messageBase(error.code) }
  }
  if (!data || data.length === 0) return { ok: false, error: 'Cette session n’est plus rattachée à l’entreprise.' }
  const etiquettes = await recalculerEtiquettes(admin, id)
  if (!etiquettes.ok) console.error(`[entreprises] étiquettes non recalculées (${etiquettes.code})`)
  revalider(id)
  return { ok: true }
}

/**
 * Recalcule les étiquettes à la demande : utile quand des participants
 * ont créé leur compte Academy après le rattachement de la session.
 */
export async function actualiserEtiquettes(id: string): Promise<{ ok: true; etiquetes: number } | Echec> {
  await requireAdmin()
  if (!estUuid(id)) return INTROUVABLE
  const r = await recalculerEtiquettes(createAdminClient(), id)
  if (!r.ok) return { ok: false, error: messageBase(r.code) }
  revalider(id)
  return { ok: true, etiquetes: r.etiquetes }
}
