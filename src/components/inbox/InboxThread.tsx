'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Megaphone,
  Pin,
  PinOff,
  RotateCcw,
  StickyNote,
  UserCheck,
  UserMinus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/inbox/list'
import type { ConversationDetail, ThreadMessageDto } from '@/lib/inbox/dto'
import type { MessageStatus } from '@/lib/inbox/acks'

const THREAD_POLL_MS = 6_000

/** Reprise d'historique : une fois par conversation et par session. */
const syncedThisSession = new Set<string>()

// ── Coches ─────────────────────────────────

/**
 * 1 coche grise = envoyé · 2 grises = reçu · 2 bleues = lu ·
 * horloge = en attente · triangle rouge = échec · inconnu = 1 coche.
 */
export function StatusTicks({ status, className }: { status: MessageStatus | null; className?: string }) {
  const base = cn('inline-block size-4 shrink-0', className)
  switch (status) {
    case 'pending':
      return <Clock className={cn(base, 'text-slate-400')} aria-label="En attente" />
    case 'delivered':
      return <CheckCheck className={cn(base, 'text-slate-400')} aria-label="Reçu" />
    case 'read':
    case 'played':
      return <CheckCheck className={cn(base, 'text-sky-500')} aria-label="Lu" />
    case 'failed':
      return <AlertTriangle className={cn(base, 'text-red-600')} aria-label="Échec d'envoi" />
    default:
      return <Check className={cn(base, 'text-slate-400')} aria-label="Envoyé" />
  }
}

// ── Texte avec liens cliquables ────────────

const URL_RE = /(https?:\/\/[^\s<>"]+)/g

function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_RE)
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-sky-700 dark:text-sky-400 break-all">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  )
}

// ── Bulle ──────────────────────────────────

function MessageBubble({ m }: { m: ThreadMessageDto }) {
  const time = new Date(m.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={cn('flex', m.fromMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm',
          m.fromMe
            ? 'bg-emerald-50 text-slate-900 rounded-br-sm dark:bg-emerald-950 dark:text-slate-100'
            : 'bg-white text-slate-900 rounded-bl-sm dark:bg-slate-800 dark:text-slate-100',
        )}
      >
        {m.fromMe && m.author && <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">{m.author}</p>}

        {m.ad && (
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs dark:border-amber-900 dark:bg-amber-950">
            <p className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300">
              <Megaphone className="size-3.5" /> Venu d&apos;une publicité
            </p>
            {m.ad.title && <p className="mt-0.5">{m.ad.title}</p>}
          </div>
        )}

        {m.quoted && (
          <div className="mb-1.5 border-l-4 border-emerald-400 bg-black/5 dark:bg-white/5 rounded px-2 py-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
            {m.quoted}
          </div>
        )}

        {m.mediaUrl && m.mediaKind === 'image' && (
          <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- flux privé relayé, non optimisable par next/image */}
            <img src={m.mediaUrl} alt="Photo reçue" loading="lazy" className="max-h-80 w-auto rounded-lg" />
          </a>
        )}
        {m.mediaUrl && m.mediaKind === 'sticker' && (
          // eslint-disable-next-line @next/next/no-img-element -- flux privé relayé
          <img src={m.mediaUrl} alt="Autocollant" loading="lazy" className="size-32 object-contain" />
        )}
        {m.mediaUrl && m.mediaKind === 'video' && (
          <video src={m.mediaUrl} controls preload="metadata" className="max-h-80 rounded-lg mb-1" />
        )}
        {m.mediaUrl && m.mediaKind === 'audio' && <audio src={m.mediaUrl} controls preload="none" className="mb-1 max-w-full" />}
        {m.mediaUrl && m.mediaKind === 'document' && (
          <a
            href={m.mediaUrl}
            download
            className="mb-1 flex items-center gap-2 rounded-lg bg-black/5 dark:bg-white/5 px-3 py-2 text-sm hover:bg-black/10"
          >
            <FileText className="size-5 shrink-0" />
            <span className="truncate">{m.filename ?? 'Document'}</span>
          </a>
        )}
        {!m.mediaUrl && m.mediaKind && (
          <p className="text-xs italic text-slate-500">Média non disponible</p>
        )}

        {m.text && <LinkifiedText text={m.text} />}

        <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-slate-500">
          <span>{time}</span>
          {m.fromMe && <StatusTicks status={m.status} className="size-3.5" />}
        </div>
      </div>
    </div>
  )
}

// ── Fil ─────────────────────────────────────

interface InboxThreadProps {
  conversationId: string
  meId: string
  onChanged: () => void
  onBack: () => void
}

