'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Loader2, CheckCircle, AlertTriangle, Send, Check,
  ChevronDown, ChevronUp, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CorrectionJob, CorrectionSession, CorrectionResult } from '@/types/teacher'

interface Props {
  session: CorrectionSession
  initialJobs: CorrectionJob[]
}

export function CorrectionReview({ session, initialJobs }: Props) {
  const supabase = createClient()
  const [jobs, setJobs] = useState<CorrectionJob[]>(initialJobs)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Supabase Realtime — suivi des jobs en direct
  useEffect(() => {
    const channel = supabase
      .channel(`correction-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'correction_jobs',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          setJobs((prev) =>
            prev.map((j) => (j.id === payload.new.id ? { ...j, ...(payload.new as CorrectionJob) } : j))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session.id, supabase])

  const doneCount = jobs.filter((j) => j.status === 'done').length
  const allDone = jobs.length > 0 && jobs.every((j) => j.status === 'done' || j.status === 'error')

  return (
    <div className="max-w-3xl">
      <Link
        href="/professeur/correction"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux sessions
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-gray-900">{session.titre}</h1>
        <p className="text-gray-500">
          {session.matiere} · {session.niveau} · {jobs.length} copie{jobs.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Barre de progression globale */}
      {!allDone && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Correction en cours… {doneCount}/{jobs.length} copies traitées
            </p>
            <div className="h-1.5 bg-blue-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${(doneCount / jobs.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Liste des copies */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <CopieCard
            key={job.id}
            job={job}
            expanded={expanded === job.id}
            onToggle={() => setExpanded(expanded === job.id ? null : job.id)}
            onUpdate={(updated) =>
              setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
            }
          />
        ))}
      </div>
    </div>
  )
}

function CopieCard({
  job,
  expanded,
  onToggle,
  onUpdate,
}: {
  job: CorrectionJob
  expanded: boolean
  onToggle: () => void
  onUpdate: (j: CorrectionJob) => void
}) {
  const [sending, setSending] = useState(false)
  const [validating, setValidating] = useState(false)
  const result = job.result_json as CorrectionResult | null
  const hasResult = job.status === 'done' && result && 'note_obtenue' in result

  const validate = async () => {
    setValidating(true)
    await fetch(`/api/correction/jobs/${job.id}/validate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_finale: job.note_finale }),
    })
    onUpdate({ ...job, validated: true })
    setValidating(false)
  }

  const send = async () => {
    setSending(true)
    const res = await fetch(`/api/correction/jobs/${job.id}/send`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      onUpdate({ ...job, sent_at: new Date().toISOString() })
    } else {
      alert(data.error || 'Erreur envoi')
    }
    setSending(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden">
      {/* En-tête copie */}
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          {job.status === 'processing' || job.status === 'pending' ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
          ) : job.status === 'error' ? (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          ) : job.sent_at ? (
            <Send className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : job.validated ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-[#e97e42] flex-shrink-0" />
          )}
          <div>
            <p className="font-semibold text-gray-900">
              {job.eleve_prenom} {job.eleve_nom}
            </p>
            <p className="text-xs text-gray-500">
              {job.status === 'processing' && `Traitement… ${job.progress}%`}
              {job.status === 'pending' && 'En attente'}
              {job.status === 'error' && (job.error_message || 'Erreur')}
              {hasResult && `Note : ${result!.note_obtenue}/${result!.note_sur} — ${result!.mention}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result?.necessite_validation_manuelle && (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
          {hasResult && (expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
        </div>
      </button>

      {/* Détail correction */}
      {expanded && hasResult && (
        <div className="border-t border-[#f0ebe3] p-4 space-y-4">
          {result!.necessite_validation_manuelle && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Vérification recommandée (lecture OCR incertaine sur certaines questions).
              </span>
            </div>
          )}

          {/* Appréciation */}
          <div className="bg-[#fbf8f3] rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Appréciation</p>
            <p className="text-sm text-gray-700">{result!.appreciation_generale}</p>
          </div>

          {/* Questions */}
          <div className="space-y-2">
            {result!.questions.map((q) => (
              <div
                key={q.numero}
                className="flex items-start justify-between gap-3 text-sm border-b border-[#f0ebe3] pb-2 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-700">
                    Q{q.numero}
                    {q.lecture_incertaine && (
                      <span className="ml-2 text-xs text-amber-600">(lecture incertaine)</span>
                    )}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{q.commentaire}</p>
                </div>
                <span
                  className={`font-semibold whitespace-nowrap ${
                    q.statut === 'correct'
                      ? 'text-green-600'
                      : q.statut === 'partiel'
                        ? 'text-amber-600'
                        : 'text-red-500'
                  }`}
                >
                  {q.points_obtenus}/{q.points_max}
                </span>
              </div>
            ))}
          </div>

          {/* Note finale */}
          <div className="flex items-center justify-between bg-[#fff7ed] rounded-xl p-3">
            <span className="font-semibold text-gray-700">Note finale</span>
            <span className="text-xl font-bold font-heading text-[#e97e42]">
              {result!.note_obtenue}/{result!.note_sur}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!job.validated ? (
              <Button
                onClick={validate}
                disabled={validating}
                className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl"
              >
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Valider le rapport
              </Button>
            ) : job.sent_at ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-green-600 text-sm font-medium py-2">
                <Send className="w-4 h-4" />
                Envoyé à l'élève
              </div>
            ) : (
              <Button
                onClick={send}
                disabled={sending}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Envoyer (WhatsApp + lien)
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
