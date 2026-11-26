import { createAdminClient } from '@/lib/supabase/admin'
import {
  chronologie,
  dateLaPlusRecente,
  indicateurs,
  joursActifs,
  moyenne,
  niveauActivite,
  progressionPourcent,
  provenanceCompte,
  serieDeJours,
  type Evenement,
  type ResumeUtilisateur,
  type StatutInscription,
  type SuiviFormation,
} from '@/lib/admin/user-activity'

/**
 * Lecture des données de suivi des utilisateurs pour l'écran d'administration.
 *
 * Utilise la clé de service (contourne la RLS) : à n'appeler que depuis une
 * page déjà protégée par requireAdmin(). Chaque source est lue séparément ;
 * si l'une échoue (table ou colonne absente dans cet environnement), elle est
 * signalée dans `indisponibles` et le reste s'affiche quand même.
 */

type Admin = ReturnType<typeof createAdminClient>
type Ligne = Record<string, unknown>

const PAGE = 1000
const MAX_LIGNES = 20_000
const MAX_EVENEMENTS = 60
const JOURS_CALENDRIER = 84

const txt = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null)
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const liste = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const STATUTS: readonly StatutInscription[] = ['pending', 'active', 'rejected', 'completed']
const statut = (v: unknown): StatutInscription =>
  STATUTS.includes(v as StatutInscription) ? (v as StatutInscription) : 'pending'

/** Lit toutes les lignes d'une table par pages de 1000 (plafond de l'API). */
async function lire(
  admin: Admin,
  table: string,
  colonnes: string,
  tri: string,
  indisponibles: string[],
  filtre?: { colonne: string; valeur: string }
): Promise<Ligne[]> {
  const lignes: Ligne[] = []
  for (let de = 0; de < MAX_LIGNES; de += PAGE) {
    let requete = admin.from(table).select(colonnes)
    if (filtre) requete = requete.eq(filtre.colonne, filtre.valeur)
    const { data, error } = await requete.order(tri, { ascending: false }).range(de, de + PAGE - 1)
    if (error) {
      console.error(`[admin/users] lecture de ${table} impossible : ${error.message}`)
      indisponibles.push(table)
      break
    }
    const page = (data ?? []) as unknown as Ligne[]
    lignes.push(...page)
    if (page.length < PAGE) break
  }
  return lignes
}

interface CompteAuth {
  derniereConnexion: string | null
  creeLe: string | null
  emailConfirme: boolean
  source: unknown
  fournisseurs: string[]
}

function compteAuth(u: {
  last_sign_in_at?: string | null
  created_at?: string | null
  email_confirmed_at?: string | null
  user_metadata?: Record<string, unknown> | null
  app_metadata?: Record<string, unknown> | null
}): CompteAuth {
  const fournisseurs = liste(u.app_metadata?.providers).filter((p): p is string => typeof p === 'string')
  const principal = txt(u.app_metadata?.provider)
  return {
    derniereConnexion: u.last_sign_in_at ?? null,
    creeLe: u.created_at ?? null,
    emailConfirme: !!u.email_confirmed_at,
    source: u.user_metadata?.source,
    fournisseurs: principal && !fournisseurs.includes(principal) ? [...fournisseurs, principal] : fournisseurs,
  }
}

async function comptesAuth(admin: Admin, indisponibles: string[]): Promise<Map<string, CompteAuth>> {
  const comptes = new Map<string, CompteAuth>()
  for (let page = 1; page <= MAX_LIGNES / PAGE; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE })
    if (error) {
      console.error(`[admin/users] lecture des comptes impossible : ${error.message}`)
      indisponibles.push('comptes de connexion')
      break
    }
    for (const u of data.users) comptes.set(u.id, compteAuth(u))
    if (data.users.length < PAGE) break
  }
  return comptes
}

/** Regroupe des lignes par valeur d'une colonne. */
function grouper(lignes: Ligne[], colonne: string): Map<string, Ligne[]> {
  const groupes = new Map<string, Ligne[]>()
  for (const l of lignes) {
    const cle = txt(l[colonne])
    if (!cle) continue
    const groupe = groupes.get(cle)
    if (groupe) groupe.push(l)
    else groupes.set(cle, [l])
  }
  return groupes
}

