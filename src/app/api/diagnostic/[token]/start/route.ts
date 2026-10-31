import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clientIpFrom, consumeRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import type { AssessmentQuestion } from '@/types/entreprise'

export const dynamic = 'force-dynamic'

function clip(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

/** Un salarié démarre le test : crée une soumission, renvoie les questions sans la bonne réponse. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const ip = clientIpFrom(request.headers)
  if (!(await consumeRateLimit(`diag-start:ip:${ip}`, RATE_LIMITS.diagnosticStartPerIp))) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 })
  }
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
      prenom: clip(body.prenom, 80),
      nom: clip(body.nom, 80),
      departement: clip(body.departement, 120),
      poste: clip(body.poste, 120),
      email: clip(body.email, 200),
    })
    .select('respondent_token')
    .single()
  if (error) return NextResponse.json({ error: 'Impossible de démarrer le test' }, { status: 200 })

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
