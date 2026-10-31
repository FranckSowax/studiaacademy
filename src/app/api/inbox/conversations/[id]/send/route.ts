import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { InboxSendError, MAX_TEXT_LENGTH, sendFromInbox } from '@/lib/inbox/send'
import { WahaSendError } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SendSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), text: z.string().min(1).max(MAX_TEXT_LENGTH) }),
  z.object({
    kind: z.literal('library'),
    libraryId: z.string().regex(UUID_RE),
    caption: z.string().max(1000).optional(),
  }),
])

/**
 * Envoie une réponse (texte, ou fichier de la médiathèque) au client.
 * L'auteur est enregistré ; la conversation est attribuée à la première
 * personne qui répond.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  const parsed = SendSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Message invalide' }, { status: 400 })

  try {
    const message = await sendFromInbox(me, id, parsed.data)
    return NextResponse.json({ ok: true, message })
  } catch (error) {
    if (error instanceof InboxSendError || error instanceof WahaSendError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
    }
    console.error('[inbox-send]', error instanceof Error ? error.message : 'erreur')
    return NextResponse.json({ ok: false, error: "L'envoi a échoué" }, { status: 500 })
  }
}