export function InboxThread({ conversationId, meId, onChanged, onBack }: InboxThreadProps) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<ThreadMessageDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)
  /** Conversation affichée : une réponse tardive d'une autre conversation est ignorée. */
  const currentIdRef = useRef(conversationId)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}`, { cache: 'no-store' })
      const data = await res.json()
      if (currentIdRef.current !== conversationId) return
      if (!res.ok) throw new Error(data.error ?? 'Lecture impossible')
      setDetail(data.conversation)
      setMessages(data.messages)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lecture impossible')
    }
  }, [conversationId])

  // Chargement + reprise d'historique (une fois par session) + rafraîchissement
  useEffect(() => {
    currentIdRef.current = conversationId
    setDetail(null)
    setMessages([])
    setNoteOpen(false)
    setSyncing(false)
    lastCountRef.current = 0

    const start = async () => {
      await load()
      if (!syncedThisSession.has(conversationId)) {
        syncedThisSession.add(conversationId)
        setSyncing(true)
        try {
          await fetch(`/api/inbox/conversations/${conversationId}/sync`, { method: 'POST' })
        } finally {
          // WHY: on teste la conversation affichée, pas un drapeau d'annulation —
          // le double montage de React ne doit pas laisser l'indicateur bloqué.
          if (currentIdRef.current === conversationId) {
            setSyncing(false)
            await load()
            onChanged()
          }
        }
      }
    }
    void start()

    const timer = setInterval(() => {
      if (!document.hidden) void load()
    }, THREAD_POLL_MS)
    return () => clearInterval(timer)
  }, [conversationId, load, onChanged])

  // Défile en bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > lastCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    lastCountRef.current = messages.length
  }, [messages.length])

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action)
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Action impossible')
      if (data.conversation) setDetail(data.conversation)
      setError(null)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action impossible')
    } finally {
      setBusy(null)
    }
  }

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        {error ? <p className="text-sm text-red-600">{error}</p> : <Loader2 className="size-6 animate-spin" />}
      </div>
    )
  }

  const assignedToOther = detail.assignedTo && detail.assignedTo !== meId
  const title = detail.name ?? (detail.phoneDisplay || 'Contact WhatsApp (numéro non résolu)')

  return (
    <div className="flex h-full flex-col">
      {/* En-tête */}
      <header className="flex flex-wrap items-center gap-2 border-b bg-white px-3 py-2 dark:bg-slate-900">
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onBack} aria-label="Retour à la liste">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          <p className="truncate text-xs text-slate-500">
            {detail.name ? detail.phoneDisplay : ''}
            {detail.source?.type === 'ad' && (
              <span className="ml-2 text-amber-700">· venu de la publicité {detail.source.title ? `« ${detail.source.title} »` : ''}</span>
            )}
            {detail.assignedName && (
              <span className="ml-2">· suivi par {detail.assignedTo === meId ? 'vous' : detail.assignedName}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {detail.assignedTo === meId ? (
            <Button size="sm" variant="outline" onClick={() => act('release')} disabled={!!busy}>
              <UserMinus /> Libérer
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => act('assign')} disabled={!!busy}>
              <UserCheck /> {assignedToOther ? 'Reprendre' : "M'attribuer"}
            </Button>
          )}
          <Button
            size="sm"
            variant={noteOpen ? 'secondary' : 'outline'}
            onClick={() => {
              setNoteDraft(detail.note ?? '')
              setNoteOpen((o) => !o)
            }}
          >
            <StickyNote /> Note
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => act(detail.pinned ? 'unpin' : 'pin')}
            disabled={!!busy}
            aria-label={detail.pinned ? 'Désépingler' : 'Épingler'}
            title={detail.pinned ? 'Désépingler (pour vous seul)' : 'Épingler (pour vous seul)'}
          >
            {detail.pinned ? <PinOff /> : <Pin />}
          </Button>
          {detail.status === 'closed' ? (
            <Button size="sm" variant="outline" onClick={() => act('reopen')} disabled={!!busy}>
              <RotateCcw /> Rouvrir
            </Button>
          ) : (
            <Button size="sm" onClick={() => act('close')} disabled={!!busy}>
              <CheckCircle2 /> Terminer
            </Button>
          )}
        </div>
      </header>

      {/* Note interne : couleur distincte, jamais envoyée */}
      {noteOpen && (
        <div className="border-b border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950">
          <p className="mb-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
            Note interne — visible par l&apos;équipe uniquement, jamais envoyée au client
          </p>
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            maxLength={2000}
            rows={3}
            className="bg-white dark:bg-slate-900"
            placeholder="Ex. : rappeler jeudi, intéressé par la session de décembre…"
          />
          <div className="mt-1 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setNoteOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await act('note', { note: noteDraft })
                setNoteOpen(false)
              }}
              disabled={busy === 'note'}
            >
              Enregistrer la note
            </Button>
          </div>
        </div>
      )}
      {!noteOpen && detail.note && (
        <button
          type="button"
          onClick={() => {
            setNoteDraft(detail.note ?? '')
            setNoteOpen(true)
          }}
          className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-left text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <span className="font-semibold">Note interne :</span> {detail.note}
        </button>
      )}

      {error && <p className="bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p>}

      {/* Fil */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-[#efeae2] px-3 py-4 dark:bg-slate-950">
        {syncing && (
          <p className="text-center text-xs text-slate-500">
            <Loader2 className="mr-1 inline size-3 animate-spin" /> Récupération de l&apos;historique WhatsApp…
          </p>
        )}
        {messages.length === 0 && !syncing && <p className="text-center text-sm text-slate-500">Aucun message.</p>}
        {messages.map((m) => (
          <MessageBubble key={m.ref} m={m} />
        ))}
      </div>

      {/* Zone de réponse : jalon 3 */}
      <footer className="border-t bg-white px-3 py-3 text-center text-xs text-slate-500 dark:bg-slate-900">
        La réponse depuis cet écran arrive au jalon 3. En attendant, répondez depuis le téléphone :
        vos messages apparaîtront ici, marqués « Depuis le téléphone ».
        {detail.lastMessageAt && <span className="ml-1">Dernier message : {formatRelativeTime(detail.lastMessageAt)}.</span>}
      </footer>
    </div>
  )
}
