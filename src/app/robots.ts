import type { MetadataRoute } from 'next'

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.studia-academy.ga'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/dashboard/',
        '/api/',
        '/formations-ia/merci',
        '/formations-ia/inscription',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
