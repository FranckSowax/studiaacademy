import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractSource } from '@/lib/formations/source-extract'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

type FileRef = { url: string; mime: string; name: string }

function isDocx(f: FileRef): boolean {
  return /word|officedocument/.test(f.mime) || /\.docx?$/i.test(f.name)
}

/**
 * Extrait et combine le texte de sources hétérogènes (URL + PDF/images + DOCX)
 * pour la création d'un Kahoot professeur.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const url: string | undefined = body.url?.trim() || undefined
  const files: FileRef[] = Array.isArray(body.files) ? body.files : []

  const parts: string[] = []
  const errors: string[] = []

  if (url) {
    try {
      parts.push(await extractSource({ type: 'url', url }))
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'URL illisible')
    }
  }

  const docxFiles = files.filter(isDocx)
  const ocrFiles = files.filter((f) => !isDocx(f))

  if (ocrFiles.length > 0) {
    try {
      parts.push(await extractSource({ type: 'pdf', files: ocrFiles }))
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'PDF/image illisible')
    }
  }
  for (const f of docxFiles) {
    try {
      parts.push(await extractSource({ type: 'docx', files: [f] }))
    } catch (e) {
      errors.push(`${f.name} : ${e instanceof Error ? e.message : 'DOC illisible'}`)
    }
  }

  const content = parts.filter((p) => p && p.trim()).join('\n\n---\n\n')
  return NextResponse.json({ content, errors })
}
