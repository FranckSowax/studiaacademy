export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../../actions'
import { ClassesManager } from '@/components/teacher/ClassesManager'
import type { Classe } from '@/types/teacher'

export default async function ClassesPage() {
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')

  const supabase = await createClient()
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })

  return <ClassesManager initialClasses={(classes ?? []) as Classe[]} />
}
