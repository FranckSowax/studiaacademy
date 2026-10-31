// ============================================
// Qualification par modèle de langage (serveur uniquement)
// ============================================
// Variables d'environnement :
//   INBOX_ANALYSIS_PROVIDER              openrouter | mistral (défaut : openrouter si OPENROUTER_API_KEY)
//   OPENROUTER_API_KEY                   clé OpenRouter (coût exact renvoyé par l'API)
//   INBOX_ANALYSIS_MODEL                 OpenRouter : identifiant du modèle (OBLIGATOIRE)
//                                        Mistral : mistral-small-latest (défaut) | mistral-large-latest
//   INBOX_ANALYSIS_DAILY_CAP             analyses max par jour (défaut 200)
//   INBOX_ANALYSIS_BATCH                 analyses max par passage planifié (défaut 10)
//   INBOX_ANALYSIS_PRICE_INPUT_PER_MTOK  tarif / million de tokens d'entrée (sinon coût inconnu)
//   INBOX_ANALYSIS_PRICE_OUTPUT_PER_MTOK tarif / million de tokens de sortie
//   INBOX_ANALYSIS_PRICE_CURRENCY        devise de ces tarifs

import { getAppConfig } from '@/lib/config/app-config'
import { mistralChatWithUsage, type MistralModel } from '@/lib/mistral/client'
import { OPENROUTER_COST_UNIT, openRouterChat } from '@/lib/ai/openrouter'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ABANDON_RISKS,
  aggregateDailyReport,
  buildDialogue,
  computeAnalysisCost,
  dayRangeUtc,
  factStageFromInscriptions,
  INTENTS,
  NEXT_ACTIONS,
  OBJECTIONS,
  extractModelJson,
  parseModelAnalysis,
  paymentMentionValues,
  PREFERRED_FORMATS,
  PURCHASE_STAGES,
  RESOLUTIONS,
  retainedStage,
  SENTIMENTS,
  shouldAnalyze,
  URGENCIES,
  validateAnalysis,
  type AnalysisPricing,
  type ConversationAnalysis,
  type DailyReport,
  type PurchaseStage,
} from './analysis'

const ALLOWED_MODELS: MistralModel[] = ['mistral-small-latest', 'mistral-large-latest']

function envNumber(name: string): number | null {
  const v = process.env[name]
  if (!v || !v.trim()) return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export type AnalysisProvider = 'openrouter' | 'mistral'

export function analysisSettings() {
  const configured = process.env.INBOX_ANALYSIS_MODEL?.trim() || null
  const provider: AnalysisProvider =
    process.env.INBOX_ANALYSIS_PROVIDER === 'mistral'
      ? 'mistral'
      : process.env.INBOX_ANALYSIS_PROVIDER === 'openrouter' || process.env.OPENROUTER_API_KEY
        ? 'openrouter'
        : 'mistral'
  const pricing: AnalysisPricing = {
    inputPerMillion: envNumber('INBOX_ANALYSIS_PRICE_INPUT_PER_MTOK'),
    outputPerMillion: envNumber('INBOX_ANALYSIS_PRICE_OUTPUT_PER_MTOK'),
    currency: process.env.INBOX_ANALYSIS_PRICE_CURRENCY?.trim() || null,
  }
  // OpenRouter : le modèle est OBLIGATOIRE (identifiant choisi sur openrouter.ai/models,
  // jamais deviné). Mistral direct : liste fermée, mistral-small-latest par défaut.
  const model =
    provider === 'openrouter'
      ? configured
      : configured && ALLOWED_MODELS.includes(configured as MistralModel)
        ? configured
        : 'mistral-small-latest'
  return {
    provider,
    model,
    // Les modèles qui « raisonnent » consomment des centaines de tokens avant
    // d'écrire le JSON : un plafond trop bas coupe la réponse.
    maxTokens: envNumber('INBOX_ANALYSIS_MAX_TOKENS') ?? 3000,
    dailyCap: envNumber('INBOX_ANALYSIS_DAILY_CAP') ?? 200,
    batchSize: envNumber('INBOX_ANALYSIS_BATCH') ?? 10,
    pricing,
  }
}

function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: getAppConfig().country.timezone })
}

async function analysesToday(): Promise<number> {
  const { start, end } = dayRangeUtc(todayLocal(), getAppConfig().country.timezone)
  const admin = createAdminClient()
  const { count } = await admin
    .from('wa_conversation_analyses')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
  return count ?? 0
}

const list = (o: Record<string, string>) => Object.keys(o).join(' | ')

