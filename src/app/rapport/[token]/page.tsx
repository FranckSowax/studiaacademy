export const dynamic = 'force-dynamic'

import Image from 'next/image'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CorrectionResult } from '@/types/teacher'

export default async function RapportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: job } = await admin
    .from('correction_jobs')
    .select('*, correction_sessions(titre, matiere, niveau)')
    .eq('report_token', token)
    .single()

  if (!job || !job.validated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f3] px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Rapport introuvable ou non disponible.</p>
        </div>
      </div>
    )
  }

  const result = job.result_json as CorrectionResult
  const session = job.correction_sessions

  return (
    <div className="min-h-screen bg-[#fbf8f3] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Image src="/logo.png" alt="Studia" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-bold font-heading text-gray-800">
            Studia <span className="text-[#e97e42] font-light">Academy</span>
          </span>
        </div>

        {/* Carte note */}
        <div className="bg-white rounded-3xl border border-[#f0ebe3] p-8 text-center mb-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">{session.titre}</p>
          <p className="text-xs text-gray-400 mb-4">
            {session.matiere} · {session.niveau}
          </p>
          <p className="text-gray-700 font-medium mb-2">
            {job.eleve_prenom} {job.eleve_nom}
          </p>
          <div className="text-5xl font-extrabold font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
            {result.note_obtenue}/{result.note_sur}
          </div>
          <span className="inline-block mt-3 bg-[#fff7ed] text-[#a84d16] px-4 py-1 rounded-full text-sm font-semibold">
            {result.mention}
          </span>
        </div>

        {/* Appréciation */}
        <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Appréciation</p>
          <p className="text-gray-700 leading-relaxed">{result.appreciation_generale}</p>
        </div>

        {/* Détail par question */}
        <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-4">Détail des questions</p>
          <div className="space-y-3">
            {result.questions.map((q) => {
              const Icon =
                q.statut === 'correct' ? CheckCircle : q.statut === 'partiel' ? AlertCircle : XCircle
              const color =
                q.statut === 'correct'
                  ? 'text-green-600'
                  : q.statut === 'partiel'
                    ? 'text-amber-500'
                    : 'text-red-500'
              return (
                <div key={q.numero} className="flex items-start gap-3 border-b border-[#f0ebe3] pb-3 last:border-0">
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800 text-sm">Question {q.numero}</p>
                      <span className={`text-sm font-semibold ${color}`}>
                        {q.points_obtenus}/{q.points_max}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{q.commentaire}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Points forts / axes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
            <p className="text-sm font-semibold text-green-700 mb-2">Points forts</p>
            <ul className="space-y-1">
              {result.points_forts.map((p, i) => (
                <li key={i} className="text-sm text-green-800 flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <p className="text-sm font-semibold text-amber-700 mb-2">Axes d'amélioration</p>
            <ul className="space-y-1">
              {result.axes_amelioration.map((a, i) => (
                <li key={i} className="text-sm text-amber-800 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Rapport généré par Studia Academy · Libreville, Gabon
        </p>
      </div>
    </div>
  )
}
