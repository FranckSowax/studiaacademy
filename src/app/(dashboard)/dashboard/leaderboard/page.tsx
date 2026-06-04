export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getFormationLeaderboard } from '@/lib/formations/leaderboard'
import { LeaderboardView } from '@/components/dashboard/LeaderboardView'
import { Trophy } from 'lucide-react'

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ formation?: string }>
}) {
  const { formation: formationParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard/leaderboard')

  // Formations où l'élève est inscrit
  const { data: enrollments } = await supabase
    .from('formation_enrollments')
    .select('formation_id, status, granted_at, formations(id, titre, slug)')
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
    .order('granted_at', { ascending: false })

  type Enr = { formation_id: string; formations: { id: string; titre: string; slug: string } | null }
  const myFormations = ((enrollments ?? []) as unknown as Enr[])
    .filter((e) => e.formations)
    .map((e) => ({ id: e.formations!.id, titre: e.formations!.titre, slug: e.formations!.slug }))

  if (myFormations.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-[#fff7ed] rounded-2xl flex items-center justify-center mx-auto mb-4"><Trophy className="w-8 h-8 text-[#e97e42]" /></div>
        <h1 className="text-xl font-bold font-heading text-gray-900 mb-2">Aucun classement pour l&apos;instant</h1>
        <p className="text-gray-500 max-w-sm mx-auto mb-6">Inscrivez-vous à une formation pour rejoindre son classement et suivre votre progression face aux autres apprenants.</p>
        <Link href="/formations/en-ligne" className="inline-flex items-center gap-2 bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl px-5 py-3 font-medium">Découvrir les formations</Link>
      </div>
    )
  }

  const selectedId = myFormations.find((f) => f.id === formationParam)?.id ?? myFormations[0].id
  const board = await getFormationLeaderboard(selectedId, user.id)

  return (
    <LeaderboardView
      formations={myFormations}
      selectedId={selectedId}
      board={board}
    />
  )
}
