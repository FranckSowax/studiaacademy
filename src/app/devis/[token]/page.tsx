export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { DevisView } from '@/components/entreprise/DevisView'
import { EMETTEUR } from '@/lib/entreprise/devis'
import { lireDevisPublic } from '@/lib/entreprise/devis-acces'
import { createAdminClient } from '@/lib/supabase/admin'

// Page privée par lien secret : jamais indexée, et le lien ne part pas
// dans l'en-tête Referer si le lecteur clique vers un autre site.
export const metadata: Metadata = {
  title: 'Devis — Studia Academy',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

/**
 * Devis remis au contact d'une entreprise, lisible sans compte grâce au
 * jeton du lien. Seul le devis correspondant à ce jeton est lu, côté serveur.
 */
export default async function DevisPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const resultat = await lireDevisPublic(createAdminClient(), token)

  if (!resultat) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#a84d16]">Studia Academy</p>
          <h1 className="mt-3 text-xl font-bold text-gray-900">Ce lien n’est plus valable</h1>
          <p className="mt-2 text-sm text-gray-600">
            Le devis a peut-être été remplacé par une version plus récente. Écrivez-nous pour le recevoir à nouveau :{' '}
            <a href={`mailto:${EMETTEUR.email}`} className="font-medium text-[#a84d16] underline underline-offset-2">{EMETTEUR.email}</a>.
          </p>
        </div>
      </main>
    )
  }

  const mention = resultat.statut === 'accepte' ? 'Accepté' : resultat.statut === 'refuse' ? 'Décliné' : null
  return (
    <main className="min-h-screen bg-slate-50 py-0 sm:py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-4xl overflow-hidden bg-white sm:rounded-2xl sm:border print:rounded-none print:border-0">
        <DevisView devis={resultat.contenu} mention={mention} />
      </div>
    </main>
  )
}
