// ============================================
// Identité dans la messagerie : « qui écrit ? » (serveur uniquement)
// ============================================
// Appelée par TOUTES les routes de la messagerie. Une seule source de vérité :
// le rôle effectif en base (public.current_staff_role), le nom de la fiche
// collaborateur à défaut du profil.

import { createClient } from '@/lib/supabase/server'
import { parseStaffRole, type StaffRole } from '@/lib/collaborators/roles'

export type InboxRole = 'admin' | 'collab'

export interface InboxIdentity {
  /** Identifiant stable (uuid du compte), enregistré comme auteur des réponses. */
  id: string
  /** Nom affiché sur les réponses et les attributions. */
  name: string
  role: InboxRole
}

interface IdentityInput {
  id: string
  staffRole: StaffRole | null
  collaboratorName?: unknown
  full_name?: unknown
  email?: unknown
}

function text(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

/**
 * Règle d'accès (pure) : toute l'équipe active (admin, super_admin, agent).
 * Les admins gardent les droits d'équipe (phrases rapides, reprise, bilans).
 *
 * @example
 * resolveIdentity({ id, staffRole: 'agent', collaboratorName: 'Awa' })
 * // { id, name: 'Awa', role: 'collab' }
 */
export function resolveIdentity(input: IdentityInput | null): InboxIdentity | null {
  if (!input?.id || !input.staffRole) return null
  const email = text(input.email)
  const name =
    text(input.collaboratorName) ?? text(input.full_name) ?? (email ? email.split('@')[0] : null) ?? 'Collaborateur'
  return { id: input.id, name, role: input.staffRole === 'agent' ? 'collab' : 'admin' }
}

/**
 * Identité de la personne connectée, ou null si elle n'a pas accès.
 *
 * @example
 * const me = await getInboxIdentity()
 * if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
 */
export async function getInboxIdentity(): Promise<InboxIdentity | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: role, error } = await supabase.rpc('current_staff_role')
  if (error) {
    console.error('[inbox] current_staff_role indisponible:', error.code)
    return null
  }
  const staffRole = parseStaffRole(role)
  if (!staffRole) return null

  const [{ data: collab }, { data: profile }] = await Promise.all([
    supabase.from('collaborators').select('full_name').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle(),
  ])
  return resolveIdentity({
    id: user.id,
    staffRole,
    collaboratorName: collab?.full_name,
    full_name: profile?.full_name,
    email: profile?.email ?? user.email,
  })
}
