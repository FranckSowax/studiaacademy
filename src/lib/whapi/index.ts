// ============================================
// Client Whapi — Envoi WhatsApp Studia Academy
// ============================================
// https://whapi.cloud — canal prioritaire Afrique Centrale

const WHAPI_BASE_URL = 'https://gate.whapi.cloud'

function getToken(): string {
  const token = process.env.WHAPI_TOKEN
  if (!token) {
    throw new Error('WHAPI_TOKEN non configuré')
  }
  return token
}

/**
 * Normalise un numéro de téléphone gabonais au format international.
 * Ex: "06 12 34 56" → "24106123456"
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()+]/g, '')
  // Retirer le préfixe 00
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2)
  // Numéro local gabonais (commence par 0) → ajouter 241
  if (cleaned.startsWith('0')) {
    cleaned = '241' + cleaned.slice(1)
  }
  // Si pas de code pays et longueur courte → 241
  if (cleaned.length <= 9 && !cleaned.startsWith('241')) {
    cleaned = '241' + cleaned
  }
  return cleaned
}

/**
 * Envoie un message texte WhatsApp via Whapi.
 * Retourne true si succès, false sinon (sans throw pour ne pas casser un worker).
 */
export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<boolean> {
  if (!process.env.WHAPI_TOKEN) {
    console.warn('[whapi] WHAPI_TOKEN absent, envoi ignoré')
    return false
  }

  const to = normalizePhone(phone)

  try {
    const response = await fetch(`${WHAPI_BASE_URL}/messages/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ to, body: message }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`[whapi] Erreur ${response.status}: ${err}`)
      return false
    }
    return true
  } catch (error) {
    console.error('[whapi] Exception envoi:', error)
    return false
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
