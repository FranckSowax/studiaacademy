'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Clock, Lock, ArrowRight, ArrowLeft, Loader2, Send, CheckCircle, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { QuestionType } from '@/types/teacher'

interface PublicQuestion {
  id: number
  type: QuestionType
  enonce: string
  points: number
  options?: { lettre: string; texte: string }[]
  longueur_attendue?: string
}

interface Props {
  linkToken: string
  titre: string
  matiere: string
  niveau: string
  dureeMinutes: number
  noteTotale: number
  isLocked: boolean
  questions: PublicQuestion[]
}

type Phase = 'accueil' | 'verrouille' | 'quiz' | 'soumission'

export function QcmStudentApp(props: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>(props.isLocked ? 'verrouille' : 'accueil')
  const [identite, setIdentite] = useState({ prenom: '', nom: '', email: '', parent_phone: '', code: '' })
  const [sessionId, setSessionId] = useState<string>('')
  const [reportToken, setReportToken] = useState<string>('')
  const [reponses, setReponses] = useState<Record<number, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(props.dureeMinutes * 60)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const startTimeRef = useRef<number>(0)

  // ── Soumission ──
  const submit = useCallback(async () => {
    if (phase === 'soumission') return
    setPhase('soumission')
    const dureeReelle = Math.round((Date.now() - startTimeRef.current) / 1000)

    const reponsesPayload = props.questions.map((q) => ({
      question_id: q.id,
      type_question: q.type,
      reponse_donnee: reponses[q.id] ?? '',
    }))

    try {
      const res = await fetch(`/api/qcm/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duree_reelle_secondes: dureeReelle, reponses: reponsesPayload }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/devoir/${props.linkToken}/resultats/${reportToken || data.report_token}`)
      } else {
        setError(data.error || 'Erreur lors de la soumission')
      }
    } catch {
      setError('Erreur réseau lors de la soumission')
    }
  }, [phase, props.questions, props.linkToken, reponses, sessionId, reportToken, router])

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'quiz') return
    if (timeLeft <= 0) {
      submit()
      return
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timer)
  }, [phase, timeLeft, submit])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ── Démarrage ──
  const start = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/qcm/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_token: props.linkToken,
          access_code: identite.code,
          eleve_nom: identite.nom,
          eleve_prenom: identite.prenom,
          eleve_email: identite.email || undefined,
          parent_phone: identite.parent_phone || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 423) setPhase('verrouille')
        setError(data.error || 'Erreur')
        setLoading(false)
        return
      }
      setSessionId(data.session_id)
      setReportToken(data.report_token)
      startTimeRef.current = Date.now()
      setPhase('quiz')
    } catch {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  const answeredCount = Object.keys(reponses).filter((k) => reponses[Number(k)]?.trim()).length

  // ── PHASE VERROUILLÉ ──
  if (phase === 'verrouille') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f3] px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold font-heading text-gray-900 mb-2">Devoir verrouillé</h1>
          <p className="text-gray-500 mb-6">
            Le professeur n'a pas encore ouvert l'accès. Patientez, la page se rafraîchira.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  // ── PHASE ACCUEIL ──
  if (phase === 'accueil') {
    const canStart = identite.prenom && identite.nom && identite.code
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f3] px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#f0ebe3] p-8">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Image src="/logo.png" alt="Studia" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-bold font-heading text-gray-800">
              Studia <span className="text-[#e97e42] font-light">Academy</span>
            </span>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-heading text-gray-900 mb-1">{props.titre}</h1>
            <p className="text-gray-500 text-sm">
              {props.matiere} · {props.niveau}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6 text-sm">
            <span className="inline-flex items-center gap-1.5 bg-[#fff7ed] text-[#a84d16] px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              {props.dureeMinutes} min
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">
              {props.questions.length} questions
            </span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Prénom *</Label>
                <Input
                  value={identite.prenom}
                  onChange={(e) => setIdentite({ ...identite, prenom: e.target.value })}
                  className="rounded-xl border-[#e2e8f0]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Nom *</Label>
                <Input
                  value={identite.nom}
                  onChange={(e) => setIdentite({ ...identite, nom: e.target.value })}
                  className="rounded-xl border-[#e2e8f0]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Code classe *</Label>
              <Input
                placeholder="Ex: MATHS-7A3"
                value={identite.code}
                onChange={(e) => setIdentite({ ...identite, code: e.target.value.toUpperCase() })}
                className="rounded-xl border-[#e2e8f0] font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">WhatsApp parent (optionnel)</Label>
              <Input
                placeholder="+241…"
                value={identite.parent_phone}
                onChange={(e) => setIdentite({ ...identite, parent_phone: e.target.value })}
                className="rounded-xl border-[#e2e8f0]"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          )}

          <Button
            onClick={start}
            disabled={!canStart || loading}
            className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Commencer le devoir <ArrowRight className="w-4 h-4 ml-1" /></>}
          </Button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Le chronomètre démarre dès que vous cliquez.
          </p>
        </div>
      </div>
    )
  }

  // ── PHASE SOUMISSION ──
  if (phase === 'soumission') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f3] px-4">
        <div className="text-center">
          {error ? (
            <>
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-500">{error}</p>
            </>
          ) : (
            <>
              <Loader2 className="w-12 h-12 text-[#e97e42] animate-spin mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Correction en cours…</p>
              <p className="text-gray-400 text-sm mt-1">Votre note arrive dans un instant.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── PHASE QUIZ ──
  const q = props.questions[currentQ]
  const urgent = timeLeft < 60

  return (
    <div className="min-h-screen bg-[#fbf8f3]">
      {/* Barre timer sticky */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#f0ebe3] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Studia" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-gray-700 hidden sm:inline">{props.titre}</span>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold font-mono ${
              urgent ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-[#fff7ed] text-[#a84d16]'
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
        {/* Progression */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] transition-all"
              style={{ width: `${((currentQ + 1) / props.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-400">
            Question {currentQ + 1} / {props.questions.length}
          </span>
          <span className="text-xs bg-white border border-[#f0ebe3] text-gray-500 px-2.5 py-1 rounded-full">
            {q.points} point{q.points > 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">{q.enonce}</h2>

          {q.type === 'qcm' && q.options ? (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <button
                  key={opt.lettre}
                  onClick={() => setReponses({ ...reponses, [q.id]: opt.lettre })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    reponses[q.id] === opt.lettre
                      ? 'border-[#e97e42] bg-[#fff7ed]'
                      : 'border-[#f0ebe3] hover:border-[#e97e42]/40'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                      reponses[q.id] === opt.lettre ? 'bg-[#e97e42] text-white' : 'bg-[#fbf8f3] text-gray-500'
                    }`}
                  >
                    {opt.lettre}
                  </span>
                  <span className="text-sm text-gray-700">{opt.texte}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <Textarea
                placeholder="Votre réponse…"
                value={reponses[q.id] ?? ''}
                onChange={(e) => setReponses({ ...reponses, [q.id]: e.target.value })}
                rows={q.type === 'texte_long' ? 8 : 4}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42] resize-none"
              />
              {q.longueur_attendue && (
                <p className="text-xs text-gray-400 mt-2">Attendu : {q.longueur_attendue}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation questions */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
            disabled={currentQ === 0}
            className="rounded-xl border-[#e2e8f0]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Précédent
          </Button>

          {currentQ < props.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQ((c) => Math.min(props.questions.length - 1, c + 1))}
              className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
            >
              <Send className="w-4 h-4 mr-1" />
              Terminer ({answeredCount}/{props.questions.length})
            </Button>
          )}
        </div>

        {/* Pastilles questions */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {props.questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                i === currentQ
                  ? 'bg-[#e97e42] text-white'
                  : reponses[qq.id]?.trim()
                    ? 'bg-[#fff7ed] text-[#a84d16] border border-[#e97e42]/30'
                    : 'bg-white text-gray-400 border border-[#f0ebe3]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
