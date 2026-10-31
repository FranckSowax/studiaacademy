import { NextRequest, NextResponse } from 'next/server'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { getQuickReplies, saveQuickReplies } from '@/lib/inbox/quick-replies'

export const dynamic = 'force-dynamic'

/** Phrases rapides de l'équipe : lecture pour tous, modification par les admins. */
export async function GET() {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  return NextResponse.json({ items: await getQuickReplies(), canEdit: me.role === 'admin' })
}

export async function PUT(request: NextRequest) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  if (me.role !== 'admin') {
    return NextResponse.json({ error: 'Seuls les administrateurs modifient les phrases rapides' }, { status: 403 })
  }
  const body = (await request.json().catch(() => null)) as { items?: unknown } | null
  try {
    return NextResponse.json({ items: await saveQuickReplies(body?.items) })
  } catch {
    return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
  }
}
