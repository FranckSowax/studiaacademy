// ============================================
// Liens insérables dans une réponse (serveur uniquement)
// ============================================
// Pages du site et formations actives, construits depuis la configuration et
// la base : aucune URL en dur dans l'interface.

import { createAdminClient } from '@/lib/supabase/admin'
import { getAppConfig } from '@/lib/config/app-config'

export interface InsertableLink {
  label: string
  url: string
  group: 'Pages' | 'Formations'
}

const SITE_PAGES: { label: string; path: string }[] = [
  { label: 'Accueil', path: '/' },
  { label: 'Catalogue des formations IA', path: '/formations-ia' },
  { label: 'Inscription à une formation', path: '/formations-ia/inscription' },
  { label: 'Offre entreprises', path: '/formations-ia/entreprises' },
  { label: 'Tarifs', path: '/pricing' },
  { label: 'Contact', path: '/contact' },
]

export async function getInsertableLinks(): Promise<InsertableLink[]> {
  const { siteUrl } = getAppConfig().brand
  const links: InsertableLink[] = SITE_PAGES.map((p) => ({
    label: p.label,
    url: `${siteUrl}${p.path === '/' ? '' : p.path}`,
    group: 'Pages',
  }))

  const admin = createAdminClient()
  const { data } = await admin
    .from('fia_formations')
    .select('slug, titre')
    .eq('actif', true)
    .order('titre', { ascending: true })
    .limit(50)
  for (const f of data ?? []) {
    links.push({ label: String(f.titre), url: `${siteUrl}/formations-ia/${f.slug}`, group: 'Formations' })
  }
  return links
}
