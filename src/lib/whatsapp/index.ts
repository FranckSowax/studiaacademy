// ============================================
// Client WAHA (WhatsApp HTTP API, auto-hébergé) — Envoi WhatsApp Studia Academy
// ============================================
// https://waha.devlike.pro — remplace Whapi.
// Variables : WAHA_BASE_URL, WAHA_API_KEY, WAHA_SESSION (défaut "default").

import { getAppConfig } from '@/lib/config/app-config'

const DEFAULT_SESSION = 'default'
const REQUEST_TIMEOUT_MS = 15_000

interface WahaConfig {
  baseUrl: string
  apiKey: string
  session: string
}

function getConfig(): WahaConfig | null {
  const baseUrl = process.env.WAHA_BASE_URL
  const apiKey = process.env.WAHA_API_KEY
  if (!baseUrl || !apiKey) return null
  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    apiKey,
    session: process.env.WAHA_SESSION || DEFAULT_SESSION,
  }
}

/**
 * Normalise un numéro de téléphone gabonais au format international.
 * Ex: "07 67 01 58" → "24107670158"
 *
 * WHY: au Gabon, le 0 initial fait partie du numéro et est conservé à
 * l'international (+241 07 67 01 58). L'ancienne version le supprimait
 * et envoyait au mauvais destinataire (24177670158).
 */
export function normalizePhone(phone: string): string {
  const { dialCode, keepsLeadingZero } = getAppConfig().country
  let cleaned = phone.replace(/[\s\-().+]/g, '')
  // Retirer le préfixe international 00
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2)
  // Déjà au format international du pays configuré
  if (cleaned.startsWith(dialCode)) return cleaned
  // Numéro local (commence par 0) : on ajoute l'indicatif, en gardant le 0 si le pays le conserve
  if (cleaned.startsWith('0')) return dialCode + (keepsLeadingZero ? cleaned : cleaned.slice(1))
  // Numéro local court sans 0 (saisie incomplète) → indicatif du pays
  if (cleaned.length <= 8) return dialCode + cleaned
  // Sinon : numéro étranger déjà préfixé de son indicatif
  return cleaned
}

/**
 * Valide qu'un numéro normalisé est plausible (8 à 15 chiffres, E.164).
 *
 * @example
 * isValidPhone(normalizePhone('06 12 34 56')) // true
 * isValidPhone('abc') // false
 */
export function isValidPhone(normalized: string): boolean {
  return /^[1-9]\d{7,14}$/.test(normalized)
}

/** Identifiant de discussion WAHA pour un contact individuel. */
export function toChatId(phone: string): string {
  return `${normalizePhone(phone)}@c.us`
}

async function wahaRequest(
  config: WahaConfig,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Key': config.apiKey,
    },
    body: body ? JSON.stringify({ session: config.session, ...body }) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
}

/**
 * Envoie un message texte WhatsApp via WAHA.
 * Retourne true si succès, false sinon (sans throw pour ne pas casser un worker).
 *
 * @example
 * await sendWhatsApp('06 12 34 56', 'Bonjour 👋')
 */
export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const config = getConfig()
  if (!config) {
    console.warn('[waha] WAHA_BASE_URL / WAHA_API_KEY absents, envoi ignoré')
    return false
  }

  const normalized = normalizePhone(phone)
  if (!isValidPhone(normalized)) {
    console.warn('[waha] numéro invalide, envoi ignoré')
    return false
  }

  try {
    const response = await wahaRequest(config, 'POST', '/api/sendText', {
      chatId: `${normalized}@c.us`,
      text: message,
    })
    if (!response.ok) {
      // WHY: ne pas journaliser le corps (peut contenir le numéro du destinataire).
      console.error(`[waha] Erreur envoi ${response.status}`)
      return false
    }
    return true
  } catch (error) {
    console.error('[waha] Exception envoi:', error instanceof Error ? error.name : 'unknown')
    return false
  }
}

/**
 * Numéro de téléphone (chiffres, sans « + ») associé à un identifiant
 * WhatsApp « xxx@lid ». Retourne null si inconnu ou WAHA injoignable.
 * Endpoint vérifié : GET /api/{session}/lids/{lid} → { lid, pn: "241…@c.us" }.
 */
export async function resolveLidToPhone(lidChatId: string): Promise<string | null> {
  const config = getConfig()
  if (!config || !lidChatId.endsWith('@lid')) return null
  const lid = lidChatId.slice(0, -'@lid'.length)
  try {
    const res = await fetch(
      `${config.baseUrl}/api/${encodeURIComponent(config.session)}/lids/${encodeURIComponent(lid)}`,
      {
        headers: { Accept: 'application/json', 'X-Api-Key': config.apiKey },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { pn?: unknown }
    const pn = typeof data.pn === 'string' ? data.pn.split('@')[0].replace(/\D/g, '') : ''
    return pn || null
  } catch {
    return null
  }
}

/** Erreur d'envoi WAHA, avec un message affichable à l'équipe. */
export class WahaSendError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message)
    this.name = 'WahaSendError'
  }
}

