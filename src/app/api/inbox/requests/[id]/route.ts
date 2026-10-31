import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { REQUEST_STATUSES } from '@/lib/inbox/request-rules'
import { addMessagePhotos, addRequestNote, getRequest, RequestError, setRequestStatus } from '@/lib/inbox/requests'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PatchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('note'), text: z.string().min(1).max(1000) }),
  z.object({ action: z.literal('status'), status: z.enum(REQUEST_STATUSES) }),
  z.object({ action: z.literal('photos'), message_refs: z.array(z.string().regex(/^[0-9a-f]{32}$/)).min(1).max(10) }),
])

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Recherche introuvable' }, { status: 404 })
  const found = await getRequest(id).catch(() => null)
  if (!found) return NextResponse.json({ error: 'Recherche introuvable' }, { status: 404 })
  return NextResponse.json({ request: found })
}

/** Compléter une recherche : note signée, statut, ou photos prises dans le fil. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Recherche introuvable' }, { status: 404 })
  const parsed = PatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Modification invalide' }, { status: 400 })

  try {
    const input = parsed.data
    if (input.action === 'note') return NextResponse.json({ request: await addRequestNote(me, id, input.text) })
    if (input.action === 'status') return NextResponse.json({ request: await setRequestStatus(me, id, input.status) })
    const r = await addMessagePhotos(id, input.message_refs)
    return NextResponse.json({ request: r.request, added: r.added, overflow: r.overflow })
  } catch (error) {
    if (error instanceof RequestError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'CONFLICT' ? 409 : 400
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error('[inbox-requests]', error instanceof Error ? error.message : 'erreur')
    return NextResponse.json({ error: 'Opération impossible' }, { status: 500 })
  }
}
