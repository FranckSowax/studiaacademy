export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HostScreen } from '@/components/live/HostScreen'
import type { LiveGame, LivePlayer } from '@/types/live'

export default async function HostPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: game } = await admin.from('live_games').select('*').eq('code', code.toUpperCase()).maybeSingle()
  if (!game) notFound()
  if (game.host_id !== user.id) redirect(`/live/${code}`)

  const { data: players } = await admin
    .from('live_players')
    .select('*')
    .eq('game_id', game.id)
    .order('score', { ascending: false })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studiaacademy-production.up.railway.app'
  const joinUrl = `${baseUrl}/live/${game.code}`

  return (
    <HostScreen
      game={game as LiveGame}
      initialPlayers={(players ?? []) as LivePlayer[]}
      joinUrl={joinUrl}
    />
  )
}
