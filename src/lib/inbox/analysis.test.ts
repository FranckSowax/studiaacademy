import { describe, expect, it } from 'vitest'
import { checkCronAuth } from './cron-auth'
import {
  aggregateDailyReport,
  buildDialogue,
  computeAnalysisCost,
  dayRangeUtc,
  DEFAULT_ANALYSIS,
  extractModelJson,
  factStageFromInscriptions,
  maskPersonalData,
  parseModelAnalysis,
  retainedStage,
  shouldAnalyze,
  validateAnalysis,
} from './analysis'

describe('validation de l’analyse', () => {
  it('valeur hors liste → défaut, sans exception', () => {
    const a = validateAnalysis({
      sentiment: 'joyeux',
      purchase_stage: 'acheteur',
      intent_score: 250,
      objections: ['price', 'inventé', 'price', 42],
      payment_mentioned: 'bitcoin',
      next_best_action: 'appeler_le_ministre',
    })
    expect(a.sentiment).toBe('neutral')
    expect(a.purchase_stage).toBe('discovery')
    expect(a.intent_score).toBe(100)
    expect(a.objections).toEqual(['price'])
    expect(a.payment_mentioned).toBe('none')
    expect(a.next_best_action).toBe(DEFAULT_ANALYSIS.next_best_action)
  })

  it('n’importe quelle entrée donne une analyse complète', () => {
    for (const input of [null, undefined, 42, 'texte', [], { intent_score: 'abc' }]) {
      expect(() => validateAnalysis(input)).not.toThrow()
      expect(validateAnalysis(input).intent_score).toBe(0)
    }
  })

  it('coupe les textes et borne les listes', () => {
    const a = validateAnalysis({ need_summary: 'x'.repeat(1000), open_questions: Array(9).fill('Quel prix ?') })
    expect(a.need_summary).toHaveLength(280)
    expect(a.open_questions).toHaveLength(5)
  })

  it('« noter une recherche » fait partie des actions reconnues', () => {
    expect(validateAnalysis({ next_best_action: 'note_request' }).next_best_action).toBe('note_request')
  })

  it('les moyens de paiement viennent de la configuration', () => {
    expect(validateAnalysis({ payment_mentioned: 'airtel_money' }).payment_mentioned).toBe('airtel_money')
  })

  it('extrait le JSON entouré de balises de code ; null si inexploitable', () => {
    expect(extractModelJson('```json\n{ "intent_score": 95 }\n```')).toEqual({ intent_score: 95 })
    expect(extractModelJson('')).toBeNull()
    expect(extractModelJson('{"intent_score": 9')).toBeNull()
    expect(extractModelJson('[1,2]')).toBeNull()
  })

  it('JSON cassé ou entouré de texte → analyse quand même', () => {
    expect(parseModelAnalysis('Voici : {"purchase_stage":"ready_to_buy","intent_score":80} merci').purchase_stage).toBe('ready_to_buy')
    expect(parseModelAnalysis('pas du json').purchase_stage).toBe('discovery')
  })
})

describe('les faits corrigent le modèle', () => {
  it('commande payée + modèle « en réflexion » → client', () => {
    expect(retainedStage('considering', factStageFromInscriptions(['payee']))).toBe('customer')
  })
  it('inscription en attente → au moins « inscrit, paiement en attente »', () => {
    expect(retainedStage('interested', factStageFromInscriptions(['en_attente_paiement', 'annulee']))).toBe('checkout')
  })
  it('un client payé n’est jamais « perdu »', () => {
    expect(retainedStage('lost', 'customer')).toBe('customer')
  })
  it('sans fait, l’avis du modèle est conservé', () => {
    expect(retainedStage('ready_to_buy', factStageFromInscriptions([]))).toBe('ready_to_buy')
    expect(retainedStage('ready_to_buy', factStageFromInscriptions(['annulee']))).toBe('ready_to_buy')
  })
  it('les faits ne font jamais reculer le stade', () => {
    expect(retainedStage('customer', 'checkout')).toBe('customer')
  })
})

describe('quand analyser', () => {
  const now = new Date('2026-10-31T15:00:00Z')
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()

  it('moins de 2 messages du client → non', () => {
    expect(shouldAnalyze({ inboundCount: 1, lastMessageAt: minutesAgo(60), analyzedAt: null, now }).ok).toBe(false)
  })
  it('conversation en cours (< 30 min) → non', () => {
    expect(shouldAnalyze({ inboundCount: 4, lastMessageAt: minutesAgo(10), analyzedAt: null, now })).toMatchObject({
      ok: false,
      reason: 'conversation en cours',
    })
  })
  it('rien de nouveau depuis la dernière analyse → non', () => {
    expect(
      shouldAnalyze({ inboundCount: 4, lastMessageAt: minutesAgo(60), analyzedAt: minutesAgo(40), now }),
    ).toMatchObject({ ok: false, reason: 'rien de nouveau' })
  })
  it('4 messages, calme depuis 30 min, du nouveau → oui', () => {
    expect(shouldAnalyze({ inboundCount: 4, lastMessageAt: minutesAgo(31), analyzedAt: minutesAgo(120), now }).ok).toBe(true)
  })
  it('ré-analyse forcée, même en cours', () => {
    expect(shouldAnalyze({ inboundCount: 1, lastMessageAt: minutesAgo(1), analyzedAt: minutesAgo(0), now, force: true }).ok).toBe(true)
    expect(shouldAnalyze({ inboundCount: 0, lastMessageAt: minutesAgo(1), analyzedAt: null, now, force: true }).ok).toBe(false)
  })
})

