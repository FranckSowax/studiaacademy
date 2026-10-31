'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipboardList, FileText, ImageIcon, Link2, Loader2, Plus, Send, ShoppingCart, Smile, Sparkles, Trash2, Upload, Video, X, Zap } from 'lucide-react'
import type { NextAction } from '@/lib/inbox/analysis'
import { AnalysisPanel } from './AnalysisPanel'
import { CartPanel } from './CartPanel'
import { RequestPanel, type ThreadImage } from './RequestPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { fillTemplate } from '@/lib/inbox/templates'
import type { ThreadMessageDto } from '@/lib/inbox/dto'

type Panel = 'emoji' | 'links' | 'quick' | 'media' | 'cart' | 'request' | 'analysis' | null

/** Actions proposées par l'analyse qui se réalisent dans l'en-tête du fil. */
export type ThreadAction = 'follow_up' | 'handover' | 'close'

interface QuickReply {
  id: string
  title: string
  text: string
}
interface LinkItem {
  label: string
  url: string
  group: string
}
interface LibraryItem {
  id: string
  mime: string
  kind: 'image' | 'video' | 'document'
  filename: string | null
  caption: string | null
  createdByName: string | null
  fileUrl: string
}

const EMOJIS = [
  '😊', '🙂', '😀', '😁', '😉', '🙏', '👍', '👌', '👏', '🤝', '💪', '🎉',
  '✅', '❌', '⚠️', '📌', '📅', '⏰', '📍', '📞', '📩', '💬', '📚', '🎓',
  '💻', '🤖', '🚀', '⭐', '🔥', '💡', '❤️', '😅', '🤔', '😮', '😢', '👋',
]

/** Brouillons par conversation : on ne perd pas sa phrase en changeant de fil. */
const drafts = new Map<string, string>()

interface InboxComposerProps {
  conversationId: string
  contact: { name: string | null; phone: string | null }
  /** Images du fil, proposables comme photos d'une recherche client. */
  threadImages: ThreadImage[]
  onSent: (message: ThreadMessageDto | null) => void
  onThreadAction: (action: ThreadAction) => void
}

