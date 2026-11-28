import { SECTEURS } from '@/lib/secteurs'

/** Formation créée dans l'admin et rattachée à un secteur d'activité. */
export interface FormationSecteur {
  /** Identifiant de la formation (absent des jeux de données qui ne le fournissent pas). */
  id?: string
  slug: string
  titre: string
  prix_fcfa: number
  /** Code Studia Live ; null → la formation se suit dans le lecteur Academy. */
  live_code: string | null
}

export interface LigneFormationSecteur extends FormationSecteur {
  secteur_slug: string | null
}

const SLUGS = new Set(SECTEURS.map((s) => s.slug))

/** Vrai si `valeur` est le slug d'un secteur connu. */
export function estSecteurValide(valeur: string): boolean {
  return SLUGS.has(valeur)
}

/**
 * Retire d'une liste les formations de la collection « Upgrade Métier » (celles rattachées à
 * un secteur) : elles ne s'affichent que dans leur section de l'accueil, jamais mêlées aux autres.
 */
export function horsCollectionMetier<T extends { slug: string }>(
  formations: T[],
  collection: Map<string, FormationSecteur>,
): T[] {
  if (collection.size === 0) return formations
  const slugs = new Set([...collection.values()].map((f) => f.slug))
  return formations.filter((f) => !slugs.has(f.slug))
}

/** Titre comparable : sans accents, sans ponctuation, en minuscules. */
function cleTitre(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const SECTEUR_PAR_TITRE = new Map(SECTEURS.map((s) => [cleTitre(s.formation.titre), s.slug]))

/** Vrai si la formation fait partie de la collection « Upgrade Métier » (rattachée ou reconnue à son titre). */
export function estFormationMetier(f: { titre: string; secteur_slug?: string | null }): boolean {
  return Boolean(f.secteur_slug) || SECTEUR_PAR_TITRE.has(cleTitre(f.titre))
}

/**
 * Range les formations par secteur. Une formation appartient à un secteur si elle y est
 * rattachée dans l'admin (`secteur_slug`) ou, à défaut, si son titre est celui de la formation
 * métier de ce secteur. Le rattachement explicite l'emporte ; à égalité, la première ligne gagne.
 * WHY: les formations créées avec le bon titre mais sans remplir le champ « Formation métier
 * du secteur » restaient mêlées au catalogue général.
 */
export function indexerParSecteur(lignes: LigneFormationSecteur[]): Map<string, FormationSecteur> {
  const index = new Map<string, FormationSecteur>()
  const ranger = (secteur: string, l: LigneFormationSecteur) => {
    if (index.has(secteur)) return
    index.set(secteur, { ...(l.id ? { id: l.id } : {}), slug: l.slug, titre: l.titre, prix_fcfa: l.prix_fcfa, live_code: l.live_code })
  }
  for (const l of lignes) {
    if (l.secteur_slug && estSecteurValide(l.secteur_slug)) ranger(l.secteur_slug, l)
  }
  for (const l of lignes) {
    if (l.secteur_slug) continue
    const secteur = SECTEUR_PAR_TITRE.get(cleTitre(l.titre))
    if (secteur) ranger(secteur, l)
  }
  return index
}
