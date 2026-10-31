import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { getPins } from '@/lib/inbox/settings'
import { toDetail, toThreadMessage } from '@/lib/inbox/dto'

export const dynamic = 'force-dynamic'

const THREAD_LIMIT = 300
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Détail d'une conversation et son fil (300 derniers messages). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  const admin = createAdminClient()
  const [{ data: conv, error }, { data: messages, error: messagesError }, pins] = await Promise.all([
    admin.from('wa_conversations').select('*').eq('id', id).maybeSingle(),
    admin
      .from('wa_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('sent_at', { ascending: false })
      .limit(THREAD_LIMIT),
    getPins(me),
  ])
  if (error || messagesError) {
    return NextResponse.json({ error: 'Lecture de la conversation impossible' }, { status: 500 })
  }
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  return NextResponse.json({
    conversation: toDetail(conv, me.id, new Set(pins)),
    messages: (messages ?? []).reverse().map(toThreadMessage),
    me: { id: me.id, name: me.name },
  })
}
