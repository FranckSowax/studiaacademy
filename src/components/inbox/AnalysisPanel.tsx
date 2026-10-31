'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ABANDON_RISKS,
  INTENTS,
  NEXT_ACTIONS,
  OBJECTIONS,
  PURCHASE_STAGES,
  SENTIMENTS,
  URGENCIES,
  type ConversationAnalysis,
  type NextAction,
} from '@/lib/inbox/analysis'

interface LatestAnalysis {
  analysis: ConversationAnalysis
  modelStage: string | null
  factStage: string | null
  finalStage: string | null
  model: string
  costAmount: number | null
  costCurrency: string | null
  createdAt: string
}

const stageLabel = (s: string | null) => (s && s in PURCHASE_STAGES ? PURCHASE_STAGES[s as keyof typeof PURCHASE_STAGES] : '—')

interface AnalysisPanelProps {
  conversationId: string
  onAction: (action: NextAction) => void
}

export function AnalysisPanel({ conversationId, onAction }: AnalysisPanelProps) {
  const [latest, setLatest] = useState<LatestAnalysis | null | undefined>(undefined)
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/inbox/conversations/${conversationId}/analysis`)
    const d = await res.json()
    setLatest(res.ok ? d.latest : null)
  }, [conversationId])

  useEffect(() => {
    void load()
  }, [load])

  const reanalyze = async () => {
    setRunning(true)
    setNotice(null)
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/analysis`, { method: 'POST' })
      const d = await res.json()
      if (d.ok) setLatest(d.latest)
      else setNotice(`Analyse non effectuée : ${d.reason ?? d.error ?? 'erreur'}`)
    } finally {
      setRunning(false)
    }
  }

  if (latest === undefined) return <Loader2 className="size-4 animate-spin text-slate-400" />

  const header = (
    <div className="flex items-center justify-between">
      <p className="text-[11px] text-slate-500">
        {latest
          ? `Analysé le ${new Date(latest.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · ${latest.model} · ${
              latest.costAmount === null ? 'coût inconnu' : `${latest.costAmount} ${latest.costCurrency ?? ''}`
            }`
          : 'Pas encore analysée. L’analyse automatique se fait après 2 messages du client et 30 min de calme.'}
      </p>
      <Button size="sm" variant="outline" onClick={reanalyze} disabled={running}>
        {running ? <Loader2 className="animate-spin" /> : <RefreshCw />} {latest ? 'Ré-analyser' : 'Analyser'}
      </Button>
    </div>
  )

  if (!latest) {
    return (
      <div className="space-y-2 text-sm">
        {header}
        {notice && <p className="text-xs text-amber-700">{notice}</p>}
      </div>
    )
  }

  const a = latest.analysis
  const stageDiffers = latest.factStage && latest.modelStage !== latest.finalStage
  const action = a.next_best_action

  return (
    <div className="space-y-3 text-sm">
      {header}
      {notice && <p className="text-xs text-amber-700">{notice}</p>}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded border bg-white p-2 dark:bg-slate-900">
          <p className="text-[11px] text-slate-500">Stade d’achat</p>
          <p className="font-semibold">{stageLabel(latest.finalStage)}</p>
          {stageDiffers && (
            <p className="mt-0.5 text-[10px] text-slate-500">
              Modèle : {stageLabel(latest.modelStage)} · Faits : {stageLabel(latest.factStage)}
            </p>
          )}
        </div>
        <div className="rounded border bg-white p-2 dark:bg-slate-900">
          <p className="text-[11px] text-slate-500">Intention d’achat</p>
          <p className="font-semibold">{a.intent_score}/100</p>
          <div className="mt-1 h-1.5 rounded bg-slate-200">
            <div
              className={cn('h-1.5 rounded', a.intent_score >= 70 ? 'bg-orange-500' : a.intent_score >= 40 ? 'bg-amber-400' : 'bg-slate-400')}
              style={{ width: `${a.intent_score}%` }}
            />
          </div>
        </div>
        <div className="rounded border bg-white p-2 dark:bg-slate-900">
          <p className="text-[11px] text-slate-500">Risque d’abandon</p>
          <p className={cn('font-semibold', a.abandon_risk === 'high' && 'text-red-600')}>{ABANDON_RISKS[a.abandon_risk]}</p>
        </div>
        <div className="rounded border bg-white p-2 dark:bg-slate-900">
          <p className="text-[11px] text-slate-500">Demande · ton</p>
          <p className="font-semibold">{INTENTS[a.intent]}</p>
          <p className="text-[10px] text-slate-500">
            {SENTIMENTS[a.sentiment]} · urgence {URGENCIES[a.urgency].toLowerCase()}
          </p>
        </div>
      </div>

      {a.need_summary && (
        <p>
          <span className="font-semibold">Besoin : </span>
          {a.need_summary}
        </p>
      )}
      {a.objections.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs font-semibold">Objections :</span>
          {a.objections.map((o) => (
            <span key={o} className="rounded bg-red-50 px-1.5 text-xs text-red-800">
              {OBJECTIONS[o]}
            </span>
          ))}
        </div>
      )}
      {a.open_questions.length > 0 && (
        <div>
          <p className="text-xs font-semibold">Questions sans réponse :</p>
          <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300">
            {a.open_questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Une analyse qui ne débouche sur aucun bouton ne sert à rien. */}
      <div className="flex flex-wrap items-center gap-2 rounded border border-emerald-300 bg-emerald-50 p-2 dark:border-emerald-900 dark:bg-emerald-950">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Prochaine action : {NEXT_ACTIONS[action]}</p>
          {a.next_action_detail && <p className="text-xs text-emerald-800 dark:text-emerald-300">{a.next_action_detail}</p>}
        </div>
        {action !== 'none' && (
          <Button size="sm" onClick={() => onAction(action)}>
            Faire <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  )
}
