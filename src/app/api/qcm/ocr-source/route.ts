import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ocrSourceCours } from '@/lib/mistral'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Extrait le texte d'un PDF/image de cours via Pixtral.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { urls } = (await request.json()) as { urls: string[] }

  try {
    const content = await ocrSourceCours(urls)
    return NextResponse.json({ content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur OCR'
    return NextResponse.json({ error: message, content: '' }, { status: 200 })
  }
}
