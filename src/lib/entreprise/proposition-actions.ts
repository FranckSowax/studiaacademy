'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp } from '@/lib/whatsapp'
import { analyserSessions } from './analyse'
import { getCatalogueByRef } from './catalogue'
import { lireDonneesSessions } from './dossier'
import { estUuid } from './dossier-regles'
import { enregistrerAnalyse, messagePropositions, REF_FORMATION, STATUTS_PROPOSITION, type StatutProposition } from './propositions'

/**
 * Actions de l'admin sur les formations proposées à une entreprise :
 * lancer l'analyse, retenir ou écarter une proposition, en ajouter une à
 * la main, relier la formation créée à une proposition sur mesure.
 *
 * Chaque action commence par requireAdmin(). L'analyse est faite par
 * règles, dans ce serveur : aucune donnée n'est envoyée à un service tiers.
 */

type Echec = { ok: false; error: string }
const LISTE = '/admin/entreprise'
const INTROUVABLE: Echec = { ok: false, error: 'Proposition introuvable.' }

function revalider(id: string) {
  revalidatePath(LISTE)
  revalidatePath(`${LISTE}/${id}`)
}

/**
 * Prévient l'équipe qu'une formation sur mesure est à créer (WhatsApp de
 * l'équipe, s'il est configuré). La file « à créer » de l'admin reste la
 * référence : un message non parti ne bloque rien.
 */
async function prevenirEquipe(entreprise: string, titre: string, companyId: string): Promise<boolean> {
  const telephone = process.env.STUDIA_TEAM_PHONE
  if (!telephone) return false
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.studia.academy').replace(/\/+$/, '')
  try {
    return await sendWhatsApp(
      telephone,
      `Formation sur mesure à créer pour ${entreprise} :\n« ${titre} »\n\nDossier : ${base}${LISTE}/${companyId}`,
    )
  } catch {
    return false
  }
}

/** « Analyser les sessions » : calcule les propositions et les enregistre sans écraser les décisions prises. */
export async function lancerAnalyse(
  id: string,
): Promise<{ ok: true; sessions: number; ajoutees: number; mises_a_jour: number } | Echec> {
  const { userId } = await requireAdmin()
  if (!estUuid(id)) return { ok: false, error: 'Entreprise introuvable.' }
  const admin = createAdminClient()
  const sessions = await lireDonneesSessions(admin, id)
  if (!sessions) return { ok: false, error: 'Les sessions de cette entreprise sont illisibles. Réessayez dans un instant.' }

  const analyse = analyserSessions(sessions)
  if (analyse.sessions_analysees === 0) {
    return { ok: false, error: 'Rattachez d’abord une session Studia Live clôturée : il n’y a encore rien à analyser.' }
  }
  const r = await enregistrerAnalyse(admin, id, analyse.propositions, userId)
  if (!r.ok) {
    console.error(`[entreprises] analyse non enregistrée (${r.code})`)
    return { ok: false, error: messagePropositions(r.code) }
  }
  revalider(id)
  return { ok: true, sessions: analyse.sessions_analysees, ajoutees: r.ajoutees, mises_a_jour: r.mises_a_jour }
}

/**
 * Retient, écarte ou remet en attente une proposition. Retenir une
 * formation sur mesure prévient l'équipe : elle entre dans la file « à créer ».
 */
export async function deciderProposition(
  id: string,
  propositionId: string,
  statut: StatutProposition,
): Promise<{ ok: true; equipePrevenue: boolean } | Echec> {
  const { userId } = await requireAdmin()
  if (!estUuid(id) || !estUuid(propositionId)) return INTROUVABLE
  if (!STATUTS_PROPOSITION.includes(statut)) return { ok: false, error: 'Décision inconnue.' }

  const admin = createAdminClient()
  const avant = await admin
    .from('company_proposals')
    .select('id, type, titre, statut, formation_id')
    .eq('id', propositionId)
    .eq('company_id', id)
    .maybeSingle()
  if (avant.error) return { ok: false, error: messagePropositions(avant.error.code) }
  const proposition = avant.data as { type: string; titre: string; statut: string; formation_id: string | null } | null
  if (!proposition) return INTROUVABLE

  const { error } = await admin
    .from('company_proposals')
    .update({
      statut,
      decidee_par: statut === 'proposee' ? null : userId,
      decidee_le: statut === 'proposee' ? null : new Date().toISOString(),
    })
    .eq('id', propositionId)
    .eq('company_id', id)
  if (error) {
    console.error(`[entreprises] décision non enregistrée (${error.code})`)
    return { ok: false, error: messagePropositions(error.code) }
  }

  let equipePrevenue = false
  const devientACreer = statut === 'retenue' && proposition.statut !== 'retenue' && proposition.type === 'sur_mesure' && !proposition.formation_id
  if (devientACreer) {
    const entreprise = await admin.from('company_profiles').select('nom_entreprise').eq('id', id).maybeSingle()
    const nom = (entreprise.data as { nom_entreprise: string } | null)?.nom_entreprise ?? 'une entreprise'
    equipePrevenue = await prevenirEquipe(nom, proposition.titre, id)
  }
  revalider(id)
  return { ok: true, equipePrevenue }
}

