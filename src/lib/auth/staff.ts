// ============================================
// Rôle effectif de la personne connectée (serveur uniquement)
// ============================================
// Source de vérité : public.current_staff_role() en base — la même règle
// sert au middleware, aux gardes et aux policies RLS.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseStaffRole, type StaffRole } from '@/lib/collaborators/roles'

export interface StaffContext {
  userId: string
  role: StaffRole | null
}

/**
 * Compte connecté et son rôle d'équipe (null si client / désactivé).
 * Retourne null si personne n'est connecté.
 */
export async function getStaffContext(): Promise<StaffContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.rpc('current_staff_role')
  if (error) console.error('[staff] current_staff_role indisponible:', error.code)
  return { userId: user.id, role: error ? null : parseStaffRole(data) }
}

/**
 * Garde serveur : redirige vers la connexion équipe si personne n'est
 * connecté, ou vers `deniedTo` si le rôle ne passe pas `allowed`.
 *
 * @example
 * const { role } = await requireStaff(canAccessInbox)
 */
export async function requireStaff(
  allowed: (role: StaffRole | null) => boolean,
  deniedTo = '/dashboard',
): Promise<{ userId: string; role: StaffRole }> {
  const ctx = await getStaffContext()
  if (!ctx) redirect('/equipe/connexion')
  if (!ctx.role || !allowed(ctx.role)) redirect(deniedTo)
  return { userId: ctx.userId, role: ctx.role }
}
