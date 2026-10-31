// ============================================
// Qualification des conversations — taxonomie, validation, règles (pur)
// ============================================
// Partagé serveur / interface. Valeurs techniques stables, libellés français
// à côté. Ce qui dépend du pays (moyens de paiement) vient de la configuration.

import { getAppConfig } from '@/lib/config/app-config'

// ── Taxonomie fermée ───────────────────────

export const SENTIMENTS = { positive: 'Positif', neutral: 'Neutre', negative: 'Négatif', frustrated: 'Agacé' } as const
export const URGENCIES = { low: 'Faible', medium: 'Moyenne', high: 'Forte' } as const
export const RESOLUTIONS = {
  resolved: 'Résolu',
  in_progress: 'En cours',
  unresolved: 'Non résolu',
  needs_human: 'Besoin d’un humain',
} as const
export const INTENTS = {
  information: 'Information',
  pricing: 'Tarifs',
  enrollment: 'Inscription',
  payment: 'Paiement',
  schedule: 'Dates / horaires',
  support: 'Assistance',
  complaint: 'Réclamation',
  partnership: 'Entreprise / partenariat',
  other: 'Autre',
} as const
/** Stades ordonnés (du plus froid au plus avancé). « lost » est à part. */
export const PURCHASE_STAGES = {
  discovery: 'Découverte',
  interested: 'Intéressé',
  considering: 'En réflexion',
  ready_to_buy: 'Prêt à acheter',
  checkout: 'Inscrit, paiement en attente',
  customer: 'Client (payé)',
  lost: 'Perdu',
} as const
export const OBJECTIONS = {
  price: 'Prix',
  schedule: 'Date / horaire',
  location: 'Lieu',
  payment_method: 'Moyen de paiement',
  trust: 'Confiance',
  content_fit: 'Contenu inadapté',
  level: 'Niveau requis',
  timing: 'Pas le bon moment',
  other: 'Autre',
} as const
export const PREFERRED_FORMATS = {
  in_person: 'Présentiel',
  online: 'En ligne',
  company: 'En entreprise',
  unknown: 'Non précisé',
} as const
export const ABANDON_RISKS = { low: 'Faible', medium: 'Moyen', high: 'Élevé' } as const
/** Chaque prochaine action correspond à un outil de la messagerie. */
export const NEXT_ACTIONS = {
  send_cart: 'Composer et envoyer un panier',
  send_media: 'Envoyer un visuel ou une brochure',
  send_quick_reply: 'Répondre avec une phrase rapide',
  answer_question: 'Répondre à sa question',
  follow_up: 'Relancer plus tard (noter un rappel)',
  handover: 'Passer la main à un collègue',
  close: 'Clôturer la conversation',
  none: 'Rien à faire',
} as const

export type Sentiment = keyof typeof SENTIMENTS
export type Urgency = keyof typeof URGENCIES
export type Resolution = keyof typeof RESOLUTIONS
export type Intent = keyof typeof INTENTS
export type PurchaseStage = keyof typeof PURCHASE_STAGES
export type Objection = keyof typeof OBJECTIONS
export type PreferredFormat = keyof typeof PREFERRED_FORMATS
export type AbandonRisk = keyof typeof ABANDON_RISKS
export type NextAction = keyof typeof NEXT_ACTIONS

/** Moyens de paiement reconnus : ceux de la configuration + « autre » / « aucun ». */
export function paymentMentionValues(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of getAppConfig().payment.methods) out[m.id] = m.label
  out.other = 'Autre'
  out.none = 'Aucun'
  return out
}

export interface ConversationAnalysis {
  sentiment: Sentiment
  urgency: Urgency
  resolution: Resolution
  intent: Intent
  purchase_stage: PurchaseStage
  intent_score: number
  objections: Objection[]
  preferred_format: PreferredFormat
  payment_mentioned: string
  abandon_risk: AbandonRisk
  next_best_action: NextAction
  next_action_detail: string
  need_summary: string
  open_questions: string[]
}

