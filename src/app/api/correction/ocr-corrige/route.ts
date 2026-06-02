import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ocrCorrige } from '@/lib/mistral'

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

  const { urls } = (await request.json()) as { urls: string[] }
  if (!urls?.length) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }

  try {
    const content = await ocrCorrige(urls)
    return NextResponse.json({ content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur OCR'
    return NextResponse.json({ error: message, content: '' }, { status: 200 })
  }
}
