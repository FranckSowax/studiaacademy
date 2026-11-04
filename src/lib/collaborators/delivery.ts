// ============================================
// Envoi du code de connexion : WhatsApp d'abord, email en repli
// ============================================
// Dépendances injectées : testable sans réseau.

import type { OtpChannel } from './otp'

export interface OtpRecipient {
  full_name: string
  email: string | null
  whatsapp_phone: string | null
}

export interface OtpDeliveryDeps {
  sendWhatsApp: (phone: string, text: string) => Promise<boolean>
  sendEmail: (message: { to: string; subject: string; text: string }) => Promise<boolean>
  /** Développement local uniquement : afficher le code dans la console serveur. */
  logToConsole?: (line: string) => void
}

export function otpMessage(code: string, brandName: string, ttlMinutes: number): string {
  return (
    `${brandName} — votre code de connexion équipe : ${code}\n` +
    `Il expire dans ${ttlMinutes} minutes. Ne le communiquez à personne, ` +
    `même à quelqu'un qui se présente comme membre de l'équipe.`
  )
}

/**
 * Envoie le code par le premier canal qui fonctionne :
 * WhatsApp (si numéro) → email (si adresse) → console (dev uniquement).
 *
 * @returns le canal utilisé, ou null si aucun envoi n'a abouti.
 */
export async function deliverOtp(
  recipient: OtpRecipient,
  code: string,
  options: { brandName: string; ttlMinutes: number },
  deps: OtpDeliveryDeps,
): Promise<OtpChannel | null> {
  const text = otpMessage(code, options.brandName, options.ttlMinutes)

  if (recipient.whatsapp_phone) {
    try {
      if (await deps.sendWhatsApp(recipient.whatsapp_phone, text)) return 'whatsapp'
    } catch {
      // repli sur l'email
    }
  }

  if (recipient.email) {
    try {
      const sent = await deps.sendEmail({
        to: recipient.email,
        subject: `${options.brandName} — votre code de connexion`,
        text,
      })
      if (sent) return 'email'
    } catch {
      // repli console éventuel
    }
  }

  if (deps.logToConsole) {
    deps.logToConsole(`[collab-otp] (dev) code pour ${recipient.full_name} : ${code}`)
    return 'console'
  }
  return null
}