interface Catalogue {
  formations: Map<string, { titre: string; slug: string | null; liveCode: string | null }>
  lecons: Map<string, number>
}

function catalogue(formations: Ligne[], lecons: Ligne[]): Catalogue {
  const parFormation = new Map<string, number>()
  for (const l of lecons) {
    const id = txt(l.formation_id)
    if (id) parFormation.set(id, (parFormation.get(id) ?? 0) + 1)
  }
  return {
    formations: new Map(
      formations.map((f) => [
        String(f.id),
        { titre: txt(f.titre) ?? 'Formation sans titre', slug: txt(f.slug), liveCode: txt(f.live_code) },
      ])
    ),
    lecons: parFormation,
  }
}

/** Suivi de chaque formation d'un utilisateur, à partir de ses inscriptions. */
function suivis(
  inscriptions: Ligne[],
  cat: Catalogue,
  progressionsLive: Ligne[],
  quiz: Ligne[],
  completions: Ligne[]
): SuiviFormation[] {
  const liveParCode = new Map(progressionsLive.map((p) => [String(p.formation_code), p]))
  return inscriptions.map((i) => {
    const formationId = String(i.formation_id)
    const f = cat.formations.get(formationId)
    const live = f?.liveCode ? liveParCode.get(f.liveCode) : undefined
    const st = statut(i.status)
    const faites = live ? num(live.exercices_reussis) : liste(i.progress).length
    const total = live ? num(live.exercices_total) : (cat.lecons.get(formationId) ?? 0)
    const scores = quiz.filter((q) => q.formation_id === i.formation_id).map((q) => num(q.score))
    return {
      formationId,
      titre: f?.titre ?? 'Formation supprimée',
      slug: f?.slug ?? null,
      statut: st,
      lieu: f?.liveCode ? 'studia_live' : 'academy',
      faites,
      total,
      progression: st === 'completed' ? 100 : progressionPourcent(faites, total),
      meilleurQuiz: scores.length > 0 ? Math.max(...scores) : null,
      pointsLive: live ? num(live.points) : null,
      niveauLive: live ? txt(live.niveau) : null,
      demandeLe: txt(i.requested_at),
      accordeLe: txt(i.granted_at),
      termineLe: txt(i.completed_at),
      derniereActivite: dateLaPlusRecente([
        ...completions.filter((c) => c.formation_id === i.formation_id).map((c) => txt(c.completed_at)),
        live ? txt(live.source_mis_a_jour) : null,
      ]),
    }
  })
}

function resume(
  profil: Ligne,
  auth: CompteAuth | undefined,
  estCollaborateur: boolean,
  suivisUtilisateur: SuiviFormation[],
  sources: { completions: Ligne[]; quiz: Ligne[]; outils: Ligne[]; progressionsLive: Ligne[]; inscriptions: Ligne[] },
  maintenant: Date
): ResumeUtilisateur {
  const avecAcces = suivisUtilisateur.filter((s) => s.statut === 'active' || s.statut === 'completed')
  const derniereConnexion = auth?.derniereConnexion ?? txt(profil.last_login_at)
  const derniereActivite = dateLaPlusRecente([
    derniereConnexion,
    ...sources.completions.map((c) => txt(c.completed_at)),
    ...sources.quiz.map((q) => txt(q.created_at)),
    ...sources.outils.map((o) => txt(o.created_at)),
    ...sources.progressionsLive.map((p) => txt(p.source_mis_a_jour)),
    ...sources.inscriptions.map((i) => txt(i.requested_at)),
  ])
  return {
    id: String(profil.id),
    nom: txt(profil.full_name),
    email: txt(profil.email),
    telephone: txt(profil.phone),
    ville: txt(profil.city),
    typeCompte: txt(profil.account_type) ?? (profil.is_teacher === true ? 'teacher' : 'student'),
    role: txt(profil.role) ?? 'user',
    provenance: provenanceCompte({
      source: auth?.source,
      fournisseurs: auth?.fournisseurs,
      estCollaborateur,
    }),
    inscritLe: txt(profil.created_at) ?? auth?.creeLe ?? null,
    derniereConnexion,
    derniereActivite,
    activite: niveauActivite(derniereActivite, maintenant),
    formations: avecAcces.length,
    formationsTerminees: suivisUtilisateur.filter((s) => s.statut === 'completed').length,
    demandesEnAttente: suivisUtilisateur.filter((s) => s.statut === 'pending').length,
    progression: moyenne(avecAcces.map((s) => s.progression)),
    leconsTerminees: suivisUtilisateur.filter((s) => s.lieu === 'academy').reduce((n, s) => n + s.faites, 0),
    pointsLive: sources.progressionsLive.reduce((n, p) => n + num(p.points), 0),
    outilsUtilises: sources.outils.length,
    formationIds: [...new Set(suivisUtilisateur.map((s) => s.formationId))],
    statuts: [...new Set(suivisUtilisateur.map((s) => s.statut))],
  }
}