/** Ce que chaque action déclenche réellement dans la messagerie (pour guider le modèle). */
const NEXT_ACTIONS_GUIDE: Record<keyof typeof NEXT_ACTIONS, string> = {
  send_cart: "le client veut s'inscrire ou payer : lui envoyer son inscription et le lien de paiement",
  send_media: 'lui envoyer un visuel, une brochure ou un programme',
  send_quick_reply: 'question courante à laquelle une réponse type suffit',
  note_request: "le client cherche une formation, un thème ou un format absent du catalogue : noter sa demande pour que l'équipe la recherche",
  answer_question: 'question précise qui demande une réponse rédigée',
  follow_up: 'le client hésite ou reviendra plus tard : prévoir une relance',
  handover: "demande hors du périmètre de la personne : passer la main",
  close: 'échange terminé, rien à ajouter',
  none: 'aucune action utile',
}

function systemPrompt(): string {
  const { brand } = getAppConfig()
  return `Tu analyses une conversation WhatsApp entre un client et l'équipe de ${brand.name} (formations professionnelles, notamment à l'intelligence artificielle).
Réponds UNIQUEMENT par un objet JSON avec exactement ces clés, valeurs prises dans les listes :
- sentiment : ${list(SENTIMENTS)}
- urgency : ${list(URGENCIES)}
- resolution : ${list(RESOLUTIONS)}
- intent : ${list(INTENTS)}
- purchase_stage : ${list(PURCHASE_STAGES)}
- intent_score : entier de 0 à 100 (probabilité que le client s'inscrive et paie)
- objections : tableau parmi ${list(OBJECTIONS)} (vide si aucune)
- preferred_format : ${list(PREFERRED_FORMATS)}
- payment_mentioned : ${list(paymentMentionValues())}
- abandon_risk : ${list(ABANDON_RISKS)}
- next_best_action : une valeur parmi (signification entre parenthèses) :
${Object.entries(NEXT_ACTIONS_GUIDE)
  .map(([k, v]) => `    ${k} (${v})`)
  .join('\n')}
- next_action_detail : une phrase concrète pour l'équipe (français, 200 caractères max)
- need_summary : le besoin du client en une phrase (français, 280 caractères max)
- open_questions : questions du client restées sans réponse de l'équipe (français, 5 max)
N'invente rien qui ne soit pas dans la conversation. Les données personnelles sont masquées.`
}

export type AnalyzeOutcome =
  | { status: 'analyzed'; analysis: ConversationAnalysis; finalStage: PurchaseStage }
  | { status: 'skipped'; reason: string }

/**
 * Analyse une conversation si les conditions sont réunies (ou si forcée),
 * dans la limite du plafond quotidien. Ne lève pas pour une analyse ratée :
 * renvoie « skipped » avec la raison.
 */
