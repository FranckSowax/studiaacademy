export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminLessonsManager } from '@/components/formations/AdminLessonsManager'
import type { Formation, FormationLesson } from '@/types/formation'

export default async function AdminFormationEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: formation } = await supabase.from('formations').select('*').eq('id', id).single()
  if (!formation) redirect('/admin/formations')

  const { data: lessons } = await supabase
    .from('formation_lessons')
    .select('*')
    .eq('formation_id', id)
    .order('ordre', { ascending: true })

  return (
    <AdminLessonsManager
      formation={formation as Formation}
      initialLessons={(lessons ?? []) as FormationLesson[]}
    />
  )
}
