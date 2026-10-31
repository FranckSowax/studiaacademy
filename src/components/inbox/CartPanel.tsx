'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Plus, RotateCcw, Save, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/config/app-config'
import { computeFiaLine, sumFiaTotals, type FiaInscriptionType } from '@/lib/formations-ia-pricing'

interface CatalogFormation {
  id: string
  code: string
  slug: string
  title: string
  prixFcfa: number | null
  prixGroupeFcfa: number | null
  sessions: { id: string; date: string; lieu: string }[]
}

interface CartLine {
  code: string
  title: string
  sessionDate: string
  participants: number
  total: number | null
  inscriptionCode: string | null
  inscriptionStatus: string | null
}

interface CartView {
  id: string
  conversationId: string
  firstName: string
  lastName: string
  phoneDisplay: string
  type: FiaInscriptionType
  societe: string | null
  message: string | null
  status: 'draft' | 'sent' | 'partial'
  items: { sessionId: string; participants: number }[]
  lines: CartLine[]
  total: number | null
  updatedByName: string | null
  updatedAt: string
  lastSendResult: SendResult | null
}

interface SendResult {
  sent: number
  total: number
  errors: { index: number; label: string; error: string }[]
  amount: number | null
}

interface Draft {
  cartId: string | null
  firstName: string
  lastName: string
  phone: string
  type: FiaInscriptionType
  societe: string
  message: string
  items: { sessionId: string; participants: number }[]
}

const STATUS_LABEL: Record<CartView['status'], string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  partial: 'Envoi partiel',
}

function emptyDraft(contact: { name: string | null; phone: string | null }): Draft {
  const parts = (contact.name ?? '').trim().split(/\s+/).filter(Boolean)
  return {
    cartId: null,
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
    phone: contact.phone ?? '',
    type: 'individuel',
    societe: '',
    message: '',
    items: [],
  }
}

const dateFr = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

interface CartPanelProps {
  conversationId: string
  contact: { name: string | null; phone: string | null }
  onSent: () => void
}

