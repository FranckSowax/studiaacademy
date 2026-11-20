import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Comptes Studia Academy des participants Studia Live : retrouvés ou
 * créés par e-mail (client service, serveur uniquement). La création
 * déclenche handle_new_user : profil + portefeuille de 50 crédits.
 */

export interface CompteAcademy {
  id: string
  cree: boolean
  /** Compte d'équipe (admin, collaborateur) : jamais de connexion
   * automatique par lien e-mail pour ceux-là. */
  equipe: boolean
}

async function estEquipe(admin: SupabaseClient, email: string, role: string | null): Promise<boolean> {
  if (role && role !== 'user') return true
  const { data } = await admin.from('collaborators').select('id').eq('email', email).maybeSingle()
  return Boolean(data)
}

export async function trouverOuCreerCompte(
  admin: SupabaseClient,
  email: string,
  prenom: string
): Promise<CompteAcademy | null> {
  const adresse = email.trim().toLowerCase()
  const { data: existant } = await admin
    .from('profiles')
    .select('id, role')
    .eq('email', adresse)
    .maybeSingle<{ id: string; role: string | null }>()
  if (existant) {
    return { id: existant.id, cree: false, equipe: await estEquipe(admin, adresse, existant.role) }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: adresse,
    // L'adresse n'est utilisée que via des liens envoyés à cette même
    // boîte (lien d'accès, mot de passe oublié) : elle vaut confirmation.
    email_confirm: true,
    user_metadata: { full_name: prenom.trim().slice(0, 60), source: 'studia_live' },
  })
  if (error || !data.user) return null
  return { id: data.user.id, cree: true, equipe: await estEquipe(admin, adresse, 'user') }
}
