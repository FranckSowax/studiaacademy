export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../../../actions'
import { TeacherKahootManager } from '@/components/teacher/TeacherKahootManager'
import type { TeacherKahoot } from '@/types/teacher'

export default async function KahootDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')

  const supabase = await createClient()
  const { data } = await supabase
    .from('teacher_kahoots')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', teacher.id)
    .single()

  if (!data) redirect('/professeur/kahoot')

  const { data: soloResults } = await supabase
    .from('kahoot_solo_results')
    .select('pseudo, score, correct_count, total_questions, created_at')
    .eq('kahoot_id', id)
    .order('score', { ascending: false })
    .limit(50)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studiaacademy-production.up.railway.app'

  return (
    <TeacherKahootManager
      kahoot={data as TeacherKahoot}
      soloUrl={`${baseUrl}/kahoot/${id}`}
      soloResults={(soloResults ?? []) as SoloResult[]}
    />
  )
}

export interface SoloResult {
  pseudo: string
  score: number
  correct_count: number
  total_questions: number
  created_at: string
}
