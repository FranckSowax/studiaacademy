import type { DonneesSessionLive, SessionLiveResume } from '@/lib/studia-live/pilotage'
import { emailValide, enTexte } from '@/lib/studia-live/suivi-regles'

/**
 * Règles du dossier entreprise de l'admin (pur, partagé serveur / interface) :
 * saisie d'une entreprise, sessions rattachées, indicateurs agrégés et
 * participants à étiqueter.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const estUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v)

// ---------- Entreprise ----------

export interface Entreprise {
  id: string
  /** Compte client de l'entreprise, s'il existe (inscription sur /entreprise). */
  user_id: string | null
  nom_entreprise: string
  secteur: string | null
  effectif_estime: string | null
  ville: string | null
  contact_nom: string | null
  contact_phone: string | null
  contact_email: string | null
  direction_nom: string | null
  direction_email: string | null
  notes: string | null
  responsable_id: string | null
  created_at: string
}

export type EntrepriseInput = Partial<Record<
  | 'nom_entreprise' | 'secteur' | 'effectif_estime' | 'ville' | 'contact_nom' | 'contact_phone' | 'contact_email'
  | 'direction_nom' | 'direction_email' | 'notes' | 'responsable_id',
  string | null
>>

export interface EntrepriseValeurs {
  nom_entreprise: string
  secteur: string | null
  effectif_estime: string | null
  ville: string | null
  contact_nom: string | null
  contact_phone: string | null
  contact_email: string | null
  direction_nom: string | null
  direction_email: string | null
  notes: string | null
  responsable_id: string | null
}

const texte = (v: unknown, max: number): string | null => {
  const t = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
  return t === '' ? null : t
}

/**
 * Nettoie et valide la saisie d'une entreprise.
 *
 * @example
 * const r = lireEntrepriseInput({ nom_entreprise: ' Sobraga ', contact_email: 'RH@Sobraga.GA' })
 * if (r.ok) console.log(r.valeurs.contact_email) // 'rh@sobraga.ga'
 */
export function lireEntrepriseInput(saisie: unknown): { ok: true; valeurs: EntrepriseValeurs } | { ok: false; error: string } {
  const s = (saisie && typeof saisie === 'object' ? saisie : {}) as EntrepriseInput
  const nom = texte(s.nom_entreprise, 160)
  if (!nom) return { ok: false, error: 'Le nom de l’entreprise est requis.' }

  const emails: Record<'contact_email' | 'direction_email', string | null> = { contact_email: null, direction_email: null }
  for (const [cle, libelle] of [['contact_email', 'du contact'], ['direction_email', 'de la direction']] as const) {
    const brut = texte(s[cle], 254)
    if (!brut) continue
    const propre = emailValide(brut)
    if (!propre) return { ok: false, error: `L’e-mail ${libelle} n’est pas valide.` }
    emails[cle] = propre
  }

  const telephone = texte(s.contact_phone, 30)
  if (telephone && !/^\+?[0-9 ().-]{6,30}$/.test(telephone)) return { ok: false, error: 'Le téléphone du contact n’est pas valide.' }

  const responsable = texte(s.responsable_id, 36)
  if (responsable && !estUuid(responsable)) return { ok: false, error: 'Responsable inconnu.' }

  return {
    ok: true,
    valeurs: {
      nom_entreprise: nom,
      secteur: texte(s.secteur, 80),
      effectif_estime: texte(s.effectif_estime, 40),
      ville: texte(s.ville, 80),
      contact_nom: texte(s.contact_nom, 120),
      contact_phone: telephone,
      ...emails,
      direction_nom: texte(s.direction_nom, 120),
      notes: typeof s.notes === 'string' && s.notes.trim() !== '' ? s.notes.trim().slice(0, 5000) : null,
      responsable_id: responsable,
    },
  }
}

/** Initiales pour la pastille d'une entreprise : « Sobraga » → « SO », « Total Gabon » → « TG ». */
export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean)
  if (mots.length === 0) return '?'
  const lettres = mots.length === 1 ? mots[0].slice(0, 2) : mots[0][0] + mots[1][0]
  return lettres.toUpperCase()
}

// ---------- Sessions ----------

/** Session rattachée, quelle que soit sa source. */
export interface SessionEntreprise {
  /** Identifiant du rattachement (company_sessions.id). */
  lien_id: string
  source: 'live' | 'presentiel'
  /** Identifiant de la session dans sa source. */
  session_id: string
  titre: string
  /** Code Studia Live, ou null pour un événement. */
  code: string | null
  formation: string | null
  /** Date de la session (AAAA-MM-JJ ou ISO complet). */
  date: string | null
  etat: 'passee' | 'a_venir'
  participants: number | null
  /** Indicateurs Studia Live d'une session clôturée ; vide pour un événement. */
  resume: Partial<SessionLiveResume>
  /** Places d'un événement à venir. */
  places_total: number | null
  supprimee_live: boolean
}

/** Session que l'on peut encore rattacher. */
export interface SessionDisponible {
  source: 'live' | 'presentiel'
  session_id: string
  titre: string
  code: string | null
  formation: string | null
  date: string | null
  etat: 'passee' | 'a_venir'
  participants: number | null
}