async function postAndReturnMessage(path: string, body: Record<string, unknown>, timeoutMs: number): Promise<unknown> {
  const config = getConfig()
  if (!config) throw new WahaSendError('WhatsApp non configuré (WAHA_BASE_URL / WAHA_API_KEY)', null)
  let res: Response
  try {
    res = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Api-Key': config.apiKey },
      body: JSON.stringify({ session: config.session, ...body }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    throw new WahaSendError('Service WhatsApp injoignable', null)
  }
  if (!res.ok) throw new WahaSendError(`Envoi refusé par WhatsApp (code ${res.status})`, res.status)
  return res.json().catch(() => null)
}

/**
 * Envoie un texte dans une discussion existante (chatId @lid ou @c.us) et
 * renvoie le message WAHA créé (identifiant, horodatage, accusé).
 * Endpoint vérifié : POST /api/sendText.
 */
export async function sendTextToChat(chatId: string, text: string): Promise<unknown> {
  return postAndReturnMessage('/api/sendText', { chatId, text }, REQUEST_TIMEOUT_MS)
}

export type OutgoingMediaKind = 'image' | 'video' | 'document'

/**
 * Envoie un fichier (base64) dans une discussion. Endpoints vérifiés :
 * POST /api/sendImage, /api/sendVideo, /api/sendFile — file: { mimetype, filename, data }.
 */
export async function sendMediaToChat(
  chatId: string,
  kind: OutgoingMediaKind,
  file: { mimetype: string; filename: string; base64: string },
  caption?: string,
): Promise<unknown> {
  const path = kind === 'image' ? '/api/sendImage' : kind === 'video' ? '/api/sendVideo' : '/api/sendFile'
  return postAndReturnMessage(
    path,
    {
      chatId,
      caption: caption || undefined,
      file: { mimetype: file.mimetype, filename: file.filename, data: file.base64 },
    },
    120_000,
  )
}

/**
 * Derniers messages d'une discussion, côté WAHA (reprise d'historique).
 * Endpoint vérifié : GET /api/{session}/chats/{chatId}/messages
 * (limit, downloadMedia). Retourne [] en cas d'erreur.
 */
export async function fetchChatMessages(chatId: string, limit = 100): Promise<unknown[]> {
  const config = getConfig()
  if (!config) return []
  const params = new URLSearchParams({ limit: String(limit), downloadMedia: 'true' })
  try {
    const res = await fetch(
      `${config.baseUrl}/api/${encodeURIComponent(config.session)}/chats/${encodeURIComponent(chatId)}/messages?${params}`,
      {
        headers: { Accept: 'application/json', 'X-Api-Key': config.apiKey },
        signal: AbortSignal.timeout(60_000),
      },
    )
    if (!res.ok) return []
    const data = (await res.json()) as unknown
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * Récupère un fichier média stocké par WAHA (chemin /api/files/...), avec la
 * clé serveur. Le navigateur ne voit jamais la clé : la route de relais
 * renvoie ce flux.
 */
export async function fetchWahaFile(path: string): Promise<Response | null> {
  const config = getConfig()
  if (!config || !path.startsWith('/api/files/') || path.includes('..')) return null
  try {
    const res = await fetch(`${config.baseUrl}${path}`, {
      headers: { 'X-Api-Key': config.apiKey },
      signal: AbortSignal.timeout(60_000),
    })
    return res.ok ? res : null
  } catch {
    return null
  }
}

/**
 * Marque une discussion comme lue (double coche bleue). Recommandé par WAHA
 * avant de répondre à un message entrant, pour limiter le risque de blocage.
 */
export async function markChatSeen(chatId: string): Promise<void> {
  const config = getConfig()
  if (!config) return
  try {
    await wahaRequest(config, 'POST', '/api/sendSeen', { chatId })
  } catch {
    // Non bloquant
  }
}

// ── Templates de messages ───────────────────

export function messageRapportEleve(params: {
  prenom: string
  titre: string
  note: number | string
  sur: number | string
  mention: string
  lienRapport: string
  nomProf: string
}): string {
  return `Bonjour ${params.prenom} 👋
Votre devoir *${params.titre}* a été corrigé.
📊 Note : *${params.note}/${params.sur}* — ${params.mention}
🔗 Rapport détaillé : ${params.lienRapport}
— ${params.nomProf} via Studia Academy`
}

export function messageBilanClasse(params: {
  titre: string
  nbRendus: number
  nbEleves: number
  moyenne: number | string
  max: number | string
  min: number | string
  lienDashboard: string
}): string {
  return `📋 Bilan devoir *${params.titre}*
👥 ${params.nbRendus}/${params.nbEleves} copies reçues
📈 Moyenne : ${params.moyenne}/20
🏆 Max : ${params.max}/20 · Min : ${params.min}/20
🔗 Tableau complet : ${params.lienDashboard}`
}

export function messageParent(params: {
  prenom: string
  matiere: string
  note: number | string
  sur: number | string
  mention: string
  lienRapport: string
}): string {
  return `Bonjour,
Résultat de ${params.prenom} en ${params.matiere} :
*${params.note}/${params.sur}* — ${params.mention}
🔗 Rapport : ${params.lienRapport}`
}
