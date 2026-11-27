export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { HomeSlidesManager } from '@/components/admin/HomeSlidesManager'
import { HomeEventsManager, type EvenementAccueil } from '@/components/admin/HomeEventsManager'
import { COLONNES_REGLAGES, normaliserReglages } from '@/lib/home/event-settings'
import type { HomeSlide } from '@/lib/home/slides'

/** Même borne que la page d'accueil : un événement commencé depuis moins de 24 h reste affiché. */
const limiteAVenir = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString()

export default async function AdminAccueilPage() {
  await requireAdmin()
  const admin = createAdminClient()
  const [slides, evenements, reglages] = await Promise.all([
    admin
      .from('home_slides')
      .select('id, ordre, titre, sous_titre, texte, cta_label, cta_href, image_url, is_active')
      .order('ordre', { ascending: true })
      .order('created_at', { ascending: true }),
    admin
      .from('presentiel_sessions')
      .select('*')
      .eq('is_published', true)
      .gte('date_debut', limiteAVenir())
      .order('date_debut', { ascending: true }),
    admin.from('home_settings').select(COLONNES_REGLAGES).maybeSingle(),
  ])

  return (
    <div className="max-w-3xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Page d&apos;accueil</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Composez le carrousel du haut de page et choisissez les événements mis en avant.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-xl border border-[#e97e42] px-4 py-2 text-sm font-medium text-[#a84d16] hover:bg-[#fff7ed]"
        >
          <ExternalLink className="h-4 w-4" />
          Voir le site
        </Link>
      </div>

      {/* Slides du hero */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Slides du hero</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Image de fond, textes, bouton, ordre et visibilité du carrousel.
          </p>
        </div>
        {slides.error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Impossible de lire les slides ({slides.error.message}). La migration{' '}
            <code className="font-mono">20261124120000_home_slides.sql</code> a-t-elle été appliquée ?
          </div>
        ) : (
          <HomeSlidesManager initial={(slides.data ?? []) as HomeSlide[]} />
        )}
      </section>

      {/* Événements */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Événements en page d&apos;accueil</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Réglez la section « Événements en présentiel » : nombre de dates, journées IA et événements affichés.
          </p>
        </div>
        {reglages.error && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Les réglages ne peuvent pas encore être enregistrés : appliquez la migration{' '}
            <code className="font-mono">20261129120000_events_home.sql</code>. En attendant, l&apos;accueil utilise les
            valeurs par défaut.
          </div>
        )}
        {evenements.error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Impossible de lire les événements ({evenements.error.message}).
          </div>
        ) : (
          <HomeEventsManager
            reglages={normaliserReglages(reglages.data)}
            evenements={(evenements.data ?? []) as EvenementAccueil[]}
          />
        )}
      </section>
    </div>
  )
}
