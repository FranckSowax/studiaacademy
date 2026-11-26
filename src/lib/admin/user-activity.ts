/**
 * Suivi des utilisateurs (écran d'administration) : types partagés et règles
 * de calcul pures. Aucune lecture de données ici — voir users-data.ts.
 */

// ── Provenance du compte ────────────────────────────────────────────

export type Provenance = 'studia_live' | 'equipe' | 'google' | 'site'

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  studia_live: 'Studia Live',
  equipe: 'Équipe Studia',
  google: 'Connexion Google',
  site: 'Inscription sur le site',
}

/**
 * D'où vient un compte : créé depuis Studia Live, fiche de l'équipe,
 * connexion Google, ou inscription classique sur le site.
 *
 * @example
 * provenanceCompte({ source: 'studia_live', fournisseurs: ['email'] }) // 'studia_live'
 */
export function provenanceCompte(compte: {
  source?: unknown
  fournisseurs?: readonly string[]
  estCollaborateur?: boolean
}): Provenance {
  if (compte.source === 'studia_live') return 'studia_live'
  if (compte.estCollaborateur) return 'equipe'
  if (compte.fournisseurs?.includes('google')) return 'google'
  return 'site'
}

// ── Niveau d'activité ───────────────────────────────────────────────

export type NiveauActivite = 'actif_7j' | 'actif_30j' | 'inactif' | 'jamais'

export const ACTIVITE_LABEL: Record<NiveauActivite, string> = {
  actif_7j: 'Actif (7 jours)',
  actif_30j: 'Actif (30 jours)',
  inactif: 'Inactif',
  jamais: 'Jamais actif',
}

/** Classes Tailwind de la pastille d'activité. */
export const ACTIVITE_STYLE: Record<NiveauActivite, string> = {
  actif_7j: 'bg-green-50 text-green-700',
  actif_30j: 'bg-amber-50 text-amber-700',
  inactif: 'bg-gray-100 text-gray-600',
  jamais: 'bg-gray-50 text-gray-400',
}

export const TYPE_COMPTE_LABEL: Record<string, string> = {
  student: 'Étudiant',
  teacher: 'Professeur',
  pro: 'Pro',
}

export const ROLE_LABEL: Record<string, string> = {
  user: 'Utilisateur',
  admin: 'Admin',
  super_admin: 'Super admin',
}

/** Chiffres clés affichés au-dessus de la table des utilisateurs. */
export function indicateurs(
  utilisateurs: readonly { inscritLe: string | null; activite: NiveauActivite; formations: number; formationsTerminees: number }[],
  maintenant: Date
) {
  const il30j = maintenant.getTime() - 30 * 24 * 3600 * 1000
  return {
    comptes: utilisateurs.length,
    nouveaux30j: utilisateurs.filter((u) => u.inscritLe && new Date(u.inscritLe).getTime() >= il30j).length,
    actifs7j: utilisateurs.filter((u) => u.activite === 'actif_7j').length,
    avecFormation: utilisateurs.filter((u) => u.formations > 0).length,
    formationsTerminees: utilisateurs.reduce((n, u) => n + u.formationsTerminees, 0),
  }
}

const JOUR_MS = 24 * 3600 * 1000

/** Classe un compte selon la date de sa dernière activité connue. */
export function niveauActivite(derniereActivite: string | null, maintenant: Date): NiveauActivite {
  if (!derniereActivite) return 'jamais'
  const ecart = maintenant.getTime() - new Date(derniereActivite).getTime()
  if (Number.isNaN(ecart)) return 'jamais'
  if (ecart <= 7 * JOUR_MS) return 'actif_7j'
  if (ecart <= 30 * JOUR_MS) return 'actif_30j'
  return 'inactif'
}

/** La plus récente des dates fournies (ISO), ou null si aucune n'est valide. */
export function dateLaPlusRecente(dates: readonly (string | null | undefined)[]): string | null {
  let max: string | null = null
  let maxMs = -Infinity
  for (const d of dates) {
    if (!d) continue
    const ms = new Date(d).getTime()
    if (!Number.isNaN(ms) && ms > maxMs) {
      maxMs = ms
      max = d
    }
  }
  return max
}

// ── Progression ─────────────────────────────────────────────────────

