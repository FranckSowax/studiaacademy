export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { SoloKahootPlayer } from '@/components/live/SoloKahootPlayer'
import type { TeacherKahoot } from '@/types/teacher'

export default async function SoloKahootPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from('teacher_kahoots')
    .select('id, titre, matiere, niveau, questions')
    .eq('id', id)
    .maybeSingle()

  if (!data) notFound()
  const k = data as Pick<TeacherKahoot, 'id' | 'titre' | 'matiere' | 'niveau' | 'questions'>

  // Top 5 scores pour la salle d'attente / fin
  const { data: results } = await admin
    .from('kahoot_solo_results')
    .select('pseudo, score')
    .eq('kahoot_id', id)
    .order('score', { ascending: false })
    .limit(5)

  return (
    <SoloKahootPlayer
      kahootId={k.id}
      titre={k.titre}
      questions={k.questions}
      leaderboard={(results ?? []) as { pseudo: string; score: number }[]}
    />
  )
}
