import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp, messageRapportEleve, messageParent } from '@/lib/whapi'
import type { CorrectionResult } from '@/types/teacher'

export const dynamic = 'force-dynamic'

/**
 * Envoie le rapport de correction à l'élève (et au parent si renseigné)
 * via WhatsApp + génère le lien public du rapport.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: job } = await supabase
    .from('correction_jobs')
    .select('*, correction_sessions(titre, matiere, teacher_profiles(matiere))')
    .eq('id', id)
    .single()

  if (!job) return NextResponse.json({ error: 'Copie introuvable' }, { status: 404 })
  if (!job.validated) {
    return NextResponse.json({ error: 'Valider le rapport avant envoi' }, { status: 400 })
  }

  const result = job.result_json as CorrectionResult
  const session = job.correction_sessions
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studiaacademy-production.up.railway.app'
  const lienRapport = `${baseUrl}/rapport/${job.report_token}`

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const nomProf = profile?.full_name ?? 'Votre professeur'

  let sent = false

  // Envoi élève
  if (job.eleve_phone) {
    sent = await sendWhatsApp(
      job.eleve_phone,
      messageRapportEleve({
        prenom: job.eleve_prenom ?? '',
        titre: session.titre,
        note: result.note_obtenue,
        sur: result.note_sur,
        mention: result.mention,
        lienRapport,
        nomProf,
      })
    )
  }

  // Envoi parent (optionnel)
  if (job.parent_phone) {
    await sendWhatsApp(
      job.parent_phone,
      messageParent({
        prenom: job.eleve_prenom ?? '',
        matiere: session.matiere ?? '',
        note: result.note_obtenue,
        sur: result.note_sur,
        mention: result.mention,
        lienRapport,
      })
    )
  }

  await supabase
    .from('correction_jobs')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ success: true, whatsapp_sent: sent, lien_rapport: lienRapport })
}