/** Avancement en pourcentage (0–100), ou null si le total est inconnu. */
export function progressionPourcent(faites: number, total: number): number | null {
  if (!(total > 0)) return null
  return Math.max(0, Math.min(100, Math.round((faites / total) * 100)))
}

/** Moyenne arrondie des progressions connues, ou null s'il n'y en a aucune. */
export function moyenne(valeurs: readonly (number | null)[]): number | null {
  const connues = valeurs.filter((v): v is number => v !== null)
  if (connues.length === 0) return null
  return Math.round(connues.reduce((s, v) => s + v, 0) / connues.length)
}

export type TrancheProgression = 'aucune' | 'debut' | 'avance' | 'termine'

export const TRANCHE_LABEL: Record<TrancheProgression, string> = {
  aucune: 'Pas commencé (0 %)',
  debut: 'En cours (1–49 %)',
  avance: 'Bien avancé (50–99 %)',
  termine: 'Terminé (100 %)',
}

export function trancheProgression(pourcent: number | null): TrancheProgression {
  if (pourcent === null || pourcent <= 0) return 'aucune'
  if (pourcent < 50) return 'debut'
  if (pourcent < 100) return 'avance'
  return 'termine'
}

/** Jours distincts (AAAA-MM-JJ, UTC) où une activité a eu lieu. */
export function joursActifs(dates: readonly string[]): Set<string> {
  const jours = new Set<string>()
  for (const d of dates) if (d && d.length >= 10) jours.add(d.slice(0, 10))
  return jours
}

/** Jours d'activité consécutifs jusqu'à aujourd'hui (ou hier si rien aujourd'hui). */
export function serieDeJours(jours: ReadonlySet<string>, maintenant: Date): number {
  const curseur = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate()))
  const cle = () => curseur.toISOString().slice(0, 10)
  if (!jours.has(cle())) curseur.setUTCDate(curseur.getUTCDate() - 1)
  let serie = 0
  while (jours.has(cle())) {
    serie++
    curseur.setUTCDate(curseur.getUTCDate() - 1)
  }
  return serie
}

// ── Données affichées ───────────────────────────────────────────────

export type StatutInscription = 'pending' | 'active' | 'rejected' | 'completed'

export const STATUT_LABEL: Record<StatutInscription, string> = {
  pending: 'Demande en attente',
  active: 'En cours',
  completed: 'Terminée',
  rejected: 'Refusée',
}

/** Une ligne de la table des utilisateurs. */
export interface ResumeUtilisateur {
  id: string
  nom: string | null
  email: string | null
  telephone: string | null
  ville: string | null
  typeCompte: string
  role: string
  provenance: Provenance
  inscritLe: string | null
  derniereConnexion: string | null
  derniereActivite: string | null
  activite: NiveauActivite
  /** Formations avec accès (en cours ou terminées). */
  formations: number
  formationsTerminees: number
  demandesEnAttente: number
  /** Moyenne des progressions des formations suivies, null si aucune n'est mesurable. */
  progression: number | null
  leconsTerminees: number
  pointsLive: number
  outilsUtilises: number
  /** Identifiants des formations liées au compte (tous statuts), pour le filtre. */
  formationIds: string[]
  statuts: StatutInscription[]
}

/** Le suivi d'une formation sur la fiche d'un utilisateur. */
export interface SuiviFormation {
  formationId: string
  titre: string
  slug: string | null
  statut: StatutInscription
  /** Où la formation est suivie. */
  lieu: 'academy' | 'studia_live'
  faites: number
  total: number
  progression: number | null
  meilleurQuiz: number | null
  pointsLive: number | null
  niveauLive: string | null
  demandeLe: string | null
  accordeLe: string | null
  termineLe: string | null
  derniereActivite: string | null
}

export type TypeEvenement =
  | 'compte'
  | 'demande'
  | 'acces'
  | 'lecon'
  | 'quiz'
  | 'termine'
  | 'outil'
  | 'reservation'
  | 'session_live'
  | 'progression_live'

export interface Evenement {
  date: string
  type: TypeEvenement
  titre: string
  detail?: string
}

/** Trie du plus récent au plus ancien et garde les `max` premiers événements. */
export function chronologie(evenements: readonly Evenement[], max: number): Evenement[] {
  return evenements
    .filter((e) => e.date && !Number.isNaN(new Date(e.date).getTime()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, max)
}
