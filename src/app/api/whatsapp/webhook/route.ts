import { after, NextRequest, NextResponse } from 'next/server'
import { describeWahaMessage } from '@/lib/inbox/waha-message'
import { applyAck, ingestMessage, InboxMigrationMissingError } from '@/lib/inbox/ingest'
import { isFreshEvent, verifyWahaSignature } from '@/lib/whatsapp/webhook'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 512 * 1024

/**
 * Réception des événements WAHA.
 *
 * - Signature HMAC-SHA512 obligatoire (WAHA_WEBHOOK_HMAC_KEY côté app
 *   = WHATSAPP_HOOK_HMAC_KEY côté WAHA). Sans clé configurée : refus total.
 * - Réponse 200 immédiate ; le traitement se fait après la réponse et ne
 *   lève jamais (sinon WAHA réessaie et le même message arrive dix fois).
 *
 * Événements traités : message, message.any (deux sens, y compris les
 * messages envoyés depuis le téléphone), message.ack (coches).
 */
export async function POST(request: NextRequest) {
  const key = process.env.WAHA_WEBHOOK_HMAC_KEY
  if (!key) return NextResponse.json({ error: 'Webhook non configuré' }, { status: 503 })

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Corps trop volumineux' }, { status: 413 })
  }

  const valid = verifyWahaSignature(
    raw,
    request.headers.get('x-webhook-hmac'),
    request.headers.get('x-webhook-hmac-algorithm'),
    key,
  )
  if (!valid) return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })

  let event: { event?: unknown; payload?: unknown }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }
  if (!isFreshEvent(event)) return NextResponse.json({ ok: true, ignored: 'événement périmé' })

  after(() => processEvent(event))
  return NextResponse.json({ ok: true })
}

async function processEvent(event: { event?: unknown; payload?: unknown }): Promise<void> {
  const name = typeof event.event === 'string' ? event.event : 'inconnu'
  try {
    switch (name) {
      case 'message':
      case 'message.any': {
        const described = describeWahaMessage(event.payload)
        if (described.kind === 'ignored') return
        if (described.message.type === 'unknown') {
          // C'est ainsi qu'on découvre les types que WAHA envoie.
          console.warn('[waha-webhook] type de message inconnu:', described.message.rawType)
        }
        await ingestMessage(described.message)
        return
      }
      case 'message.ack':
        await applyAck(event.payload)
        return
      case 'session.status': {
        const status = (event.payload as { status?: unknown } | undefined)?.status
        console.info('[waha-webhook] session:', typeof status === 'string' ? status : 'inconnu')
        return
      }
      default:
        console.info('[waha-webhook] événement non traité:', name)
    }
  } catch (error) {
    if (error instanceof InboxMigrationMissingError) {
      console.error('[waha-webhook]', error.message)
      return
    }
    // Jamais de détail de message dans les journaux (données personnelles).
    console.error(`[waha-webhook] échec ${name}:`, error instanceof Error ? error.message : 'erreur')
  }
}
