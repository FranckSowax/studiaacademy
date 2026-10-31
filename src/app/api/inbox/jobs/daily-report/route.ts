import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/inbox/cron-auth'
import { buildAndStoreDailyReport } from '@/lib/inbox/analyze'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Tâche planifiée : bilan d'une journée (par défaut hier). Corps facultatif : { "day": "AAAA-MM-JJ" }. */
export async function POST(request: NextRequest) {
  const auth = checkCronAuth(request.headers.get('authorization'))
  if (auth === 'unconfigured') return NextResponse.json({ error: 'INBOX_CRON_SECRET non configuré' }, { status: 503 })
  if (auth === 'denied') return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { day?: unknown } | null
  const day = typeof body?.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.day) ? body.day : undefined
  return NextResponse.json({ report: await buildAndStoreDailyReport(day) })
}
