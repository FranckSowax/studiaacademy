export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlayerScreen } from '@/components/live/PlayerScreen'
import type { LiveGame } from '@/types/live'

export default async function LivePlayerPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const admin = createAdminClient()

  const { data: game } = await admin
    .from('live_games')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (!game) notFound()

  return <PlayerScreen game={game as LiveGame} />
}
