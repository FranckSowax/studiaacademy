import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { url } = (await request.json()) as { url: string }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (StudiaAcademy Bot)' },
    })
    if (!res.ok) throw new Error('Page inaccessible')
    const html = await res.text()

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
    const message = error instanceof Error ? error.message : 'Erreur'
    return NextResponse.json({ error: message, content: '' }, { status: 200 })
  }
}
