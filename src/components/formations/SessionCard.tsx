'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays, MapPin, Users, Clock, Loader2, CheckCircle, X, Ticket, Banknote, Smartphone, Upload, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, formatNumber } from '@/lib/utils'
import {
  PAYMENT_LABELS, PROOF_ACCEPT, PROOF_MAX_BYTES, type PaymentMethod,
} from '@/lib/formations/enrollment-payment'
import { EVENT_TYPE_LABELS, placesRestantes, typeEvenement } from '@/lib/events/rules'
import { afficherNumeroWhatsApp, WHATSAPP_NUMBER } from '@/lib/formations-ia'
import type { PresentielSession } from '@/types/formation'

const FUSEAU = 'Africa/Libreville'
const BOUTON = 'bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl'

/**
 * Carte d'un événement en présentiel dans l'agenda public : date, lieu,
 * places restantes, prix, et inscription en ligne (avec le mode de paiement
 * quand l'événement est payant).
 *
 * @example
 * <SessionCard session={s} airtelNumber="24107000000" />
 */
export function SessionCard({
  session,
  airtelNumber = null,
}: {
  session: PresentielSession
  /** Numéro Airtel Money de Studia (chiffres), s'il est configuré. */
  airtelNumber?: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', phone: '', reference: '' })
  const [method, setMethod] = useState<PaymentMethod>('airtel_money')
  const [proof, setProof] = useState<File | null>(null)

  const placesLeft = placesRestantes(session)
  const full = placesLeft <= 0
  const payant = session.prix_fcfa > 0
  const prix = payant ? `${formatNumber(session.prix_fcfa)} FCFA` : 'Gratuit'
  const date = new Date(session.date_debut)
  const partie = (options: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString('fr-FR', { timeZone: FUSEAU, ...options }).replace('.', '')
  const heure = date.toLocaleTimeString('fr-FR', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit' })

  const chooseProof = (file: File | null) => {
    setError(null)
    if (file && file.size > PROOF_MAX_BYTES) {
      setProof(null)
      setError('La capture d’écran dépasse 5 Mo. Réduisez-la puis réessayez.')
      return
    }
    setProof(file)
  }

  const submit = async () => {
    setError(null)
    if (payant && method === 'airtel_money' && !proof) {
      setError('Ajoutez la capture d’écran de votre paiement Airtel Money.')
      return
    }
    const body = new FormData()
    body.set('session_id', session.id)
    body.set('prenom', form.prenom)
    body.set('nom', form.nom)
    body.set('phone', form.phone)
    if (form.email) body.set('email', form.email)
    if (payant) {
      body.set('method', method)
      if (method === 'airtel_money') {
        if (form.reference) body.set('reference', form.reference)
        if (proof) body.set('proof', proof)
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/evenements/inscription', { method: 'POST', body })
      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null
      if (res.ok && data?.success) {
        setDone(true)
        setOpen(false)
        router.refresh()
      } else {
        setError(data?.error || 'Réservation impossible pour le moment. Réessayez.')
      }
    } catch {
      setError('Connexion interrompue. Vérifiez votre réseau puis réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const modes: { id: PaymentMethod; icon: typeof Banknote }[] = [
    { id: 'airtel_money', icon: Smartphone },
    { id: 'cash', icon: Banknote },
  ]

  return (
    <article
      id={`evenement-${session.id}`}
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-[#f0ebe3] bg-white transition-shadow hover:shadow-md target:ring-2 target:ring-[#e97e42]"
    >
      <div className="flex flex-col sm:flex-row">
        {session.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element -- adresse libre saisie par l'admin (hôte non prévu par next/image)
          <img src={session.cover_image} alt="" loading="lazy" className="h-40 w-full object-cover sm:h-auto sm:w-48" />
        )}

        <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center">
          {/* Date */}
          <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-[#fff7ed]">
            <span className="font-heading text-xl font-extrabold leading-none text-[#e97e42]">{partie({ day: 'numeric' })}</span>
            <span className="text-xs uppercase text-[#a84d16]">{partie({ month: 'short' })}</span>
          </div>

          {/* Infos */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#a84d16]">
              {EVENT_TYPE_LABELS[typeEvenement(session)]}
              {session.categorie ? ` · ${session.categorie}` : ''}
            </p>
            <h3 className="font-heading font-bold text-gray-900">{session.titre}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {partie({ weekday: 'short', day: 'numeric', month: 'long' })} · {heure}
              </span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{session.lieu || session.ville}</span>
              {session.formateur_nom && (
                <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{session.formateur_nom}</span>
              )}
              <span className={cn('inline-flex items-center gap-1', full ? 'text-red-600' : placesLeft <= 3 ? 'text-amber-700' : '')}>
                <Users className="h-3.5 w-3.5" />
                {full ? 'Complet' : `${placesLeft} place${placesLeft > 1 ? 's' : ''} restante${placesLeft > 1 ? 's' : ''}`}
              </span>
            </div>
            {session.description && <p className="mt-2 line-clamp-2 text-sm text-gray-500">{session.description}</p>}
          </div>

          {/* Prix + CTA */}
          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <span className="whitespace-nowrap font-bold text-[#a84d16]">{prix}</span>
            {done ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle className="h-4 w-4" />
                {payant ? 'Demande envoyée' : 'Place réservée'}
              </span>
            ) : (
              <Button onClick={() => setOpen(true)} disabled={full} className={cn(BOUTON, 'whitespace-nowrap disabled:opacity-50')}>
                <Ticket className="mr-1.5 h-4 w-4" />
                {full ? 'Complet' : payant ? 'S’inscrire' : 'Réserver'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {done && (
        <p role="status" className="border-t border-[#f0ebe3] bg-green-50 px-5 py-3 text-sm text-green-800">
          {payant && method === 'airtel_money' &&
            'Votre place est retenue. Elle est confirmée dès que l’équipe a vérifié votre paiement : vous recevez un message WhatsApp.'}
          {payant && method === 'cash' &&
            `Votre place est retenue. Réglez ${prix} en espèces à Studia Academy pour la confirmer.`}
          {!payant && 'Votre place est réservée. Vous recevez une confirmation sur WhatsApp.'}
        </p>
      )}

      {/* Fenêtre d'inscription */}
      {open && !done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
          <div role="dialog" aria-modal="true" aria-labelledby={`resa-${session.id}`} className="my-auto w-full max-w-md rounded-3xl bg-white p-6">
            <div className="mb-1 flex items-center justify-between">
              <h2 id={`resa-${session.id}`} className="font-heading font-bold text-gray-900">
                {payant ? 'M’inscrire' : 'Réserver ma place'}
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-5 flex items-start gap-1.5 text-sm text-gray-500">
              <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#e97e42]" />
              <span>{session.titre} · {partie({ weekday: 'long', day: 'numeric', month: 'long' })} à {heure}</span>
            </p>

            <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`prenom-${session.id}`} className="text-sm text-gray-700">Prénom *</Label>
                  <Input id={`prenom-${session.id}`} autoComplete="given-name" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="rounded-xl border-[#e2e8f0]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`nom-${session.id}`} className="text-sm text-gray-700">Nom *</Label>
                  <Input id={`nom-${session.id}`} autoComplete="family-name" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="rounded-xl border-[#e2e8f0]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`tel-${session.id}`} className="text-sm text-gray-700">WhatsApp *</Label>
                <Input id={`tel-${session.id}`} type="tel" autoComplete="tel" placeholder="+241 07 XX XX XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border-[#e2e8f0]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`email-${session.id}`} className="text-sm text-gray-700">Email (optionnel)</Label>
                <Input id={`email-${session.id}`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border-[#e2e8f0]" />
              </div>

              {payant && (
                <>
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-gray-900">Paiement · {prix}</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {modes.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={method === m.id}
                          onClick={() => { setMethod(m.id); setError(null) }}
                          className={cn(
                            'flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition-colors',
                            method === m.id ? 'border-[#e97e42] bg-[#fff7ed] ring-1 ring-[#e97e42]' : 'border-[#e2e8f0] hover:border-[#e97e42]/50',
                          )}
                        >
                          <m.icon className="h-5 w-5 flex-shrink-0 text-[#e97e42]" />
                          {PAYMENT_LABELS[m.id]}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {method === 'airtel_money' ? (
                    <>
                      <p className="rounded-xl bg-[#fbf8f3] p-3 text-xs text-gray-700">
                        Envoyez <strong>{prix}</strong> par Airtel Money
                        {airtelNumber ? (
                          <> au <strong className="whitespace-nowrap">{afficherNumeroWhatsApp(airtelNumber)}</strong> (Studia Academy)</>
                        ) : (
                          <>
                            {' '}au numéro que nous vous donnons sur{' '}
                            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#a84d16] underline">WhatsApp</a>
                          </>
                        )}
                        , puis joignez la capture d’écran de la confirmation.
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor={`preuve-${session.id}`} className="text-sm text-gray-700">Capture d’écran du paiement *</Label>
                        <label htmlFor={`preuve-${session.id}`} className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#e97e42]/60 p-3 text-sm hover:bg-[#fff7ed]">
                          <Upload className="h-4 w-4 flex-shrink-0 text-[#e97e42]" />
                          <span className="truncate">{proof ? proof.name : 'Choisir une image (JPG, PNG, WebP · 5 Mo max)'}</span>
                        </label>
                        <input id={`preuve-${session.id}`} type="file" accept={PROOF_ACCEPT} className="sr-only" onChange={(e) => chooseProof(e.target.files?.[0] ?? null)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ref-${session.id}`} className="text-sm text-gray-700">Référence de la transaction (optionnel)</Label>
                        <Input id={`ref-${session.id}`} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="rounded-xl border-[#e2e8f0]" />
                      </div>
                    </>
                  ) : (
                    <p className="rounded-xl bg-[#fbf8f3] p-3 text-xs text-gray-700">
                      Votre place est retenue. Passez régler <strong>{prix}</strong> en espèces à Studia Academy, à Libreville,
                      pour la confirmer.
                    </p>
                  )}
                </>
              )}

              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

              <Button onClick={submit} disabled={!form.prenom.trim() || !form.nom.trim() || !form.phone.trim() || loading} className={cn(BOUTON, 'w-full')}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : payant ? 'Envoyer mon inscription' : 'Confirmer ma réservation'}
              </Button>
              <p className="text-center text-xs text-gray-400">
                {payant ? 'Votre place est confirmée après validation du paiement.' : 'Vous recevrez une confirmation WhatsApp.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
