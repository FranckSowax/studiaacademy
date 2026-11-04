'use server'

// ============================================
// Gestion des collaborateurs (server actions, réservées aux admins)
// ============================================

import { revalidatePath } from 'next/cache'
import { getStaffContext } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCollaboratorInput } from './input'
import { canManageCollaborators, isSelfLockout, type CollaboratorRole } from './roles'

export type ActionResult = { ok: true } | { ok: false; error: string }

const PAGE = '/admin/collaborateurs'
// WHY: le bannissement Supabase empêche le rafraîchissement de session d'un
// compte désactivé (en plus du refus par current_staff_role).
const BAN_FOREVER = '876000h'

async function requireManager() {
  const ctx = await getStaffContext()
  if (!ctx || !canManageCollaborators(ctx.role)) return null
  return ctx
}

function uniqueViolation(code: string | undefined): string | null {
  return code === '23505' ? 'Ce numéro ou cet email est déjà utilisé par un autre collaborateur' : null
}

/** Inviter un collaborateur : la fiche suffit, le compte est créé à sa première connexion par code. */
export async function createCollaborator(raw: unknown): Promise<ActionResult> {
  const me = await requireManager()
  if (!me) return { ok: false, error: 'Accès refusé' }
  const input = parseCollaboratorInput(raw)
  if (!input.ok) return input

  const { error } = await createAdminClient()
    .from('collaborators')
    .insert({ ...input.value, invited_by: me.userId })
  if (error) return { ok: false, error: uniqueViolation(error.code) ?? 'Enregistrement impossible' }
  revalidatePath(PAGE)
  return { ok: true }
}

/** Le compte lié est-il le super admin ? Seul un super admin peut alors modifier la fiche. */
async function protectsSuperAdmin(userId: string | null, actorRole: string | null): Promise<boolean> {
  if (!userId || actorRole === 'super_admin') return false
  const { data } = await createAdminClient().from('profiles').select('role').eq('id', userId).maybeSingle()
  return data?.role === 'super_admin'
}

/** Modifier nom, contacts et rôle. */
export async function updateCollaborator(id: string, raw: unknown): Promise<ActionResult> {
  const me = await requireManager()
  if (!me) return { ok: false, error: 'Accès refusé' }
  const input = parseCollaboratorInput(raw)
  if (!input.ok) return input

  const admin = createAdminClient()
  const { data: target } = await admin.from('collaborators').select('id, user_id').eq('id', id).maybeSingle()
  if (!target) return { ok: false, error: 'Collaborateur introuvable' }
  if (await protectsSuperAdmin(target.user_id, me.role)) return { ok: false, error: 'Réservé au super administrateur' }
  if (isSelfLockout(me.userId, target, { role: input.value.role as CollaboratorRole })) {
    return { ok: false, error: 'Vous ne pouvez pas retirer votre propre rôle admin' }
  }

  const { error } = await admin.from('collaborators').update(input.value).eq('id', id)
  if (error) return { ok: false, error: uniqueViolation(error.code) ?? 'Enregistrement impossible' }
  revalidatePath(PAGE)
  return { ok: true }
}

/** Activer / désactiver. Désactivé : plus aucun accès, l'historique des réponses reste. */
export async function setCollaboratorActive(id: string, active: boolean): Promise<ActionResult> {
  const me = await requireManager()
  if (!me) return { ok: false, error: 'Accès refusé' }

  const admin = createAdminClient()
  const { data: target } = await admin.from('collaborators').select('id, user_id').eq('id', id).maybeSingle()
  if (!target) return { ok: false, error: 'Collaborateur introuvable' }
  if (await protectsSuperAdmin(target.user_id, me.role)) return { ok: false, error: 'Réservé au super administrateur' }
  if (isSelfLockout(me.userId, target, { is_active: active })) {
    return { ok: false, error: 'Vous ne pouvez pas désactiver votre propre compte' }
  }

  const { error } = await admin.from('collaborators').update({ is_active: active }).eq('id', id)
  if (error) return { ok: false, error: 'Enregistrement impossible' }

  if (target.user_id) {
    // Codes en cours annulés ; session coupée au prochain rafraîchissement.
    if (!active) {
      await admin.from('collaborator_otps').update({ consumed_at: new Date().toISOString() }).eq('collaborator_id', id).is('consumed_at', null)
    }
    const { error: banError } = await admin.auth.admin.updateUserById(target.user_id, {
      ban_duration: active ? 'none' : BAN_FOREVER,
    })
    if (banError) console.error('[collaborators] (dé)bannissement impossible:', banError.status)
  }
  revalidatePath(PAGE)
  return { ok: true }
}
