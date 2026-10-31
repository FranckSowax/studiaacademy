import { NextRequest, NextResponse } from 'next/server'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { addToLibrary, LIBRARY_MAX_BYTES, LibraryUploadError, listLibrary } from '@/lib/inbox/library'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Médiathèque : liste des fichiers envoyables. */
export async function GET() {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  try {
    return NextResponse.json({ items: await listLibrary() })
  } catch {
    return NextResponse.json({ error: 'Médiathèque indisponible (migration appliquée ?)' }, { status: 503 })
  }
}

/** Téléversement depuis l'ordinateur (multipart : file, caption). */
export async function POST(request: NextRequest) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > LIBRARY_MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'Fichier trop volumineux (16 Mo max)' }, { status: 413 })
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  const caption = form?.get('caption')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })

  try {
    const item = await addToLibrary(file, typeof caption === 'string' ? caption : null, me)
    return NextResponse.json({ item })
  } catch (error) {
    if (error instanceof LibraryUploadError) return NextResponse.json({ error: error.message }, { status: 400 })
    console.error('[inbox-library]', error instanceof Error ? error.message : 'erreur')
    return NextResponse.json({ error: 'Téléversement impossible' }, { status: 500 })
  }
}
