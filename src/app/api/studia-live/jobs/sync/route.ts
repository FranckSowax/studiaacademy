import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/inbox/cron-auth'
import { liaisonLiveConfiguree } from '@/lib/studia-live/pilotage'
import { synchroniserSessionsLive } from '@/lib/studia-live/suivi'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Tâche planifiée (chaque nuit) : synchronise le suivi avec les sessions
 * clôturées de Studia Live, comme le bouton de l'admin.
 * En-tête attendu : Authorization: Bearer <INBOX_CRON_SECRET>, le secret
 * des autres tâches planifiées. La réponse ne contient que des compteurs.
 */
export async function POST(request: NextRequest) {
  const auth = checkCronAuth(request.headers.get('authorization'))
  if (auth === 'unconfigured') return NextResponse.json({ error: 'INBOX_CRON_SECRET non configuré' }, { status: 503 })
  if (auth === 'denied') return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
  if (!liaisonLiveConfiguree()) return NextResponse.json({ error: 'Liaison Studia Live non configurée' }, { status: 503 })

  const r = await synchroniserSessionsLive(createAdminClient())
  return r.ok ? NextResponse.json(r.bilan) : NextResponse.json({ error: r.message }, { status: 502 })
}