export async function analyzeConversation(conversationId: string, options: { force?: boolean } = {}): Promise<AnalyzeOutcome> {
  const settings = analysisSettings()
  const admin = createAdminClient()

  const { data: conv } = await admin
    .from('wa_conversations')
    .select('id, phone, last_message_at, analyzed_at')
    .eq('id', conversationId)
    .maybeSingle()
  if (!conv) return { status: 'skipped', reason: 'conversation introuvable' }

  const { data: messages } = await admin
    .from('wa_messages')
    .select('id, from_me, type, text, sent_at')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: false })
    .limit(30)
  const thread = messages ?? []
  const { count: inboundCount } = await admin
    .from('wa_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('from_me', false)

  const decision = shouldAnalyze({
    inboundCount: inboundCount ?? 0,
    lastMessageAt: conv.last_message_at as string | null,
    analyzedAt: conv.analyzed_at as string | null,
    now: new Date(),
    force: options.force,
  })
  if (!decision.ok) return { status: 'skipped', reason: decision.reason }

  if ((await analysesToday()) >= settings.dailyCap) {
    return { status: 'skipped', reason: `plafond quotidien atteint (${settings.dailyCap})` }
  }

  const dialogue = buildDialogue(
    thread.map((m) => ({
      fromMe: m.from_me as boolean,
      type: m.type as string,
      text: (m.text as string | null) ?? null,
      sentAt: m.sent_at as string,
    })),
  )

  if (!settings.model) return { status: 'skipped', reason: 'modèle non configuré (INBOX_ANALYSIS_MODEL)' }

  const prompt = [
    { role: 'system' as const, content: systemPrompt() },
    { role: 'user' as const, content: dialogue },
  ]
  let content: string
  let usage: { promptTokens: number; completionTokens: number } | null
  // Coût exact fourni par le fournisseur (OpenRouter), sinon calculé depuis les tarifs configurés.
  let providerCost: { amount: number | null; currency: string | null } | null = null
  try {
    if (settings.provider === 'openrouter') {
      const res = await openRouterChat({ model: settings.model, messages: prompt, temperature: 0.1, maxTokens: settings.maxTokens })
      content = res.content
      usage = res.usage
      if (res.cost !== null) providerCost = { amount: res.cost, currency: OPENROUTER_COST_UNIT }
    } else {
      const res = await mistralChatWithUsage({
        model: settings.model as MistralModel,
        temperature: 0.1,
        maxTokens: settings.maxTokens,
        jsonMode: true,
        messages: prompt,
      })
      content = res.content
      usage = res.usage
    }
  } catch (error) {
    console.error('[inbox-analyze] appel modèle échoué:', error instanceof Error ? error.message.slice(0, 120) : 'erreur')
    return { status: 'skipped', reason: 'modèle indisponible' }
  }

  const lastMessageId = (thread[0]?.id as string | undefined) ?? null
  const raw = extractModelJson(content)
  if (!raw) {
    // WHY: une réponse coupée ou hors JSON donnerait une analyse « par défaut »
    // trompeuse. On trace la tentative (coût, plafond du jour) sans toucher au
    // stade de la conversation, et on la date pour ne pas repayer en boucle.
    const failedCost = providerCost ?? computeAnalysisCost(usage, settings.pricing)
    await admin.from('wa_conversation_analyses').insert({
      conversation_id: conversationId,
      analyzed_message_id: lastMessageId,
      model: `${settings.provider}:${settings.model}`,
      result: { error: 'réponse inexploitable' },
      input_tokens: usage?.promptTokens ?? null,
      output_tokens: usage?.completionTokens ?? null,
      cost_amount: failedCost.amount,
      cost_currency: failedCost.currency,
    })
    await admin
      .from('wa_conversations')
      .update({ analyzed_at: new Date().toISOString(), analyzed_message_id: lastMessageId })
      .eq('id', conversationId)
    console.warn('[inbox-analyze] réponse du modèle inexploitable (coupée ou hors JSON)')
    return { status: 'skipped', reason: 'réponse du modèle inexploitable (augmentez INBOX_ANALYSIS_MAX_TOKENS ou changez de modèle)' }
  }
  const analysis = validateAnalysis(raw)

  // Les faits corrigent le modèle : inscriptions réelles du même numéro.
  let factStage: PurchaseStage | null = null
  if (conv.phone) {
    const { data: inscriptions } = await admin
      .from('fia_inscriptions')
      .select('statut')
      .eq('telephone_whatsapp', `+${conv.phone}`)
    factStage = factStageFromInscriptions((inscriptions ?? []).map((i) => i.statut as string))
  }
  const finalStage = retainedStage(analysis.purchase_stage, factStage)
  const cost = providerCost ?? computeAnalysisCost(usage, settings.pricing)

  const { error: insertError } = await admin.from('wa_conversation_analyses').insert({
    conversation_id: conversationId,
    analyzed_message_id: lastMessageId,
    model: `${settings.provider}:${settings.model}`,
    result: analysis,
    model_stage: analysis.purchase_stage,
    fact_stage: factStage,
    final_stage: finalStage,
    intent_score: analysis.intent_score,
    input_tokens: usage?.promptTokens ?? null,
    output_tokens: usage?.completionTokens ?? null,
    cost_amount: cost.amount,
    cost_currency: cost.currency,
  })
  if (insertError) return { status: 'skipped', reason: 'enregistrement impossible (migration appliquée ?)' }

  // Copie sur la conversation : la liste filtre et trie sans jointure.
  await admin
    .from('wa_conversations')
    .update({
      purchase_stage: finalStage,
      purchase_intent_score: analysis.intent_score,
      abandon_risk: analysis.abandon_risk,
      next_best_action: analysis.next_best_action,
      analyzed_at: new Date().toISOString(),
      analyzed_message_id: lastMessageId,
    })
    .eq('id', conversationId)

  return { status: 'analyzed', analysis, finalStage }
}

export interface LatestAnalysis {
  analysis: ConversationAnalysis
  modelStage: string | null
  factStage: string | null
  finalStage: string | null
  model: string
  costAmount: number | null
  costCurrency: string | null
  createdAt: string
}

