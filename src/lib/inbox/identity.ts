// ============================================
// Identité dans la messagerie : « qui écrit ? » (serveur uniquement)
// ============================================
// Appelée par TOUTES les routes de la messagerie. Une seule source de vérité.

import { createClient } from '@/lib/supabase/server'

export type InboxRole = 'admin' | 'collab'

export interface InboxIdentity {
  /** Identifiant stable (uuid du compte), enregistré comme auteur des réponses. */
  id: string
  /** Nom affiché sur les réponses et les attributions. */
  name: string
  role: InboxRole
}

/** Rôles qui donnent toujours accès à la messagerie. */
export const INBOX_ADMIN_ROLES = ['admin', 'super_admin'] as const

interface ProfileLike {
  id: string
  role?: unknown
  full_name?: unknown
  email?: unknown
  inbox_access?: unknown
}

/**
 * Règle d'accès (pure) : admin / super_admin, ou collaborateur avec
 * `inbox_access = true`. Sinon null.
 *
 * @example
 * resolveIdentity({ id, role: 'user', inbox_access: true, full_name: 'Awa' })
 * // { id, name: 'Awa', role: 'collab' }
 */
export function resolveIdentity(profile: ProfileLike | null): InboxIdentity | null {
  if (!profile?.id) return null
  const name =
    (typeof profile.full_name === 'string' && profile.full_name.trim()) ||
    (typeof profile.email === 'string' && profile.email.split('@')[0]) ||
    'Collaborateur'
  if ((INBOX_ADMIN_ROLES as readonly unknown[]).includes(profile.role)) {
    return { id: profile.id, name, role: 'admin' }
  }
  if (profile.inbox_access === true) return { id: profile.id, name, role: 'collab' }
  return null
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

  // select('*') : tolère une base où la colonne inbox_access n'existe pas encore.
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return resolveIdentity(profile as ProfileLike | null)
}
