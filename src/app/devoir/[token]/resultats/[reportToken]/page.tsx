export const dynamic = 'force-dynamic'

import Image from 'next/image'
import { CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Question, QcmReponse } from '@/types/teacher'

export default async function ResultatsPage({
  params,
}: {
  params: Promise<{ token: string; reportToken: string }>
}) {
  const { reportToken } = await params
  const admin = createAdminClient()

  const { data: session } = await admin
    .from('qcm_sessions')
    .select('*, qcm_devoirs(titre, matiere, niveau, questions, note_totale)')
    .eq('report_token', reportToken)
    .single()

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f3] px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Résultat introuvable.</p>
        </div>
      </div>
    )
  }

  // Correction en cours
  if (session.status !== 'corrected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f3] px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#e97e42] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Correction en cours…</p>
          <p className="text-gray-400 text-sm mt-1">Actualisez dans quelques secondes.</p>
        </div>
      </div>
    )
  }

  const devoir = session.qcm_devoirs
  const questions = devoir.questions as Question[]

  const { data: reponses } = await admin
    .from('qcm_reponses')
    .select('*')
    .eq('session_id', session.id)
    .order('question_id', { ascending: true })

  const reponsesList = (reponses ?? []) as QcmReponse[]
  const pct = ((Number(session.score) || 0) / (Number(session.score_sur) || 20)) * 100

  return (
    <div className="min-h-screen bg-[#fbf8f3] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Image src="/logo.png" alt="Studia" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-bold font-heading text-gray-800">
            Studia <span className="text-[#e97e42] font-light">Academy</span>
          </span>
        </div>

        {/* Carte note */}
        <div className="bg-white rounded-3xl border border-[#f0ebe3] p-8 text-center mb-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">{devoir.titre}</p>
          <p className="text-xs text-gray-400 mb-4">
            {devoir.matiere} · {devoir.niveau}
          </p>
          <p className="text-gray-700 font-medium mb-3">
            {session.eleve_prenom} {session.eleve_nom}
          </p>
          <div className="text-5xl font-extrabold font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
            {session.score}/{session.score_sur}
          </div>
          <span className="inline-block mt-3 bg-[#fff7ed] text-[#a84d16] px-4 py-1 rounded-full text-sm font-semibold">
            {session.mention}
          </span>
          {session.duree_reelle_secondes != null && (
            <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
              <Clock className="w-3 h-3" />
              Réalisé en {Math.floor(session.duree_reelle_secondes / 60)} min {session.duree_reelle_secondes % 60}s
            </p>
          )}
          {/* Barre score */}
          <div className="h-2 bg-gray-100 rounded-full mt-5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Détail par question */}
        <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-4">Correction détaillée</p>
          <div className="space-y-4">
            {questions.map((q) => {
              const rep = reponsesList.find((r) => r.question_id === q.id)
              const correct = rep?.est_correcte
              const Icon = correct ? CheckCircle : XCircle
              const color = correct ? 'text-green-600' : 'text-red-500'

              return (
                <div key={q.id} className="border-b border-[#f0ebe3] pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-800 text-sm">
                          Q{q.id}. {q.enonce}
                        </p>
                        <span className={`text-sm font-semibold whitespace-nowrap ${color}`}>
                          {rep?.points_obtenus ?? 0}/{q.points}
                        </span>
                      </div>

                      {/* Réponse élève */}
                      <p className="text-xs text-gray-500 mt-1">
                        Votre réponse : <span className="font-medium">{rep?.reponse_donnee || '—'}</span>
                      </p>

                      {/* Bonne réponse QCM */}
                      {q.type === 'qcm' && !correct && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Bonne réponse : {q.reponse_correcte}
                        </p>
                      )}
                      {q.type === 'qcm' && q.explication && (
                        <p className="text-xs text-gray-400 mt-1 italic">{q.explication}</p>
                      )}

                      {/* Commentaire IA pour les textes */}
                      {rep?.commentaire_ia && (
                        <div className="bg-[#fbf8f3] rounded-lg p-2.5 mt-2 text-xs text-gray-600">
                          💬 {rep.commentaire_ia}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Corrigé par l'IA Studia Academy · Libreville, Gabon
        </p>
      </div>
    </div>
  )
}
