import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { fetchWahaFile } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

const REF_RE = /^[0-9a-f]{32}$/
/** Types affichables en ligne ; tout le reste est servi en téléchargement. */
const INLINE_TYPES = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|3gpp)|audio\/(ogg|mpeg|mp4|aac|amr|webm))/

/**
 * Relais du fichier complet d'un média reçu/envoyé. Vérifie l'accès à la
 * messagerie et que le message est suivi en base ; la clé WAHA reste côté
 * serveur. Jamais de cache partagé sur la photo d'un client.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { ref } = await params
  if (!REF_RE.test(ref)) return NextResponse.json({ error: 'Média introuvable' }, { status: 404 })

  const admin = createAdminClient()
  const { data: msg } = await admin
    .from('wa_messages')
    .select('media_url, media_mimetype, filename')
    .eq('public_ref', ref)
    .maybeSingle()
  if (!msg?.media_url) return NextResponse.json({ error: 'Média introuvable' }, { status: 404 })

  const upstream = await fetchWahaFile(msg.media_url as string)
  if (!upstream?.body) {
    return NextResponse.json({ error: 'Média indisponible chez le fournisseur' }, { status: 502 })
  }

  const mime = (upstream.headers.get('content-type') ?? (msg.media_mimetype as string | null) ?? '').split(';')[0]
  const inline = INLINE_TYPES.test(mime)
  const safeName = ((msg.filename as string | null) ?? 'fichier').replace(/[^\w.\- ]+/g, '_').slice(0, 100)

  return new Response(upstream.body, {
    status: 200,
    headers: {
      // WHY: un document HTML/SVG servi en ligne depuis notre domaine
      // exécuterait du script : seuls images/vidéos/sons sont affichés.
      'Content-Type': inline ? mime : 'application/octet-stream',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
}
