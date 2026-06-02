export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { QcmStudentApp } from '@/components/teacher/QcmStudentApp'
import { AlertCircle } from 'lucide-react'
import type { Question } from '@/types/teacher'

export default async function DevoirPublicPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: devoir } = await admin
    .from('qcm_devoirs')
    .select('id, titre, matiere, niveau, duree_minutes, questions, note_totale, access_code, is_locked, status, link_token')
    .eq('link_token', token)
    .single()

  if (!devoir || devoir.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f3] px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Ce devoir n'est pas disponible.</p>
        </div>
      </div>
    )
  }

  // On retire les bonnes réponses avant d'envoyer au client
  const questionsPubliques = (devoir.questions as Question[]).map((q) => ({
    id: q.id,
    type: q.type,
    enonce: q.enonce,
    points: q.points,
    options: q.options?.map((o) => ({ lettre: o.lettre, texte: o.texte })),
    longueur_attendue: q.longueur_attendue,
  }))

  return (
    <QcmStudentApp
      linkToken={devoir.link_token}
      titre={devoir.titre}
      matiere={devoir.matiere ?? ''}
      niveau={devoir.niveau ?? ''}
      dureeMinutes={devoir.duree_minutes}
      noteTotale={Number(devoir.note_totale)}
      isLocked={devoir.is_locked}
      questions={questionsPubliques}
    />
  )
}
