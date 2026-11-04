import { canAccessAdmin } from '@/lib/collaborators/roles'
import { requireStaff } from './staff'

export type AdminRole = 'admin' | 'super_admin'

export function isAdminRole(role: unknown): role is AdminRole {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Garde serveur pour l'espace /admin : redirige si l'utilisateur n'est pas
 * connecté ou n'a pas le rôle admin / super_admin (rôle effectif en base,
 * voir public.current_staff_role : une fiche collaborateur désactivée
 * coupe l'accès). Un agent messagerie est renvoyé vers la messagerie.
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
  const { userId, role } = await requireStaff(canAccessAdmin, '/dashboard')
  // requireStaff a déjà filtré ; le test affine le type.
  if (!isAdminRole(role)) throw new Error('Rôle admin attendu')
  return { userId, role }
}