describe('coût, journée et bilan', () => {
  it('coût inconnu sans tarif configuré (jamais 0)', () => {
    const usage = { promptTokens: 1000, completionTokens: 200 }
    expect(computeAnalysisCost(usage, { inputPerMillion: null, outputPerMillion: null, currency: null }).amount).toBeNull()
    expect(computeAnalysisCost(null, { inputPerMillion: 1, outputPerMillion: 1, currency: 'EUR' }).amount).toBeNull()
  })
  it('coût calculé depuis les tarifs fournis', () => {
    expect(
      computeAnalysisCost({ promptTokens: 2_000_000, completionTokens: 500_000 }, { inputPerMillion: 0.1, outputPerMillion: 0.3, currency: 'EUR' }),
    ).toEqual({ amount: 0.35, currency: 'EUR' })
  })
  it('bornes de journée dans le fuseau configuré', () => {
    const { start, end } = dayRangeUtc('2026-10-31', 'Africa/Libreville')
    expect(start.toISOString()).toBe('2026-10-30T23:00:00.000Z')
    expect(end.toISOString()).toBe('2026-10-31T23:00:00.000Z')
  })
  it('bilan : stades, objections récurrentes, questions sans réponse, coût', () => {
    const r = aggregateDailyReport({
      day: '2026-10-31',
      inboundMessages: 12,
      outboundMessages: 9,
      activeConversations: 4,
      newConversations: 2,
      stages: ['ready_to_buy', 'considering', null, 'ready_to_buy'],
      analyses: [
        { objections: ['price', 'schedule'], openQuestions: ['Y a-t-il une session en ligne ?'], costAmount: 0.002 },
        { objections: ['price'], openQuestions: ['Y a-t-il une session en ligne ?'], costAmount: null },
      ],
    })
    expect(r.stages).toEqual({ ready_to_buy: 2, considering: 1, non_analysee: 1 })
    expect(r.topObjections[0]).toEqual({ objection: 'price', label: 'Prix', count: 2 })
    expect(r.unansweredQuestions).toEqual(['Y a-t-il une session en ligne ?'])
    expect(r.cost).toEqual({ known: 0.002, unknownCount: 1 })
  })
})

describe('tâches planifiées', () => {
  const secret = 's'.repeat(32)
  it('refus total si le secret n’est pas configuré', () => {
    expect(checkCronAuth(`Bearer ${secret}`, undefined)).toBe('unconfigured')
    expect(checkCronAuth('Bearer court', 'court')).toBe('unconfigured')
  })
  it('accepte le bon secret, refuse le reste', () => {
    expect(checkCronAuth(`Bearer ${secret}`, secret)).toBe('ok')
    expect(checkCronAuth(`Bearer ${'x'.repeat(32)}`, secret)).toBe('denied')
    expect(checkCronAuth(null, secret)).toBe('denied')
    expect(checkCronAuth(secret, secret)).toBe('denied')
  })
})

describe('données personnelles et dialogue', () => {
  it('masque e-mails et numéros', () => {
    expect(maskPersonalData('Écrivez à marie.n@exemple.ga ou au +241 07 67 01 58, merci')).toBe(
      'Écrivez à [email] ou au [téléphone], merci',
    )
    expect(maskPersonalData('Session de 2026 à 95000 FCFA')).toBe('Session de 2026 à 95000 FCFA')
  })

  it('médias en libellés, 30 messages au plus, dans l’ordre', () => {
    const base = new Date('2026-10-31T10:00:00Z').getTime()
    const msgs = Array.from({ length: 40 }, (_, i) => ({
      fromMe: i % 2 === 1,
      type: i === 39 ? 'audio' : 'text',
      text: i === 39 ? null : `message ${i}`,
      sentAt: new Date(base + i * 60_000).toISOString(),
    }))
    const lines = buildDialogue(msgs.reverse()).split('\n')
    expect(lines).toHaveLength(30)
    expect(lines[0]).toBe('Client : message 10')
    expect(lines[29]).toBe('Équipe : [vocal]')
  })
})
