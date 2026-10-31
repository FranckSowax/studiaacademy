// ============================================
// Demandes du site → conversation dans /messagerie (serveur uniquement)
// ============================================
// Envoie au client un accusé de réception WhatsApp depuis le numéro Studia et
// l'inscrit dans le fil, marqué « venu du site ». L'équipe répond ensuite dans
// la même conversation.

import { createAdminClient } from '@/lib/supabase/admin'
import { consumeRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { isValidPhone, normalizePhone, sendTextToChat, toChatId } from '@/lib/whatsapp'
import { phonesMatch } from './phones'
import { recordSentMessage } from './send'
import { buildSiteRequestAck, type SiteRequest, siteSource } from './site-request-rules'

/** Auteur affiché dans le fil pour les accusés automatiques. */
const SITE_AUTHOR = { id: 'site', name: 'Site Studia' } as const

export type SiteRequestAckResult =
  | { sent: true; conversationId: string }
  | { sent: false; reason: 'numéro invalide' | 'numéro Studia' | 'quota atteint' | 'envoi impossible' }

function isOwnNumber(phone: string): boolean {
  return [process.env.STUDIA_TEAM_PHONE, process.env.NEXT_PUBLIC_WHATSAPP_NUMBER].some(
    (own) => !!own && phonesMatch(own, phone),
  )
}

/**
 * Retrouve la conversation du client (par numéro, quelle que soit la forme de
 * son identifiant WhatsApp) ou la crée, et y enregistre l'origine « site ».
 */
async function upsertSiteConversation(
  phone: string,
  request: SiteRequest,
): Promise<{ id: string; chat_id: string } | null> {
  const admin = createAdminClient()
  const source = siteSource(request)
  const name = request.name?.trim() || null

  const { data: existing, error } = await admin
    .from('wa_conversations')
    .select('id, chat_id, name')
    .eq('phone', phone)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[site-request] lecture conversation:', error.code)
    return null
  }

  if (existing) {
    const patch: Record<string, unknown> = { source }
    if (!existing.name && name) patch.name = name
    await admin.from('wa_conversations').update(patch).eq('id', existing.id)
    return existing
  }

  const { data: created, error: insertError } = await admin
    .from('wa_conversations')
    .upsert(
      { chat_id: toChatId(phone), phone, name, status: 'open', source },
      { onConflict: 'chat_id' },
    )
    .select('id, chat_id')
    .single()
  if (insertError) {
    console.error('[site-request] création conversation:', insertError.code)
    return null
  }
  return created
}

/**
 * Accuse réception d'une demande faite sur le site : message WhatsApp au
 * client + conversation visible dans /messagerie, à traiter par l'équipe.
 * Ne lève jamais : la demande est déjà enregistrée, l'accusé est un plus.
 *
 * @example
 * await acknowledgeSiteRequest('07 12 34 56', { kind: 'formation', name: 'Marie', title: 'L’IA pour recruter' })
 */
export async function acknowledgeSiteRequest(
  rawPhone: string,
  request: SiteRequest,
): Promise<SiteRequestAckResult> {
  const phone = normalizePhone(rawPhone)
  if (!isValidPhone(phone)) return { sent: false, reason: 'numéro invalide' }
  if (isOwnNumber(phone)) return { sent: false, reason: 'numéro Studia' }
  if (!(await consumeRateLimit(`wa:to:${phone}`, RATE_LIMITS.whatsappPerRecipient))) {
    return { sent: false, reason: 'quota atteint' }
  }

  try {
    const conv = await upsertSiteConversation(phone, request)
    if (!conv) return { sent: false, reason: 'envoi impossible' }

    const raw = await sendTextToChat(conv.chat_id, buildSiteRequestAck(request))
    await recordSentMessage(raw, SITE_AUTHOR)

    // WHY: l'accusé est un envoi « de notre part » qui marquerait la conversation
    // comme répondue (ou la laisserait close) ; une nouvelle demande attend
    // pourtant une réponse humaine.
    await createAdminClient().from('wa_conversations').update({ status: 'open' }).eq('id', conv.id)
    return { sent: true, conversationId: conv.id }
  } catch (error) {
    console.error('[site-request] accusé non envoyé:', error instanceof Error ? error.message : 'erreur')
    return { sent: false, reason: 'envoi impossible' }
  }
}