export const DEFAULT_ANALYSIS: ConversationAnalysis = {
  sentiment: 'neutral',
  urgency: 'low',
  resolution: 'in_progress',
  intent: 'other',
  purchase_stage: 'discovery',
  intent_score: 0,
  objections: [],
  preferred_format: 'unknown',
  payment_mentioned: 'none',
  abandon_risk: 'medium',
  next_best_action: 'answer_question',
  next_action_detail: '',
  need_summary: '',
  open_questions: [],
}

// ── Validation stricte (ne lève jamais) ────

function oneOf<T extends string>(value: unknown, allowed: Record<T, string>, fallback: T): T {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(allowed, value) ? (value as T) : fallback
}

function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

/**
 * Ramène la réponse du modèle à la taxonomie : valeur hors liste → défaut,
 * textes coupés, nombre borné. N'importe quelle entrée produit une analyse
 * valide — une analyse ratée n'empêche jamais d'afficher une conversation.
 *
 * @example
 * validateAnalysis({ purchase_stage: 'acheteur', intent_score: 250 })
 * // { …, purchase_stage: 'discovery', intent_score: 100 }
 */
export function validateAnalysis(raw: unknown): ConversationAnalysis {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const score = typeof r.intent_score === 'number' ? r.intent_score : Number(r.intent_score)
  const objections = Array.isArray(r.objections)
    ? [...new Set(r.objections.filter((o): o is Objection => typeof o === 'string' && o in OBJECTIONS))].slice(0, 5)
    : []
  const questions = Array.isArray(r.open_questions)
    ? r.open_questions.map((q) => clip(q, 160)).filter(Boolean).slice(0, 5)
    : []
  return {
    sentiment: oneOf(r.sentiment, SENTIMENTS, DEFAULT_ANALYSIS.sentiment),
    urgency: oneOf(r.urgency, URGENCIES, DEFAULT_ANALYSIS.urgency),
    resolution: oneOf(r.resolution, RESOLUTIONS, DEFAULT_ANALYSIS.resolution),
    intent: oneOf(r.intent, INTENTS, DEFAULT_ANALYSIS.intent),
    purchase_stage: oneOf(r.purchase_stage, PURCHASE_STAGES, DEFAULT_ANALYSIS.purchase_stage),
    intent_score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : DEFAULT_ANALYSIS.intent_score,
    objections,
    preferred_format: oneOf(r.preferred_format, PREFERRED_FORMATS, DEFAULT_ANALYSIS.preferred_format),
    payment_mentioned: oneOf(r.payment_mentioned, paymentMentionValues(), 'none'),
    abandon_risk: oneOf(r.abandon_risk, ABANDON_RISKS, DEFAULT_ANALYSIS.abandon_risk),
    next_best_action: oneOf(r.next_best_action, NEXT_ACTIONS, DEFAULT_ANALYSIS.next_best_action),
    next_action_detail: clip(r.next_action_detail, 200),
    need_summary: clip(r.need_summary, 280),
    open_questions: questions,
  }
}

/**
 * Extrait l'objet JSON de la réponse du modèle (texte autour, balises ```json
 * tolérés). null si aucune donnée exploitable : la réponse a été coupée ou
 * le modèle n'a pas répondu en JSON.
 */
export function extractModelJson(content: string): Record<string, unknown> | null {
  const candidates = [content, content.match(/\{[\s\S]*\}/)?.[0] ?? '']
  for (const candidate of candidates) {
    if (!candidate.trim()) continue
    try {
      const parsed: unknown = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>
    } catch {
      // candidat suivant
    }
  }
  return null
}

/** Analyse JSON brute du modèle (texte) → analyse validée, même si le JSON est cassé. */
export function parseModelAnalysis(content: string): ConversationAnalysis {
  return validateAnalysis(extractModelJson(content))
}

// ── Les faits corrigent le modèle ──────────

