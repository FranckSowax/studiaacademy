import { NextRequest, NextResponse } from 'next/server'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { readUploadedPhoto } from '@/lib/inbox/requests'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const IMAGE_TYPES = /^image\/(jpeg|png|webp)$/

/** Relais d'une photo téléversée sur une recherche (bucket privé). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; index: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { id, index } = await params
  const i = Number(index)
  if (!UUID_RE.test(id) || !Number.isInteger(i) || i < 0 || i > 9) {
    return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 })
  }
  const photo = await readUploadedPhoto(id, i).catch(() => null)
  if (!photo || !IMAGE_TYPES.test(photo.mime)) return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 })

  return new Response(Buffer.from(photo.bytes), {
    status: 200,
    headers: {
      'Content-Type': photo.mime,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
}
