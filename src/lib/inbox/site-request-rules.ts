// ============================================
// Demandes envoyées depuis les pages du site — règles pures (sans E/S)
// ============================================
// Une demande du site (inscription, réservation, devis, contact…) ouvre ou
// rejoint la conversation WhatsApp du client dans /messagerie : on lui envoie
// un accusé de réception depuis le numéro Studia, et l'équipe répond dans le
// même fil.

export const SITE_REQUEST_KINDS = [
  'formation',
  'presentiel',
  'formation-ia',
  'devis',
  'contact',
  'partenariat',
] as const

export type SiteRequestKind = (typeof SITE_REQUEST_KINDS)[number]

export interface SiteRequest {
  kind: SiteRequestKind
  /** Prénom ou nom du client, si connu. */
  name?: string | null
  /** Objet de la demande (titre de la formation, de la session…). */
  title?: string | null
  /** Message libre saisi par le client. */
  details?: string | null
  /** Chemin de la page d'origine (ex. « /formations/ia-recrutement »). */
  page?: string | null
}

/** Origine enregistrée sur la conversation (colonne wa_conversations.source). */
export interface SiteSource {
  type: 'site'
  kind: SiteRequestKind
  title: string | null
  page: string | null
}

const KIND_LABELS: Record<SiteRequestKind, string> = {
  formation: 'votre demande d’accès à la formation',
  presentiel: 'votre réservation pour la session',
  'formation-ia': 'votre inscription à la formation',
  devis: 'votre demande de devis',
  contact: 'votre message',
  partenariat: 'votre demande de partenariat',
}

/** Libellé court affiché dans /messagerie (« venu du site · … »). */
export const SITE_KIND_SHORT: Record<SiteRequestKind, string> = {
  formation: 'formation en ligne',
  presentiel: 'réservation présentiel',
  'formation-ia': 'inscription Formations IA',
  devis: 'devis entreprise',
  contact: 'formulaire de contact',
  partenariat: 'partenariat',
}

export const MAX_DETAILS_LENGTH = 1000
const MAX_FIELD_LENGTH = 200

function clean(value: string | null | undefined, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (!trimmed) return null
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

/** Premier mot du nom, pour une salutation naturelle. */
function firstName(name: string | null): string | null {
  return name ? (name.split(' ')[0] ?? null) : null
}

/** Vrai si la valeur est un type de demande connu. */
export function isSiteRequestKind(value: unknown): value is SiteRequestKind {
  return typeof value === 'string' && (SITE_REQUEST_KINDS as readonly string[]).includes(value)
}

/**
 * Texte de l'accusé de réception envoyé au client sur WhatsApp. Il reprend
 * l'objet et le message de la demande pour que l'équipe les retrouve dans le fil.
 *
 * @example
 * buildSiteRequestAck({ kind: 'formation', name: 'Marie Ndong', title: 'L’IA pour recruter' })
 * // « Bonjour Marie 👋\nNous avons bien reçu votre demande d’accès à la formation « L’IA pour recruter »… »
 */
export function buildSiteRequestAck(request: SiteRequest): string {
  const name = firstName(clean(request.name, MAX_FIELD_LENGTH))
  const title = clean(request.title, MAX_FIELD_LENGTH)
  const details = clean(request.details, MAX_DETAILS_LENGTH)

  const lines = [
    name ? `Bonjour ${name} 👋` : 'Bonjour 👋',
    `Nous avons bien reçu ${KIND_LABELS[request.kind]}${title ? ` « ${title} »` : ''} sur le site Studia Academy.`,
  ]
  if (details) lines.push(`Votre message : « ${details} »`)
  lines.push('Un conseiller vous répond ici même, sur WhatsApp. À très vite !')
  return lines.join('\n')
}

/** Origine à enregistrer sur la conversation. */
export function siteSource(request: SiteRequest): SiteSource {
  const page = clean(request.page, MAX_FIELD_LENGTH)
  return {
    type: 'site',
    kind: request.kind,
    title: clean(request.title, MAX_FIELD_LENGTH),
    // WHY: on ne garde qu'un chemin interne, jamais une URL arbitraire fournie par le client.
    page: page?.startsWith('/') && !page.startsWith('//') ? page : null,
  }
}