const STAGE_ORDER: PurchaseStage[] = ['discovery', 'interested', 'considering', 'ready_to_buy', 'checkout', 'customer']

/** Stade déduit des inscriptions réelles du même numéro (null si aucune). */
export function factStageFromInscriptions(statuses: (string | null | undefined)[]): PurchaseStage | null {
  if (statuses.includes('payee')) return 'customer'
  if (statuses.includes('en_attente_paiement')) return 'checkout'
  return null
}

/**
 * Stade retenu : le plus avancé entre l'avis du modèle et les faits.
 * Un client qui a payé n'est jamais « en réflexion » ni « perdu ».
 */
export function retainedStage(model: PurchaseStage, fact: PurchaseStage | null): PurchaseStage {
  if (!fact) return model
  if (model === 'lost') return fact
  return STAGE_ORDER.indexOf(fact) > STAGE_ORDER.indexOf(model) ? fact : model
}

// ── Quand analyser ─────────────────────────

export const MIN_INBOUND_MESSAGES = 2
export const QUIET_MINUTES = 30

export interface AnalyzeDecisionInput {
  inboundCount: number
  lastMessageAt: string | null
  analyzedAt: string | null
  now: Date
  force?: boolean
}

/**
 * Au moins 2 messages du client, conversation calme depuis 30 minutes, et du
 * nouveau depuis la dernière analyse. Le bouton « ré-analyser » force,
 * sauf s'il n'y a aucun message du client.
 */
export function shouldAnalyze(input: AnalyzeDecisionInput): { ok: boolean; reason: string } {
  if (input.force) {
    return input.inboundCount > 0 ? { ok: true, reason: 'forcée' } : { ok: false, reason: 'aucun message du client' }
  }
  if (input.inboundCount < MIN_INBOUND_MESSAGES) return { ok: false, reason: 'moins de 2 messages du client' }
  if (!input.lastMessageAt) return { ok: false, reason: 'aucun message' }
  const last = new Date(input.lastMessageAt).getTime()
  if (input.now.getTime() - last < QUIET_MINUTES * 60_000) return { ok: false, reason: 'conversation en cours' }
  if (input.analyzedAt && new Date(input.analyzedAt).getTime() >= last) return { ok: false, reason: 'rien de nouveau' }
  return { ok: true, reason: 'à analyser' }
}

// ── Coût et journée ────────────────────────

export interface AnalysisPricing {
  /** Prix par million de tokens d'entrée (null si non configuré). */
  inputPerMillion: number | null
  outputPerMillion: number | null
  currency: string | null
}

/**
 * Coût d'un appel. Inconnu (null) si les tarifs ou l'usage manquent : on
 * n'invente jamais de prix, et un coût inconnu n'est jamais 0.
 */
export function computeAnalysisCost(
  usage: { promptTokens: number; completionTokens: number } | null,
  pricing: AnalysisPricing,
): { amount: number | null; currency: string | null } {
  if (!usage || pricing.inputPerMillion === null || pricing.outputPerMillion === null) {
    return { amount: null, currency: pricing.currency }
  }
  const amount =
    (usage.promptTokens * pricing.inputPerMillion + usage.completionTokens * pricing.outputPerMillion) / 1_000_000
  return { amount: Math.round(amount * 1_000_000) / 1_000_000, currency: pricing.currency }
}

/**
 * Bornes UTC d'une journée locale (AAAA-MM-JJ) dans un fuseau donné.
 *
 * @example
 * dayRangeUtc('2026-10-31', 'Africa/Libreville')
 * // { start: 2026-10-30T23:00:00.000Z, end: 2026-10-31T23:00:00.000Z }
 */
