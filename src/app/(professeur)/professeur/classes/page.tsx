export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../../actions'
import { ClassesManager } from '@/components/teacher/ClassesManager'
import type { Classe, ClassStudent } from '@/types/teacher'

export default async function ClassesPage() {
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')

  const supabase = await createClient()
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })

  const classeList = (classes ?? []) as Classe[]

  // Élèves de toutes les classes du prof
  const classIds = classeList.map((c) => c.id)
  let students: ClassStudent[] = []
  if (classIds.length > 0) {
    const { data } = await supabase
      .from('class_students')
      .select('*')
      .in('class_id', classIds)
      .order('nom', { ascending: true })
    students = (data ?? []) as ClassStudent[]
  }

  return <ClassesManager initialClasses={classeList} initialStudents={students} />
}