export interface ListeUtilisateurs {
  utilisateurs: ResumeUtilisateur[]
  chiffres: ReturnType<typeof indicateurs>
  formations: { id: string; titre: string }[]
  /** Sources qui n'ont pas pu être lues : les chiffres correspondants sont à 0. */
  indisponibles: string[]
}

/**
 * Tous les comptes avec leur résumé d'activité, pour la table /admin/users.
 *
 * @example
 * await requireAdmin()
 * const { utilisateurs } = await chargerUtilisateurs()
 */
export async function chargerUtilisateurs(): Promise<ListeUtilisateurs> {
  const admin = createAdminClient()
  const indisponibles: string[] = []
  const [profils, auth, inscriptions, formations, lecons, completions, quiz, live, outils, collaborateurs] =
    await Promise.all([
      lire(admin, 'profiles', '*', 'created_at', indisponibles),
      comptesAuth(admin, indisponibles),
      lire(
        admin,
        'formation_enrollments',
        'user_id, formation_id, status, progress, requested_at, granted_at, completed_at',
        'requested_at',
        indisponibles
      ),
      lire(admin, 'formations', 'id, titre, slug, live_code', 'created_at', indisponibles),
      lire(admin, 'formation_lessons', 'formation_id', 'formation_id', indisponibles),
      lire(admin, 'lesson_completions', 'user_id, formation_id, completed_at', 'completed_at', indisponibles),
      lire(admin, 'formation_quiz_results', 'user_id, formation_id, score, created_at', 'created_at', indisponibles),
      lire(
        admin,
        'live_progressions',
        'user_id, formation_code, points, niveau, exercices_reussis, exercices_total, source_mis_a_jour',
        'source_mis_a_jour',
        indisponibles
      ),
      lire(admin, 'outil_generations', 'user_id, created_at', 'created_at', indisponibles),
      lire(admin, 'collaborators', 'user_id', 'created_at', indisponibles),
    ])

  const cat = catalogue(formations, lecons)
  const par = {
    inscriptions: grouper(inscriptions, 'user_id'),
    completions: grouper(completions, 'user_id'),
    quiz: grouper(quiz, 'user_id'),
    live: grouper(live, 'user_id'),
    outils: grouper(outils, 'user_id'),
  }
  const equipe = new Set(collaborateurs.map((c) => txt(c.user_id)).filter(Boolean))
  const maintenant = new Date()

  const utilisateurs = profils.map((p) => {
    const id = String(p.id)
    const sources = {
      inscriptions: par.inscriptions.get(id) ?? [],
      completions: par.completions.get(id) ?? [],
      quiz: par.quiz.get(id) ?? [],
      progressionsLive: par.live.get(id) ?? [],
      outils: par.outils.get(id) ?? [],
    }
    const s = suivis(sources.inscriptions, cat, sources.progressionsLive, sources.quiz, sources.completions)
    return resume(p, auth.get(id), equipe.has(id), s, sources, maintenant)
  })

  return {
    utilisateurs,
    chiffres: indicateurs(utilisateurs, maintenant),
    formations: [...cat.formations.entries()]
      .map(([id, f]) => ({ id, titre: f.titre }))
      .sort((a, b) => a.titre.localeCompare(b.titre, 'fr')),
    indisponibles: [...new Set(indisponibles)],
  }
}

