export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { BilanView } from '@/components/entreprise/BilanView'
import { lireBilanPublic } from '@/lib/entreprise/bilan-acces'
import { CONTACT_STUDIA } from '@/lib/entreprise/bilan'
import { createAdminClient } from '@/lib/supabase/admin'

// Page privée par lien secret : jamais indexée, et le lien ne part pas
// dans l'en-tête Referer si le lecteur clique vers un autre site.
export const metadata: Metadata = {
  title: 'Bilan de formation — Studia Academy',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

/**
 * Bilan de formation remis à la direction d'une entreprise, lisible sans
 * compte grâce au jeton du lien. Seul le bilan correspondant à ce jeton
 * est lu (côté serveur) ; il ne contient que des données agrégées.
 */
export default async function BilanPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const resultat = await lireBilanPublic(createAdminClient(), token)

  if (!resultat) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#a84d16]">Studia Academy</p>
          <h1 className="mt-3 text-xl font-bold text-gray-900">Ce lien n’est plus valable</h1>
          <p className="mt-2 text-sm text-gray-600">
            Le bilan a peut-être expiré ou été remplacé par une version plus récente. Écrivez-nous pour en recevoir un nouveau :{' '}
            <a href={`mailto:${CONTACT_STUDIA}`} className="font-medium text-[#a84d16] underline underline-offset-2">{CONTACT_STUDIA}</a>.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 py-0 sm:py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-4xl overflow-hidden bg-white sm:rounded-2xl sm:border print:rounded-none print:border-0">
        <BilanView bilan={resultat.bilan} expireLe={resultat.expire_le} />
      </div>
    </main>
  )
}
