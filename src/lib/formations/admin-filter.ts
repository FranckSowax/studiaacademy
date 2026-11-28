// ============================================
// Liste admin des formations — filtres et tri (règles pures, sans E/S)
// ============================================

import { estFormationMetier } from '@/lib/formations/secteur-link'

export type StatusFilter = 'all' | 'published' | 'draft'
export type CollectionFilter = 'all' | 'catalogue' | 'metier'
export type PriceFilter = 'all' | 'free' | 'paid'
export type SortKey = 'recent' | 'titre' | 'prix' | 'inscrits'

export interface AdminFormationFilters {
  q: string
  status: StatusFilter
  collection: CollectionFilter
  price: PriceFilter
  /** Catégorie exacte, ou '' pour toutes. */
  categorie: string
}

export const DEFAULT_FILTERS: AdminFormationFilters = {
  q: '',
  status: 'all',
  collection: 'all',
  price: 'all',
  categorie: '',
}

/** Champs d'une formation utiles à la liste admin. */
export interface FilterableFormation {
  titre: string
  sous_titre?: string | null
  categorie?: string | null
  formateur_nom?: string | null
  prix_fcfa?: number | null
  is_published: boolean
  secteur_slug?: string | null
  created_at: string
}

/** Minuscules sans accents : « Éducation » se trouve en tapant « educ ». */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Formations correspondant aux filtres (tous cumulés).
 *
 * @example
 * filtrerFormations(formations, { ...DEFAULT_FILTERS, status: 'draft', q: 'rh' })
 */
export function filtrerFormations<T extends FilterableFormation>(
  formations: T[],
  filtres: AdminFormationFilters,
): T[] {
  const q = normaliser(filtres.q)
  return formations.filter((f) => {
    if (filtres.status === 'published' && !f.is_published) return false
    if (filtres.status === 'draft' && f.is_published) return false

    const metier = estFormationMetier(f)
    if (filtres.collection === 'metier' && !metier) return false
    if (filtres.collection === 'catalogue' && metier) return false

    const prix = f.prix_fcfa ?? 0
    if (filtres.price === 'free' && prix > 0) return false
    if (filtres.price === 'paid' && prix <= 0) return false

    if (filtres.categorie && (f.categorie ?? '') !== filtres.categorie) return false

    if (!q) return true
    const texte = normaliser([f.titre, f.sous_titre, f.categorie, f.formateur_nom].filter(Boolean).join(' '))
    return texte.includes(q)
  })
}

/**
 * Tri de la liste (copie, l'entrée n'est pas modifiée).
 * `inscrits` : nombre d'élèves par formation, pour le tri « Plus suivies ».
 */
export function trierFormations<T extends FilterableFormation & { id: string }>(
  formations: T[],
  tri: SortKey,
  inscrits: Record<string, number> = {},
): T[] {
  const copie = [...formations]
  switch (tri) {
    case 'titre':
      return copie.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }))
    case 'prix':
      return copie.sort((a, b) => (b.prix_fcfa ?? 0) - (a.prix_fcfa ?? 0))
    case 'inscrits':
      return copie.sort((a, b) => (inscrits[b.id] ?? 0) - (inscrits[a.id] ?? 0))
    default:
      return copie.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
}

/** Catégories présentes, triées, sans doublon ni valeur vide. */
export function listerCategories(formations: { categorie?: string | null }[]): string[] {
  const uniques = new Set(formations.map((f) => f.categorie?.trim()).filter((c): c is string => !!c))
  return [...uniques].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
}

/** Chiffres de l'en-tête de la page. */
export function compterFormations(formations: FilterableFormation[]) {
  const publiees = formations.filter((f) => f.is_published).length
  return {
    total: formations.length,
    publiees,
    brouillons: formations.length - publiees,
    metier: formations.filter((f) => estFormationMetier(f)).length,
  }
}

/** Vrai si au moins un filtre est actif (affiche « Réinitialiser »). */
export function filtresActifs(filtres: AdminFormationFilters): boolean {
  return (Object.keys(DEFAULT_FILTERS) as (keyof AdminFormationFilters)[]).some(
    (cle) => filtres[cle] !== DEFAULT_FILTERS[cle],
  )
}
