// ============================================
// Événements en présentiel — règles pures (sans E/S)
// ============================================
// Types d'événements, dates d'une série récurrente, slide d'accueil d'un
// événement, et statut d'une réservation (payante ou non).

export const EVENT_TYPES = ['formation', 'masterclass', 'presentation', 'evenement'] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  formation: 'Formation en présentiel',
  masterclass: 'Masterclass',
  presentation: 'Présentation',
  evenement: 'Événement',
}

export function isEventType(value: unknown): value is EventType {
  return typeof value === 'string' && (EVENT_TYPES as readonly string[]).includes(value)
}

/** Type d'un événement, « formation » pour les événements créés avant la migration. */
export function typeEvenement(e: { type?: string | null }): EventType {
  return isEventType(e.type) ? e.type : 'formation'
}

// ── Récurrence ──────────────────────────────

export const FREQUENCES = ['none', 'weekly', 'biweekly', 'monthly'] as const
export type Frequence = (typeof FREQUENCES)[number]

export const FREQUENCE_LABELS: Record<Frequence, string> = {
  none: 'Une seule date',
  weekly: 'Chaque semaine',
  biweekly: 'Toutes les deux semaines',
  monthly: 'Chaque mois',
}

/** Nombre maximal de dates créées d'un coup pour un événement récurrent. */
export const OCCURRENCES_MAX = 12

export function isFrequence(value: unknown): value is Frequence {
  return typeof value === 'string' && (FREQUENCES as readonly string[]).includes(value)
}

export interface Occurrence {
  debut: string
  fin: string | null
}

const JOUR_MS = 24 * 3600 * 1000

/** Même jour du mois `n` mois plus tard, ramené au dernier jour si le mois est plus court. */
function ajouterMois(date: Date, n: number): Date {
  const cible = new Date(date.getTime())
  const jour = cible.getUTCDate()
  cible.setUTCDate(1)
  cible.setUTCMonth(cible.getUTCMonth() + n)
  const dernier = new Date(Date.UTC(cible.getUTCFullYear(), cible.getUTCMonth() + 1, 0)).getUTCDate()
  cible.setUTCDate(Math.min(jour, dernier))
  return cible
}

/**
 * Dates d'un événement récurrent : la première, puis une par période.
 * La durée (début → fin) est conservée à chaque date. Le nombre est borné à
 * `OCCURRENCES_MAX` ; une fréquence « none » ne donne que la première date.
 *
 * WHY: calcul en UTC — Libreville (UTC+1) n'a pas d'heure d'été, l'heure
 * locale reste donc la même d'une date à l'autre.
 *
 * @example
 * occurrences('2026-12-05T09:00:00.000Z', null, 'weekly', 3)
 * // 5, 12 et 19 décembre à 9 h UTC
 */
export function occurrences(
  debutIso: string,
  finIso: string | null,
  frequence: Frequence,
  nombre: number,
): Occurrence[] {
  const debut = new Date(debutIso)
  if (Number.isNaN(debut.getTime())) return []
  const fin = finIso ? new Date(finIso) : null
  const duree = fin && !Number.isNaN(fin.getTime()) ? fin.getTime() - debut.getTime() : null
  const total = frequence === 'none' ? 1 : Math.max(1, Math.min(OCCURRENCES_MAX, Math.floor(nombre) || 1))

  return Array.from({ length: total }, (_, i) => {
    const d =
      frequence === 'monthly'
        ? ajouterMois(debut, i)
        : new Date(debut.getTime() + i * (frequence === 'biweekly' ? 14 : 7) * JOUR_MS)
    return {
      debut: d.toISOString(),
      fin: duree !== null ? new Date(d.getTime() + duree).toISOString() : null,
    }
  })
}

// ── Slide d'accueil ─────────────────────────

const FUSEAU = 'Africa/Libreville'

/** Adresse de l'événement dans l'agenda public (ancre de sa carte). */
export function lienEvenement(id: string): string {
  return `/formations/presentiel#evenement-${id}`
}

/**
 * « samedi 5 décembre 2026 à 10 h 00 », à l'heure de Libreville.
 *
 * @example
 * dateEvenement('2026-12-05T09:00:00.000Z') // 'samedi 5 décembre 2026 à 10 h 00'
 */
export function dateEvenement(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const jour = d.toLocaleDateString('fr-FR', {
    timeZone: FUSEAU, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const heure = d
    .toLocaleTimeString('fr-FR', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit', hour12: false })
    .replace(':', ' h ')
  return `${jour} à ${heure}`
}

const couper = (texte: string, max: number) =>
  texte.length <= max ? texte : `${texte.slice(0, max - 1).trimEnd()}…`

export interface SlideEvenement {
  titre: string
  sous_titre: string
  texte: string | null
  cta_label: string
  cta_href: string
  image_url: string | null
}

/**
 * Slide de la page d'accueil qui annonce un événement : son titre, sa date
 * et un bouton d'inscription vers sa carte dans l'agenda.
 * Les longueurs respectent les limites de la table `home_slides`.
 */
export function slidePourEvenement(e: {
  id: string
  titre: string
  type?: string | null
  date_debut: string
  lieu?: string | null
  ville?: string | null
  description?: string | null
  cover_image?: string | null
  prix_fcfa?: number | null
}): SlideEvenement {
  const lieu = e.lieu?.trim() || e.ville?.trim() || 'Libreville'
  return {
    titre: couper(e.titre.trim(), 120),
    sous_titre: couper(`${EVENT_TYPE_LABELS[typeEvenement(e)]} · ${dateEvenement(e.date_debut)} · ${lieu}`, 160),
    texte: e.description?.trim() ? couper(e.description.trim().replace(/\s+/g, ' '), 400) : null,
    cta_label: (e.prix_fcfa ?? 0) > 0 ? 'S’inscrire' : 'Réserver ma place',
    cta_href: lienEvenement(e.id),
    image_url: e.cover_image?.trim() || null,
  }
}

// ── Réservations ────────────────────────────

export type EtatReservation = 'a_valider' | 'reservee' | 'confirmee' | 'annulee'

export const ETAT_RESERVATION_LABELS: Record<EtatReservation, string> = {
  a_valider: 'Paiement à valider',
  reservee: 'Place réservée',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
}

/**
 * État lisible d'une réservation. Une réservation payante garde sa place
 * (« reserved ») en attendant que l'admin valide le paiement.
 */
export function etatReservation(r: { status: string; payment_method?: string | null }): EtatReservation {
  if (r.status === 'cancelled') return 'annulee'
  if (r.status === 'confirmed') return 'confirmee'
  return r.payment_method ? 'a_valider' : 'reservee'
}

/** Une réservation « reserved » peut être confirmée ou annulée ; une confirmée, seulement annulée. */
export function peutDecider(status: string, decision: 'confirmed' | 'cancelled'): boolean {
  if (status === 'reserved') return true
  return status === 'confirmed' && decision === 'cancelled'
}

/** Places restantes, jamais négatives. */
export function placesRestantes(e: { places_total: number; places_reservees: number }): number {
  return Math.max(0, e.places_total - e.places_reservees)
}
