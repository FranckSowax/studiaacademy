'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Inbox, Check, X, Loader2, Phone, Clock, CheckCircle, XCircle, Banknote, Smartphone, AlertTriangle, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatNumber } from '@/lib/utils'
import { decideEnrollment } from '@/lib/formations/admin-actions'
import { PAYMENT_LABELS } from '@/lib/formations/enrollment-payment'
import type { EnrollmentRow } from '@/app/(admin)/admin/formations/inscriptions/page'

type Filter = 'pending' | 'all'
interface Notice {
  kind: 'ok' | 'warn' | 'error'
  text: string
}

const NOTICE_STYLES: Record<Notice['kind'], string> = {
  ok: 'border-green-200 bg-green-50 text-green-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-700',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Libreville' })
}

export function AdminEnrollmentsManager({ initial }: { initial: EnrollmentRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('pending')
  const [refusing, setRefusing] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  const pendingCount = initial.filter((r) => r.status === 'pending').length
  const rows = filter === 'pending' ? initial.filter((r) => r.status === 'pending') : initial

  const amountOf = (r: EnrollmentRow) => `${formatNumber(r.payment_amount_fcfa ?? r.formation_prix)} FCFA`

  const decide = async (r: EnrollmentRow, decision: 'active' | 'rejected') => {
    if (decision === 'active') {
      const paiement =
        r.payment_method === 'cash'
          ? `Avez-vous bien encaissé ${amountOf(r)} en espèces ?`
          : r.payment_method === 'airtel_money'
            ? `Avez-vous bien vérifié la réception de ${amountOf(r)} sur le compte Airtel Money ?`
            : `Confirmez-vous le paiement de ${amountOf(r)} ?`
      if (!window.confirm(`${paiement}\n\n${r.user_name} aura accès à « ${r.formation_titre} ».`)) return
    }
    setBusy(r.id)
    setNotice(null)
    const res = await decideEnrollment(r.id, decision, decision === 'rejected' ? note : undefined)
    setBusy(null)
    if (!res.success) {
      setNotice({ kind: 'error', text: res.error || 'Action impossible. Réessayez.' })
      return
    }
    setRefusing(null)
    setNote('')
    const fait = decision === 'active' ? `Accès ouvert pour ${r.user_name}.` : `Demande de ${r.user_name} refusée.`
    setNotice(
      res.notified
        ? { kind: 'ok', text: `${fait} L’élève est prévenu sur WhatsApp.` }
        : { kind: 'warn', text: `${fait} Le message WhatsApp n’est pas parti : prévenez l’élève vous-même.` },
    )
    router.refresh()
  }

  const statusBadge = (s: string) => {
    if (s === 'pending') return <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />En attente</span>
    if (s === 'active') return <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Payé · accès ouvert</span>
    if (s === 'completed') return <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Formation terminée</span>
    if (s === 'rejected') return <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />Refusé</span>
    return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inscriptions et paiements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vérifiez le paiement (espèces ou Airtel Money), puis validez : c’est la validation qui ouvre l’accès à la formation.
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(['pending', 'all'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f ? 'bg-white shadow-sm text-[#a84d16]' : 'text-muted-foreground'}`}>
              {f === 'pending' ? `En attente (${pendingCount})` : `Toutes (${initial.length})`}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${NOTICE_STYLES[notice.kind]}`}>
          {notice.text}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl border">
          <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune demande{filter === 'pending' ? ' en attente' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const ModeIcon = r.payment_method === 'cash' ? Banknote : Smartphone
            const sansPreuve = r.status === 'pending' && r.payment_method === 'airtel_money' && !r.proof_url
            return (
              <div key={r.id} className="bg-white border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{r.user_name}</h3>
                      {statusBadge(r.status)}
                      <span className="text-xs text-muted-foreground">{formatDate(r.requested_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.user_email}</p>
                    <p className="text-sm text-gray-700 mt-1">📚 {r.formation_titre}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      {r.payment_method ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#fff7ed] px-2 py-1 font-medium text-[#a84d16]">
                          <ModeIcon className="w-4 h-4" />
                          {PAYMENT_LABELS[r.payment_method]} · {amountOf(r)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 text-gray-600">
                          Mode de paiement non renseigné · {amountOf(r)}
                        </span>
                      )}
                      {r.payment_reference && (
                        <span className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                          Réf. {r.payment_reference}
                        </span>
                      )}
                    </div>

                    {r.phone && (
                      <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-green-700 mt-2 hover:underline">
                        <Phone className="w-3.5 h-3.5" />{r.phone}
                      </a>
                    )}
                    {r.message && <p className="text-sm text-gray-500 mt-1 italic">« {r.message} »</p>}
                    {r.status === 'rejected' && r.admin_note && (
                      <p className="text-sm text-red-600 mt-1">Motif du refus : {r.admin_note}</p>
                    )}
                    {sansPreuve && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-amber-700">
                        <AlertTriangle className="w-4 h-4" />
                        Aucune capture d’écran jointe : demandez-la sur WhatsApp avant de valider.
                      </p>
                    )}
                  </div>

                  {r.proof_url && (
                    <a href={r.proof_url} target="_blank" rel="noopener noreferrer"
                      className="group flex-shrink-0 text-center" title="Ouvrir la capture en grand">
                      {/* eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire, hors optimisation d'images */}
                      <img src={r.proof_url} alt={`Capture du paiement de ${r.user_name}`}
                        className="h-28 w-24 rounded-lg border object-cover group-hover:ring-2 group-hover:ring-[#e97e42]" />
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-[#a84d16]">
                        <ExternalLink className="w-3 h-3" />Voir la preuve
                      </span>
                    </a>
                  )}

                  {(r.status === 'pending' || r.status === 'rejected') && refusing !== r.id && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => decide(r, 'active')} disabled={busy === r.id}
                        className="bg-green-600 hover:bg-green-700 text-white">
                        {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <><Check className="w-4 h-4 mr-1" />{r.status === 'rejected' ? 'Valider finalement' : 'Valider le paiement'}</>
                        )}
                      </Button>
                      {r.status === 'pending' && (
                        <Button size="sm" variant="outline" disabled={busy === r.id}
                          onClick={() => { setRefusing(r.id); setNote('') }}>
                          <X className="w-4 h-4 mr-1" />Refuser
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {refusing === r.id && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <label htmlFor={`note-${r.id}`} className="text-sm font-medium text-gray-700">
                      Motif du refus (montré à l’élève)
                    </label>
                    <Textarea id={`note-${r.id}`} rows={2} maxLength={500} value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ex. paiement non reçu, montant incomplet, capture illisible…"
                      className="resize-none text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => decide(r, 'rejected')} disabled={busy === r.id}>
                        {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer le refus'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRefusing(null)} disabled={busy === r.id}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
