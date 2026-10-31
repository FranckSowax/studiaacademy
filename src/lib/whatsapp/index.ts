// ============================================
// Client WAHA (WhatsApp HTTP API, auto-hébergé) — Envoi WhatsApp Studia Academy
// ============================================
// https://waha.devlike.pro — remplace Whapi.
// Variables : WAHA_BASE_URL, WAHA_API_KEY, WAHA_SESSION (défaut "default").

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
  let cleaned = phone.replace(/[\s\-().+]/g, '')
  // Retirer le préfixe international 00
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2)
  // Déjà au format international gabonais
  if (cleaned.startsWith('241')) return cleaned
  // Numéro local gabonais : on garde le 0 et on ajoute l'indicatif
  if (cleaned.startsWith('0')) return '241' + cleaned
  // Numéro local court sans 0 (saisie incomplète) → indicatif gabonais
  if (cleaned.length <= 8) return '241' + cleaned
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
