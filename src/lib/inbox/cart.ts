// ============================================
// Panier de la messagerie (serveur uniquement)
// ============================================
// Panier = inscriptions Formations IA créées au nom du client par la fonction
// existante fia_inscrire. Les montants sont TOUJOURS recalculés par
// src/lib/formations-ia-pricing.ts à partir de fia_formations : aucun prix
// n'est stocké ni saisi dans la messagerie.

import { getAppConfig } from '@/lib/config/app-config'
import {
  computeFiaLine,
  normalizeParticipants,
  sumFiaTotals,
  type FiaInscriptionType,
} from '@/lib/formations-ia-pricing'
import { createAdminClient } from '@/lib/supabase/admin'
import { markChatSeen, sendTextToChat, WahaSendError } from '@/lib/whatsapp'
import { buildCartMessages, type CartLineView } from './cart-messages'
import type { InboxIdentity } from './identity'
import { formatPhone } from './list'
import { digitsOnly, phonesMatch } from './phones'
import { recordSentMessage } from './send'

export const MAX_CART_ITEMS = 5
export const MAX_PARTICIPANTS = 50
/** Pause entre deux messages : une rafale se fait limiter et devient illisible. */
export const SEND_PAUSE_MS = 1500
const CART_LIST_LIMIT = 40

type Row = Record<string, unknown>

export class CartError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID' | 'NOT_FOUND' | 'PHONE_MISMATCH' | 'PAID' = 'INVALID',
  ) {
    super(message)
    this.name = 'CartError'
  }
}

// ── Catalogue ──────────────────────────────

export interface CatalogSession {
  id: string
  date: string
  lieu: string
}

export interface CatalogFormation {
  id: string
  code: string
  slug: string
  title: string
  prixFcfa: number | null
  prixGroupeFcfa: number | null
  sessions: CatalogSession[]
}

function todayInConfiguredZone(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: getAppConfig().country.timezone })
}

/** Formations actives et leurs sessions à venir (planifiées ou confirmées). */
export async function loadCatalog(): Promise<CatalogFormation[]> {
  const admin = createAdminClient()
  const [{ data: formations, error }, { data: sessions, error: sessionsError }] = await Promise.all([
    admin.from('fia_formations').select('id, code, slug, titre, prix_fcfa, prix_groupe_fcfa').eq('actif', true).order('code'),
    admin
      .from('fia_sessions')
      .select('id, formation_id, date, lieu')
      .gte('date', todayInConfiguredZone())
      .in('statut', ['planifiee', 'confirmee'])
      .order('date'),
  ])
  if (error || sessionsError) throw new Error('catalogue indisponible')
  return (formations ?? []).map((f) => ({
    id: String(f.id),
    code: String(f.code),
    slug: String(f.slug),
    title: String(f.titre),
    prixFcfa: (f.prix_fcfa as number | null) ?? null,
    prixGroupeFcfa: (f.prix_groupe_fcfa as number | null) ?? null,
    sessions: (sessions ?? [])
      .filter((s) => s.formation_id === f.id)
      .map((s) => ({ id: String(s.id), date: String(s.date), lieu: String(s.lieu) })),
  }))
}

// ── Vue d'un panier ─────────────────────────

export interface CartItem {
  sessionId: string
  participants: number
  inscriptionId: string | null
}

export interface CartSendResult {
  sent: number
  total: number
  errors: { index: number; label: string; error: string }[]
  amount: number | null
  at: string
}

export interface CartView {
  id: string
  conversationId: string
  firstName: string
  lastName: string
  phoneDisplay: string
  type: FiaInscriptionType
  societe: string | null
  message: string | null
  status: 'draft' | 'sent' | 'partial'
  items: CartItem[]
  lines: (CartLineView & { inscriptionStatus: string | null })[]
  total: number | null
  paid: boolean
  createdByName: string | null
  updatedByName: string | null
  updatedAt: string
  lastSendResult: CartSendResult | null
}

function parseItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is Row => !!v && typeof v === 'object')
    .map((v) => ({
      sessionId: String(v.session_id ?? ''),
      participants: normalizeParticipants(v.participants),
      inscriptionId: typeof v.inscription_id === 'string' ? v.inscription_id : null,
    }))
    .filter((i) => i.sessionId)
}

