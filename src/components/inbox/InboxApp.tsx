'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Loader2, MessageCircle, Pin, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  FILTER_LABELS,
  HOT_INTENT_THRESHOLD,
  INBOX_FILTERS,
  formatRelativeTime,
  initials,
  type InboxFilter,
} from '@/lib/inbox/list'
import type { ConversationListItem, InboxCounts } from '@/lib/inbox/dto'
import { InboxThread, StatusTicks } from './InboxThread'

const LIST_POLL_MS = 10_000
const SEARCH_DEBOUNCE_MS = 300

interface InboxAppProps {
  brandName: string
  isAdmin: boolean
}

export function InboxApp({ brandName, isAdmin }: InboxAppProps) {
  const [filter, setFilter] = useState<InboxFilter>('to_reply')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [items, setItems] = useState<ConversationListItem[]>([])
  const [counts, setCounts] = useState<InboxCounts | null>(null)
  const [me, setMe] = useState<{ id: string; name: string } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  const loadList = useCallback(async () => {
    try {
      // WHY: POST — la recherche peut contenir un numéro ou un nom, jamais dans une URL.
      const res = await fetch('/api/inbox/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter, q: debouncedQuery }),
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Lecture impossible')
      setItems(data.items)
      setCounts(data.counts)
      setMe(data.me)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lecture impossible')
    } finally {
      setLoading(false)
    }
  }, [filter, debouncedQuery])

  useEffect(() => {
    setLoading(true)
    void loadList()
    const timer = setInterval(() => {
      if (!document.hidden) void loadList()
    }, LIST_POLL_MS)
    return () => clearInterval(timer)
  }, [loadList])

  return (
    <div className="flex h-full flex-col">
      {/* En-tête : compteurs d'équipe */}
      <header className="flex items-center gap-3 border-b bg-white px-4 py-2 dark:bg-slate-900">
        <MessageCircle className="size-5 text-emerald-600" />
        <h1 className="font-semibold">Messagerie</h1>
        <span className="hidden text-xs text-slate-500 sm:inline">{brandName}</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span title="Conversations en attente de réponse">
            À répondre <strong className="text-red-600">{counts?.toReply ?? '…'}</strong>
          </span>
          <span title="Conversations qui vous sont attribuées">
            À vous <strong>{counts?.mine ?? '…'}</strong>
          </span>
          <span title="Vos épingles (personnelles)">
            📌 <strong>{counts?.pinned ?? '…'}</strong>
          </span>
          {isAdmin && (
            <Link href="/admin" className="hidden items-center gap-1 text-slate-500 hover:text-slate-900 sm:flex">
              <LayoutDashboard className="size-4" /> Admin
            </Link>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Volet gauche — conversations */}
        <aside
          className={cn(
            'flex w-full flex-col border-r bg-white dark:bg-slate-900 md:w-[360px] lg:w-[400px]',
            selectedId ? 'hidden md:flex' : 'flex',
          )}
        >
          <div className="space-y-2 border-b p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom, numéro ou extrait de message"
                className="pl-8"
                aria-label="Rechercher une conversation"
              />
            </div>
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtres">
              {INBOX_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    filter === f
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200',
                  )}
                >
                  {FILTER_LABELS[f]}
                  {f === 'to_reply' && counts ? ` (${counts.toReply})` : ''}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {loading && items.length === 0 && (
              <li className="flex justify-center p-6 text-slate-400">
                <Loader2 className="size-5 animate-spin" />
              </li>
            )}
            {!loading && items.length === 0 && !error && (
              <li className="p-6 text-center text-sm text-slate-500">Aucune conversation ici.</li>
            )}
            {items.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800',
                    selectedId === c.id && 'bg-emerald-50 dark:bg-emerald-950',
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                    {initials(c.name, c.phoneDisplay)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1">
                      <span className={cn('truncate text-sm', c.unread > 0 ? 'font-bold' : 'font-medium')}>
                        {c.name ?? (c.phoneDisplay || 'Contact WhatsApp')}
                      </span>
                      {c.pinned && <Pin className="size-3 shrink-0 text-slate-400" aria-label="Épinglée" />}
                      <span className="ml-auto shrink-0 text-[11px] text-slate-500">{formatRelativeTime(c.lastMessageAt)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1">
                      {c.status === 'replied' && <StatusTicks status={c.lastOutboundStatus} className="size-3.5" />}
                      <span className="truncate text-xs text-slate-600 dark:text-slate-300">{c.preview ?? ''}</span>
                      {c.unread > 0 && (
                        <span className="ml-auto shrink-0 rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white">
                          {c.unread}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1">
                      {c.assignedTo && (
                        <span
                          className={cn(
                            'rounded px-1.5 text-[10px] font-medium',
                            c.mine ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {c.mine ? 'Moi' : c.assignedName}
                        </span>
                      )}
                      {c.intent !== null && c.intent >= HOT_INTENT_THRESHOLD && (
                        <span className="rounded bg-orange-100 px-1.5 text-[10px] font-medium text-orange-800">🔥 {c.intent}</span>
                      )}
                      {c.status === 'closed' && (
                        <span className="rounded bg-slate-100 px-1.5 text-[10px] text-slate-500">Terminée</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Volet droit — le fil */}
        <main className={cn('min-w-0 flex-1', selectedId ? 'block' : 'hidden md:block')}>
          {selectedId && me ? (
            <InboxThread
              conversationId={selectedId}
              meId={me.id}
              onChanged={loadList}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
              <MessageCircle className="size-10 text-slate-300" />
              <p className="text-sm">Choisissez une conversation.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
