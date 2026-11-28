// ============================================
// Formations à places limitées — lecture des places prises (serveur)
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlacesParFormation } from '@/lib/formations/places'

/**
 * Places prises des formations publiées à places limitées, par identifiant
 * de formation (fonction `formations_places()` de la base : des nombres
 * seulement, lisibles sans compte).
 *
 * Ne lève jamais : tant que la migration n'est pas appliquée, ou si la base
 * ne répond pas, aucune formation n'est considérée comme limitée — le bandeau
 * ne s'affiche pas, le site reste utilisable.
 *
 * @example
 * const places = await getPlacesFormations(supabase)
 * const etat = etatPlaces(places[f.id]?.max, places[f.id]?.prises)
 */
export async function getPlacesFormations(supabase: SupabaseClient): Promise<PlacesParFormation> {
  const { data, error } = await supabase.rpc('formations_places')
  if (error || !Array.isArray(data)) return {}
  const places: PlacesParFormation = {}
  for (const ligne of data as { formation_id?: unknown; places_max?: unknown; places_prises?: unknown }[]) {
    if (typeof ligne.formation_id !== 'string' || typeof ligne.places_max !== 'number') continue
    places[ligne.formation_id] = {
      max: ligne.places_max,
      prises: typeof ligne.places_prises === 'number' ? ligne.places_prises : 0,
    }
  }
  return places
}
