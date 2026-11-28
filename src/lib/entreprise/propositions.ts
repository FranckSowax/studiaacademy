import type { createAdminClient } from '@/lib/supabase/admin'
import type { PropositionCalculee } from './analyse'
import { normaliser } from './analyse'

/**
 * Formations proposées à une entreprise : lecture, enregistrement du
 * résultat d'une analyse et file des formations sur mesure à créer.
 *
 * Serveur uniquement, avec la clé de service : à n'appeler que derrière
 * requireAdmin().
 */

type Admin = ReturnType<typeof createAdminClient>

/**
 * Préfixe de `catalogue_ref` pour une formation du catalogue Studia
 * Academy (formations en ligne) : `formation:<uuid>`. Les formations
 * entreprise gardent leur référence F1…F8.
 */
export const REF_FORMATION = 'formation:'
export const estFormationEnLigne = (ref: string | null | undefined) => !!ref && ref.startsWith(REF_FORMATION)

export type StatutProposition = 'proposee' | 'retenue' | 'ecartee'
export const STATUTS_PROPOSITION: readonly StatutProposition[] = ['proposee', 'retenue', 'ecartee']

export interface Proposition {
  id: string
  company_id: string
  type: 'catalogue' | 'sur_mesure'
  catalogue_ref: string | null
  titre: string
  justification: string | null
  score: number
  origine: 'analyse' | 'manuelle'
  statut: StatutProposition
  formation_id: string | null
  decidee_le: string | null
  created_at: string
}

export const MIGRATION_PROPOSITIONS = 'Appliquez la migration 20261206120000_company_proposals.sql pour activer les propositions de formations.'
const ABSENT = new Set(['42P01', 'PGRST205'])
export const messagePropositions = (code: string | undefined) =>
  code && ABSENT.has(code) ? MIGRATION_PROPOSITIONS : 'Lecture ou enregistrement impossible. Réessayez dans un instant.'

const COLONNES = 'id, company_id, type, catalogue_ref, titre, justification, score, origine, statut, formation_id, decidee_le, created_at'

/** Une formation sur mesure retenue reste « à créer » tant qu'aucune formation Academy ne lui est reliée. */
export const estACreer = (p: Pick<Proposition, 'type' | 'statut' | 'formation_id'>) =>
  p.type === 'sur_mesure' && p.statut === 'retenue' && !p.formation_id

/** Clé d'unicité d'une proposition dans une entreprise. */
export const cleProposition = (p: { type: string; catalogue_ref: string | null; titre: string }) =>
  p.catalogue_ref ? `ref:${p.catalogue_ref}` : `titre:${normaliser(p.titre)}`

/** Propositions d'une entreprise : retenues, puis proposées par score, puis écartées. */
export async function lirePropositions(admin: Admin, companyId: string): Promise<{ propositions: Proposition[]; erreur: string | null }> {
  const { data, error } = await admin.from('company_proposals').select(COLONNES).eq('company_id', companyId).limit(500)
  if (error) {
    console.error(`[entreprises] propositions illisibles (${error.code})`)
    return { propositions: [], erreur: messagePropositions(error.code) }
  }
  const rang: Record<StatutProposition, number> = { retenue: 0, proposee: 1, ecartee: 2 }
  const propositions = ((data ?? []) as Proposition[]).sort(
    (a, b) => rang[a.statut] - rang[b.statut] || b.score - a.score || a.titre.localeCompare(b.titre, 'fr'),
  )
  return { propositions, erreur: null }
}

/**
 * Enregistre le résultat d'une analyse sans écraser les décisions déjà
 * prises : une proposition nouvelle est ajoutée ; une proposition encore
 * « proposée » voit sa justification et son score mis à jour ; une
 * proposition retenue ou écartée n'est pas touchée.
 */
export async function enregistrerAnalyse(
  admin: Admin,
  companyId: string,
  calculees: PropositionCalculee[],
  userId: string,
): Promise<{ ok: true; ajoutees: number; mises_a_jour: number } | { ok: false; code: string | undefined }> {
  const existantes = await admin.from('company_proposals').select('id, type, catalogue_ref, titre, statut').eq('company_id', companyId)
  if (existantes.error) return { ok: false, code: existantes.error.code }
  type Courte = Pick<Proposition, 'id' | 'type' | 'catalogue_ref' | 'titre' | 'statut'>
  const parCle = new Map(((existantes.data ?? []) as Courte[]).map((p) => [cleProposition(p), p]))

  const nouvelles = calculees.filter((p) => !parCle.has(cleProposition(p)))
  if (nouvelles.length > 0) {
    const { error } = await admin.from('company_proposals').insert(
      nouvelles.map((p) => ({
        company_id: companyId, type: p.type, catalogue_ref: p.catalogue_ref, titre: p.titre.slice(0, 200),
        justification: p.justification, score: p.score, origine: 'analyse', cree_par: userId,
      })),
    )
    if (error) return { ok: false, code: error.code }
  }

  let misesAJour = 0
  for (const p of calculees) {
    const existante = parCle.get(cleProposition(p))
    if (!existante || existante.statut !== 'proposee') continue
    const { error } = await admin
      .from('company_proposals')
      .update({ justification: p.justification, score: p.score })
      .eq('id', existante.id)
      .eq('statut', 'proposee')
    if (!error) misesAJour++
  }
  return { ok: true, ajoutees: nouvelles.length, mises_a_jour: misesAJour }
}

export interface FormationLiable {
  id: string
  titre: string
  publiee: boolean
}

/** Formations Academy que l'on peut relier à une proposition sur mesure. */
export async function lireFormationsLiables(admin: Admin): Promise<FormationLiable[]> {
  const { data, error } = await admin.from('formations').select('id, titre, is_published').order('created_at', { ascending: false }).limit(500)
  if (error) console.error(`[entreprises] formations illisibles (${error.code})`)
  return ((data ?? []) as { id: string; titre: string; is_published: boolean | null }[]).map((f) => ({
    id: f.id, titre: f.titre, publiee: f.is_published === true,
  }))
}

export interface SurMesureACreer {
  id: string
  company_id: string
  entreprise: string
  titre: string
  justification: string | null
  decidee_le: string | null
}

/** File de l'admin : formations sur mesure retenues, encore à créer, la plus ancienne en tête. */
export async function lireSurMesureACreer(admin: Admin): Promise<SurMesureACreer[]> {
  const { data, error } = await admin
    .from('company_proposals')
    .select('id, company_id, titre, justification, decidee_le')
    .eq('type', 'sur_mesure')
    .eq('statut', 'retenue')
    .is('formation_id', null)
    .order('decidee_le', { ascending: true, nullsFirst: false })
    .limit(200)
  // Avant la migration, la table n'existe pas : la file est simplement vide.
  if (error || !data || data.length === 0) return []
  const lignes = data as Omit<SurMesureACreer, 'entreprise'>[]
  const entreprises = await admin.from('company_profiles').select('id, nom_entreprise').in('id', [...new Set(lignes.map((l) => l.company_id))])
  const noms = new Map(((entreprises.data ?? []) as { id: string; nom_entreprise: string }[]).map((e) => [e.id, e.nom_entreprise]))
  return lignes.map((l) => ({ ...l, entreprise: noms.get(l.company_id) ?? 'Entreprise' }))
}
