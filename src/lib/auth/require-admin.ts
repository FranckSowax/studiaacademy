import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AdminRole = 'admin' | 'super_admin'

export function isAdminRole(role: unknown): role is AdminRole {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Garde serveur pour l'espace /admin : redirige si l'utilisateur n'est pas
 * connecté ou n'a pas le rôle admin / super_admin.
 *
 * À appeler en tête de chaque page admin qui lit des données avec le
 * service_role : un layout seul ne protège pas une page (les deux sont
 * rendus indépendamment lors des navigations client).
 *
 * @example
 * const { role } = await requireAdmin()
 * const isSuperAdmin = role === 'super_admin'
 */
export async function requireAdmin(): Promise<{ userId: string; role: AdminRole }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role: unknown = profile?.role
  if (!isAdminRole(role)) redirect('/dashboard')

  return { userId: user.id, role }
}
