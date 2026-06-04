import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scoreSubmission } from '@/lib/entreprise/scoring'
import type { AssessmentQuestion } from '@/types/entreprise'

export const dynamic = 'force-dynamic'

/** Un salarié soumet ses réponses : scoring déterministe + enregistrement. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdminClient()

  const body = await request.json().catch(() => ({}))
  const respondentToken = body.respondentToken as string | undefined
  const reponses = (body.reponses ?? {}) as Record<string, number>
  if (!respondentToken) return NextResponse.json({ error: 'Session invalide' }, { status: 200 })

  const { data: assessment } = await admin
    .from('company_assessments')
    .select('id, questions, seuil_analyse, nb_submissions')
    .eq('link_token', token)
    .maybeSingle()
  if (!assessment) return NextResponse.json({ error: 'Test introuvable' }, { status: 404 })

  const { data: sub } = await admin
    .from('assessment_submissions')
    .select('id, status')
    .eq('respondent_token', respondentToken)
    .eq('assessment_id', assessment.id)
    .maybeSingle()
  if (!sub) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 200 })
  if (sub.status === 'scored') return NextResponse.json({ error: 'Test déjà soumis' }, { status: 200 })

  const questions = assessment.questions as AssessmentQuestion[]
  const result = scoreSubmission(questions, reponses)

  // Réponses détaillées
  await admin.from('submission_answers').insert(
    result.answers.map((a) => ({
      submission_id: sub.id,
      question_id: a.question_id,
      domaine: a.domaine,
      competence: a.competence,
      reponse_index: a.reponse_index,
      est_correcte: a.est_correcte,
      points_obtenus: a.points_obtenus,
      points_max: a.points_max,
    }))
  )

  await admin
    .from('assessment_submissions')
    .update({
      score_global: result.score_global,
      score_sur: result.score_sur,
      scores_domaines: result.scores_domaines,
      status: 'scored',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', sub.id)

  await admin
    .from('company_assessments')
    .update({ nb_submissions: (assessment.nb_submissions ?? 0) + 1 })
    .eq('id', assessment.id)

  return NextResponse.json({
    success: true,
    score_global: result.score_global,
    score_sur: result.score_sur,
    scores_domaines: result.scores_domaines,
  })
}
