export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoursePlayer } from '@/components/formations/CoursePlayer'
import type { Formation, FormationLesson, FormationEnrollment } from '@/types/formation'

export default async function ApprendrePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/apprendre/${slug}`)

  const { data: formation } = await supabase.from('formations').select('*').eq('slug', slug).single()
  if (!formation) notFound()
  const f = formation as Formation

  // Vérifier l'accès (inscription active)
  const { data: enrollment } = await supabase
    .from('formation_enrollments')
    .select('*')
    .eq('formation_id', f.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const enr = enrollment as FormationEnrollment | null
  const hasAccess = enr?.status === 'active' || enr?.status === 'completed'

  // Leçons : complètes si accès, sinon preview seulement
  const { data: lessonsData } = await supabase
    .from('formation_lessons')
    .select('*')
    .eq('formation_id', f.id)
    .order('ordre', { ascending: true })

  const lessons = (lessonsData ?? []) as FormationLesson[]

  if (!hasAccess) {
    redirect(`/formations/en-ligne/${slug}`)
  }

  return (
    <CoursePlayer
      formation={f}
      lessons={lessons}
      enrollmentId={enr!.id}
      completedLessonIds={enr!.progress ?? []}
      hasFinalQuiz={(f.final_quiz?.length ?? 0) > 0}
    />
  )
}
