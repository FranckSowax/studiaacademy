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
    const { data, error } = await supabase
      .from('formations')
      .select('slug, titre, prix_fcfa, live_code, secteur_slug')
      .eq('is_published', true)
      .not('secteur_slug', 'is', null)
      .order('updated_at', { ascending: false })
    if (error || !data) return new Map()
    return indexerParSecteur(data as LigneFormationSecteur[])
  } catch {
    return new Map()
  }
}
