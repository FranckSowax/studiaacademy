export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { CollaboratorsManager, type CollaboratorRowDto } from '@/components/admin/CollaboratorsManager'

const STATS_DAYS = 30
const STATS_SCAN_LIMIT = 5000

type ReplyStats = Map<string, { count: number; last: string | null }>

/** Activité dans la messagerie : réponses envoyées sur 30 jours (wa_messages.sent_by). */
async function loadReplyStats(userIds: string[]): Promise<ReplyStats> {
  const stats: ReplyStats = new Map()
  if (userIds.length === 0) return stats
  const since = new Date(Date.now() - STATS_DAYS * 86_400_000).toISOString()
  const { data: sent } = await createAdminClient()
    .from('wa_messages')
    .select('sent_by, sent_at')
    .in('sent_by', userIds)
    .gte('sent_at', since)
    .order('sent_at', { ascending: false })
    .limit(STATS_SCAN_LIMIT)
  for (const m of sent ?? []) {
    const key = m.sent_by as string
    const cur = stats.get(key) ?? { count: 0, last: null }
    stats.set(key, { count: cur.count + 1, last: cur.last ?? (m.sent_at as string) })
  }
  return stats
}

export default async function CollaboratorsPage() {
  const { userId } = await requireAdmin()
  const admin = createAdminClient()

  const { data: rows, error } = await admin
    .from('collaborators')
    .select('id, user_id, full_name, email, whatsapp_phone, role, is_active, last_login_at, created_at')
    .order('is_active', { ascending: false })
    .order('full_name')

  const userIds = (rows ?? []).map((r) => r.user_id).filter((v): v is string => typeof v === 'string')
  const stats = await loadReplyStats(userIds)

  const items: CollaboratorRowDto[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    userId: (r.user_id as string | null) ?? null,
    fullName: r.full_name as string,
    email: (r.email as string | null) ?? null,
    whatsappPhone: (r.whatsapp_phone as string | null) ?? null,
    role: r.role as 'admin' | 'agent',
    isActive: r.is_active === true,
    lastLoginAt: (r.last_login_at as string | null) ?? null,
    repliesLast30d: r.user_id ? (stats.get(r.user_id as string)?.count ?? 0) : 0,
    lastReplyAt: r.user_id ? (stats.get(r.user_id as string)?.last ?? null) : null,
    isMe: r.user_id === userId,
  }))

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Collaborateurs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque membre de l&apos;équipe se connecte avec son propre compte, par code WhatsApp (email à défaut),
          sur <code>/equipe/connexion</code>. Les réponses envoyées depuis la messagerie portent son nom.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Lecture impossible — la migration 20261104120000_collaborators est-elle appliquée ?
        </p>
      ) : (
        <CollaboratorsManager items={items} />
      )}
    </div>
  )
}
