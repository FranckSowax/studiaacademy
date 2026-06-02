import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ocrDocuments, type OcrFile } from '@/lib/mistral/document-ocr'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Extrait le texte de PDF/images de cours via l'OCR dédié Mistral.
 * Gère les PDF multi-pages (découpe par lots) et le manuscrit.
 *
 * Accepte soit { files: [{ url, mime, name }] } (recommandé),
 * soit { urls: string[] } (rétro-compat, traités comme images).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = (await request.json()) as {
    files?: OcrFile[]
    urls?: string[]
  }

  const files: OcrFile[] =
    body.files ??
    (body.urls ?? []).map((url) => ({ url, mime: 'image/jpeg' }))

  if (files.length === 0) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }

  try {
    const content = await ocrDocuments(files)
    return NextResponse.json({ content, length: content.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur OCR'
    return NextResponse.json({ error: message, content: '' }, { status: 200 })
  }
}
