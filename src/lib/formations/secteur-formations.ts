import { createClient } from '@/lib/supabase/server'
import { indexerParSecteur, type FormationSecteur, type LigneFormationSecteur } from './secteur-link'

/**
 * Formations publiées rattachées à un secteur, indexées par slug de secteur.
 * WHY: renvoie une table vide en cas d'erreur (colonne `secteur_slug` absente tant que la
 * migration n'est pas appliquée) : les fiches secteur gardent alors leur contact WhatsApp.
 */
export async function getFormationsParSecteur(): Promise<Map<string, FormationSecteur>> {
  try {
    const supabase = await createClient()
    const lire = (colonnes: string) =>
      supabase
        .from('formations')
        .select(colonnes)
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
    let { data, error } = await lire('slug, titre, prix_fcfa, live_code, secteur_slug')
    // Colonne `secteur_slug` absente (migration non appliquée) : on se rabat sur les titres seuls.
    if (error) ({ data, error } = await lire('slug, titre, prix_fcfa, live_code'))
    if (error || !data) return new Map()
    const lignes = (data as unknown as Partial<LigneFormationSecteur>[]).map((l) => ({
      slug: l.slug ?? '',
      titre: l.titre ?? '',
      prix_fcfa: l.prix_fcfa ?? 0,
      live_code: l.live_code ?? null,
      secteur_slug: l.secteur_slug ?? null,
    }))
    return indexerParSecteur(lignes)
  } catch {
    return new Map()
  }
}
