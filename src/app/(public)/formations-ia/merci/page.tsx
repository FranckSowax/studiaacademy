import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus, CheckCircle, MessageCircle, Smartphone } from 'lucide-react'
import {
  AIRTEL_MONEY_NUMBER,
  MOOV_MONEY_NUMBER,
  WHATSAPP_NUMBER,
  fcfa,
  formatDateFr,
  getFormation,
} from '@/lib/formations-ia'

export const metadata: Metadata = {
  title: 'Inscription enregistrée — Formations IA | Studia Academy',
  robots: { index: false },
}

export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string
    f?: string
    d?: string
    type?: string
    nb?: string
  }>
}) {
  const { code, f: slug, d: date, type, nb } = await searchParams
  const formation = slug ? getFormation(slug) : undefined
  const nbParticipants = Math.max(parseInt(nb ?? '1', 10) || 1, 1)
  const groupe = type === 'entreprise' && nbParticipants >= 3
  const prixUnitaire = formation
    ? groupe
      ? formation.prixGroupeFcfa ?? formation.prixFcfa
      : formation.prixFcfa
    : null
  const montant = prixUnitaire != null ? prixUnitaire * nbParticipants : null

  const waText = encodeURIComponent(
    `Bonjour Studia Academy, je viens de m'inscrire à la formation ${formation?.titre ?? ''}${date ? ` du ${formatDateFr(date)}` : ''}. Mon code d'inscription : ${code ?? '—'}. Je vous envoie la preuve de paiement Mobile Money.`
  )

  const icsHref = formation && date
    ? `/api/formations-ia/ics?titre=${encodeURIComponent(`Formation ${formation.titre} — Studia Academy`)}&date=${date}&lieu=${encodeURIComponent('Libreville')}`
    : null

  return (
    <div className="min-h-screen bg-[#f7f8fc] pt-16">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 md:py-16">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-[#141828]">
            Inscription enregistrée !
          </h1>
          <p className="mt-2 text-[#4a5068]">
            Il ne reste qu&apos;à régler par Mobile Money pour confirmer votre place.
          </p>
        </div>

        {/* Récap */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(20,24,40,0.10)]">
          <h2 className="font-heading text-sm font-extrabold uppercase tracking-wide text-[#4a5068]">
            Votre dossier
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            {formation && (
              <div className="flex justify-between gap-4">
                <dt className="text-[#4a5068]">Formation</dt>
                <dd className="font-bold text-[#141828]">
                  {formation.code} — {formation.titre}
                </dd>
              </div>
            )}
            {date && (
              <div className="flex justify-between gap-4">
                <dt className="text-[#4a5068]">Date</dt>
                <dd className="font-bold capitalize text-[#141828]">{formatDateFr(date)}</dd>
              </div>
            )}
            {nbParticipants > 1 && (
              <div className="flex justify-between gap-4">
                <dt className="text-[#4a5068]">Participants</dt>
                <dd className="font-bold text-[#141828]">{nbParticipants}</dd>
              </div>
            )}
            {montant != null && (
              <div className="flex justify-between gap-4 border-t border-[#e8eaf3] pt-2">
                <dt className="text-[#4a5068]">Montant à régler</dt>
                <dd className="font-heading text-lg font-extrabold text-[#141828]">
                  {fcfa(montant)}
                </dd>
              </div>
            )}
          </dl>

          {code && (
            <div className="mt-4 rounded-xl bg-[#141828] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f5b301]">
                Votre référence — à rappeler lors du paiement
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-white">
                {code}
              </p>
            </div>
          )}
        </div>

        {/* Instructions Mobile Money */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(20,24,40,0.10)]">
          <h2 className="flex items-center gap-2 font-heading text-sm font-extrabold uppercase tracking-wide text-[#4a5068]">
            <Smartphone className="h-4 w-4 text-[#f5b301]" />
            Régler par Mobile Money
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e8eaf3] p-4">
              <p className="text-xs font-bold uppercase text-red-500">Airtel Money</p>
              <p className="mt-1 font-mono text-lg font-extrabold text-[#141828]">
                {AIRTEL_MONEY_NUMBER}
              </p>
            </div>
            <div className="rounded-xl border border-[#e8eaf3] p-4">
              <p className="text-xs font-bold uppercase text-blue-600">Moov Money</p>
              <p className="mt-1 font-mono text-lg font-extrabold text-[#141828]">
                {MOOV_MONEY_NUMBER}
              </p>
            </div>
          </div>
          <ol className="mt-4 list-inside list-decimal space-y-1 text-sm text-[#4a5068]">
            <li>Envoyez le montant sur l&apos;un des deux numéros ci-dessus.</li>
            <li>
              Indiquez votre référence <b className="text-[#141828]">{code ?? 'STU-…'}</b> dans
              le motif (ou gardez la capture d&apos;écran).
            </li>
            <li>Confirmez sur WhatsApp — nous validons sous 24 h ouvrées.</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3.5 text-sm font-bold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Confirmer sur WhatsApp
          </a>
          {icsHref && (
            <a
              href={icsHref}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#141828] px-6 py-3.5 text-sm font-bold text-[#141828]"
            >
              <CalendarPlus className="h-4 w-4" />
              Ajouter au calendrier
            </a>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[#4a5068]">
          Une question ?{' '}
          <Link href="/formations-ia" className="font-bold text-[#141828] underline">
            Retour aux formations IA
          </Link>
        </p>
      </div>
    </div>
  )
}
