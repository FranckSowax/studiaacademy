import { NextRequest, NextResponse } from 'next/server'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { analyzeConversation, getLatestAnalysis } from '@/lib/inbox/analyze'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Dernière analyse de la conversation (null si jamais analysée). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
  return NextResponse.json({ latest: await getLatestAnalysis(id) })
}

/** Ré-analyse forcée (bouton), dans la limite du plafond quotidien. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  const outcome = await analyzeConversation(id, { force: true })
  if (outcome.status === 'skipped') return NextResponse.json({ ok: false, reason: outcome.reason }, { status: 200 })
  return NextResponse.json({ ok: true, latest: await getLatestAnalysis(id) })
}
