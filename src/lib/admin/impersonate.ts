'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Génère un lien de connexion à usage unique pour se connecter EN TANT QUE
 * l'utilisateur cible. Réservé au super administrateur.
 * Le super admin est déconnecté de sa propre session et connecté sur le compte cible.
 */
export async function impersonateUser(userId: string): Promise<{ success: boolean; link?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'super_admin') return { success: false, error: 'Réservé au super administrateur' }

  const admin = createAdminClient()
  const { data: target } = await admin.from('profiles').select('email, account_type').eq('id', userId).single()
  if (!target?.email) return { success: false, error: 'Utilisateur introuvable' }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studiaacademy-production.up.railway.app'
  const dest = target.account_type === 'teacher' ? '/professeur' : target.account_type === 'pro' ? '/pro' : '/dashboard'

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email as string,
    options: { redirectTo: `${baseUrl}${dest}` },
  })
  if (error || !data?.properties?.action_link) {
    return { success: false, error: error?.message ?? 'Impossible de générer le lien' }
  }
  return { success: true, link: data.properties.action_link }
}