export function dayRangeUtc(day: string, timezone: string): { start: Date; end: Date } {
  const offsetAt = (instant: Date): number => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
        .formatToParts(instant)
        .map((p) => [p.type, p.value]),
    )
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
    return asUtc - instant.getTime()
  }
  const naiveStart = new Date(`${day}T00:00:00Z`)
  const start = new Date(naiveStart.getTime() - offsetAt(naiveStart))
  const naiveEnd = new Date(naiveStart.getTime() + 86_400_000)
  const end = new Date(naiveEnd.getTime() - offsetAt(naiveEnd))
  return { start, end }
}

// ── Bilan du jour (agrégation pure) ────────

export interface DailyReportInput {
  day: string
  inboundMessages: number
  outboundMessages: number
  activeConversations: number
  newConversations: number
  stages: (string | null)[]
  analyses: { objections: string[]; openQuestions: string[]; costAmount: number | null }[]
}

export interface DailyReport {
  day: string
  inboundMessages: number
  outboundMessages: number
  activeConversations: number
  newConversations: number
  stages: Record<string, number>
  topObjections: { objection: string; label: string; count: number }[]
  unansweredQuestions: string[]
  analysesCount: number
  cost: { known: number; unknownCount: number }
}

/** Bilan du jour : volumes, stades, objections récurrentes, questions restées sans réponse. */
export function aggregateDailyReport(input: DailyReportInput): DailyReport {
  const stages: Record<string, number> = {}
  for (const s of input.stages) {
    const key = s && s in PURCHASE_STAGES ? s : 'non_analysee'
    stages[key] = (stages[key] ?? 0) + 1
  }
  const objectionCounts = new Map<string, number>()
  const questions: string[] = []
  let known = 0
  let unknownCount = 0
  for (const a of input.analyses) {
    for (const o of a.objections) objectionCounts.set(o, (objectionCounts.get(o) ?? 0) + 1)
    for (const q of a.openQuestions) if (!questions.includes(q)) questions.push(q)
    if (a.costAmount === null) unknownCount++
    else known += a.costAmount
  }
  return {
    day: input.day,
    inboundMessages: input.inboundMessages,
    outboundMessages: input.outboundMessages,
    activeConversations: input.activeConversations,
    newConversations: input.newConversations,
    stages,
    topObjections: [...objectionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([objection, count]) => ({
        objection,
        label: OBJECTIONS[objection as Objection] ?? objection,
        count,
      })),
    unansweredQuestions: questions.slice(0, 20),
    analysesCount: input.analyses.length,
    cost: { known: Math.round(known * 1_000_000) / 1_000_000, unknownCount },
  }
}

// ── Données personnelles et dialogue ───────

const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
// Suites de 8 chiffres ou plus, espaces/points/tirets tolérés, « + » facultatif
const PHONE_RE = /\+?\d(?:[\s.-]?\d){7,}/g

/** Masque e-mails et numéros de téléphone avant tout envoi au modèle. */
export function maskPersonalData(text: string): string {
  return text.replace(EMAIL_RE, '[email]').replace(PHONE_RE, '[téléphone]')
}

export interface DialogueMessage {
  fromMe: boolean
  type: string
  text: string | null
  sentAt: string
}

const MEDIA_PLACEHOLDER: Record<string, string> = {
  image: '[photo]',
  video: '[vidéo]',
  audio: '[vocal]',
  document: '[document]',
  sticker: '[autocollant]',
  location: '[position]',
  contact: '[contact]',
}

export const DIALOGUE_MAX_MESSAGES = 30

/**
 * Dialogue envoyé au modèle : 30 derniers messages, médias remplacés,
 * données personnelles masquées.
 */
export function buildDialogue(messages: DialogueMessage[]): string {
  return [...messages]
    .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    .slice(-DIALOGUE_MAX_MESSAGES)
    .map((m) => {
      const media = MEDIA_PLACEHOLDER[m.type]
      const text = m.text ? maskPersonalData(m.text).slice(0, 600) : ''
      const content = [media, text].filter(Boolean).join(' ') || '[message vide]'
      return `${m.fromMe ? 'Équipe' : 'Client'} : ${content}`
    })
    .join('\n')
}
