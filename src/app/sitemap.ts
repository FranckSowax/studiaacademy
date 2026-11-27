import type { MetadataRoute } from 'next'
import { formationsIA } from '@/lib/formations-ia'
import { SECTEURS } from '@/lib/secteurs'

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.studia-academy.ga'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/formations-ia',
    '/formations-ia/entreprises',
    '/formations',
    '/outils',
    '/entreprise',
    '/institut-francais',
    '/studia-labs',
    '/contact',
    '/about',
    '/pricing',
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : path.startsWith('/formations-ia') ? 0.9 : 0.7,
  }))

  const formationRoutes = formationsIA.map((f) => ({
    url: `${BASE_URL}/formations-ia/${f.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Fiches des formations « Boostez votre métier », une par secteur.
  const metierRoutes = SECTEURS.map((s) => ({
    url: `${BASE_URL}/entreprise/secteur/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...formationRoutes, ...metierRoutes]
}
