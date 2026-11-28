import type { createAdminClient } from '@/lib/supabase/admin'
import type { DonneesSessionLive, SessionLiveResume } from '@/lib/studia-live/pilotage'
import { dateIso } from '@/lib/studia-live/suivi-regles'
import { analyserSessions, type AnalyseEntreprise } from './analyse'
import {
  agregerSessions, comptesAEtiqueter, etatEvenement, participantsEntreprise, trierSessions, type Entreprise,
  type IndicateursEntreprise, type ParticipantEntreprise, type SessionDisponible, type SessionEntreprise,
} from './dossier-regles'

/**
 * Lecture des dossiers entreprise pour l'admin, et calcul des étiquettes
 * « entreprise » des participants.
 *
 * Serveur uniquement, avec la clé de service : à n'appeler que derrière
 * requireAdmin(). Les participants lus sont nominatifs : seuls des
 * compteurs et des codes d'erreur sont journalisés.
 */

type Admin = ReturnType<typeof createAdminClient>
type Ligne = Record<string, unknown>

export const MIGRATION_ENTREPRISES = 'Appliquez la migration 20261205120000_entreprises_admin.sql pour gérer les entreprises depuis l’admin.'
const ABSENT = new Set(['42P01', '42703', 'PGRST204', 'PGRST205'])
export const messageBase = (code: string | undefined) =>
  code && ABSENT.has(code) ? MIGRATION_ENTREPRISES : 'Lecture ou enregistrement impossible. Réessayez dans un instant.'

const COLONNES_ENTREPRISE =
  'id, user_id, nom_entreprise, secteur, effectif_estime, ville, contact_nom, contact_phone, contact_email, ' +
  'direction_nom, direction_email, notes, responsable_id, created_at'

export interface EntrepriseResume extends Entreprise {
  nb_sessions: number
  nb_etiquetes: number
  nb_diagnostics: number
}

function compter(lignes: Ligne[] | null, cle = 'company_id'): Map<string, number> {
  const total = new Map<string, number>()
  for (const l of lignes ?? []) {
    const id = l[cle]
    if (typeof id === 'string') total.set(id, (total.get(id) ?? 0) + 1)
  }
  return total
}

/** Toutes les entreprises, de la plus récente à la plus ancienne, avec leurs compteurs. */
export async function lireEntreprises(admin: Admin): Promise<{ entreprises: EntrepriseResume[]; erreur: string | null }> {
  const [entreprises, sessions, membres, diagnostics] = await Promise.all([
    admin.from('company_profiles').select(COLONNES_ENTREPRISE).order('created_at', { ascending: false }).limit(2000),
    admin.from('company_sessions').select('company_id').limit(20_000),
    admin.from('company_members').select('company_id').limit(50_000),
    admin.from('company_assessments').select('company_id').limit(20_000),
  ])
  const erreur = entreprises.error ?? sessions.error ?? membres.error
  if (erreur) {
    console.error(`[entreprises] lecture impossible (${erreur.code})`)
    return { entreprises: [], erreur: messageBase(erreur.code) }
  }
  const parSessions = compter(sessions.data as Ligne[] | null)
  const parMembres = compter(membres.data as Ligne[] | null)
  const parDiagnostics = compter(diagnostics.data as Ligne[] | null)
  return {
    erreur: null,
    entreprises: ((entreprises.data ?? []) as unknown as Entreprise[]).map((e) => ({
      ...e,
      nb_sessions: parSessions.get(e.id) ?? 0,
      nb_etiquetes: parMembres.get(e.id) ?? 0,
      nb_diagnostics: parDiagnostics.get(e.id) ?? 0,
    })),
  }
}

interface LienSession {
  id: string
  live_session_id: string | null
  presentiel_session_id: string | null
}

interface SessionLiveLue {
  live_session_id: string
  code: string
  titre: string
  formation_label: string | null
  date_formation: string | null
  resume: Partial<SessionLiveResume> | null
  supprimee_live_le: string | null
  donnees?: DonneesSessionLive | null
}

interface EvenementLu {
  id: string
  titre: string
  categorie: string | null
  date_debut: string | null
  places_total: number | null
  places_reservees: number | null
}

