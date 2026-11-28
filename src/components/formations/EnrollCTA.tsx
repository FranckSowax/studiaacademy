'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Loader2, ArrowRight, CheckCircle, Clock, PlayCircle, Banknote, Smartphone, Upload, XCircle, ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatNumber } from '@/lib/utils'
import { enrollFree } from '@/lib/formations/actions'
import {
  PAYMENT_LABELS,
  PROOF_ACCEPT,
  PROOF_MAX_BYTES,
  type PaymentMethod,
} from '@/lib/formations/enrollment-payment'
import { afficherNumeroWhatsApp, WHATSAPP_NUMBER } from '@/lib/formations-ia'
import type { EnrollmentStatus } from '@/types/formation'

interface Props {
  formationId: string
  formationSlug: string
  isLoggedIn: boolean
  enrollmentStatus: EnrollmentStatus | null
  isFree?: boolean
  /** Vrai si ce compte (ou ce visiteur) n'a pas encore accès à la formation. */
  accessClosed?: boolean
  /** Prix à régler (formation payante). */
  prixFcfa?: number
  /** Mode de paiement de la demande en cours ou refusée. */
  paymentMethod?: PaymentMethod | null
  /** Motif laissé par l'admin lors d'un refus. */
  adminNote?: string | null
  /** Numéro Airtel Money de Studia (chiffres), s'il est configuré. */
  airtelNumber?: string | null
}

const BOUTON = 'w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl'

