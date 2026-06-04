import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AssessmentQuestion } from '@/types/entreprise'

export const dynamic = 'force-dynamic'

/** Un salarié démarre le test : crée une soumission, renvoie les questions sans la bonne réponse. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: assessment } = await admin
    .from('company_assessments')
    .select('id, titre, description, duree_minutes, questions, status')
    .eq('link_token', token)
    .maybeSingle()
  if (!assessment) return NextResponse.json({ error: 'Test introuvable' }, { status: 404 })
  if (assessment.status !== 'open') return NextResponse.json({ error: 'Ce test n\'est plus ouvert.' }, { status: 200 })

  const body = await request.json().catch(() => ({}))
  const { data: sub, error } = await admin
    .from('assessment_submissions')
    .insert({
      assessment_id: assessment.id,
      prenom: body.prenom ?? null,
      nom: body.nom ?? null,
      departement: body.departement ?? null,
      poste: body.poste ?? null,
      email: body.email ?? null,
    })
    .select('respondent_token')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 200 })

  // Questions publiques : on retire la bonne réponse
  const publicQuestions = (assessment.questions as AssessmentQuestion[]).map(
    ({ reponse_correcte: _omit, ...q }) => q
  )

  return NextResponse.json({
    respondentToken: sub.respondent_token,
    titre: assessment.titre,
    description: assessment.description,
    dureeMinutes: assessment.duree_minutes,
    questions: publicQuestions,
  })
}