/** Sessions rattachées à une entreprise, avec le détail Studia Live quand il est demandé. */
async function lireSessionsRattachees(admin: Admin, companyId: string, maintenant: number, avecDetail: boolean) {
  const liens = await admin.from('company_sessions').select('id, live_session_id, presentiel_session_id').eq('company_id', companyId)
  if (liens.error) return { erreur: liens.error.code as string | undefined, sessions: [] as SessionEntreprise[], lives: [] as SessionLiveLue[] }
  const lignes = (liens.data ?? []) as LienSession[]
  const idsLive = lignes.map((l) => l.live_session_id).filter((v): v is string => !!v)
  const idsEvenements = lignes.map((l) => l.presentiel_session_id).filter((v): v is string => !!v)

  const colonnesLive = `live_session_id, code, titre, formation_label, date_formation, resume, supprimee_live_le${avecDetail ? ', donnees' : ''}`
  const [lives, evenements] = await Promise.all([
    idsLive.length > 0
      ? admin.from('live_sessions_suivi').select(colonnesLive).in('live_session_id', idsLive)
      : Promise.resolve({ data: [], error: null }),
    idsEvenements.length > 0
      ? admin.from('presentiel_sessions').select('id, titre, categorie, date_debut, places_total, places_reservees').in('id', idsEvenements)
      : Promise.resolve({ data: [], error: null }),
  ])
  const parLive = new Map(((lives.data ?? []) as unknown as SessionLiveLue[]).map((s) => [s.live_session_id, s]))
  const parEvenement = new Map(((evenements.data ?? []) as unknown as EvenementLu[]).map((e) => [e.id, e]))

  const sessions: SessionEntreprise[] = []
  for (const l of lignes) {
    const live = l.live_session_id ? parLive.get(l.live_session_id) : undefined
    const evenement = l.presentiel_session_id ? parEvenement.get(l.presentiel_session_id) : undefined
    if (live) {
      const resume = live.resume ?? {}
      sessions.push({
        lien_id: l.id, source: 'live', session_id: live.live_session_id, titre: live.titre, code: live.code,
        formation: live.formation_label, date: dateIso(live.date_formation), etat: 'passee',
        participants: typeof resume.nb_participants === 'number' ? resume.nb_participants : null,
        resume, places_total: null, supprimee_live: !!live.supprimee_live_le,
      })
    } else if (evenement) {
      const etat = etatEvenement(evenement.date_debut, maintenant)
      sessions.push({
        lien_id: l.id, source: 'presentiel', session_id: evenement.id, titre: evenement.titre, code: null,
        formation: evenement.categorie, date: evenement.date_debut, etat,
        participants: etat === 'passee' ? evenement.places_reservees : null,
        resume: {}, places_total: evenement.places_total, supprimee_live: false,
      })
    }
  }
  return { erreur: undefined, sessions: trierSessions(sessions), lives: [...parLive.values()] }
}

export interface DossierEntreprise {
  entreprise: Entreprise
  sessions: SessionEntreprise[]
  indicateurs: IndicateursEntreprise
  participants: ParticipantEntreprise[]
  /** Comptes Academy portant l'étiquette de l'entreprise. */
  etiquetes: string[]
  diagnostics: { id: string; titre: string; status: string; nb_submissions: number | null }[]
  /** Analyse par règles des sessions passées (thèmes, priorités, propositions calculées). */
  analyse: AnalyseEntreprise
}

/** Détail Studia Live des sessions passées d'une entreprise, pour l'analyse. */
export async function lireDonneesSessions(admin: Admin, companyId: string): Promise<{ donnees: DonneesSessionLive | null }[] | null> {
  const rattachees = await lireSessionsRattachees(admin, companyId, Date.now(), true)
  if (rattachees.erreur) return null
  return rattachees.lives.map((s) => ({ donnees: s.donnees ?? null }))
}

/** Le dossier complet d'une entreprise, ou null si elle n'existe pas. */
export async function lireDossier(admin: Admin, id: string, maintenant = Date.now()): Promise<DossierEntreprise | null> {
  const { data, error } = await admin.from('company_profiles').select(COLONNES_ENTREPRISE).eq('id', id).maybeSingle()
  if (error) console.error(`[entreprises] fiche illisible (${error.code})`)
  if (error || !data) return null

  const [rattachees, membres, diagnostics] = await Promise.all([
    lireSessionsRattachees(admin, id, maintenant, true),
    admin.from('company_members').select('user_id').eq('company_id', id),
    admin.from('company_assessments').select('id, titre, status, nb_submissions').eq('company_id', id).order('created_at', { ascending: false }),
  ])
  if (rattachees.erreur) console.error(`[entreprises] sessions illisibles (${rattachees.erreur})`)

  return {
    entreprise: data as unknown as Entreprise,
    sessions: rattachees.sessions,
    indicateurs: agregerSessions(rattachees.sessions),
    participants: participantsEntreprise(
      rattachees.lives.map((s) => ({ titre: s.titre, date: dateIso(s.date_formation), donnees: s.donnees ?? null })),
    ),
    etiquetes: ((membres.data ?? []) as { user_id: string }[]).map((m) => m.user_id),
    diagnostics: (diagnostics.data ?? []) as DossierEntreprise['diagnostics'],
    analyse: analyserSessions(rattachees.lives.map((s) => ({ donnees: s.donnees ?? null }))),
  }
}

