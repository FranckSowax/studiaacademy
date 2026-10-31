import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/inbox/cron-auth'
import { runPendingAnalyses } from '@/lib/inbox/analyze'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Tâche planifiée : analyse les conversations en attente (lot + plafond du jour). */
export async function POST(request: NextRequest) {
  const auth = checkCronAuth(request.headers.get('authorization'))
  if (auth === 'unconfigured') return NextResponse.json({ error: 'INBOX_CRON_SECRET non configuré' }, { status: 503 })
  if (auth === 'denied') return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
  return NextResponse.json(await runPendingAnalyses())
}
