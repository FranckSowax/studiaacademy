'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ExternalLink, ImageIcon, Loader2, MessageSquarePlus, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/inbox/list'
import {
  MAX_REQUEST_PHOTOS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  type RequestStatus,
} from '@/lib/inbox/request-rules'
import type { CustomerRequestView } from '@/lib/inbox/requests'

/** Image du fil proposée comme photo de recherche (référence opaque du message). */
export interface ThreadImage {
  ref: string
  url: string
  fromMe: boolean
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  todo: 'bg-amber-100 text-amber-800',
  searching: 'bg-sky-100 text-sky-800',
  proposed: 'bg-violet-100 text-violet-800',
  done: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-600',
}

async function callJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, { ...init, cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Opération impossible')
  return data as Record<string, unknown>
}

/** Panneau « Recherche » d'une conversation : noter un besoin hors catalogue et le suivre. */
export function RequestPanel({ conversationId, threadImages }: { conversationId: string; threadImages: ThreadImage[] }) {
  const [items, setItems] = useState<CustomerRequestView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await callJson(`/api/inbox/requests?conversation=${conversationId}`, {})
      const list = data.items as CustomerRequestView[]
      setItems(list)
      // Aucune recherche encore : on ouvre directement le formulaire.
      setCreating(list.length === 0)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lecture impossible')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const create = async () => {
    setSaving(true)
    try {
      const data = await callJson('/api/inbox/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, text: draft, message_refs: picked }),
      })
      setItems((list) => [data.request as CustomerRequestView, ...list])
      setDraft('')
      setPicked([])
      setCreating(false)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  const replace = (updated: CustomerRequestView) =>
    setItems((list) => list.map((r) => (r.id === updated.id ? updated : r)))

  if (loading) return <Loader2 className="mx-auto size-5 animate-spin text-slate-400" />

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2">
        {!creating && (
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            <Plus /> Nouvelle recherche
          </Button>
        )}
        <Link
          href="/messagerie/recherches"
          target="_blank"
          className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
        >
          Toutes les recherches <ExternalLink className="size-3" />
        </Link>
      </div>

      {error && <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>}

      {creating && (
        <div className="space-y-2 rounded-md border bg-white p-2 dark:bg-slate-900">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Ce que cherche le client : thème, niveau, dates, lieu, budget évoqué…"
            aria-label="Description de la demande"
          />
          <ImagePicker images={threadImages} picked={picked} onChange={setPicked} />
          <div className="flex justify-end gap-2">
            {items.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
                Annuler
              </Button>
            )}
            <Button size="sm" onClick={create} disabled={saving || !draft.trim()}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />} Noter la recherche
            </Button>
          </div>
        </div>
      )}

      {items.map((r) => (
        <RequestCard key={r.id} request={r} threadImages={threadImages} onChange={replace} />
      ))}
    </div>
  )
}

