'use server'

import { getStaffContext } from '@/lib/auth/staff'
import { peutEntrerCommeFormateur } from './formateur'
import { configLancement } from './lancement'

/** Pour les composants client : le lancement vers Studia Live est-il
 * configuré (STUDIA_LIVE_URL et STUDIA_LINK_SECRET présents) ? */
export async function lancementLiveConfigure(): Promise<boolean> {
  return configLancement() !== null
}

/** Le bouton « Ouvrir Studia Live » s'affiche-t-il pour le compte
 * connecté ? Affichage seulement : la route revérifie tout à chaque appel. */
export async function peutOuvrirStudiaLive(): Promise<boolean> {
  if (!configLancement()) return false
  const contexte = await getStaffContext()
  return peutEntrerCommeFormateur(contexte?.role ?? null)
}
