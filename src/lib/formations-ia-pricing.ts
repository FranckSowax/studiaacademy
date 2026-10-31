// ============================================
// Prix des inscriptions Formations IA — SEUL endroit de calcul
// ============================================
// Utilisé par la page de confirmation (/formations-ia/merci) et par le
// panier de la messagerie. Les tarifs viennent de la table fia_formations.
// Un prix inconnu (formation « sur devis ») vaut null, jamais 0.

export type FiaInscriptionType = 'individuel' | 'entreprise'

export interface FiaPriceSource {
  /** Tarif individuel en devise configurée ; null = sur devis. */
  prixFcfa: number | null
  /** Tarif groupe (entreprise, à partir de GROUP_MIN_PARTICIPANTS). */
  prixGroupeFcfa: number | null
}

/** Le tarif groupe s'applique à une inscription entreprise d'au moins 3 personnes. */
export const GROUP_MIN_PARTICIPANTS = 3

export interface FiaLinePrice {
  participants: number
  groupRate: boolean
  unitPrice: number | null
  total: number | null
}

/** Nombre de participants valide (entier ≥ 1). */
export function normalizeParticipants(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

/**
 * Prix d'une inscription.
 *
 * @example
 * computeFiaLine({ prixFcfa: 95000, prixGroupeFcfa: 80750 }, 'entreprise', 3)
 * // { participants: 3, groupRate: true, unitPrice: 80750, total: 242250 }
 */
export function computeFiaLine(
  price: FiaPriceSource,
  type: FiaInscriptionType,
  participants: unknown,
): FiaLinePrice {
  // Une inscription individuelle concerne toujours une seule personne.
  const nb = type === 'entreprise' ? normalizeParticipants(participants) : 1
  const groupRate = type === 'entreprise' && nb >= GROUP_MIN_PARTICIPANTS
  const unitPrice = groupRate ? (price.prixGroupeFcfa ?? price.prixFcfa) : price.prixFcfa
  return {
    participants: nb,
    groupRate,
    unitPrice: unitPrice ?? null,
    total: unitPrice === null || unitPrice === undefined ? null : unitPrice * nb,
  }
}

/** Total d'un panier : inconnu (null) dès qu'une ligne l'est, ou si le panier est vide. */
export function sumFiaTotals(lines: Pick<FiaLinePrice, 'total'>[]): number | null {
  if (lines.length === 0) return null
  let sum = 0
  for (const line of lines) {
    if (line.total === null) return null
    sum += line.total
  }
  return sum
}
