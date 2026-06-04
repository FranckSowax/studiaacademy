export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { KahootQuiz } from '@/components/formations/KahootQuiz'
import { Trophy, ArrowLeft } from 'lucide-react'
import type { Formation, FormationEnrollment, LessonQuizQuestion } from '@/types/formation'

export default async function QuizFinalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/apprendre/${slug}/quiz-final`)

  const { data: formation } = await supabase.from('formations').select('*').eq('slug', slug).single()
  if (!formation) notFound()
  const f = formation as Formation

  // Vérifier l'accès (inscription active)
  const { data: enrollment } = await supabase
    .from('formation_enrollments')
    .select('status')
    .eq('formation_id', f.id)
    .eq('user_id', user.id)
    .maybeSingle()
  const enr = enrollment as Pick<FormationEnrollment, 'status'> | null
  if (enr?.status !== 'active' && enr?.status !== 'completed') {
    redirect(`/formations/en-ligne/${slug}`)
  }

  const questions = (f.final_quiz ?? []) as LessonQuizQuestion[]

  // Pas de quiz final disponible
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf8f3] px-4 text-center">
        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-[#7C3AED]" />
        </div>
        <h1 className="text-xl font-bold font-heading text-gray-900 mb-2">Quiz final bientôt disponible</h1>
        <p className="text-gray-500 max-w-sm mb-6">Le défi de fin de formation n'a pas encore été préparé pour cette formation.</p>
        <Link href={`/apprendre/${slug}`} className="inline-flex items-center gap-2 text-[#e97e42] font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" />Retour à la formation
        </Link>
      </div>
    )
  }

  // Leaderboard (via admin pour récupérer les noms)
  const admin = createAdminClient()
  const { data: results } = await admin
    .from('formation_quiz_results')
    .select('score, user_id')
    .eq('formation_id', f.id)
    .order('score', { ascending: false })
    .limit(20)

  // Meilleur score par utilisateur + nom
  const bestByUser = new Map<string, number>()
  for (const r of results ?? []) {
    const prev = bestByUser.get(r.user_id as string) ?? 0
    if ((r.score as number) > prev) bestByUser.set(r.user_id as string, r.score as number)
  }
  const topUserIds = [...bestByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  let leaderboard: { nom: string; score: number }[] = []
  if (topUserIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', topUserIds.map(([id]) => id))
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || (p.email as string)?.split('@')[0] || 'Élève']))
    leaderboard = topUserIds.map(([id, score]) => ({ nom: nameById.get(id) ?? 'Élève', score }))
  }

  return (
    <KahootQuiz
      formationId={f.id}
      formationSlug={slug}
      formationTitre={f.titre}
      questions={questions}
      leaderboard={leaderboard}
    />
  )
}