/** Choix de photos du fil (celles du client d'abord), dans la limite donnée. */
function ImagePicker({
  images,
  picked,
  onChange,
  limit = MAX_REQUEST_PHOTOS,
}: {
  images: ThreadImage[]
  picked: string[]
  onChange: (refs: string[]) => void
  limit?: number
}) {
  if (images.length === 0) return <p className="text-xs text-slate-500">Aucune photo dans ce fil.</p>
  const ordered = [...images.filter((i) => !i.fromMe), ...images.filter((i) => i.fromMe)]
  const toggle = (ref: string) =>
    onChange(picked.includes(ref) ? picked.filter((r) => r !== ref) : picked.length < limit ? [...picked, ref] : picked)
  return (
    <div>
      <p className="mb-1 text-xs text-slate-500">
        Photos du fil ({picked.length}/{limit}) — celles du client d’abord
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ordered.map((img) => {
          const on = picked.includes(img.ref)
          return (
            <button
              key={img.ref}
              type="button"
              onClick={() => toggle(img.ref)}
              aria-pressed={on}
              title={img.fromMe ? 'Photo envoyée par l’équipe' : 'Photo du client'}
              className={cn(
                'relative size-14 overflow-hidden rounded border-2',
                on ? 'border-emerald-600' : 'border-transparent opacity-80 hover:opacity-100',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- média privé relayé, pas d'optimisation Next */}
              <img src={img.url} alt="" className="size-full object-cover" loading="lazy" />
              {on && <Check className="absolute right-0.5 top-0.5 size-3.5 rounded-full bg-emerald-600 text-white" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Carte d'une recherche : statut, photos, notes empilées (jamais réécrites),
 * ajout de note, de photos du fil ou téléversées.
 */
export function RequestCard({
  request,
  threadImages,
  onChange,
  showContact = false,
}: {
  request: CustomerRequestView
  threadImages?: ThreadImage[]
  onChange: (updated: CustomerRequestView) => void
  showContact?: boolean
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const room = MAX_REQUEST_PHOTOS - request.photos.length

  const run = async (body: Record<string, unknown> | FormData, path = '') => {
    setBusy(true)
    try {
      const isForm = body instanceof FormData
      const data = await callJson(`/api/inbox/requests/${request.id}${path}`, {
        method: isForm ? 'POST' : 'PATCH',
        headers: isForm ? undefined : { 'Content-Type': 'application/json' },
        body: isForm ? body : JSON.stringify(body),
      })
      onChange(data.request as CustomerRequestView)
      setError(
        typeof data.overflow === 'number' && data.overflow > 0
          ? `${data.overflow} photo(s) non ajoutée(s) : 10 au maximum`
          : null,
      )
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opération impossible')
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="space-y-2 rounded-md border bg-white p-2.5 dark:bg-slate-900">
      <header className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold">{request.ref}</span>
        <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', STATUS_STYLES[request.status])}>
          {request.statusLabel}
        </span>
        {showContact && (
          <Link
            href={`/messagerie?c=${request.conversationId}`}
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            {request.contactName || request.contactPhone || 'Contact WhatsApp'}
          </Link>
        )}
        <select
          value={request.status}
          disabled={busy}
          onChange={(e) => void run({ action: 'status', status: e.target.value })}
          className="ml-auto rounded border bg-transparent px-1 py-0.5 text-xs"
          aria-label={`Statut de la recherche ${request.ref}`}
        >
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REQUEST_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </header>

      {request.photos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {request.photos.map((p) => (
            <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="size-14 overflow-hidden rounded border">
              {/* eslint-disable-next-line @next/next/no-img-element -- média privé relayé, pas d'optimisation Next */}
              <img src={p.url} alt="" className="size-full object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      )}

      <ol className="space-y-1">
        {request.notes.map((n, i) => (
          <li key={`${n.at}-${i}`} className={cn('text-xs', n.text.startsWith('Statut :') && 'text-slate-500 italic')}>
            <span className="font-medium">{n.authorName}</span>
            <span className="text-slate-400"> · {formatRelativeTime(n.at)}</span>
            <p className="whitespace-pre-wrap">{n.text}</p>
          </li>
        ))}
      </ol>

      {error && <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>}

      {picking && threadImages && (
        <div className="space-y-1.5 rounded bg-slate-50 p-2 dark:bg-slate-950">
          <ImagePicker images={threadImages} picked={picked} onChange={setPicked} limit={Math.max(room, 0)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPicking(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={busy || picked.length === 0}
              onClick={async () => {
                if (await run({ action: 'photos', message_refs: picked })) {
                  setPicked([])
                  setPicking(false)
                }
              }}
            >
              Ajouter
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={1}
          placeholder="Ajouter une note (signée, ne remplace rien)"
          className="min-h-8 flex-1 resize-none text-xs"
          aria-label={`Note sur la recherche ${request.ref}`}
        />
        <Button
          size="icon-sm"
          variant="outline"
          disabled={busy || !note.trim()}
          aria-label="Ajouter la note"
          title="Ajouter la note"
          onClick={async () => {
            if (await run({ action: 'note', text: note })) setNote('')
          }}
        >
          {busy ? <Loader2 className="animate-spin" /> : <MessageSquarePlus />}
        </Button>
        {threadImages && threadImages.length > 0 && (
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={busy || room <= 0}
            aria-label="Ajouter des photos du fil"
            title={room <= 0 ? '10 photos au maximum' : 'Ajouter des photos du fil'}
            onClick={() => setPicking((v) => !v)}
          >
            <ImageIcon />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          disabled={busy || room <= 0}
          aria-label="Téléverser une photo"
          title={room <= 0 ? '10 photos au maximum' : 'Téléverser une photo (JPEG, PNG, WebP)'}
          onClick={() => fileRef.current?.click()}
        >
          <Upload />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            const form = new FormData()
            form.append('file', file)
            void run(form, '/photos')
          }}
        />
      </div>
      <p className="text-[10px] text-slate-400">
        Créée par {request.createdByName ?? 'l’équipe'} · {formatRelativeTime(request.createdAt)}
      </p>
    </article>
  )
}