/** Sessions qui ne sont rattachées à aucune entreprise : Studia Live clôturées et événements. */
export async function lireSessionsDisponibles(admin: Admin, maintenant = Date.now()): Promise<SessionDisponible[]> {
  const [prises, lives, evenements] = await Promise.all([
    admin.from('company_sessions').select('live_session_id, presentiel_session_id').limit(20_000),
    admin
      .from('live_sessions_suivi')
      .select('live_session_id, code, titre, formation_label, date_formation, resume')
      .is('supprimee_live_le', null)
      .order('date_formation', { ascending: false, nullsFirst: false })
      .limit(1000),
    admin.from('presentiel_sessions').select('id, titre, categorie, date_debut, places_total, places_reservees').order('date_debut', { ascending: false }).limit(1000),
  ])
  const dejaPrises = new Set<string>()
  for (const l of (prises.data ?? []) as Omit<LienSession, 'id'>[]) {
    if (l.live_session_id) dejaPrises.add(l.live_session_id)
    if (l.presentiel_session_id) dejaPrises.add(l.presentiel_session_id)
  }

  const disponibles: SessionDisponible[] = []
  for (const s of (lives.data ?? []) as unknown as SessionLiveLue[]) {
    if (dejaPrises.has(s.live_session_id)) continue
    const n = s.resume?.nb_participants
    disponibles.push({
      source: 'live', session_id: s.live_session_id, titre: s.titre, code: s.code, formation: s.formation_label,
      date: dateIso(s.date_formation), etat: 'passee', participants: typeof n === 'number' ? n : null,
    })
  }
  for (const e of (evenements.data ?? []) as unknown as EvenementLu[]) {
    if (dejaPrises.has(e.id)) continue
    const etat = etatEvenement(e.date_debut, maintenant)
    disponibles.push({
      source: 'presentiel', session_id: e.id, titre: e.titre, code: null, formation: e.categorie, date: e.date_debut, etat,
      participants: etat === 'passee' ? e.places_reservees : e.places_total,
    })
  }
  return trierSessions(disponibles)
}

/** Entreprises dont un compte porte l'étiquette (pour la fiche utilisateur de l'admin). */
export async function lireEntreprisesDuCompte(admin: Admin, userId: string): Promise<{ id: string; nom: string }[]> {
  const membres = await admin.from('company_members').select('company_id').eq('user_id', userId)
  const ids = ((membres.data ?? []) as { company_id: string }[]).map((m) => m.company_id)
  if (membres.error || ids.length === 0) return []
  const { data } = await admin.from('company_profiles').select('id, nom_entreprise').in('id', ids)
  return ((data ?? []) as { id: string; nom_entreprise: string }[]).map((e) => ({ id: e.id, nom: e.nom_entreprise }))
}

/**
 * Recalcule les étiquettes d'une entreprise : les comptes Academy reliés
 * aux participants de ses sessions Studia Live la portent, les autres la
 * perdent. Rejouable sans effet de bord.
 */
export async function recalculerEtiquettes(admin: Admin, companyId: string): Promise<{ ok: true; etiquetes: number } | { ok: false; code: string | undefined }> {
  const rattachees = await lireSessionsRattachees(admin, companyId, Date.now(), true)
  if (rattachees.erreur) return { ok: false, code: rattachees.erreur }

  const voulus = comptesAEtiqueter(rattachees.lives.map((s) => ({ donnees: s.donnees ?? null })))
  // Un compte Academy supprimé depuis la session ne peut plus être étiqueté.
  const existants =
    voulus.length > 0 ? await admin.from('profiles').select('id').in('id', voulus) : { data: [] as { id: string }[], error: null }
  if (existants.error) return { ok: false, code: existants.error.code }
  const comptes = new Set(((existants.data ?? []) as { id: string }[]).map((p) => p.id))

  const actuels = await admin.from('company_members').select('user_id').eq('company_id', companyId)
  if (actuels.error) return { ok: false, code: actuels.error.code }
  const deja = new Set(((actuels.data ?? []) as { user_id: string }[]).map((m) => m.user_id))

  const aAjouter = [...comptes].filter((id) => !deja.has(id))
  const aRetirer = [...deja].filter((id) => !comptes.has(id))
  if (aAjouter.length > 0) {
    const { error } = await admin
      .from('company_members')
      .upsert(aAjouter.map((user_id) => ({ company_id: companyId, user_id })), { onConflict: 'company_id,user_id' })
    if (error) return { ok: false, code: error.code }
  }
  if (aRetirer.length > 0) {
    const { error } = await admin.from('company_members').delete().eq('company_id', companyId).in('user_id', aRetirer)
    if (error) return { ok: false, code: error.code }
  }
  return { ok: true, etiquetes: comptes.size }
}
