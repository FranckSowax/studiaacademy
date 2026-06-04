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

  return <TeacherKahootManager kahoot={data as TeacherKahoot} />
}
