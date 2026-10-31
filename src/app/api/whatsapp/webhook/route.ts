import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { markChatSeen } from '@/lib/whatsapp'
import { parseInboundMessage, verifyWahaSignature } from '@/lib/whatsapp/webhook'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 256 * 1024

/**
 * Réception des événements WAHA (messages WhatsApp entrants).
 * Signature HMAC-SHA512 obligatoire (WAHA_WEBHOOK_HMAC_KEY côté app
 * = WHATSAPP_HOOK_HMAC_KEY côté WAHA).
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

  let event: unknown
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const msg = parseInboundMessage(event)
  if (!msg) return NextResponse.json({ ok: true, ignored: true })

  const admin = createAdminClient()
  // WHY: event_id unique → les retries WAHA ne créent pas de doublon.
  const { error } = await admin.from('whatsapp_inbound_messages').upsert(
    {
      event_id: msg.eventId,
      session: msg.session,
      message_id: msg.messageId,
      from_chat_id: msg.from,
      body: msg.body,
      has_media: msg.hasMedia,
      received_at: new Date(msg.timestamp * 1000).toISOString(),
    },
    { onConflict: 'event_id', ignoreDuplicates: true },
  )
  if (error) {
    console.error('[waha-webhook] insert échoué:', error.code)
    return NextResponse.json({ error: 'Stockage indisponible' }, { status: 500 })
  }

  await markChatSeen(msg.from)
  return NextResponse.json({ ok: true })
}
