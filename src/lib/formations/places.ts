// ============================================
// Formations à places limitées — règles pures (sans E/S)
// ============================================
// Une formation peut limiter son nombre d'inscriptions (`places_max`).
// Une place est prise par une inscription en attente, ouverte ou terminée.

export const PLACES_MAX_LIMITE = 100_000

/** Statuts d'inscription qui prennent une place. */
export const STATUTS_AVEC_PLACE = ['pending', 'active', 'completed'] as const

/** Message renvoyé par la base quand la limite est atteinte (voir la migration). */
export const ERREUR_COMPLET = 'FORMATION_COMPLETE'
export const MESSAGE_COMPLET = 'Cette formation est complète : il n’y a plus de place disponible.'

export interface EtatPlaces {
  max: number
  prises: number
  restantes: number
  complet: boolean
}

/** Places par identifiant de formation (uniquement les formations à places limitées). */
export type PlacesParFormation = Record<string, { max: number; prises: number }>

export function prendUnePlace(status: string | null | undefined): boolean {
  return typeof status === 'string' && (STATUTS_AVEC_PLACE as readonly string[]).includes(status)
}

/**
 * État des places d'une formation, ou `null` si elle n'est pas limitée.
 *
 * @example
 * etatPlaces(20, 17) // { max: 20, prises: 17, restantes: 3, complet: false }
 * etatPlaces(null, 40) // null
 */
export function etatPlaces(max: number | null | undefined, prises: number | null | undefined): EtatPlaces | null {
  if (typeof max !== 'number' || !Number.isFinite(max) || max < 1) return null
  const occupees = Math.max(0, Math.floor(prises ?? 0))
  const restantes = Math.max(0, Math.floor(max) - occupees)
  return { max: Math.floor(max), prises: occupees, restantes, complet: restantes === 0 }
}

/** Texte du bandeau posé sur la couverture. */
export function libelleBandeau(etat: EtatPlaces): string {
  return etat.complet ? 'Complet' : 'Places limitées'
}

/**
 * Phrase précise pour la fiche de la formation.
 *
 * @example
 * detailPlaces({ max: 20, prises: 17, restantes: 3, complet: false }) // 'Plus que 3 places sur 20'
 */
export function detailPlaces(etat: EtatPlaces): string {
  if (etat.complet) return `Complet · ${etat.max} places attribuées`
  if (etat.restantes === 1) return `Plus qu’une place sur ${etat.max}`
  if (etat.restantes <= 5) return `Plus que ${etat.restantes} places sur ${etat.max}`
  return `${etat.restantes} places restantes sur ${etat.max}`
}

/**
 * Lit la valeur saisie dans l'admin : vide = pas de limite.
 * Retourne `undefined` si la saisie n'est pas un entier valide.
 *
 * @example
 * lirePlacesMax('')    // null
 * lirePlacesMax('25')  // 25
 * lirePlacesMax('0')   // undefined
 */
export function lirePlacesMax(saisie: string | number | null | undefined): number | null | undefined {
  if (saisie === null || saisie === undefined) return null
  const texte = String(saisie).trim()
  if (texte === '') return null
  if (!/^\d+$/.test(texte)) return undefined
  const n = Number(texte)
  return n >= 1 && n <= PLACES_MAX_LIMITE ? n : undefined
}

/** Vrai si l'erreur de la base signale une formation complète. */
export function estErreurComplet(message: string | null | undefined): boolean {
  return typeof message === 'string' && message.includes(ERREUR_COMPLET)
}
