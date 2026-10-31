import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { OPEN_REQUEST_STATUSES } from '@/lib/inbox/request-rules'
import { createRequest, listRequests, RequestError } from '@/lib/inbox/requests'

export const dynamic = 'force-dynamic'

const UUID = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
const MESSAGE_REF = z.string().regex(/^[0-9a-f]{32}$/)

const CreateSchema = z.object({
  conversation_id: UUID,
  text: z.string().min(1).max(1000),
  message_refs: z.array(MESSAGE_REF).max(10).default([]),
})

/**
 * Recherches d'une conversation (?conversation=<uuid>), ou de toute l'équipe.
 * ?scope=all inclut les recherches terminées et annulées.
 */
export async function GET(request: NextRequest) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const params = request.nextUrl.searchParams
  const conversation = UUID.safeParse(params.get('conversation'))
  const all = params.get('scope') === 'all'
  try {
    const items = await listRequests({
      conversationId: conversation.success ? conversation.data : null,
      statuses: all || conversation.success ? null : OPEN_REQUEST_STATUSES,
    })
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'Recherches indisponibles (migration appliquée ?)' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const parsed = CreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Demande invalide' }, { status: 400 })
  try {
    const { request: created, photoOverflow } = await createRequest(me, {
      conversationId: parsed.data.conversation_id,
      text: parsed.data.text,
      messageRefs: parsed.data.message_refs,
    })
    return NextResponse.json({ request: created, photoOverflow }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

function errorResponse(error: unknown) {
  if (error instanceof RequestError) {
    const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'CONFLICT' ? 409 : 400
    return NextResponse.json({ error: error.message }, { status })
  }
  console.error('[inbox-requests]', error instanceof Error ? error.message : 'erreur')
  return NextResponse.json({ error: 'Opération impossible' }, { status: 500 })
}