async function buildViews(carts: Row[]): Promise<CartView[]> {
  if (carts.length === 0) return []
  const admin = createAdminClient()
  const allItems = carts.flatMap((c) => parseItems(c.items))
  const sessionIds = [...new Set(allItems.map((i) => i.sessionId))]
  const inscriptionIds = allItems.map((i) => i.inscriptionId).filter((v): v is string => !!v)

  const [{ data: sessions }, { data: inscriptions }] = await Promise.all([
    sessionIds.length
      ? admin
          .from('fia_sessions')
          .select('id, date, lieu, fia_formations(code, slug, titre, prix_fcfa, prix_groupe_fcfa)')
          .in('id', sessionIds)
      : Promise.resolve({ data: [] as Row[] }),
    inscriptionIds.length
      ? admin.from('fia_inscriptions').select('id, code_public, statut').in('id', inscriptionIds)
      : Promise.resolve({ data: [] as Row[] }),
  ])
  const sessionById = new Map((sessions ?? []).map((s) => [String(s.id), s as Row]))
  const inscriptionById = new Map((inscriptions ?? []).map((i) => [String(i.id), i as Row]))

  return carts.map((c) => {
    const type = (c.inscription_type === 'entreprise' ? 'entreprise' : 'individuel') as FiaInscriptionType
    const items = parseItems(c.items)
    const lines = items.flatMap((item) => {
      const session = sessionById.get(item.sessionId)
      const formation = (session?.fia_formations ?? null) as Row | null
      if (!session || !formation) return []
      const price = computeFiaLine(
        { prixFcfa: (formation.prix_fcfa as number | null) ?? null, prixGroupeFcfa: (formation.prix_groupe_fcfa as number | null) ?? null },
        type,
        item.participants,
      )
      const inscription = item.inscriptionId ? inscriptionById.get(item.inscriptionId) : undefined
      return [
        {
          code: String(formation.code),
          title: String(formation.titre),
          slug: String(formation.slug),
          sessionDate: String(session.date),
          lieu: String(session.lieu),
          participants: price.participants,
          groupRate: price.groupRate,
          unitPrice: price.unitPrice,
          total: price.total,
          inscriptionCode: (inscription?.code_public as string | null) ?? null,
          inscriptionStatus: (inscription?.statut as string | null) ?? null,
        },
      ]
    })
    return {
      id: String(c.id),
      conversationId: String(c.conversation_id),
      firstName: String(c.client_first_name),
      lastName: String(c.client_last_name),
      phoneDisplay: formatPhone(String(c.client_phone)),
      type,
      societe: (c.societe as string | null) ?? null,
      message: (c.message as string | null) ?? null,
      status: c.status as CartView['status'],
      items,
      lines,
      total: sumFiaTotals(lines),
      paid: lines.length > 0 && lines.every((l) => l.inscriptionStatus === 'payee'),
      createdByName: (c.created_by_name as string | null) ?? null,
      updatedByName: (c.updated_by_name as string | null) ?? null,
      updatedAt: String(c.updated_at),
      lastSendResult: (c.last_send_result as CartSendResult | null) ?? null,
    }
  })
}

/**
 * Paniers enregistrés non payés, les 40 plus récents. Ceux de la
 * conversation demandée sont placés en tête.
 */
export async function listCarts(conversationId: string | null): Promise<CartView[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wa_carts')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(CART_LIST_LIMIT)
  if (error) throw new Error('paniers indisponibles')
  const views = (await buildViews(data ?? [])).filter((v) => !v.paid)
  return [...views.filter((v) => v.conversationId === conversationId), ...views.filter((v) => v.conversationId !== conversationId)]
}

export async function getCart(cartId: string): Promise<CartView | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('wa_carts').select('*').eq('id', cartId).maybeSingle()
  if (!data) return null
  return (await buildViews([data]))[0] ?? null
}

// ── Enregistrer / modifier ─────────────────

export interface SaveCartInput {
  cartId?: string | null
  conversationId: string
  firstName: string
  lastName: string
  phone: string
  type: FiaInscriptionType
  societe?: string | null
  message?: string | null
  items: { sessionId: string; participants: number }[]
  confirmPhoneMismatch?: boolean
}

/**
 * Crée ou modifie le panier : inscriptions créées par fia_inscrire (la même
 * fonction que le formulaire public), mises à jour ou annulées si retirées.
 * N'envoie rien.
 */
