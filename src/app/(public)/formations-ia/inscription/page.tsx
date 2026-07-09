import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FormInscription } from '@/components/formations-ia/FormInscription'
import { formationsIA } from '@/lib/formations-ia'
import { getSessionsBySlug } from '@/lib/formations-ia-data'

export const metadata: Metadata = {
  title: 'Inscription — Formations IA | Studia Academy',
  description:
    'Inscrivez-vous à une formation IA Studia Academy à Libreville. Paiement Mobile Money, confirmation WhatsApp.',
  robots: { index: false },
}

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; session?: string }>
}) {
  const { f, session } = await searchParams
  const sessionsBySlug = await getSessionsBySlug()

  // F4 : pas d'inscription en ligne — flux "entretien"
  const formations = formationsIA
    .filter((x) => !x.executive)
    .map((x) => ({
      slug: x.slug,
      code: x.code,
      titre: x.titre,
      prixFcfa: x.prixFcfa,
      prixGroupeFcfa: x.prixGroupeFcfa,
      from: x.from,
    }))

  return (
    <div className="min-h-screen bg-[#f7f8fc] pt-16">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f5b301]">
          Formations IA · Inscription
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-[#141828] md:text-4xl">
          Réservez votre place
        </h1>
        <p className="mt-3 text-[#4a5068]">
          2 minutes suffisent. Votre dossier est créé immédiatement et le
          règlement se fait par Mobile Money (Airtel ou Moov), confirmé par
          notre équipe sur WhatsApp.
        </p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(20,24,40,0.10)] md:p-8">
          <Suspense fallback={null}>
            <FormInscription
              formations={formations}
              sessionsBySlug={sessionsBySlug}
              initialSlug={f}
              initialSessionId={session}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
