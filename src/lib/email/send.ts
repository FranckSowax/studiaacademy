// ============================================
// Envoi d'email transactionnel (serveur uniquement)
// ============================================
// Fournisseur : Resend (API HTTP, sans dépendance). Variables :
// RESEND_API_KEY, EMAIL_FROM (ex. « Studia Academy <equipe@studia.ga> »).

const RESEND_URL = 'https://api.resend.com/emails'
const REQUEST_TIMEOUT_MS = 10_000

export interface EmailMessage {
  to: string
  subject: string
  text: string
}

/** true si l'email est configuré (clé + expéditeur). */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

/**
 * Envoie un email texte. Retourne true si accepté par le fournisseur.
 * Ne lève jamais ; ne journalise ni l'adresse ni le contenu.
 *
 * @example
 * await sendEmail({ to: 'awa@studia.ga', subject: 'Code', text: '123456' })
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY / EMAIL_FROM absents, envoi ignoré')
    return false
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error(`[email] envoi refusé ${res.status}`)
      return false
    }
    return true
  } catch (error) {
    console.error('[email] exception envoi:', error instanceof Error ? error.name : 'unknown')
    return false
  }
}
