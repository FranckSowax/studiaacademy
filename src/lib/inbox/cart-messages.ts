// ============================================
// Messages WhatsApp d'un panier (pur — partagé serveur / aperçu interface)
// ============================================
// Séquence : accueil → une fiche par formation → récapitulatif chiffré avec
// le lien de finalisation. Aucune donnée personnelle dans les liens : seul le
// code d'inscription (opaque) y figure.

import { formatMoney, getAppConfig } from '@/lib/config/app-config'
import type { FiaInscriptionType } from '@/lib/formations-ia-pricing'

export interface CartLineView {
  code: string
  title: string
  slug: string
  /** Date de session, format AAAA-MM-JJ. */
  sessionDate: string
  lieu: string
  participants: number
  groupRate: boolean
  unitPrice: number | null
  total: number | null
  /** Code public d'inscription (null tant que le panier n'est pas enregistré). */
  inscriptionCode: string | null
}

export interface CartMessageInput {
  firstName: string
  type: FiaInscriptionType
  lines: CartLineView[]
  total: number | null
  /** Mot d'accueil personnalisé (sinon message par défaut). */
  intro?: string | null
}

/** Date lisible dans la langue et le fuseau configurés. */
export function formatSessionDate(isoDate: string): string {
  const { locale, timezone } = getAppConfig().country
  const date = new Date(`${isoDate}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(locale, { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function productUrl(slug: string): string {
  return `${getAppConfig().brand.siteUrl}/formations-ia/${encodeURIComponent(slug)}`
}

/** Page de finalisation (récapitulatif + paiement) d'une inscription. */
export function finalizeUrl(line: CartLineView, type: FiaInscriptionType): string | null {
  if (!line.inscriptionCode) return null
  const params = new URLSearchParams({
    code: line.inscriptionCode,
    f: line.slug,
    d: line.sessionDate,
    type,
    nb: String(line.participants),
  })
  return `${getAppConfig().brand.siteUrl}/formations-ia/merci?${params.toString()}`
}

function priceLine(line: CartLineView): string {
  if (line.unitPrice === null) return '💰 Tarif sur devis — nous vous le communiquons'
  const unit = `${formatMoney(line.unitPrice)} / personne${line.groupRate ? ' (tarif groupe)' : ''}`
  return line.participants > 1 ? `💰 ${unit} — ${formatMoney(line.total)}` : `💰 ${unit}`
}

/**
 * Construit la séquence de messages, dans l'ordre d'envoi.
 *
 * @example
 * buildCartMessages({ firstName: 'Marie', type: 'individuel', lines, total })
 * // [accueil, fiche 1, fiche 2, récapitulatif]
 */
export function buildCartMessages(input: CartMessageInput): string[] {
  const { brand, payment } = getAppConfig()
  const intro =
    input.intro?.trim() ||
    `Bonjour ${input.firstName} 👋\nVoici la sélection de formations ${brand.name} préparée pour vous :`

  const cards = input.lines.map((line) =>
    [
      `*${line.code} — ${line.title}*`,
      `📅 ${formatSessionDate(line.sessionDate)}`,
      `📍 ${line.lieu}`,
      `👥 ${line.participants} participant${line.participants > 1 ? 's' : ''}`,
      priceLine(line),
      `🔎 Voir la formation : ${productUrl(line.slug)}`,
    ].join('\n'),
  )

  const recapLines = input.lines.map(
    (line) => `• ${line.code} — ${line.title} : ${line.total === null ? 'sur devis' : formatMoney(line.total)}`,
  )
  const finalize = input.lines
    .map((line) => {
      const url = finalizeUrl(line, input.type)
      return url ? `👉 ${line.code} : ${url}` : null
    })
    .filter(Boolean)
  const methods = payment.methods.map((m) => m.label).join(' ou ')

  const recap = [
    '🧾 *Récapitulatif*',
    ...recapLines,
    `*Total : ${formatMoney(input.total, 'sur devis')}*`,
    '',
    `Pour voir votre dossier et régler par ${methods} :`,
    ...finalize,
    '',
    'Votre place est confirmée dès réception du paiement. Une question ? Répondez simplement à ce message.',
  ].join('\n')

  return [intro, ...cards, recap]
}
