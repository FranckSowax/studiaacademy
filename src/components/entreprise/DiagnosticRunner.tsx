'use client'

import { useState } from 'react'
import { BarChart3, Loader2, ArrowRight, CheckCircle, Clock, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NIVEAU_LABELS } from '@/lib/entreprise/scoring'
import { DOMAINES } from '@/lib/entreprise/competences'
import type { PublicQuestion, DomainScore } from '@/types/entreprise'

const domLabel = (slug: string) => DOMAINES.find((d) => d.slug === slug)?.libelle ?? slug
const niveauColor = (n: string) => n === 'expert' ? '#16a34a' : n === 'avance' ? '#22c55e' : n === 'intermediaire' ? '#f59e0b' : '#e11d48'

export function DiagnosticRunner({
  token, titre, description, dureeMinutes, nbDomaines, closed,
}: {
  token: string
  titre: string
  description: string | null
  dureeMinutes: number
  nbDomaines: number
  closed: boolean
}) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro')
  const [identity, setIdentity] = useState({ prenom: '', departement: '', poste: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [respondentToken, setRespondentToken] = useState('')
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ score_global: number; score_sur: number; scores_domaines: Record<string, DomainScore> } | null>(null)

  const start = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/diagnostic/${token}/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identity),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setQuestions(data.questions ?? [])
      setRespondentToken(data.respondentToken)
      setPhase('play')
    } finally { setLoading(false) }
  }

  const q = questions[idx]
  const choose = (i: number) => {
    setAnswers((a) => ({ ...a, [q.id]: i }))
    setTimeout(() => {
      if (idx < questions.length - 1) setIdx(idx + 1)
      else submit({ ...answers, [q.id]: i })
    }, 180)
  }

  const submit = async (final: Record<string, number>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/diagnostic/${token}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondentToken, reponses: final }),
      })
      const data = await res.json()
      if (data.success) { setResult(data); setPhase('done') }
      else setError(data.error || 'Erreur')
    } finally { setLoading(false) }
  }

  if (closed) {
    return (
      <div className="min-h-dvh kahoot-gradient text-white flex items-center justify-center p-6 text-center">
        <div><Clock className="w-12 h-12 mx-auto mb-3" /><h1 className="text-2xl font-bold font-heading">Ce test est clôturé</h1><p className="text-white/70 mt-2">Merci de votre intérêt.</p></div>
      </div>
    )
  }

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#2e1065] to-[#7C3AED] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3"><BarChart3 className="w-8 h-8" /></div>
            <h1 className="text-2xl font-extrabold font-heading">{titre}</h1>
            {description && <p className="text-white/75 text-sm mt-2">{description}</p>}
            <p className="text-white/60 text-sm mt-3 inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" />~{dureeMinutes} min</span>
              <span className="inline-flex items-center gap-1"><Building2 className="w-4 h-4" />{nbDomaines} domaines</span>
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 text-gray-900 shadow-2xl space-y-3">
            <p className="text-sm text-gray-500">Quelques infos (facultatif, anonyme dans le rapport) :</p>
            <Input placeholder="Prénom" value={identity.prenom} onChange={(e) => setIdentity({ ...identity, prenom: e.target.value })} className="rounded-xl" />
            <Input placeholder="Département / service" value={identity.departement} onChange={(e) => setIdentity({ ...identity, departement: e.target.value })} className="rounded-xl" />
            <Input placeholder="Poste" value={identity.poste} onChange={(e) => setIdentity({ ...identity, poste: e.target.value })} className="rounded-xl" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={start} disabled={loading} className="w-full bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl py-6 text-base font-bold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Commencer le test <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── DONE ──
  if (phase === 'done' && result) {
    const pct = result.score_sur > 0 ? Math.round((result.score_global / result.score_sur) * 100) : 0
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#2e1065] to-[#7C3AED] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="w-14 h-14 mx-auto mb-3 text-green-300" />
          <h1 className="text-2xl font-extrabold font-heading mb-1">Merci {identity.prenom || ''} !</h1>
          <p className="text-white/70 mb-5">Votre test est enregistré. Voici votre profil :</p>
          <div className="bg-white/10 rounded-2xl p-5 mb-4">
            <p className="text-5xl font-extrabold mb-1">{pct}%</p>
            <p className="text-white/70 text-sm">score global</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-left space-y-2.5">
            {Object.entries(result.scores_domaines).map(([dom, s]) => (
              <div key={dom}>
                <div className="flex justify-between text-sm mb-1 text-gray-700"><span>{domLabel(dom)}</span><span className="font-semibold" style={{ color: niveauColor(s.niveau) }}>{NIVEAU_LABELS[s.niveau]}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: niveauColor(s.niveau) }} /></div>
              </div>
            ))}
          </div>
          <p className="text-white/50 text-xs mt-5">Vos résultats individuels restent confidentiels. Seule une synthèse agrégée est transmise à votre entreprise.</p>
        </div>
      </div>
    )
  }

  // ── PLAY ──
  return (
    <div className="min-h-dvh bg-slate-900 text-white flex flex-col">
      <div className="h-1.5 bg-white/10">
        <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#e97e42] transition-all duration-300" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="px-5 py-3 text-sm text-white/60 flex justify-between">
        <span>Question {idx + 1}/{questions.length}</span>
        <span>{domLabel(q?.domaine ?? '')}</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <h2 className="text-xl sm:text-2xl font-bold font-heading text-center max-w-2xl">{q?.enonce}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-8 max-w-3xl mx-auto w-full">
        {q?.options.map((opt, i) => (
          <button key={i} disabled={loading} onClick={() => choose(i)}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-left font-medium border-2 transition-all ${answers[q.id] === i ? 'border-[#7C3AED] bg-[#7C3AED]/20' : 'border-white/15 bg-white/5 hover:border-[#7C3AED]/50'}`}>
            <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold flex-shrink-0">{String.fromCharCode(65 + i)}</span>
            <span className="flex-1">{opt}</span>
          </button>
        ))}
      </div>
      {loading && <div className="text-center pb-6 text-white/60 text-sm inline-flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" />Enregistrement…</div>}
    </div>
  )
}
