import { NextRequest, NextResponse } from 'next/server'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { addUploadedPhoto, RequestError } from '@/lib/inbox/requests'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Ajoute une photo téléversée (multipart, champ « file »). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Recherche introuvable' }, { status: 404 })

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Photo manquante' }, { status: 400 })

  try {
    return NextResponse.json({ request: await addUploadedPhoto(id, file) }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestError) {
      return NextResponse.json({ error: error.message }, { status: error.code === 'NOT_FOUND' ? 404 : 400 })
    }
    console.error('[inbox-requests]', error instanceof Error ? error.message : 'erreur')
    return NextResponse.json({ error: 'Téléversement impossible' }, { status: 500 })
  }
}
