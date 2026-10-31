'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REQUEST_STATUS_LABELS, type RequestStatus } from '@/lib/inbox/request-rules'
import type { CustomerRequestView } from '@/lib/inbox/requests'
import { RequestCard } from './RequestPanel'

const POLL_MS = 30_000
type Scope = 'open' | 'all'

/** Suivi d'équipe des recherches clients, les plus récemment modifiées en tête. */
export function RequestsBoard() {
  const [scope, setScope] = useState<Scope>('open')
  const [items, setItems] = useState<CustomerRequestView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/inbox/requests?scope=${scope}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Lecture impossible')
      setItems(data.items)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lecture impossible')
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => {
    setLoading(true)
    void load()
    const timer = setInterval(() => {
      if (!document.hidden) void load()
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  const counts = items.reduce<Partial<Record<RequestStatus, number>>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b bg-white px-4 py-2 dark:bg-slate-900">
        <Link href="/messagerie" className="text-slate-500 hover:text-slate-900" aria-label="Retour à la messagerie">
          <ArrowLeft className="size-5" />
        </Link>
        <ClipboardList className="size-5 text-emerald-600" />
        <h1 className="font-semibold">Recherches clients</h1>
        <div className="ml-auto flex gap-1 text-xs">
          {(['open', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={cn('rounded px-2 py-1', scope === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800')}
            >
              {s === 'open' ? 'En cours' : 'Toutes'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap gap-3 border-b bg-white px-4 py-1.5 text-xs text-slate-600 dark:bg-slate-900">
        {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[])
          .filter((s) => counts[s])
          .map((s) => (
            <span key={s}>
              {REQUEST_STATUS_LABELS[s]} <strong>{counts[s]}</strong>
            </span>
          ))}
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {loading ? (
          <Loader2 className="mx-auto mt-10 size-6 animate-spin text-slate-400" />
        ) : items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">
            Aucune recherche {scope === 'open' ? 'en cours' : ''}. Notez-en une depuis une conversation (bouton « Recherche client »).
          </p>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2">
            {items.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                showContact
                onChange={(updated) => setItems((list) => list.map((x) => (x.id === updated.id ? updated : x)))}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
