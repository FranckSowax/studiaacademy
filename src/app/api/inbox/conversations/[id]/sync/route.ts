import { NextRequest, NextResponse } from 'next/server'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { syncConversationHistory } from '@/lib/inbox/history'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Reprise d'historique : appelée par l'interface UNE fois par conversation
 * et par session, à la première ouverture.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  try {
    const result = await syncConversationHistory(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[inbox-sync]', error instanceof Error ? error.message : 'erreur')
    return NextResponse.json({ error: "Reprise d'historique impossible" }, { status: 502 })
  }
}
