'use server'

import { parseStaffRole } from '@/lib/collaborators/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ficheFormateur, peutEntrerCommeFormateur } from './formateur'
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data: role, error } = await supabase.rpc('current_staff_role')
  if (error) return false
  try {
    const fiche = await ficheFormateur(createAdminClient(), {
      id: user.id,
      email: user.email ?? null,
      emailConfirme: Boolean(user.email_confirmed_at),
    })
    return peutEntrerCommeFormateur(parseStaffRole(role), fiche)
  } catch {
    return false
  }
}
