import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consumeRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { ocrCorrige } from '@/lib/mistral'
import { assertProjectStorageUrl, UnsafeUrlError } from '@/lib/security/safe-fetch'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * OCR d'un corrigé de référence (cours ou devoir déjà corrigé) via Pixtral.
 * Étape 2 du parcours de correction.
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

  const body = (await request.json().catch(() => null)) as { urls?: unknown } | null
  const urls = body?.urls
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }
  if (urls.length > 20) {
    return NextResponse.json({ error: 'Trop de fichiers (20 max)' }, { status: 400 })
  }
  try {
    for (const u of urls) assertProjectStorageUrl(String(u))
  } catch (error) {
    const message = error instanceof UnsafeUrlError ? error.message : 'URL de fichier invalide'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const content = await ocrCorrige(urls)
    return NextResponse.json({ content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur OCR'
    return NextResponse.json({ error: message, content: '' }, { status: 200 })
  }
}
