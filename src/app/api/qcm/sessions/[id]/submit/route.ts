import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runQcmCorrection } from '@/lib/workers/qcm'
import { sendWhatsApp, messageParent } from '@/lib/whapi'
import type { QuestionType } from '@/types/teacher'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface SubmitBody {
  duree_reelle_secondes: number
  reponses: Array<{
    question_id: number
    type_question: QuestionType
    reponse_donnee: string
  }>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()
  const body = (await request.json()) as SubmitBody

  // Vérifier la session
  const { data: session } = await admin
    .from('qcm_sessions')
    .select('*, qcm_devoirs(titre, matiere, teacher_id)')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  if (session.status !== 'in_progress') {
    return NextResponse.json({ error: 'Devoir déjà soumis' }, { status: 400 })
  }

  // Enregistrer les réponses
  const reponsesRows = body.reponses.map((r) => ({
    session_id: id,
    question_id: r.question_id,
    type_question: r.type_question,
    reponse_donnee: r.reponse_donnee,
  }))
  await admin.from('qcm_reponses').insert(reponsesRows)

  // Marquer comme soumis
  await admin
    .from('qcm_sessions')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      duree_reelle_secondes: body.duree_reelle_secondes,
    })
    .eq('id', id)

  // Correction (QCM instantané + analyse texte Mistral)
  await runQcmCorrection(id)

  // Recharger le résultat
  const { data: corrected } = await admin
    .from('qcm_sessions')
    .select('*')
    .eq('id', id)
    .single()

  // Envoi WhatsApp
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studiaacademy-production.up.railway.app'
  const lienRapport = `${baseUrl}/devoir/${session.devoir_id}/resultats/${session.report_token}`
  const devoir = session.qcm_devoirs

  if (corrected) {
    if (session.eleve_email || session.parent_phone) {
      // Notification parent si renseigné
      if (session.parent_phone) {
        await sendWhatsApp(
          session.parent_phone,
          messageParent({
            prenom: session.eleve_prenom,
            matiere: devoir.matiere ?? '',
            note: corrected.score ?? 0,
            sur: corrected.score_sur ?? 20,
            mention: corrected.mention ?? '',
            lienRapport,
          })
        )
      }
    }
  }

  return NextResponse.json({
    success: true,
    report_token: session.report_token,
    score: corrected?.score,
    score_sur: corrected?.score_sur,
    mention: corrected?.mention,
  })
}