export function EnrollCTA({
  formationId,
  formationSlug,
  isLoggedIn,
  enrollmentStatus,
  isFree = false,
  accessClosed = false,
  prixFcfa = 0,
  paymentMethod = null,
  adminNote = null,
  airtelNumber = null,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<PaymentMethod | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('airtel_money')
  const [form, setForm] = useState({ phone: '', reference: '', message: '' })
  const [proof, setProof] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Formation pas encore ouverte à ce compte (décidé côté serveur) : aucun bouton
  // d'accès, même avec une inscription existante.
  if (accessClosed) {
    return (
      <div className="rounded-xl border border-[#f0ebe3] bg-[#fbf8f3] p-4 text-center">
        <Clock className="mx-auto mb-2 h-6 w-6 text-[#e97e42]" />
        <p className="text-sm font-semibold text-gray-900">Bientôt disponible</p>
        <p className="mt-1 text-xs text-gray-600">Les inscriptions à cette formation ouvriront prochainement.</p>
        {!isLoggedIn && (
          <Link
            href={`/login?redirect=/formations/en-ligne/${formationSlug}`}
            className="mt-3 inline-block text-sm font-medium text-[#a84d16] hover:underline"
          >
            Vous avez déjà un accès ? Se connecter
          </Link>
        )}
      </div>
    )
  }

  // Accès accordé → bouton commencer
  if (enrollmentStatus === 'active' || enrollmentStatus === 'completed') {
    return (
      <Button asChild className={cn(BOUTON, 'py-6 text-base font-semibold')}>
        {/* <a> et non <Link> : /suivre peut délivrer un ticket Studia Live à usage unique. */}
        <a href={`/formations/${formationSlug}/suivre`}>
          <PlayCircle className="w-5 h-5 mr-2" />
          Commencer la formation
        </a>
      </Button>
    )
  }

  // ── Formation GRATUITE : accès direct, juste un compte Studia ──
  if (isFree) {
    if (!isLoggedIn) {
      return (
        <div className="space-y-2">
          <Link href={`/signup?redirect=/formations/en-ligne/${formationSlug}`}>
            <Button className={cn(BOUTON, 'py-6 text-base font-semibold')}>
              Créer un compte gratuit
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href={`/login?redirect=/formations/en-ligne/${formationSlug}`} className="block text-center text-sm text-gray-500 hover:text-[#e97e42]">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      )
    }
    const startFree = async () => {
      setLoading(true)
      setError(null)
      const res = await enrollFree(formationId)
      setLoading(false)
      if (res.success) window.location.assign(`/formations/${formationSlug}/suivre`)
      else setError(res.error || 'Erreur')
    }
    return (
      <div className="space-y-2">
        <Button onClick={startFree} disabled={loading} className={cn(BOUTON, 'py-6 text-base font-semibold')}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlayCircle className="w-5 h-5 mr-2" />Accéder gratuitement</>}
        </Button>
        {error && <p role="alert" className="text-center text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  // ── Formation PAYANTE ──
  const prix = `${formatNumber(prixFcfa)} FCFA`
  const pendingMethod = sent ?? (enrollmentStatus === 'pending' ? paymentMethod : null)

  // Demande en attente de validation par l'équipe
  if (sent || enrollmentStatus === 'pending') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-amber-800">
          {pendingMethod === 'airtel_money' ? 'Paiement en cours de vérification' : 'Inscription enregistrée'}
        </p>
        <p className="text-xs text-amber-700 mt-1">
          {pendingMethod === 'airtel_money' &&
            'Nous avons bien reçu votre capture d’écran. Votre accès est ouvert dès que l’équipe a vérifié le paiement, sous 24 h.'}
          {pendingMethod === 'cash' &&
            `Passez régler ${prix} en espèces à Studia Academy (Libreville). Votre accès est ouvert dès que l’équipe a encaissé.`}
          {!pendingMethod && 'Notre équipe vous recontacte sous 24 h pour finaliser votre accès.'}
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs font-medium text-amber-900 underline"
        >
          Une question ? WhatsApp {afficherNumeroWhatsApp(WHATSAPP_NUMBER)}
        </a>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-2">
        <Link href={`/login?redirect=/formations/en-ligne/${formationSlug}`}>
          <Button className={cn(BOUTON, 'py-6 text-base font-semibold')}>
            Se connecter pour s&apos;inscrire
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link href={`/signup?redirect=/formations/en-ligne/${formationSlug}`} className="block text-center text-sm text-gray-500 hover:text-[#e97e42]">
          Pas encore de compte ? En créer un
        </Link>
      </div>
    )
  }

  const refused = enrollmentStatus === 'rejected' && (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-left">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700">
        <XCircle className="h-4 w-4" />
        Paiement non validé
      </p>
      <p className="mt-1 text-xs text-red-700">
        {adminNote || 'Votre paiement n’a pas pu être confirmé.'} Vous pouvez envoyer une nouvelle demande.
      </p>
    </div>
  )

  if (!open) {
    return (
      <div className="space-y-3">
        {refused}
        <Button onClick={() => setOpen(true)} className={cn(BOUTON, 'py-6 text-base font-semibold')}>
          {enrollmentStatus === 'rejected' ? 'Refaire ma demande' : 'S’inscrire'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-center text-xs text-gray-500">Paiement par Airtel Money ou en espèces sur place</p>
      </div>
    )
  }

  const chooseProof = (file: File | null) => {
    setError(null)
    const accepted = file && file.size <= PROOF_MAX_BYTES ? file : null
    if (file && !accepted) setError('La capture d’écran dépasse 5 Mo. Réduisez-la puis réessayez.')
    setProof(accepted)
    // Aperçu local : on libère l'adresse précédente avant d'en créer une nouvelle.
    if (preview) URL.revokeObjectURL(preview)
    setPreview(accepted ? URL.createObjectURL(accepted) : null)
  }

  const submit = async () => {
    setError(null)
    if (method === 'airtel_money' && !proof) {
      setError('Ajoutez la capture d’écran de votre paiement Airtel Money.')
      return
    }
    const body = new FormData()
    body.set('formation_id', formationId)
    body.set('phone', form.phone)
    body.set('method', method)
    if (form.message) body.set('message', form.message)
    if (method === 'airtel_money') {
      if (form.reference) body.set('reference', form.reference)
      if (proof) body.set('proof', proof)
    }

    setLoading(true)
    try {
      const res = await fetch('/api/formations/inscription', { method: 'POST', body })
      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null
      if (res.ok && data?.success) {
        setSent(method)
        router.refresh()
      } else {
        setError(data?.error || 'Inscription impossible pour le moment. Réessayez.')
      }
    } catch {
      setError('Connexion interrompue. Vérifiez votre réseau puis réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const modes: { id: PaymentMethod; icon: typeof Banknote; aide: string }[] = [
    { id: 'airtel_money', icon: Smartphone, aide: 'Payez depuis votre téléphone' },
    { id: 'cash', icon: Banknote, aide: 'Réglez à Studia, Libreville' },
  ]

  return (
    <div className="space-y-4">
      {refused}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-gray-900">1. Mode de paiement</legend>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={method === m.id}
              onClick={() => {
                setMethod(m.id)
                setError(null)
              }}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                method === m.id
                  ? 'border-[#e97e42] bg-[#fff7ed] ring-1 ring-[#e97e42]'
                  : 'border-[#e2e8f0] bg-white hover:border-[#e97e42]/50',
              )}
            >
              <m.icon className="mb-1 h-5 w-5 text-[#e97e42]" />
              <span className="block text-sm font-semibold text-gray-900">{PAYMENT_LABELS[m.id]}</span>
              <span className="block text-xs text-gray-500">{m.aide}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="rounded-xl border border-[#f0ebe3] bg-[#fbf8f3] p-3 text-sm text-gray-700">
        <p className="mb-1 font-semibold text-gray-900">2. {method === 'airtel_money' ? 'Payez' : 'Comment régler'}</p>
        {method === 'airtel_money' ? (
          <ol className="list-decimal space-y-1 pl-4 text-xs">
            <li>
              Envoyez <strong>{prix}</strong> par Airtel Money
              {airtelNumber ? (
                <> au <strong className="whitespace-nowrap">{afficherNumeroWhatsApp(airtelNumber)}</strong> (Studia Academy).</>
              ) : (
                <>
                  {' '}au numéro que nous vous donnons sur{' '}
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#a84d16] underline">
                    WhatsApp
                  </a>
                  .
                </>
              )}
            </li>
            <li>Faites une capture d’écran du message de confirmation.</li>
            <li>Ajoutez-la ci-dessous : l’équipe vérifie et ouvre votre accès.</li>
          </ol>
        ) : (
          <p className="text-xs">
            Passez régler <strong>{prix}</strong> en espèces à Studia Academy, à Libreville. L’équipe valide votre
            inscription dès l’encaissement et vous prévient sur WhatsApp.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">3. Vos informations</p>
        <div className="space-y-1.5">
          <label htmlFor="enroll-phone" className="text-sm text-gray-700">Votre WhatsApp *</label>
          <Input
            id="enroll-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+241 07 XX XX XX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
          />
        </div>

        {method === 'airtel_money' && (
          <>
            <div className="space-y-1.5">
              <label htmlFor="enroll-proof" className="text-sm text-gray-700">Capture d’écran du paiement *</label>
              <label
                htmlFor="enroll-proof"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#e97e42]/60 bg-white p-3 hover:bg-[#fff7ed]"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:), hors optimisation d'images
                  <img src={preview} alt="Aperçu de la capture" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#fff7ed]">
                    <ImageIcon className="h-6 w-6 text-[#e97e42]" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    <Upload className="h-4 w-4" />
                    {proof ? 'Changer la capture' : 'Choisir une image'}
                  </span>
                  <span className="block truncate text-xs text-gray-500">
                    {proof ? proof.name : 'JPG, PNG ou WebP · 5 Mo maximum'}
                  </span>
                </span>
              </label>
              <input
                id="enroll-proof"
                type="file"
                accept={PROOF_ACCEPT}
                className="sr-only"
                onChange={(e) => chooseProof(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="enroll-ref" className="text-sm text-gray-700">Référence de la transaction (optionnel)</label>
              <Input
                id="enroll-ref"
                placeholder="Ex. PP240101.1234.A56789"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
              />
            </div>
          </>
        )}

        <Textarea
          aria-label="Message à l'équipe (optionnel)"
          placeholder="Une question ? (optionnel)"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={2}
          className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42] resize-none text-sm"
        />
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <Button onClick={submit} disabled={!form.phone.trim() || loading} className={BOUTON}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            {method === 'airtel_money' ? 'Envoyer ma preuve de paiement' : 'Confirmer mon inscription'}
          </>
        )}
      </Button>
      <p className="text-xs text-gray-400 text-center">
        Votre accès est ouvert après validation du paiement par l’équipe.
      </p>
    </div>
  )
}
