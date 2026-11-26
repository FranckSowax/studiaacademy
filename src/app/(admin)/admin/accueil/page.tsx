export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { HomeSlidesManager } from '@/components/admin/HomeSlidesManager'
import type { HomeSlide } from '@/lib/home/slides'

export default async function AdminAccueilPage() {
  await requireAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('home_slides')
    .select('id, ordre, titre, sous_titre, texte, cta_label, cta_href, image_url, is_active')
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Page d&apos;accueil — slides du hero</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Composez le carrousel affiché en haut du site : image de fond, textes, bouton, ordre et visibilité.
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

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Impossible de lire les slides ({error.message}). La migration{' '}
          <code className="font-mono">20261124120000_home_slides.sql</code> a-t-elle été appliquée ?
        </div>
      ) : (
        <HomeSlidesManager initial={(data ?? []) as HomeSlide[]} />
      )}
    </div>
  )
}
