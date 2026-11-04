'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, Pencil, Plus, Power, Shield, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createCollaborator,
  setCollaboratorActive,
  updateCollaborator,
  type ActionResult,
} from '@/lib/collaborators/admin-actions'
import { ROLE_LABELS, type CollaboratorRole } from '@/lib/collaborators/roles'
import { formatPhone, formatRelativeTime, initials } from '@/lib/inbox/list'
import { cn } from '@/lib/utils'

export interface CollaboratorRowDto {
  id: string
  userId: string | null
  fullName: string
  email: string | null
  whatsappPhone: string | null
  role: CollaboratorRole
  isActive: boolean
  lastLoginAt: string | null
  repliesLast30d: number
  lastReplyAt: string | null
  isMe: boolean
}

interface FormState {
  full_name: string
  email: string
  whatsapp_phone: string
  role: CollaboratorRole
}

const EMPTY: FormState = { full_name: '', email: '', whatsapp_phone: '', role: 'agent' }

function CollaboratorForm({
  idPrefix,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  idPrefix: string
  initial: FormState
  submitLabel: string
  onSubmit: (v: FormState) => Promise<ActionResult>
  onCancel?: () => void
}) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        start(async () => {
          const res = await onSubmit(form)
          if (!res.ok) return setError(res.error)
          toast.success('Enregistré')
          if (onCancel) onCancel()
          else setForm(EMPTY)
        })
      }}
    >
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-name`}>Nom affiché</Label>
        <Input id={`${idPrefix}-name`} value={form.full_name} onChange={set('full_name')} required maxLength={120} />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-role`}>Rôle</Label>
        <select
          id={`${idPrefix}-role`}
          value={form.role}
          onChange={set('role')}
          className="h-9 w-full rounded-md border bg-white px-2 text-sm"
        >
          <option value="agent">{ROLE_LABELS.agent} (messagerie seule)</option>
          <option value="admin">{ROLE_LABELS.admin} (tout l&apos;espace admin)</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-phone`}>Numéro WhatsApp (reçoit le code)</Label>
        <Input id={`${idPrefix}-phone`} value={form.whatsapp_phone} onChange={set('whatsapp_phone')} placeholder="07 67 01 58" />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-email`}>Email (repli sans WhatsApp)</Label>
        <Input id={`${idPrefix}-email`} type="email" value={form.email} onChange={set('email')} placeholder="nom@studia.ga" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending} className="rounded-xl">
          {pending && <Loader2 className="mr-1 size-4 animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
            Annuler
          </Button>
        )}
      </div>
    </form>
  )
}

export function CollaboratorsManager({ items }: { items: CollaboratorRowDto[] }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [inviting, setInviting] = useState(items.length === 0)
  const [busy, setBusy] = useState<string | null>(null)

  const toggleActive = async (c: CollaboratorRowDto) => {
    const question = c.isActive
      ? `Désactiver ${c.fullName} ? Son accès est coupé immédiatement ; ses réponses restent dans l'historique.`
      : `Réactiver ${c.fullName} ?`
    if (!confirm(question)) return
    setBusy(c.id)
    const res = await setCollaboratorActive(c.id, !c.isActive)
    setBusy(null)
    if (!res.ok) toast.error(res.error)
    else toast.success(c.isActive ? 'Collaborateur désactivé' : 'Collaborateur réactivé')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        {inviting ? (
          <>
            <h3 className="mb-3 font-semibold">Inviter un collaborateur</h3>
            <CollaboratorForm idPrefix="new" initial={EMPTY} submitLabel="Inviter" onSubmit={createCollaborator} />
            <p className="mt-2 text-xs text-muted-foreground">
              Le compte est créé à sa première connexion : il saisit son numéro ou son email sur /equipe/connexion et
              reçoit un code.
            </p>
          </>
        ) : (
          <Button onClick={() => setInviting(true)} className="rounded-xl">
            <Plus className="mr-1 size-4" /> Inviter un collaborateur
          </Button>
        )}
      </div>

      <div className="divide-y overflow-hidden rounded-2xl border bg-white">
        {items.map((c) => (
          <div key={c.id} className={cn('p-4', !c.isActive && 'bg-slate-50 opacity-70')}>
            {editing === c.id ? (
              <CollaboratorForm
                idPrefix={c.id}
                initial={{
                  full_name: c.fullName,
                  email: c.email ?? '',
                  whatsapp_phone: c.whatsappPhone ?? '',
                  role: c.role,
                }}
                submitLabel="Enregistrer"
                onSubmit={(v) => updateCollaborator(c.id, v)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                    {initials(c.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {c.fullName} {c.isMe && <span className="text-xs text-gray-400">(vous)</span>}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {[c.whatsappPhone ? formatPhone(c.whatsappPhone) : null, c.email].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.repliesLast30d} réponse(s) sur 30 j
                      {c.lastReplyAt ? ` · dernière ${formatRelativeTime(c.lastReplyAt)}` : ''}
                      {' · '}
                      {c.lastLoginAt ? `connecté ${formatRelativeTime(c.lastLoginAt)}` : 'jamais connecté'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      c.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-700',
                    )}
                  >
                    {c.role === 'admin' ? <Shield className="size-3" /> : <UserRound className="size-3" />}
                    {ROLE_LABELS[c.role]}
                  </span>
                  {!c.isActive && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">Désactivé</span>}
                  {c.userId && c.repliesLast30d > 0 && (
                    <Button asChild size="sm" variant="ghost" className="rounded-xl">
                      <Link href={`/messagerie?by=${c.userId}`}>Historique</Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setEditing(c.id)}
                    aria-label={`Modifier ${c.fullName}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={busy === c.id || c.isMe}
                    onClick={() => toggleActive(c)}
                    aria-label={c.isActive ? `Désactiver ${c.fullName}` : `Réactiver ${c.fullName}`}
                    title={c.isMe ? 'Vous ne pouvez pas vous désactiver' : undefined}
                  >
                    {busy === c.id ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-400">Aucun collaborateur pour l&apos;instant.</p>
        )}
      </div>
    </div>
  )
}
