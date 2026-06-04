'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft, Trophy, Radio, Loader2, Trash2, CheckCircle, HelpCircle, Sparkles,
  Link2, Copy, Check, Crown, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createLiveGameFromQuestions } from '@/lib/live/actions'
import { deleteKahoot } from '@/app/(professeur)/actions'
import type { TeacherKahoot } from '@/types/teacher'
import type { SoloResult } from '@/app/(professeur)/professeur/kahoot/[id]/page'

export function TeacherKahootManager({
  kahoot,
  soloUrl,
  soloResults,
}: {
  kahoot: TeacherKahoot
  soloUrl: string
  soloResults: SoloResult[]
}) {
  const router = useRouter()
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const launch = async () => {
    setLaunching(true); setError('')
    const r = await createLiveGameFromQuestions({ titre: kahoot.titre, questions: kahoot.questions })
    if (r.success && r.code) {
      router.push(`/live/${r.code}/host`)
    } else {
      setError(r.error ?? 'Impossible de lancer la partie')
      setLaunching(false)
    }
  }

  const remove = async () => {
    if (!confirm('Supprimer ce Kahoot ?')) return
    await deleteKahoot(kahoot.id)
    router.push('/professeur/kahoot')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(soloUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl">
      <Link href="/professeur/kahoot" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#7C3AED] mb-6">
        <ArrowLeft className="w-4 h-4" />Mes Kahoots
      </Link>

      {/* En-tête */}
      <div className="bg-gradient-to-br from-[#7C3AED] to-[#4c1d95] rounded-3xl p-6 text-white mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-xs font-medium mb-2">
              <Trophy className="w-3 h-3" />Kahoot
            </div>
            <h1 className="text-2xl font-extrabold font-heading">{kahoot.titre}</h1>
            <p className="text-white/70 text-sm mt-1 inline-flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />{kahoot.questions.length} questions
              {kahoot.matiere && ` · ${kahoot.matiere}`}
              {kahoot.niveau && ` · ${kahoot.niveau}`}
            </p>
          </div>
          <button onClick={remove} className="text-white/60 hover:text-white p-1.5" title="Supprimer">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lancement en direct */}
      <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Radio className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold font-heading text-gray-900">Lancer en direct (présentiel)</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Une partie démarre avec un <strong>QR code</strong> et un <strong>lien direct</strong> à projeter. Les élèves rejoignent depuis leur téléphone, <strong>sans compte</strong>, et répondent en temps réel.
            </p>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <Button onClick={launch} disabled={launching || kahoot.questions.length === 0}
              className="bg-gradient-to-r from-[#7C3AED] to-[#6d28d9] text-white rounded-xl">
              {launching ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Création de la partie…</> : <><Radio className="w-4 h-4 mr-1" />Lancer la partie</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Mode asynchrone : lien solo + QR */}
      <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold font-heading text-gray-900">Partager en autonomie (à distance)</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Envoyez ce <strong>lien</strong> (ou le QR code) : chaque élève joue <strong>seul, à son rythme</strong>, quand il veut. Vous n&apos;avez pas besoin d&apos;être présent — les scores remontent automatiquement ci-dessous.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                  <span className="flex-1 text-sm text-gray-600 truncate">{soloUrl}</span>
                  <button onClick={copyLink} className="text-[#7C3AED] hover:text-[#6d28d9] flex-shrink-0" title="Copier le lien">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <Link href={soloUrl} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-[#7C3AED] hover:underline mt-2">
                  Ouvrir l&apos;aperçu élève <ArrowLeft className="w-3.5 h-3.5 rotate-[135deg]" />
                </Link>
              </div>
              <div className="bg-white p-2 rounded-xl border border-gray-100">
                <QRCodeSVG value={soloUrl} size={104} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classement solo */}
      {soloResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold font-heading text-gray-900">Classement</h2>
            <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Users className="w-3.5 h-3.5" />{soloResults.length}</span>
          </div>
          <div className="divide-y divide-[#f0ebe3]">
            {soloResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-3 text-sm">
                  <span className={`w-6 text-center font-bold ${i === 0 ? 'text-amber-500' : i < 3 ? 'text-gray-500' : 'text-gray-300'}`}>{i + 1}</span>
                  <span className="text-gray-800 font-medium">{r.pseudo}</span>
                  <span className="text-xs text-gray-400">{r.correct_count}/{r.total_questions}</span>
                </span>
                <span className="font-bold text-[#7C3AED]">{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aperçu des questions */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#7C3AED]" />
        <h2 className="font-semibold text-gray-800">Aperçu des questions</h2>
      </div>
      <div className="space-y-3">
        {kahoot.questions.map((q, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#f0ebe3] p-5">
            <p className="font-medium text-gray-900 mb-3">
              <span className="text-[#7C3AED] font-bold mr-2">{i + 1}.</span>{q.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, j) => {
                const correct = j === q.reponse_correcte
                return (
                  <div key={j} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${correct ? 'bg-green-50 text-green-700 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                    {correct ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <span className="w-4 text-gray-300">{String.fromCharCode(65 + j)}</span>}
                    {opt}
                  </div>
                )
              })}
            </div>
            {q.explication && <p className="text-xs text-gray-400 mt-2.5">{q.explication}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
