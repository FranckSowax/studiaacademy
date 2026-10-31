import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { CartError, getCart, listCarts, MAX_CART_ITEMS, saveCart, sendCart } from '@/lib/inbox/cart'
import { WahaSendError } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const UUID = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

const CartSchema = z.object({
  cart_id: UUID.nullish(),
  conversation_id: UUID,
  first_name: z.string().max(60),
  last_name: z.string().max(60),
  phone: z.string().max(30),
  type: z.enum(['individuel', 'entreprise']),
  societe: z.string().max(120).nullish(),
  message: z.string().max(1000).nullish(),
  items: z.array(z.object({ session_id: UUID, participants: z.number().int().min(1).max(50) })).max(MAX_CART_ITEMS),
  /** false : enregistrer seulement. true : enregistrer puis envoyer. */
  send: z.boolean().optional(),
  /** Reprise d'un envoi partiel : renvoie seulement les messages en échec, sans réenregistrer. */
  only_failed: z.boolean().optional(),
  confirm_phone_mismatch: z.boolean().optional(),
})

/** Paniers enregistrés non payés (40 plus récents), ceux de la conversation en tête. */
export async function GET(request: NextRequest) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const conversationId = request.nextUrl.searchParams.get('conversation')
  try {
    return NextResponse.json({ items: await listCarts(UUID.safeParse(conversationId).success ? conversationId : null) })
  } catch {
    return NextResponse.json({ error: 'Paniers indisponibles (migration appliquée ?)' }, { status: 503 })
  }
}

/**
 * Route unique du panier : enregistre (send:false), ou enregistre puis envoie
 * (send:true). Le résultat d'envoi détaille chaque message.
 */
export async function POST(request: NextRequest) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const parsed = CartSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Panier invalide' }, { status: 400 })
  const input = parsed.data

  try {
    let cart =
      input.only_failed && input.cart_id
        ? await getCart(input.cart_id)
        : await saveCart(me, {
            cartId: input.cart_id ?? null,
            conversationId: input.conversation_id,
            firstName: input.first_name,
            lastName: input.last_name,
            phone: input.phone,
            type: input.type,
            societe: input.societe ?? null,
            message: input.message ?? null,
            items: input.items.map((i) => ({ sessionId: i.session_id, participants: i.participants })),
            confirmPhoneMismatch: input.confirm_phone_mismatch === true,
          })
    if (!cart) return NextResponse.json({ error: 'Panier introuvable' }, { status: 404 })

    if (!input.send) return NextResponse.json({ cart, result: null })

    const sent = await sendCart(me, cart.id, { onlyFailed: input.only_failed === true })
    cart = sent.cart
    return NextResponse.json({ cart, result: sent.result })
  } catch (error) {
    if (error instanceof CartError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.code === 'NOT_FOUND' ? 404 : 400 })
    }
    if (error instanceof WahaSendError) return NextResponse.json({ error: error.message }, { status: 502 })
    console.error('[inbox-cart]', error instanceof Error ? error.message : 'erreur')
    return NextResponse.json({ error: 'Opération sur le panier impossible' }, { status: 500 })
  }
}