export function InboxComposer({ conversationId, contact, threadImages, onSent, onThreadAction }: InboxComposerProps) {
  const [text, setText] = useState(() => drafts.get(conversationId) ?? '')
  const [panel, setPanel] = useState<Panel>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setText(drafts.get(conversationId) ?? '')
    setPanel(null)
    setError(null)
  }, [conversationId])

  useEffect(() => {
    drafts.set(conversationId, text)
    // Champ qui grandit (jusqu'à ~8 lignes)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }
  }, [text, conversationId])

  /** Insère à la position du curseur (jamais d'envoi). */
  const insert = useCallback((snippet: string) => {
    const el = textareaRef.current
    setText((current) => {
      if (!el) return current + snippet
      const start = el.selectionStart ?? current.length
      const end = el.selectionEnd ?? current.length
      const next = current.slice(0, start) + snippet + current.slice(end)
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(start + snippet.length, start + snippet.length)
      })
      return next
    })
  }, [])

  const send = async (body: Record<string, unknown>) => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? "L'envoi a échoué")
      onSent(data.message ?? null)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'envoi a échoué")
      return false
    } finally {
      setSending(false)
    }
  }

  const sendText = async () => {
    const value = text.trim()
    if (!value || sending) return
    if (await send({ kind: 'text', text: value })) {
      setText('')
      drafts.delete(conversationId)
    }
  }

  const toggle = (p: Panel) => setPanel((current) => (current === p ? null : p))

  /** « Faire » depuis l'analyse : ouvre l'outil qui réalise l'action. */
  const runAction = (action: NextAction) => {
    switch (action) {
      case 'send_cart':
        return setPanel('cart')
      case 'send_media':
        return setPanel('media')
      case 'send_quick_reply':
        return setPanel('quick')
      case 'note_request':
        return setPanel('request')
      case 'answer_question':
        setPanel(null)
        return requestAnimationFrame(() => textareaRef.current?.focus())
      case 'follow_up':
      case 'handover':
      case 'close':
        setPanel(null)
        return onThreadAction(action)
      default:
        return undefined
    }
  }

  return (
    <div className="border-t bg-white dark:bg-slate-900">
      {panel && (
        <div
          className={cn(
            'overflow-y-auto border-b bg-slate-50 p-3 dark:bg-slate-950',
            panel === 'cart' || panel === 'request' ? 'max-h-[60vh]' : 'max-h-72',
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">
              {panel === 'emoji' && 'Émojis'}
              {panel === 'links' && 'Insérer un lien'}
              {panel === 'quick' && 'Phrases rapides — insérées dans le brouillon, à relire avant envoi'}
              {panel === 'media' && 'Médiathèque'}
              {panel === 'cart' && 'Panier client — inscriptions aux formations, prix calculés par le site'}
              {panel === 'request' && 'Recherche client — demande hors catalogue, suivie par l’équipe'}
              {panel === 'analysis' && 'Analyse de la conversation'}
            </p>
            <Button variant="ghost" size="icon-sm" onClick={() => setPanel(null)} aria-label="Fermer le panneau">
              <X />
            </Button>
          </div>
          {panel === 'emoji' && (
            <div className="grid grid-cols-12 gap-1">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => insert(e)} className="rounded p-1 text-xl hover:bg-slate-200">
                  {e}
                </button>
              ))}
            </div>
          )}
          {panel === 'links' && <LinksPanel onPick={(url) => insert(url)} />}
          {panel === 'quick' && <QuickRepliesPanel onPick={(t) => insert(fillTemplate(t, contact))} />}
          {panel === 'analysis' && <AnalysisPanel conversationId={conversationId} onAction={runAction} />}
          {panel === 'cart' && <CartPanel conversationId={conversationId} contact={contact} onSent={() => onSent(null)} />}
          {panel === 'request' && <RequestPanel conversationId={conversationId} threadImages={threadImages} />}
          {panel === 'media' && (
            <MediaPanel
              sending={sending}
              onSend={async (libraryId, caption) => {
                if (await send({ kind: 'library', libraryId, caption })) setPanel(null)
              }}
            />
          )}
        </div>
      )}

      {error && <p className="bg-red-50 px-3 py-1.5 text-xs text-red-700">{error} — le brouillon est conservé.</p>}

      <div className="flex items-end gap-2 p-2">
        <div className="flex shrink-0 gap-0.5">
          <ToolButton active={panel === 'emoji'} onClick={() => toggle('emoji')} label="Émojis">
            <Smile />
          </ToolButton>
          <ToolButton active={panel === 'links'} onClick={() => toggle('links')} label="Insérer un lien">
            <Link2 />
          </ToolButton>
          <ToolButton active={panel === 'quick'} onClick={() => toggle('quick')} label="Phrases rapides">
            <Zap />
          </ToolButton>
          <ToolButton active={panel === 'media'} onClick={() => toggle('media')} label="Médiathèque">
            <ImageIcon />
          </ToolButton>
          <ToolButton active={panel === 'cart'} onClick={() => toggle('cart')} label="Panier client">
            <ShoppingCart />
          </ToolButton>
          <ToolButton active={panel === 'request'} onClick={() => toggle('request')} label="Recherche client">
            <ClipboardList />
          </ToolButton>
          <ToolButton active={panel === 'analysis'} onClick={() => toggle('analysis')} label="Analyse">
            <Sparkles />
          </ToolButton>
        </div>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Entrée = nouvelle ligne ; Ctrl/⌘ + Entrée = envoyer (pas d'envoi accidentel)
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              void sendText()
            }
          }}
          rows={1}
          maxLength={4096}
          placeholder="Votre réponse au client… (Ctrl/⌘ + Entrée pour envoyer)"
          className="min-h-10 flex-1 resize-none"
          aria-label="Réponse au client"
        />
        <Button onClick={sendText} disabled={sending || !text.trim()} aria-label="Envoyer">
          {sending ? <Loader2 className="animate-spin" /> : <Send />}
          <span className="hidden sm:inline">Envoyer</span>
        </Button>
      </div>
    </div>
  )
}

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <Button variant={active ? 'secondary' : 'ghost'} size="icon-sm" onClick={onClick} aria-label={label} title={label}>
      {children}
    </Button>
  )
}

// ── Liens ──────────────────────────────────

