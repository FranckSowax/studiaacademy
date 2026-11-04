// ============================================
// Rôles de l'équipe et droits d'accès (pur, partagé serveur / interface)
// ============================================
// Le rôle effectif vient de la base : public.current_staff_role()
// (migration 20261104120000_collaborators.sql).

/** Rôle effectif d'un membre de l'équipe. */
export type StaffRole = 'super_admin' | 'admin' | 'agent'

/** Rôle stocké sur une fiche collaborateur (super_admin reste porté par le profil). */
export type CollaboratorRole = 'admin' | 'agent'

export const COLLABORATOR_ROLES = ['admin', 'agent'] as const satisfies readonly CollaboratorRole[]

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  agent: 'Agent messagerie',
}

export function parseStaffRole(value: unknown): StaffRole | null {
  return value === 'super_admin' || value === 'admin' || value === 'agent' ? value : null
}

/** Espace /admin : admins et super admin. */
export function canAccessAdmin(role: StaffRole | null): boolean {
  return role === 'admin' || role === 'super_admin'
}

/** Messagerie : toute l'équipe active. */
export function canAccessInbox(role: StaffRole | null): boolean {
  return role !== null
}

/** Inviter, modifier, désactiver des collaborateurs. */
export function canManageCollaborators(role: StaffRole | null): boolean {
  return canAccessAdmin(role)
}

/**
 * Un admin ne peut ni se désactiver ni se retirer le rôle admin
 * (évite de verrouiller l'équipe dehors par erreur).
 */
export function isSelfLockout(
  actorUserId: string,
  target: { user_id: string | null },
  change: { role?: CollaboratorRole; is_active?: boolean },
): boolean {
  if (!target.user_id || target.user_id !== actorUserId) return false
  return change.is_active === false || change.role === 'agent'
}

/** Page d'arrivée après connexion. */
export function homeForRole(role: StaffRole | null): string {
  if (canAccessAdmin(role)) return '/admin'
  if (canAccessInbox(role)) return '/messagerie'
  return '/dashboard'
}

/**
 * Destination après connexion : `next` seulement si c'est un chemin interne
 * autorisé pour ce rôle (pas de redirection ouverte), sinon l'accueil du rôle.
 *
 * @example
 * safeNextPath('/messagerie?c=…', 'agent') // '/messagerie?c=…'
 * safeNextPath('//evil.com', 'agent')      // '/messagerie'
 */
export function safeNextPath(next: string | null | undefined, role: StaffRole | null): string {
  const fallback = homeForRole(role)
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback
  if (next.startsWith('/admin') && !canAccessAdmin(role)) return fallback
  if (next.startsWith('/messagerie') && !canAccessInbox(role)) return fallback
  return next
}
