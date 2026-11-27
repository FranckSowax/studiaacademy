/**
 * Réglages de la section « Événements » de la page d'accueil
 * (table `home_settings`, une seule ligne, gérée depuis /admin/accueil).
 */

export interface ReglagesEvenements {
  /** Nombre maximum d'événements dans l'agenda de l'accueil. */
  max: number
  /** Afficher les journées IA (dans l'agenda et en vignettes). */
  journeesIa: boolean
}

export const EVENEMENTS_MAX_MIN = 1
export const EVENEMENTS_MAX_MAX = 10

/** Valeurs utilisées tant que la table n'existe pas ou n'a pas de ligne. */
export const REGLAGES_PAR_DEFAUT: ReglagesEvenements = { max: 5, journeesIa: true }

/** Colonnes à lire dans `home_settings`. */
export const COLONNES_REGLAGES = 'evenements_max, afficher_journees_ia'

/**
 * Transforme une ligne de `home_settings` (ou rien) en réglages sûrs :
 * toute valeur absente ou hors bornes retombe sur le réglage par défaut.
 *
 * @example
 * const { data } = await supabase.from('home_settings').select(COLONNES_REGLAGES).maybeSingle()
 * const reglages = normaliserReglages(data)
 */
export function normaliserReglages(ligne: unknown): ReglagesEvenements {
  const l = (ligne ?? {}) as Record<string, unknown>
  const max = l.evenements_max
  return {
    max:
      typeof max === 'number' && Number.isInteger(max) && max >= EVENEMENTS_MAX_MIN && max <= EVENEMENTS_MAX_MAX
        ? max
        : REGLAGES_PAR_DEFAUT.max,
    journeesIa: typeof l.afficher_journees_ia === 'boolean' ? l.afficher_journees_ia : REGLAGES_PAR_DEFAUT.journeesIa,
  }
}

/**
 * Un événement sans la colonne `afficher_accueil` (migration pas encore
 * appliquée) est affiché, comme avant.
 */
export function estAfficheAccueil(evenement: { afficher_accueil?: boolean | null }): boolean {
  return evenement.afficher_accueil !== false
}
