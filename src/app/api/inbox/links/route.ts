import { NextResponse } from 'next/server'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { getInsertableLinks } from '@/lib/inbox/links'

export const dynamic = 'force-dynamic'

/** Liens insérables dans une réponse (pages du site, formations actives). */
export async function GET() {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  return NextResponse.json({ items: await getInsertableLinks() })
}
