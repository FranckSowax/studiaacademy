export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../../../actions'
import { QcmManager } from '@/components/teacher/QcmManager'

export default async function QcmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')

  const supabase = await createClient()
  const { data: devoir } = await supabase
    .from('qcm_devoirs')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', teacher.id)
    .single()

  if (!devoir) redirect('/professeur/qcm')

  const { data: sessions } = await supabase
    .from('qcm_sessions')
    .select('*')
    .eq('devoir_id', id)
    .order('score', { ascending: false })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return <QcmManager devoir={devoir} initialSessions={sessions ?? []} baseUrl={baseUrl} />
}