export interface ProfilUtilisateur {
  resume: ResumeUtilisateur
  infos: {
    pays: string | null
    dateNaissance: string | null
    adresse: string | null
    bio: string | null
    emailVerifie: boolean | null
    statutCompte: string | null
  }
  suivis: SuiviFormation[]
  sessionsLive: {
    titre: string
    formation: string | null
    date: string | null
    score: number
    rang: number | null
    participants: number | null
  }[]
  bilan: {
    joursActifs30: number
    serie: number
    quizPasses: number
    meilleurQuiz: number | null
    reservations: number
    soldeCredits: number | null
    creditsDepenses: number | null
    outils: { slug: string; nombre: number }[]
  }
  evenements: Evenement[]
  /** Nombre d'actions par jour sur les 12 dernières semaines, du plus ancien au plus récent. */
  calendrier: { jour: string; nombre: number }[]
  indisponibles: string[]
}

/**
 * Fiche complète d'un utilisateur : informations, formations, progression,
 * bilan d'activité et historique. Null si le compte n'existe pas.
 */
export async function chargerProfilUtilisateur(id: string): Promise<ProfilUtilisateur | null> {
  const admin = createAdminClient()
  const indisponibles: string[] = []
  const moi = { colonne: 'user_id', valeur: id }

  const [profils, authRes, inscriptions, formations, lecons, completions, quiz, live, participations] =
    await Promise.all([
      lire(admin, 'profiles', '*', 'created_at', indisponibles, { colonne: 'id', valeur: id }),
      admin.auth.admin.getUserById(id),
      lire(
        admin,
        'formation_enrollments',
        'user_id, formation_id, status, progress, requested_at, granted_at, completed_at',
        'requested_at',
        indisponibles,
        moi
      ),
      lire(admin, 'formations', 'id, titre, slug, live_code', 'created_at', indisponibles),
      lire(admin, 'formation_lessons', 'id, formation_id, titre', 'formation_id', indisponibles),
      lire(admin, 'lesson_completions', 'formation_id, lesson_id, completed_at', 'completed_at', indisponibles, moi),
      lire(admin, 'formation_quiz_results', 'formation_id, score, created_at', 'created_at', indisponibles, moi),
      lire(admin, 'live_progressions', '*', 'source_mis_a_jour', indisponibles, moi),
      lire(admin, 'live_participations', '*', 'created_at', indisponibles, moi),
    ])
  const profil = profils[0]
  if (!profil) return null

  const [outils, reservations, sessions, portefeuilles, collaborateurs] = await Promise.all([
    lire(admin, 'outil_generations', 'tool_slug, title, credits_used, created_at', 'created_at', indisponibles, moi),
    lire(admin, 'presentiel_reservations', 'session_id, status, created_at', 'created_at', indisponibles, moi),
    lire(admin, 'presentiel_sessions', 'id, titre', 'created_at', indisponibles),
    lire(admin, 'wallets', 'balance, total_spent, created_at', 'created_at', indisponibles, moi),
    lire(admin, 'collaborators', 'user_id', 'created_at', indisponibles, moi),
  ])

  const auth = authRes.data?.user ? compteAuth(authRes.data.user) : undefined
  const cat = catalogue(formations, lecons)
  const maintenant = new Date()
  const s = suivis(inscriptions, cat, live, quiz, completions)
  const res = resume(
    profil,
    auth,
    collaborateurs.length > 0,
    s,
    { inscriptions, completions, quiz, progressionsLive: live, outils },
    maintenant
  )

  // ── Historique ──
  const titreLecon = new Map(lecons.map((l) => [String(l.id), txt(l.titre) ?? 'Leçon']))
  const titreFormation = (fid: unknown) => cat.formations.get(String(fid))?.titre ?? 'Formation supprimée'
  const titreSession = new Map(sessions.map((x) => [String(x.id), txt(x.titre) ?? 'Session en salle']))
  const evenements: Evenement[] = []
  const ajouter = (date: string | null, e: Omit<Evenement, 'date'>) => {
    if (date) evenements.push({ date, ...e })
  }
  ajouter(res.inscritLe, { type: 'compte', titre: 'Création du compte' })
  for (const i of inscriptions) {
    const titre = titreFormation(i.formation_id)
    ajouter(txt(i.requested_at), { type: 'demande', titre: 'Inscription à une formation', detail: titre })
    ajouter(txt(i.granted_at), { type: 'acces', titre: 'Accès accordé', detail: titre })
    ajouter(txt(i.completed_at), { type: 'termine', titre: 'Formation terminée', detail: titre })
  }
  for (const c of completions) {
    ajouter(txt(c.completed_at), {
      type: 'lecon',
      titre: 'Leçon terminée',
      detail: `${titreLecon.get(String(c.lesson_id)) ?? 'Leçon'} — ${titreFormation(c.formation_id)}`,
    })
  }
  for (const q of quiz) {
    ajouter(txt(q.created_at), {
      type: 'quiz',
      titre: `Quiz final : ${num(q.score)} points`,
      detail: titreFormation(q.formation_id),
    })
  }
  for (const o of outils) {
    ajouter(txt(o.created_at), {
      type: 'outil',
      titre: 'Outil IA utilisé',
      detail: txt(o.title) ?? txt(o.tool_slug) ?? undefined,
    })
  }
  for (const r of reservations) {
    ajouter(txt(r.created_at), {
      type: 'reservation',
      titre: 'Réservation en présentiel',
      detail: titreSession.get(String(r.session_id)),
    })
  }
  for (const p of participations) {
    ajouter(txt(p.date_formation) ?? txt(p.created_at), {
      type: 'session_live',
      titre: `Session Studia Live : ${num(p.score)} points`,
      detail: txt(p.session_titre) ?? undefined,
    })
  }
  for (const p of live) {
    ajouter(txt(p.source_mis_a_jour), {
      type: 'progression_live',
      titre: 'Progression sur Studia Live',
      detail: `${txt(p.formation_label) ?? String(p.formation_code)} — ${num(p.exercices_reussis)}/${num(p.exercices_total)} exercices`,
    })
  }

  // ── Bilan ──
  const datesActions = evenements.filter((e) => e.type !== 'compte').map((e) => e.date)
  const jours = joursActifs(datesActions)
  const parJour = new Map<string, number>()
  for (const d of datesActions) parJour.set(d.slice(0, 10), (parJour.get(d.slice(0, 10)) ?? 0) + 1)
  const calendrier: { jour: string; nombre: number }[] = []
  for (let i = JOURS_CALENDRIER - 1; i >= 0; i--) {
    const jour = new Date(maintenant.getTime() - i * 24 * 3600 * 1000).toISOString().slice(0, 10)
    calendrier.push({ jour, nombre: parJour.get(jour) ?? 0 })
  }
  const parOutil = new Map<string, number>()
  for (const o of outils) {
    const slug = txt(o.tool_slug) ?? 'outil'
    parOutil.set(slug, (parOutil.get(slug) ?? 0) + 1)
  }
  const scores = quiz.map((q) => num(q.score))
  const portefeuille = portefeuilles[0]

  return {
    resume: res,
    infos: {
      pays: txt(profil.country),
      dateNaissance: txt(profil.date_of_birth),
      adresse: txt(profil.address),
      bio: txt(profil.bio),
      emailVerifie: auth ? auth.emailConfirme : null,
      statutCompte: txt(profil.status),
    },
    suivis: s,
    sessionsLive: participations.map((p) => ({
      titre: txt(p.session_titre) ?? 'Session',
      formation: txt(p.formation_label),
      date: txt(p.date_formation),
      score: num(p.score),
      rang: typeof p.rang === 'number' ? p.rang : null,
      participants: typeof p.nb_participants === 'number' ? p.nb_participants : null,
    })),
    bilan: {
      joursActifs30: calendrier.slice(-30).filter((j) => j.nombre > 0).length,
      serie: serieDeJours(jours, maintenant),
      quizPasses: quiz.length,
      meilleurQuiz: scores.length > 0 ? Math.max(...scores) : null,
      reservations: reservations.length,
      soldeCredits: portefeuille ? num(portefeuille.balance) : null,
      creditsDepenses: portefeuille ? num(portefeuille.total_spent) : null,
      outils: [...parOutil.entries()].map(([slug, nombre]) => ({ slug, nombre })).sort((a, b) => b.nombre - a.nombre),
    },
    evenements: chronologie(evenements, MAX_EVENEMENTS),
    calendrier,
    indisponibles: [...new Set(indisponibles)],
  }
}
