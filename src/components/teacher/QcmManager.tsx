'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Loader2, Lock, Unlock, Copy, Check, Send, Users,
  Trophy, Clock, ListChecks, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { QcmDevoir, QcmSession, Question } from '@/types/teacher'

interface Props {
  devoir: QcmDevoir
  initialSessions: QcmSession[]
  baseUrl: string
}

export function QcmManager({ devoir: initial, initialSessions, baseUrl }: Props) {
  const supabase = createClient()
  const [devoir, setDevoir] = useState(initial)
  const [sessions, setSessions] = useState<QcmSession[]>(initialSessions)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const appUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  const lien = `${appUrl}/devoir/${devoir.link_token}`

  // Realtime — génération du QCM + sessions élèves
  useEffect(() => {
    const channel = supabase
      .channel(`qcm-${devoir.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'qcm_devoirs', filter: `id=eq.${devoir.id}` },
        (payload) => setDevoir((prev) => ({ ...prev, ...(payload.new as QcmDevoir) }))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qcm_sessions', filter: `devoir_id=eq.${devoir.id}` },
        async () => {
          const { data } = await supabase
            .from('qcm_sessions')
            .select('*')
            .eq('devoir_id', devoir.id)
            .order('score', { ascending: false })
          if (data) setSessions(data as QcmSession[])
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [devoir.id, supabase])

  const copyLink = () => {
    navigator.clipboard.writeText(`${lien}\nCode : ${devoir.access_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const publish = async () => {
    setBusy(true)
    const res = await fetch(`/api/qcm/devoirs/${devoir.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_locked: false }),
    })
    if (res.ok) setDevoir((p) => ({ ...p, status: 'active' }))
    setBusy(false)
  }

  const toggleLock = async () => {
    setBusy(true)
    const res = await fetch(`/api/qcm/devoirs/${devoir.id}/toggle-lock`, { method: 'PUT' })
    const data = await res.json()
    if (res.ok) setDevoir((p) => ({ ...p, is_locked: data.is_locked }))
    setBusy(false)
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `📝 Devoir : ${devoir.titre}\n⏱️ Durée : ${devoir.duree_minutes} min\n\n🔗 ${lien}\n🔑 Code classe : ${devoir.access_code}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  // Stats classe
  const corrected = sessions.filter((s) => s.status === 'corrected')
  const moyenne =
    corrected.length > 0
      ? (corrected.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / corrected.length).toFixed(1)
      : '—'
  const max = corrected.length > 0 ? Math.max(...corrected.map((s) => Number(s.score) || 0)).toFixed(1) : '—'
  const min = corrected.length > 0 ? Math.min(...corrected.map((s) => Number(s.score) || 0)).toFixed(1) : '—'

  const questions = (devoir.questions as Question[]) ?? []

  // Génération en cours
  if (devoir.generation_status === 'processing' || devoir.generation_status === 'pending') {
    return (
      <div className="max-w-2xl">
        <Link href="/professeur/qcm" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <div className="flex flex-col items-center justify-center py-20 bg-blue-50 rounded-3xl border border-blue-100 text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold font-heading text-gray-900 mb-2">Génération du QCM…</h2>
          <p className="text-gray-500 max-w-sm">
            L'IA analyse votre cours et crée les questions. Cela prend généralement moins d'une minute.
          </p>
        </div>
      </div>
    )
  }

  if (devoir.generation_status === 'error') {
    return (
      <div className="max-w-2xl">
        <Link href="/professeur/qcm" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-600">
          La génération a échoué. Réessayez avec un contenu différent.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <Link href="/professeur/qcm" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">{devoir.titre}</h1>
          <p className="text-gray-500">
            {devoir.matiere} · {devoir.niveau} · {questions.length} questions · {devoir.duree_minutes} min
          </p>
        </div>
        {devoir.status === 'draft' ? (
          <Button onClick={publish} disabled={busy} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Publier le devoir
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-green-600 bg-green-50">
            <Check className="w-4 h-4" />
            Actif
          </span>
        )}
      </div>

      {/* Lien de partage (si publié) */}
      {devoir.status === 'active' && (
        <div className="bg-white rounded-2xl border border-[#f0ebe3] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-800">Lien du devoir</p>
            <button
              onClick={toggleLock}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                devoir.is_locked
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {devoir.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {devoir.is_locked ? 'Verrouillé' : 'Ouvert'}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#fbf8f3] rounded-xl p-3 mb-3">
            <code className="flex-1 text-sm text-gray-600 truncate">{lien}</code>
            <span className="text-sm font-bold text-blue-600 whitespace-nowrap">{devoir.access_code}</span>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyLink} variant="outline" className="flex-1 rounded-xl border-[#e2e8f0]">
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? 'Copié' : 'Copier'}
            </Button>
            <Button onClick={shareWhatsApp} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl">
              <Send className="w-4 h-4 mr-1" />
              Partager WhatsApp
            </Button>
          </div>

          {devoir.is_locked && (
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Les élèves voient le devoir verrouillé. Déverrouillez quand tous l'ont reçu.
            </p>
          )}
        </div>
      )}

      {/* Stats classe */}
      {devoir.status === 'active' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Users, label: 'Rendus', value: corrected.length, color: '#3B82F6' },
            { icon: BarChart3, label: 'Moyenne', value: `${moyenne}/${devoir.note_totale}`, color: '#e97e42' },
            { icon: Trophy, label: 'Max', value: max, color: '#10B981' },
            { icon: Clock, label: 'Min', value: min, color: '#F43F5E' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-[#f0ebe3] p-4">
                <Icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
                <p className="text-xl font-bold font-heading text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Résultats élèves */}
      {devoir.status === 'active' && (
        <div className="bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden mb-6">
          <div className="p-4 border-b border-[#f0ebe3] flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <p className="font-semibold text-gray-800">Résultats des élèves</p>
          </div>
          {sessions.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm">Aucune participation pour le moment.</p>
          ) : (
            <div className="divide-y divide-[#f0ebe3]">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-800">
                      {s.eleve_prenom} {s.eleve_nom}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.status === 'corrected'
                        ? s.mention
                        : s.status === 'in_progress'
                          ? 'En cours…'
                          : 'Correction…'}
                    </p>
                  </div>
                  {s.status === 'corrected' ? (
                    <span className="font-bold text-blue-600">
                      {s.score}/{s.score_sur}
                    </span>
                  ) : (
                    <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aperçu questions */}
      <div className="bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden">
        <div className="p-4 border-b border-[#f0ebe3] flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-gray-400" />
          <p className="font-semibold text-gray-800">Aperçu des {questions.length} questions</p>
        </div>
        <div className="divide-y divide-[#f0ebe3]">
          {questions.map((q) => (
            <div key={q.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 flex-1">
                  <span className="font-semibold">Q{q.id}.</span> {q.enonce}
                </p>
                <span className="text-xs bg-[#fbf8f3] text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {q.type === 'qcm' ? 'QCM' : 'Ouverte'} · {q.points} pt
                </span>
              </div>
              {q.type === 'qcm' && q.options && (
                <ul className="mt-2 space-y-1">
                  {q.options.map((opt) => (
                    <li
                      key={opt.lettre}
                      className={`text-xs flex items-center gap-2 ${
                        opt.lettre === q.reponse_correcte ? 'text-green-600 font-medium' : 'text-gray-500'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#fbf8f3] flex items-center justify-center text-[10px]">
                        {opt.lettre}
                      </span>
                      {opt.texte}
                      {opt.lettre === q.reponse_correcte && <Check className="w-3 h-3" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
