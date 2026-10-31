import { NextRequest, NextResponse } from 'next/server'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { readLibraryFile } from '@/lib/inbox/library'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Aperçu d'un fichier de la médiathèque (bucket privé), réservé à l'équipe. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })

  const file = await readLibraryFile(id)
  if (!file) return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })

  // Le type a été vérifié sur le contenu à l'ajout ; le PDF est téléchargé, jamais affiché en ligne.
  const inline = file.mime.startsWith('image/') || file.mime === 'video/mp4'
  return new Response(Buffer.from(file.bytes), {
    headers: {
      'Content-Type': file.mime,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${file.filename.replace(/[^\w.\- ]+/g, '_')}"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
}
