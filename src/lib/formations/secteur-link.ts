import { SECTEURS } from '@/lib/secteurs'

/** Formation créée dans l'admin et rattachée à un secteur d'activité. */
export interface FormationSecteur {
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
 * Range les formations par secteur. Les lignes sans secteur ou au secteur inconnu sont
 * ignorées ; si deux lignes visent le même secteur, la première l'emporte.
 */
export function indexerParSecteur(lignes: LigneFormationSecteur[]): Map<string, FormationSecteur> {
  const index = new Map<string, FormationSecteur>()
  for (const l of lignes) {
    if (!l.secteur_slug || !estSecteurValide(l.secteur_slug) || index.has(l.secteur_slug)) continue
    index.set(l.secteur_slug, {
      slug: l.slug,
      titre: l.titre,
      prix_fcfa: l.prix_fcfa,
      live_code: l.live_code,
    })
  }
  return index
}