function LinksPanel({ onPick }: { onPick: (url: string) => void }) {
  const [items, setItems] = useState<LinkItem[] | null>(null)
  useEffect(() => {
    void fetch('/api/inbox/links')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
  }, [])
  if (!items) return <Loader2 className="size-4 animate-spin text-slate-400" />
  const groups = [...new Set(items.map((i) => i.group))]
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">{g}</p>
          <div className="flex flex-wrap gap-1">
            {items
              .filter((i) => i.group === g)
              .map((i) => (
                <button
                  key={i.url}
                  type="button"
                  onClick={() => onPick(i.url)}
                  className="rounded border bg-white px-2 py-1 text-xs hover:bg-slate-100 dark:bg-slate-900"
                  title={i.url}
                >
                  {i.label}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Phrases rapides ─────────────────────────

function QuickRepliesPanel({ onPick }: { onPick: (text: string) => void }) {
  const [items, setItems] = useState<QuickReply[] | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<QuickReply[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/inbox/quick-replies')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? [])
        setCanEdit(d.canEdit === true)
      })
      .catch(() => setItems([]))
  }, [])

  if (!items) return <Loader2 className="size-4 animate-spin text-slate-400" />

  if (editing) {
    return (
      <div className="space-y-2">
        <p className="text-[11px] text-slate-500">Variables : {'{nom}'} {'{prenom}'} {'{numero}'}</p>
        {draft.map((q, i) => (
          <div key={q.id} className="space-y-1 rounded border bg-white p-2 dark:bg-slate-900">
            <div className="flex gap-1">
              <Input
                value={q.title}
                maxLength={60}
                placeholder="Titre"
                onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              />
              <Button variant="ghost" size="icon-sm" onClick={() => setDraft((d) => d.filter((_, j) => j !== i))} aria-label="Supprimer">
                <Trash2 />
              </Button>
            </div>
            <Textarea
              value={q.text}
              maxLength={1000}
              rows={2}
              placeholder="Texte"
              onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
            />
          </div>
        ))}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDraft((d) => [...d, { id: `new-${Date.now()}`, title: '', text: '' }])}
          >
            <Plus /> Ajouter
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                setError(null)
                try {
                  const res = await fetch('/api/inbox/quick-replies', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: draft }),
                  })
                  const d = await res.json()
                  if (!res.ok) throw new Error(d.error ?? 'Enregistrement impossible')
                  setItems(d.items)
                  setEditing(false)
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Enregistrement impossible')
                } finally {
                  setSaving(false)
                }
              }}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {items.length === 0 && <p className="text-xs text-slate-500">Aucune phrase rapide pour l&apos;instant.</p>}
      {items.map((q) => (
        <button
          key={q.id}
          type="button"
          onClick={() => onPick(q.text)}
          className="block w-full rounded border bg-white px-2 py-1.5 text-left hover:bg-slate-100 dark:bg-slate-900"
        >
          <span className="block text-xs font-semibold">{q.title}</span>
          <span className="block truncate text-xs text-slate-500">{q.text}</span>
        </button>
      ))}
      {canEdit && (
        <Button
          variant="link"
          size="sm"
          className="px-0"
          onClick={() => {
            setDraft(items)
            setEditing(true)
          }}
        >
          Gérer les phrases rapides (admin)
        </Button>
      )}
    </div>
  )
}

// ── Médiathèque ─────────────────────────────

function MediaPanel({
  sending,
  onSend,
}: {
  sending: boolean
  onSend: (libraryId: string, caption: string) => Promise<void>
}) {
  const [items, setItems] = useState<LibraryItem[] | null>(null)
  const [selected, setSelected] = useState<LibraryItem | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox/library')
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Médiathèque indisponible')
      setItems(d.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Médiathèque indisponible')
      setItems([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const upload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('caption', caption)
      const res = await fetch('/api/inbox/library', { method: 'POST', body: form })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Téléversement impossible')
      setItems((list) => [d.item, ...(list ?? [])])
      setSelected(d.item)
      setCaption(d.item.caption ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Téléversement impossible')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!items) return <Loader2 className="size-4 animate-spin text-slate-400" />

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded border-2 border-dashed text-xs text-slate-500 hover:bg-slate-100"
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
          Depuis l&apos;ordinateur
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void upload(f)
          }}
        />
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSelected(item)
              setCaption(item.caption ?? '')
            }}
            className={cn(
              'relative flex aspect-square items-center justify-center overflow-hidden rounded border bg-white',
              selected?.id === item.id && 'ring-2 ring-emerald-600',
            )}
            title={item.caption ?? item.filename ?? ''}
          >
            {item.kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element -- fichier privé relayé
              <img src={item.fileUrl} alt={item.caption ?? 'Image'} className="size-full object-cover" loading="lazy" />
            ) : item.kind === 'video' ? (
              <Video className="size-6 text-slate-500" />
            ) : (
              <FileText className="size-6 text-slate-500" />
            )}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {selected && (
        <div className="flex items-center gap-2 rounded border bg-white p-2 dark:bg-slate-900">
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={1000}
            placeholder="Légende (facultative)"
          />
          <Button size="sm" disabled={sending} onClick={() => onSend(selected.id, caption)}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />} Envoyer ce fichier
          </Button>
        </div>
      )}
    </div>
  )
}