export async function saveCart(me: InboxIdentity, input: SaveCartInput): Promise<CartView> {
  const admin = createAdminClient()
  const firstName = input.firstName.trim().slice(0, 60)
  const lastName = input.lastName.trim().slice(0, 60)
  const societe = input.type === 'entreprise' ? (input.societe ?? '').trim().slice(0, 120) : ''
  if (!firstName || !lastName) throw new CartError('Prénom et nom du client requis')
  if (input.type === 'entreprise' && !societe) throw new CartError('Nom de la société requis pour une inscription entreprise')
  if (input.items.length === 0) throw new CartError('Ajoutez au moins une session')
  if (input.items.length > MAX_CART_ITEMS) throw new CartError(`${MAX_CART_ITEMS} sessions au plus par panier`)
  if (new Set(input.items.map((i) => i.sessionId)).size !== input.items.length) {
    throw new CartError('Une même session ne peut figurer qu’une fois')
  }

  const { data: conv } = await admin.from('wa_conversations').select('id, phone').eq('id', input.conversationId).maybeSingle()
  if (!conv) throw new CartError('Conversation introuvable', 'NOT_FOUND')

  // Le numéro saisi et le compte WhatsApp du client diffèrent souvent :
  // rapprochement avec la conversation, confirmation explicite si douteux.
  const phoneDigits = digitsOnly(input.phone)
  if (!phoneDigits) throw new CartError('Numéro du client requis')
  if (conv.phone && !phonesMatch(phoneDigits, conv.phone as string) && !input.confirmPhoneMismatch) {
    throw new CartError(
      `Le numéro saisi (${formatPhone(phoneDigits)}) ne correspond pas à celui de la conversation (${formatPhone(conv.phone as string)}). Confirmez-le.`,
      'PHONE_MISMATCH',
    )
  }
  const phone = `+${phoneDigits}`

  // Sessions valides : à venir, ouvertes, formation active.
  const sessionIds = input.items.map((i) => i.sessionId)
  const catalog = await loadCatalog()
  const openSessions = new Set(catalog.flatMap((f) => f.sessions.map((s) => s.id)))
  if (sessionIds.some((id) => !openSessions.has(id))) throw new CartError('Session indisponible ou passée')

  let existing: Row | null = null
  if (input.cartId) {
    const { data } = await admin.from('wa_carts').select('*').eq('id', input.cartId).maybeSingle()
    if (!data || data.conversation_id !== input.conversationId) throw new CartError('Panier introuvable', 'NOT_FOUND')
    existing = data
  }
  const previousItems = existing ? parseItems(existing.items) : []

  const nextItems: { session_id: string; participants: number; inscription_id: string }[] = []
  for (const item of input.items) {
    const participants = input.type === 'entreprise' ? Math.min(normalizeParticipants(item.participants), MAX_PARTICIPANTS) : 1
    const previous = previousItems.find((p) => p.sessionId === item.sessionId && p.inscriptionId)
    if (previous?.inscriptionId) {
      const { data: updated, error } = await admin
        .from('fia_inscriptions')
        .update({
          nb_participants: participants,
          type: input.type,
          societe: societe || null,
          nom: lastName,
          prenom: firstName,
          telephone_whatsapp: phone,
        })
        .eq('id', previous.inscriptionId)
        .eq('statut', 'en_attente_paiement')
        .select('id')
      if (error) throw new Error(`mise à jour inscription: ${error.code ?? ''}`)
      if (!updated?.length) throw new CartError('Une inscription de ce panier est déjà payée ou annulée', 'PAID')
      nextItems.push({ session_id: item.sessionId, participants, inscription_id: previous.inscriptionId })
      continue
    }
    const { data: created, error } = await admin.rpc('fia_inscrire', {
      p_session_id: item.sessionId,
      p_type: input.type,
      p_societe: societe || null,
      p_nb_participants: participants,
      p_nom: lastName,
      p_prenom: firstName,
      p_fonction: null,
      p_telephone: phone,
      p_email: null,
      p_source: 'whatsapp-messagerie',
      p_utm: { canal: 'messagerie', par: me.id },
    })
    if (error) {
      const msg = error.message ?? ''
      if (msg.includes('TELEPHONE_INVALIDE')) throw new CartError('Numéro du client invalide pour une inscription')
      throw new Error(`fia_inscrire: ${error.code ?? ''}`)
    }
    const code = Array.isArray(created) ? (created[0] as Row | undefined)?.code_public : null
    const { data: row } = await admin.from('fia_inscriptions').select('id').eq('code_public', code).single()
    nextItems.push({ session_id: item.sessionId, participants, inscription_id: String(row?.id) })
  }

  // Sessions retirées : l'inscription non payée est annulée (jamais supprimée).
  const removed = previousItems.filter((p) => p.inscriptionId && !sessionIds.includes(p.sessionId))
  for (const r of removed) {
    await admin.from('fia_inscriptions').update({ statut: 'annulee' }).eq('id', r.inscriptionId).eq('statut', 'en_attente_paiement')
  }

  const values = {
    conversation_id: input.conversationId,
    client_first_name: firstName,
    client_last_name: lastName,
    client_phone: phoneDigits,
    inscription_type: input.type,
    societe: societe || null,
    items: nextItems,
    message: input.message?.trim().slice(0, 1000) || null,
    // Un panier modifié doit être renvoyé : il repasse en brouillon.
    status: 'draft',
    updated_by_name: me.name,
  }
  const { data: saved, error: saveError } = existing
    ? await admin.from('wa_carts').update(values).eq('id', existing.id).select('*').single()
    : await admin
        .from('wa_carts')
        .insert({ ...values, created_by: me.id, created_by_name: me.name })
        .select('*')
        .single()
  if (saveError || !saved) throw new Error(`panier: ${saveError?.code ?? ''}`)
  return (await buildViews([saved]))[0]
}

