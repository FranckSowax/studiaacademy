export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../../../actions'
import { CorrectionReview } from '@/components/teacher/CorrectionReview'

export default async function CorrectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')

  const supabase = await createClient()
  const { data: session } = await supabase
    .from('correction_sessions')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', teacher.id)
    .single()

  if (!session) redirect('/professeur/correction')

  const { data: jobs } = await supabase
    .from('correction_jobs')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true })

  return <CorrectionReview session={session} initialJobs={jobs ?? []} />
}