/** Une session Studia Live clôturée est passée ; un événement l'est une fois sa date dépassée. */
export function etatEvenement(dateDebut: string | null, maintenant: number): 'passee' | 'a_venir' {
  const t = dateDebut ? Date.parse(dateDebut) : Number.NaN
  return !Number.isNaN(t) && t >= maintenant ? 'a_venir' : 'passee'
}

/** À venir d'abord (la plus proche en tête), puis passées de la plus récente à la plus ancienne. */
export function trierSessions<T extends { etat: 'passee' | 'a_venir'; date: string | null }>(sessions: T[]): T[] {
  const cle = (s: T) => s.date ?? ''
  return [...sessions].sort((a, b) => {
    if (a.etat !== b.etat) return a.etat === 'a_venir' ? -1 : 1
    return a.etat === 'a_venir' ? cle(a).localeCompare(cle(b)) : cle(b).localeCompare(cle(a))
  })
}

// ---------- Indicateurs agrégés ----------

export interface IndicateursEntreprise {
  sessions_passees: number
  sessions_a_venir: number
  /** Participations cumulées sur les sessions passées. */
  participations: number
  indice: number | null
  reussite: number | null
  participation: number | null
  satisfaction: number | null
  priorites: number
}

const nombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/**
 * Moyenne d'un indicateur sur les sessions passées, pondérée par le
 * nombre de participants (une session de 40 pèse plus qu'une de 8).
 * Les sessions où il n'a pas été mesuré sont ignorées.
 */
function moyennePonderee(sessions: SessionEntreprise[], cle: 'indice' | 'reussite_moy' | 'participation_moy' | 'satisfaction'): number | null {
  let somme = 0
  let poids = 0
  for (const s of sessions) {
    const valeur = s.resume[cle]
    if (!nombre(valeur)) continue
    const p = nombre(s.participants) && s.participants > 0 ? s.participants : 1
    somme += valeur * p
    poids += p
  }
  return poids > 0 ? somme / poids : null
}

export function agregerSessions(sessions: SessionEntreprise[]): IndicateursEntreprise {
  const passees = sessions.filter((s) => s.etat === 'passee' && s.source === 'live')
  return {
    sessions_passees: sessions.filter((s) => s.etat === 'passee').length,
    sessions_a_venir: sessions.filter((s) => s.etat === 'a_venir').length,
    participations: passees.reduce((n, s) => n + (nombre(s.participants) ? s.participants : 0), 0),
    indice: moyennePonderee(passees, 'indice'),
    reussite: moyennePonderee(passees, 'reussite_moy'),
    participation: moyennePonderee(passees, 'participation_moy'),
    satisfaction: moyennePonderee(passees, 'satisfaction'),
    priorites: passees.reduce((n, s) => n + (nombre(s.resume.priorites) ? s.resume.priorites : 0), 0),
  }
}

// ---------- Participants ----------

export interface ParticipantEntreprise {
  /** Clé stable : compte Academy, sinon e-mail, sinon identifiant Studia Live. */
  cle: string
  prenom: string | null
  email: string | null
  academy_user_id: string | null
  /** Sessions suivies, de la plus récente à la plus ancienne. */
  sessions: { titre: string; date: string | null; niveau: string | null; reussite_pct: number | null }[]
}

/**
 * Participants des sessions Studia Live d'une entreprise, dédoublonnés :
 * la même personne présente à deux sessions n'apparaît qu'une fois.
 */
export function participantsEntreprise(
  sessions: { titre: string; date: string | null; donnees: DonneesSessionLive | null }[],
): ParticipantEntreprise[] {
  const parCle = new Map<string, ParticipantEntreprise>()
  const ordonnees = [...sessions].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  for (const s of ordonnees) {
    for (const p of s.donnees?.participants ?? []) {
      const email = emailValide(p.email)
      const compte = estUuid(p.academy_user_id) ? p.academy_user_id : null
      const cle = compte ?? email ?? `live:${p.id}`
      const fiche = parCle.get(cle) ?? { cle, prenom: null, email: null, academy_user_id: null, sessions: [] }
      fiche.prenom ??= enTexte(p.prenom) || null
      fiche.email ??= email
      fiche.academy_user_id ??= compte
      fiche.sessions.push({
        titre: s.titre,
        date: s.date,
        niveau: enTexte(p.niveau) || null,
        reussite_pct: nombre(p.reussite_pct) ? p.reussite_pct : null,
      })
      parCle.set(cle, fiche)
    }
  }
  return [...parCle.values()].sort((a, b) => (a.prenom ?? a.email ?? '').localeCompare(b.prenom ?? b.email ?? '', 'fr'))
}

/** Comptes Academy à étiqueter : ceux reliés à un participant des sessions de l'entreprise. */
export function comptesAEtiqueter(sessions: { donnees: DonneesSessionLive | null }[]): string[] {
  const comptes = new Set<string>()
  for (const s of sessions) {
    for (const p of s.donnees?.participants ?? []) {
      if (estUuid(p.academy_user_id)) comptes.add(p.academy_user_id)
    }
  }
  return [...comptes]
}