/** Ajoute une proposition à la main : une formation du catalogue, ou un besoin sur mesure. */
export async function ajouterProposition(
  id: string,
  saisie: { catalogue_ref?: string | null; formation_id?: string | null; titre?: string | null; justification?: string | null },
): Promise<{ ok: true } | Echec> {
  const { userId } = await requireAdmin()
  if (!estUuid(id)) return { ok: false, error: 'Entreprise introuvable.' }

  // Formation du catalogue Studia Academy (formations en ligne) : déjà créée, donc disponible.
  if (saisie?.formation_id) {
    if (!estUuid(saisie.formation_id)) return { ok: false, error: 'Formation inconnue.' }
    const admin = createAdminClient()
    const lue = await admin.from('formations').select('id, titre').eq('id', saisie.formation_id).maybeSingle()
    const enLigne = lue.data as { id: string; titre: string } | null
    if (!enLigne) return { ok: false, error: 'Cette formation n’existe plus au catalogue.' }
    const { error } = await admin.from('company_proposals').insert({
      company_id: id,
      type: 'catalogue',
      catalogue_ref: `${REF_FORMATION}${enLigne.id}`,
      titre: enLigne.titre.slice(0, 200),
      justification: typeof saisie.justification === 'string' ? saisie.justification.trim().slice(0, 1000) || null : null,
      origine: 'manuelle',
      formation_id: enLigne.id,
      cree_par: userId,
    })
    if (error) {
      console.error(`[entreprises] proposition non ajoutée (${error.code})`)
      if (error.code === '23505') return { ok: false, error: 'Cette formation est déjà proposée à l’entreprise.' }
      if (error.code === '23503') return { ok: false, error: 'Entreprise introuvable.' }
      return { ok: false, error: messagePropositions(error.code) }
    }
    revalider(id)
    return { ok: true }
  }

  const ref = typeof saisie?.catalogue_ref === 'string' ? saisie.catalogue_ref.trim() : ''
  const formation = ref ? getCatalogueByRef(ref) : undefined
  if (ref && !formation) return { ok: false, error: 'Cette formation n’existe pas au catalogue.' }
  const titre = formation ? formation.titre : (typeof saisie?.titre === 'string' ? saisie.titre.replace(/\s+/g, ' ').trim().slice(0, 200) : '')
  if (!titre) return { ok: false, error: 'Donnez un titre à la formation sur mesure.' }
  const justification = typeof saisie?.justification === 'string' ? saisie.justification.trim().slice(0, 1000) || null : null

  const { error } = await createAdminClient().from('company_proposals').insert({
    company_id: id,
    type: formation ? 'catalogue' : 'sur_mesure',
    catalogue_ref: formation ? formation.ref : null,
    titre,
    justification,
    origine: 'manuelle',
    cree_par: userId,
  })
  if (error) {
    console.error(`[entreprises] proposition non ajoutée (${error.code})`)
    if (error.code === '23505') return { ok: false, error: 'Cette formation est déjà proposée à l’entreprise.' }
    if (error.code === '23503') return { ok: false, error: 'Entreprise introuvable.' }
    return { ok: false, error: messagePropositions(error.code) }
  }
  revalider(id)
  return { ok: true }
}

/**
 * Relie la formation Academy créée à une proposition sur mesure : elle
 * sort de la file « à créer ». `formationId` à null défait le lien.
 */
export async function lierFormation(id: string, propositionId: string, formationId: string | null): Promise<{ ok: true } | Echec> {
  await requireAdmin()
  if (!estUuid(id) || !estUuid(propositionId)) return INTROUVABLE
  if (formationId !== null && !estUuid(formationId)) return { ok: false, error: 'Formation inconnue.' }

  const admin = createAdminClient()
  if (formationId) {
    const formation = await admin.from('formations').select('id').eq('id', formationId).maybeSingle()
    if (!formation.data) return { ok: false, error: 'Cette formation n’existe plus.' }
  }
  const { data, error } = await admin
    .from('company_proposals')
    .update({ formation_id: formationId })
    .eq('id', propositionId)
    .eq('company_id', id)
    .select('id')
  if (error) {
    console.error(`[entreprises] formation non reliée (${error.code})`)
    return { ok: false, error: messagePropositions(error.code) }
  }
  if (!data || data.length === 0) return INTROUVABLE
  revalider(id)
  return { ok: true }
}
