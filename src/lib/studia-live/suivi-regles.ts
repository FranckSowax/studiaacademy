import type { DonneesSessionLive, SessionLiveResume } from './pilotage'

/**
 * Règles du suivi des sessions Studia Live (pur, partagé serveur / interface) :
 * statuts, libellés, mise en forme et quelques décisions simples.
 */

export const STATUTS_SUIVI = ['a_traiter', 'rapport_envoye', 'relance', 'clos'] as const
export type StatutSuivi = (typeof STATUTS_SUIVI)[number]

export const STATUT_SUIVI_LABELS: Record<StatutSuivi, string> = {
  a_traiter: 'À traiter',
  rapport_envoye: 'Rapport envoyé',
  relance: 'Relance',
  clos: 'Clos',
}

export const STATUT_SUIVI_STYLES: Record<StatutSuivi, string> = {
  a_traiter: 'bg-amber-50 text-amber-700',
  rapport_envoye: 'bg-blue-50 text-blue-700',
  relance: 'bg-violet-50 text-violet-700',
  clos: 'bg-gray-100 text-gray-600',
}

export function estStatutSuivi(v: unknown): v is StatutSuivi {
  return STATUTS_SUIVI.includes(v as StatutSuivi)
}

export type TypeEnvoi = 'rapport_direction' | 'finales' | 'relance_finales'

export const TYPE_ENVOI_LABELS: Record<TypeEnvoi, string> = {
  rapport_direction: 'Rapport au commanditaire',
  finales: 'Finales manquantes',
  relance_finales: 'Relance de participants',
}

export const NIVEAU_LABELS: Record<string, string> = {
  maitrise: 'Maîtrise',
  acquis: 'Acquis',
  en_cours: 'En cours',
  a_renforcer: 'À renforcer',
  non_evalue: 'Non évalué',
}
export const niveauLabel = (niveau: string | null | undefined) => (niveau ? (NIVEAU_LABELS[niveau] ?? niveau) : '—')

export const RECOMMANDATION_LABELS = { priorite: 'Priorités', conseil: 'Conseils', atout: 'Atouts' } as const

// ---------- Lignes lues en base ----------

/** Ligne du tableau des sessions (sans le détail nominatif). */
export interface LigneSuivi {
  live_session_id: string
  code: string
  titre: string
  formation_label: string | null
  date_formation: string | null
  resume: Partial<SessionLiveResume>
  synchronise_le: string | null
  supprimee_live_le: string | null
  statut_suivi: StatutSuivi
  commanditaire_nom: string | null
  commanditaire_email: string | null
  notes: string | null
  responsable_id: string | null
}

export interface FicheSuivi extends LigneSuivi {
  donnees: DonneesSessionLive | null
}

export interface EnvoiJournal {
  id: string
  type: TypeEnvoi
  destinataires: string
  resultat: Record<string, unknown>
  par: string | null
  created_at: string
}

// ---------- Décisions ----------

export const DELAI_RECHARGE_MS = 24 * 3600 * 1000

/** Le détail est rechargé s'il n'a jamais été lu ou s'il a plus de 24 h. */
export function detailARecharger(synchroniseLe: string | null | undefined, maintenant: number): boolean {
  if (!synchroniseLe) return true
  const t = Date.parse(synchroniseLe)
  return Number.isNaN(t) || maintenant - t > DELAI_RECHARGE_MS
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** E-mail nettoyé (minuscules, sans espaces) ou null s'il n'est pas valide. */
export function emailValide(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const e = v.trim().toLowerCase()
  return e.length <= 254 && EMAIL.test(e) ? e : null
}

const DATE = /^\d{4}-\d{2}-\d{2}/
export const dateIso = (v: unknown): string | null => (typeof v === 'string' && DATE.test(v) ? v.slice(0, 10) : null)

/** Finales déjà envoyées et participants joignables, comptés dans le détail. */
export function compterFinales(donnees: DonneesSessionLive): { envoyees: number; avecEmail: number; total: number } {
  const p = donnees.participants ?? []
  return {
    envoyees: p.filter((x) => x.finale?.envoyee_le).length,
    avecEmail: p.filter((x) => x.email).length,
    total: p.length,
  }
}

/**
 * Texte affichable à partir d'une valeur reçue de Studia Live : une
 * forme inattendue (objet, tableau) ne doit jamais faire tomber la page.
 */
export function enTexte(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(enTexte).filter(Boolean).join(' · ')
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    const direct = [o.texte, o.text, o.label, o.libelle, o.valeur].find((x) => typeof x === 'string' || typeof x === 'number')
    return direct !== undefined ? String(direct) : ''
  }
  return ''
}

export interface GroupeVerbatims {
  titre: string | null
  textes: string[]
}

/**
 * Commentaires de satisfaction : Studia Live les envoie groupés par
 * question (`{ titre, textes }`) ; un simple texte est aussi accepté.
 */
export function groupesVerbatims(verbatims: unknown): GroupeVerbatims[] {
  if (!Array.isArray(verbatims)) return []
  const groupes: GroupeVerbatims[] = []
  const libres: string[] = []
  for (const v of verbatims) {
    if (v && typeof v === 'object' && !Array.isArray(v) && Array.isArray((v as { textes?: unknown }).textes)) {
      const o = v as { titre?: unknown; textes: unknown[] }
      const textes = o.textes.map(enTexte).filter(Boolean)
      if (textes.length > 0) groupes.push({ titre: enTexte(o.titre) || null, textes })
    } else {
      const t = enTexte(v)
      if (t) libres.push(t)
    }
  }
  return libres.length > 0 ? [...groupes, { titre: null, textes: libres }] : groupes
}

// ---------- Mise en forme ----------

const FUSEAU = 'Africa/Libreville'
const nombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const fr = (n: number, decimales = 0) =>
  n.toLocaleString('fr-FR', { maximumFractionDigits: decimales, minimumFractionDigits: 0 })

export const pct = (v: unknown) => (nombre(v) ? `${fr(v)} %` : '—')
export const entier = (v: unknown) => (nombre(v) ? fr(v) : '—')
export const noteSur = (v: unknown, sur: number) => (nombre(v) ? `${fr(v, 1)}/${sur}` : '—')

/** « 20 novembre 2026 » à partir de `2026-11-20` (date seule : pas de décalage de fuseau). */
export function jourLong(date: string | null | undefined): string {
  const d = dateIso(date)
  if (!d) return '—'
  return new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
}

export function jourCourt(date: string | null | undefined): string {
  const d = dateIso(date)
  if (!d) return '—'
  return new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Horodatage complet, à l'heure de Libreville. */
export function jourHeure(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', { timeZone: FUSEAU, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