export function CartPanel({ conversationId, contact, onSent }: CartPanelProps) {
  const [catalog, setCatalog] = useState<CatalogFormation[] | null>(null)
  const [carts, setCarts] = useState<CartView[]>([])
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(contact))
  const [pickSession, setPickSession] = useState('')
  const [pickParticipants, setPickParticipants] = useState(1)
  const [busy, setBusy] = useState<'save' | 'send' | 'retry' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phoneMismatch, setPhoneMismatch] = useState(false)
  const [confirmPhone, setConfirmPhone] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  const loadCarts = useCallback(async () => {
    const res = await fetch(`/api/inbox/carts?conversation=${conversationId}`)
    const d = await res.json()
    if (res.ok) setCarts(d.items)
  }, [conversationId])

  useEffect(() => {
    void fetch('/api/inbox/catalog')
      .then((r) => r.json())
      .then((d) => setCatalog(d.items ?? []))
      .catch(() => setCatalog([]))
    void loadCarts()
  }, [loadCarts])

  const sessionIndex = useMemo(() => {
    const map = new Map<string, { formation: CatalogFormation; session: CatalogFormation['sessions'][number] }>()
    for (const f of catalog ?? []) for (const s of f.sessions) map.set(s.id, { formation: f, session: s })
    return map
  }, [catalog])

  // Aperçu calculé par la MÊME fonction que le serveur (formations-ia-pricing).
  const preview = draft.items.map((item) => {
    const entry = sessionIndex.get(item.sessionId)
    const price = entry
      ? computeFiaLine({ prixFcfa: entry.formation.prixFcfa, prixGroupeFcfa: entry.formation.prixGroupeFcfa }, draft.type, item.participants)
      : null
    return { item, entry, price }
  })
  const previewTotal = sumFiaTotals(preview.map((p) => ({ total: p.price?.total ?? null })))

  const reopen = (cart: CartView) => {
    setDraft({
      cartId: cart.id,
      firstName: cart.firstName,
      lastName: cart.lastName,
      phone: cart.phoneDisplay,
      type: cart.type,
      societe: cart.societe ?? '',
      message: cart.message ?? '',
      items: cart.items.map((i) => ({ sessionId: i.sessionId, participants: i.participants })),
    })
    setResult(cart.lastSendResult)
    setError(null)
    setSavedNotice(null)
    setPhoneMismatch(false)
  }

  const submit = async (mode: 'save' | 'send' | 'retry') => {
    if (mode === 'send') {
      const count = draft.items.length + 2
      if (!window.confirm(`Envoyer ${count} messages WhatsApp à ${draft.firstName} ${draft.lastName} (${draft.phone}) ?`)) return
    }
    setBusy(mode)
    setError(null)
    setSavedNotice(null)
    try {
      const res = await fetch('/api/inbox/carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: draft.cartId,
          conversation_id: conversationId,
          first_name: draft.firstName,
          last_name: draft.lastName,
          phone: draft.phone,
          type: draft.type,
          societe: draft.type === 'entreprise' ? draft.societe : null,
          message: draft.message || null,
          items: draft.items.map((i) => ({ session_id: i.sessionId, participants: i.participants })),
          send: mode !== 'save',
          only_failed: mode === 'retry',
          confirm_phone_mismatch: confirmPhone,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        if (d.code === 'PHONE_MISMATCH') setPhoneMismatch(true)
        throw new Error(d.error ?? 'Opération impossible')
      }
      setDraft((current) => ({ ...current, cartId: d.cart.id }))
      if (d.result) {
        setResult(d.result)
        onSent()
      } else {
        setSavedNotice(`Panier enregistré (${d.cart.lines.length} inscription${d.cart.lines.length > 1 ? 's' : ''}) — rien n'a été envoyé.`)
      }
      await loadCarts()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opération impossible')
    } finally {
      setBusy(null)
    }
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  if (!catalog) return <Loader2 className="size-4 animate-spin text-slate-400" />

  const others = carts.filter((c) => c.id !== draft.cartId)

  return (
    <div className="space-y-3 text-sm">
      {/* Paniers enregistrés */}
      {others.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Paniers enregistrés (non payés)</p>
          <div className="flex flex-wrap gap-1">
            {others.slice(0, 8).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => reopen(c)}
                className={cn(
                  'rounded border bg-white px-2 py-1 text-left text-xs hover:bg-slate-100 dark:bg-slate-900',
                  c.conversationId === conversationId && 'border-emerald-400',
                )}
                title="Rouvrir ce panier"
              >
                {c.firstName} {c.lastName} · {c.lines.map((l) => l.code).join('+')} · {formatMoney(c.total, 'sur devis')} ·{' '}
                <span className={c.status === 'partial' ? 'text-red-600' : 'text-slate-500'}>{STATUS_LABEL[c.status]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="font-semibold">{draft.cartId ? 'Modifier le panier' : 'Nouveau panier'}</p>
        {draft.cartId && (
          <Button variant="ghost" size="sm" onClick={() => { setDraft(emptyDraft(contact)); setResult(null) }}>
            <Plus /> Nouveau
          </Button>
        )}
      </div>

      {/* Client */}
      <div className="grid grid-cols-2 gap-2">
        <Input value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Prénom" maxLength={60} aria-label="Prénom du client" />
        <Input value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Nom" maxLength={60} aria-label="Nom du client" />
        <Input
          value={draft.phone}
          onChange={(e) => {
            set('phone', e.target.value)
            setPhoneMismatch(false)
            setConfirmPhone(false)
          }}
          placeholder="Téléphone"
          maxLength={30}
          aria-label="Téléphone du client"
        />
        <select
          value={draft.type}
          onChange={(e) => set('type', e.target.value as FiaInscriptionType)}
          className="h-9 rounded-md border bg-white px-2 text-sm dark:bg-slate-900"
          aria-label="Type d'inscription"
        >
          <option value="individuel">Individuel</option>
          <option value="entreprise">Entreprise</option>
        </select>
        {draft.type === 'entreprise' && (
          <Input className="col-span-2" value={draft.societe} onChange={(e) => set('societe', e.target.value)} placeholder="Société" maxLength={120} aria-label="Société" />
        )}
      </div>
      {phoneMismatch && (
        <label className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
          <input type="checkbox" checked={confirmPhone} onChange={(e) => setConfirmPhone(e.target.checked)} className="mt-0.5" />
          Je confirme ce numéro pour l&apos;inscription. Les messages partiront quand même dans cette conversation WhatsApp.
        </label>
      )}

      {/* Catalogue */}
      <div className="flex flex-wrap items-center gap-2 rounded border bg-white p-2 dark:bg-slate-900">
        <select
          value={pickSession}
          onChange={(e) => setPickSession(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-md border bg-white px-2 text-sm dark:bg-slate-900"
          aria-label="Session à ajouter"
        >
          <option value="">Choisir une session…</option>
          {catalog.map((f) => (
            <optgroup key={f.id} label={`${f.code} — ${f.title} (${formatMoney(f.prixFcfa, 'sur devis')})`}>
              {f.sessions.length === 0 && <option disabled>Aucune session à venir</option>}
              {f.sessions.map((s) => (
                <option key={s.id} value={s.id} disabled={draft.items.some((i) => i.sessionId === s.id)}>
                  {f.code} · {dateFr(s.date)} · {s.lieu}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {draft.type === 'entreprise' && (
          <Input
            type="number"
            min={1}
            max={50}
            value={pickParticipants}
            onChange={(e) => setPickParticipants(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            className="w-20"
            aria-label="Nombre de participants"
          />
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={!pickSession || draft.items.length >= 5}
          onClick={() => {
            set('items', [...draft.items, { sessionId: pickSession, participants: draft.type === 'entreprise' ? pickParticipants : 1 }])
            setPickSession('')
          }}
        >
          <Plus /> Ajouter
        </Button>
      </div>

      {/* Lignes et total (aperçu) */}
      {preview.length > 0 && (
        <ul className="divide-y rounded border bg-white dark:bg-slate-900">
          {preview.map(({ item, entry, price }, index) => (
            <li key={item.sessionId} className="flex items-center gap-2 px-2 py-1.5">
              <span className="min-w-0 flex-1 truncate">
                {entry ? `${entry.formation.code} — ${entry.formation.title} · ${dateFr(entry.session.date)}` : 'Session indisponible'}
                {price && price.participants > 1 && ` · ${price.participants} pers.${price.groupRate ? ' (tarif groupe)' : ''}`}
              </span>
              <span className="shrink-0 font-medium">{formatMoney(price?.total ?? null, 'sur devis')}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Retirer"
                onClick={() => set('items', draft.items.filter((_, j) => j !== index))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
          <li className="flex justify-between px-2 py-1.5 font-semibold">
            <span>Total</span>
            <span>{formatMoney(previewTotal, 'sur devis')}</span>
          </li>
        </ul>
      )}

      <Textarea
        value={draft.message}
        onChange={(e) => set('message', e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Mot d'accueil (facultatif — sinon « Bonjour {prénom}, voici la sélection… »)"
        aria-label="Mot d'accueil"
      />

      {error && <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</p>}
      {savedNotice && <p className="rounded bg-emerald-50 px-2 py-1.5 text-xs text-emerald-800">{savedNotice}</p>}

      {result && (
        <div
          className={cn(
            'rounded border px-2 py-1.5 text-xs',
            result.errors.length === 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-900',
          )}
        >
          <p className="flex items-center gap-1 font-semibold">
            {result.errors.length === 0 ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
            {result.sent} message{result.sent > 1 ? 's' : ''} sur {result.total} envoyé{result.sent > 1 ? 's' : ''} · total{' '}
            {formatMoney(result.amount, 'sur devis')}
          </p>
          {result.errors.map((e) => (
            <p key={e.index}>
              ✗ {e.label} : {e.error}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {result && result.errors.length > 0 && draft.cartId && (
          <Button variant="outline" size="sm" disabled={!!busy} onClick={() => submit('retry')}>
            {busy === 'retry' ? <Loader2 className="animate-spin" /> : <RotateCcw />} Reprendre les messages en échec
          </Button>
        )}
        <Button variant="outline" size="sm" disabled={!!busy || draft.items.length === 0} onClick={() => submit('save')}>
          {busy === 'save' ? <Loader2 className="animate-spin" /> : <Save />} Enregistrer
        </Button>
        <Button size="sm" disabled={!!busy || draft.items.length === 0} onClick={() => submit('send')}>
          {busy === 'send' ? <Loader2 className="animate-spin" /> : <Send />} {draft.cartId ? 'Enregistrer et (r)envoyer' : 'Enregistrer et envoyer'}
        </Button>
      </div>
    </div>
  )
}