export async function getLatestAnalysis(conversationId: string): Promise<LatestAnalysis | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('wa_conversation_analyses')
    .select('*')
    .eq('conversation_id', conversationId)
    // Les tentatives inexploitables (sans stade retenu) ne s'affichent pas comme des analyses.
    .not('final_stage', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return {
    analysis: parseModelAnalysis(JSON.stringify(data.result)),
    modelStage: (data.model_stage as string | null) ?? null,
    factStage: (data.fact_stage as string | null) ?? null,
    finalStage: (data.final_stage as string | null) ?? null,
    model: String(data.model),
    costAmount: data.cost_amount === null ? null : Number(data.cost_amount),
    costCurrency: (data.cost_currency as string | null) ?? null,
    createdAt: String(data.created_at),
  }
}

/**
 * Passage planifié : analyse les conversations en attente (du nouveau depuis
 * la dernière analyse, calmes depuis 30 min), par lot, dans le plafond du jour.
 */
export async function runPendingAnalyses(): Promise<{ analyzed: number; skipped: Record<string, number> }> {
  const settings = analysisSettings()
  const remaining = Math.max(0, settings.dailyCap - (await analysesToday()))
  const limit = Math.min(settings.batchSize, remaining)
  const skipped: Record<string, number> = {}
  if (limit === 0) return { analyzed: 0, skipped: { 'plafond quotidien atteint': 1 } }

  const admin = createAdminClient()
  const quietBefore = new Date(Date.now() - 30 * 60_000).toISOString()
  // Candidats larges ; la règle shouldAnalyze tranche ensuite pour chacun.
  const { data: candidates } = await admin
    .from('wa_conversations')
    .select('id, last_message_at, analyzed_at')
    .not('last_inbound_at', 'is', null)
    .lt('last_message_at', quietBefore)
    .order('last_message_at', { ascending: false })
    .limit(limit * 5)

  let analyzed = 0
  for (const c of candidates ?? []) {
    if (analyzed >= limit) break
    if (c.analyzed_at && c.last_message_at && new Date(c.analyzed_at) >= new Date(c.last_message_at)) continue
    const outcome = await analyzeConversation(String(c.id))
    if (outcome.status === 'analyzed') analyzed++
    else skipped[outcome.reason] = (skipped[outcome.reason] ?? 0) + 1
  }
  return { analyzed, skipped }
}

/** Bilan d'une journée locale (par défaut : hier), enregistré dans wa_daily_reports. */
export async function buildAndStoreDailyReport(day?: string): Promise<DailyReport> {
  const { timezone } = getAppConfig().country
  const targetDay =
    day ?? new Date(Date.now() - 86_400_000).toLocaleDateString('en-CA', { timeZone: timezone })
  const { start, end } = dayRangeUtc(targetDay, timezone)
  const from = start.toISOString()
  const to = end.toISOString()
  const admin = createAdminClient()

  const [inbound, outbound, activeRows, created, analyses] = await Promise.all([
    admin.from('wa_messages').select('id', { count: 'exact', head: true }).eq('from_me', false).gte('sent_at', from).lt('sent_at', to),
    admin.from('wa_messages').select('id', { count: 'exact', head: true }).eq('from_me', true).gte('sent_at', from).lt('sent_at', to),
    admin.from('wa_messages').select('conversation_id').gte('sent_at', from).lt('sent_at', to).limit(10_000),
    admin.from('wa_conversations').select('id', { count: 'exact', head: true }).gte('created_at', from).lt('created_at', to),
    admin.from('wa_conversation_analyses').select('result, cost_amount').gte('created_at', from).lt('created_at', to).limit(5_000),
  ])

  const activeIds = [...new Set((activeRows.data ?? []).map((r) => String(r.conversation_id)))]
  const { data: stageRows } = activeIds.length
    ? await admin.from('wa_conversations').select('purchase_stage').in('id', activeIds)
    : { data: [] as { purchase_stage: string | null }[] }

  const report = aggregateDailyReport({
    day: targetDay,
    inboundMessages: inbound.count ?? 0,
    outboundMessages: outbound.count ?? 0,
    activeConversations: activeIds.length,
    newConversations: created.count ?? 0,
    stages: (stageRows ?? []).map((r) => (r.purchase_stage as string | null) ?? null),
    analyses: (analyses.data ?? []).map((a) => {
      const parsed = parseModelAnalysis(JSON.stringify(a.result))
      return {
        objections: parsed.objections,
        openQuestions: parsed.open_questions,
        costAmount: a.cost_amount === null ? null : Number(a.cost_amount),
      }
    }),
  })

  await admin
    .from('wa_daily_reports')
    .upsert(
      {
        day: targetDay,
        report,
        cost_amount: report.cost.unknownCount > 0 ? null : report.cost.known,
        cost_currency: analysisSettings().pricing.currency,
      },
      { onConflict: 'day' },
    )
  return report
}
