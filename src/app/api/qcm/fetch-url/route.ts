import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consumeRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { safeFetch, UnsafeUrlError } from '@/lib/security/safe-fetch'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Récupère le contenu texte d'une URL (extraction basique du HTML).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!(await consumeRateLimit(`ai:${user.id}`, RATE_LIMITS.aiPerUser))) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une heure.' }, { status: 429 })
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null
  if (typeof body?.url !== 'string' || body.url.length > 2048) {
    return NextResponse.json({ error: 'URL invalide', content: '' }, { status: 400 })
  }

  try {
    const res = await safeFetch(body.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (StudiaAcademy Bot)' },
    })
    if (!res.ok) throw new Error('Page inaccessible')
    const html = res.text()

    // Extraction texte : retirer scripts/styles, puis balises
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000)

    return NextResponse.json({ content: text })
  } catch (error) {
    // Messages contrôlés uniquement : ne pas renvoyer d'erreur réseau brute.
    const message =
      error instanceof UnsafeUrlError || (error instanceof Error && error.message === 'Page inaccessible')
        ? error.message
        : 'Page inaccessible'
    return NextResponse.json({ error: message, content: '' }, { status: 200 })
  }
}
