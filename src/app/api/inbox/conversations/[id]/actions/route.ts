import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { getPins, setPinned } from '@/lib/inbox/settings'
import { toDetail } from '@/lib/inbox/dto'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('assign') }),
  z.object({ action: z.literal('release') }),
  z.object({ action: z.literal('close') }),
  z.object({ action: z.literal('reopen') }),
  z.object({ action: z.literal('pin') }),
  z.object({ action: z.literal('unpin') }),
  z.object({ action: z.literal('note'), note: z.string().max(2000) }),
])

/**
 * Actions de suivi : s'attribuer, libérer, terminer, rouvrir, épingler,
 * note interne. Aucune n'écrit dans WhatsApp.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  const parsed = ActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  const input = parsed.data

  const admin = createAdminClient()
  const { data: conv } = await admin.from('wa_conversations').select('id, assigned_to').eq('id', id).maybeSingle()
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  let update: Record<string, unknown> | null = null
  switch (input.action) {
    case 'assign':
      update = { assigned_to: me.id, assigned_name: me.name, assigned_at: new Date().toISOString() }
      break
    case 'release':
      // On ne libère que ce qui nous est attribué (un admin peut tout libérer).
      if (conv.assigned_to && conv.assigned_to !== me.id && me.role !== 'admin') {
        return NextResponse.json({ error: 'Conversation attribuée à une autre personne' }, { status: 403 })
      }
      update = { assigned_to: null, assigned_name: null, assigned_at: null }
      break
    case 'close':
      update = { status: 'closed', unread_count: 0 }
      break
    case 'reopen':
      update = { status: 'open' }
      break
    case 'note':
      update = { note: input.note.trim() || null }
      break
    case 'pin':
    case 'unpin':
      await setPinned(me, id, input.action === 'pin')
      break
  }

  if (update) {
    const { error } = await admin.from('wa_conversations').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 })
  }

  const [{ data: fresh }, pins] = await Promise.all([
    admin.from('wa_conversations').select('*').eq('id', id).single(),
    getPins(me),
  ])
  return NextResponse.json({ conversation: fresh ? toDetail(fresh, me.id, new Set(pins)) : null })
}
