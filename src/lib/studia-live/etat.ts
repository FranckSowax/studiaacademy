'use server'

import { configLancement } from './lancement'

/** Pour les composants client : le lancement vers Studia Live est-il
 * configuré (STUDIA_LIVE_URL et STUDIA_LINK_SECRET présents) ? */
export async function lancementLiveConfigure(): Promise<boolean> {
  return configLancement() !== null
}