// ── Envoyer ────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Envoie le panier sur le WhatsApp du client : accueil, une fiche par
 * formation, récapitulatif chiffré. Chaque message est inscrit dans le fil
 * avec son auteur. Le résultat détaille chaque échec : un envoi partiel se
 * voit et se reprend (onlyFailed renvoie seulement les messages en échec).
 */
export async function sendCart(
  me: InboxIdentity,
  cartId: string,
  options: { onlyFailed?: boolean } = {},
): Promise<{ cart: CartView; result: CartSendResult }> {
  const admin = createAdminClient()
  const cart = await getCart(cartId)
  if (!cart) throw new CartError('Panier introuvable', 'NOT_FOUND')
  if (cart.lines.length === 0) throw new CartError('Panier vide')
  if (cart.lines.some((l) => !l.inscriptionCode)) throw new CartError('Enregistrez le panier avant de l’envoyer')

  const { data: conv } = await admin
    .from('wa_conversations')
    .select('id, chat_id, assigned_to')
    .eq('id', cart.conversationId)
    .maybeSingle()
  if (!conv) throw new CartError('Conversation introuvable', 'NOT_FOUND')

  const messages = buildCartMessages({
    firstName: cart.firstName,
    type: cart.type,
    lines: cart.lines,
    total: cart.total,
    intro: cart.message,
  })
  const labels = ['Accueil', ...cart.lines.map((l) => `Fiche ${l.code}`), 'Récapitulatif']
  const retry = options.onlyFailed && cart.lastSendResult ? new Set(cart.lastSendResult.errors.map((e) => e.index)) : null

  await markChatSeen(conv.chat_id as string)

  const errors: CartSendResult['errors'] = []
  let sent = 0
  let attempted = 0
  for (let index = 0; index < messages.length; index++) {
    if (retry && !retry.has(index)) continue
    if (attempted > 0) await sleep(SEND_PAUSE_MS)
    attempted++
    try {
      const raw = await sendTextToChat(conv.chat_id as string, messages[index])
      await recordSentMessage(raw, me)
      sent++
    } catch (error) {
      errors.push({
        index,
        label: labels[index] ?? `Message ${index + 1}`,
        error: error instanceof WahaSendError ? error.message : 'Envoi impossible',
      })
    }
  }

  const result: CartSendResult = {
    sent: retry ? (cart.lastSendResult?.sent ?? 0) + sent : sent,
    total: messages.length,
    errors,
    amount: cart.total,
    at: new Date().toISOString(),
  }
  const status = errors.length === 0 ? 'sent' : result.sent > 0 ? 'partial' : 'draft'
  await admin
    .from('wa_carts')
    .update({ status, sent_at: result.sent > 0 ? result.at : null, last_send_result: result, updated_by_name: me.name })
    .eq('id', cart.id)

  if (!conv.assigned_to && sent > 0) {
    await admin
      .from('wa_conversations')
      .update({ assigned_to: me.id, assigned_name: me.name, assigned_at: new Date().toISOString() })
      .eq('id', conv.id)
      .is('assigned_to', null)
  }

  const fresh = await getCart(cart.id)
  return { cart: fresh ?? cart, result }
}
