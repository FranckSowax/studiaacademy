// ============================================
// Client OpenRouter (serveur uniquement)
// ============================================
// API compatible OpenAI : POST https://openrouter.ai/api/v1/chat/completions.
// D'après la documentation « Usage Accounting », l'usage est toujours renvoyé
// (usage.prompt_tokens, usage.completion_tokens) avec le coût exact de
// l'appel dans usage.cost, exprimé en crédits OpenRouter.

import { getAppConfig } from '@/lib/config/app-config'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const TIMEOUT_MS = 60_000

/** Unité du coût renvoyé par OpenRouter. */
export const OPENROUTER_COST_UNIT = 'crédits OpenRouter'

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterResult {
  content: string
  usage: { promptTokens: number; completionTokens: number } | null
  /** Coût exact de l'appel en crédits OpenRouter, null si absent de la réponse. */
  cost: number | null
}

export class OpenRouterError extends Error {}

/**
 * Appel de complétion. La clé reste côté serveur (OPENROUTER_API_KEY).
 *
 * @example
 * const r = await openRouterChat({ model: process.env.INBOX_ANALYSIS_MODEL!, messages })
 */
export async function openRouterChat(options: {
  model: string
  messages: OpenRouterMessage[]
  temperature?: number
  maxTokens?: number
}): Promise<OpenRouterResult> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new OpenRouterError('OPENROUTER_API_KEY non configurée')

  let res: Response
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        // Identification facultative de l'application auprès d'OpenRouter
        'HTTP-Referer': getAppConfig().brand.siteUrl,
        'X-Title': getAppConfig().brand.name,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 700,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new OpenRouterError('OpenRouter injoignable')
  }
  // Pas de corps d'erreur dans le message : il peut contenir le dialogue envoyé.
  if (!res.ok) throw new OpenRouterError(`OpenRouter a répondu ${res.status}`)

  const data = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: unknown } }[]
    usage?: { prompt_tokens?: unknown; completion_tokens?: unknown; cost?: unknown }
  } | null
  const content = typeof data?.choices?.[0]?.message?.content === 'string' ? data.choices[0].message.content : ''
  const u = data?.usage
  const usage =
    typeof u?.prompt_tokens === 'number' && typeof u?.completion_tokens === 'number'
      ? { promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens }
      : null
  const cost = typeof u?.cost === 'number' && Number.isFinite(u.cost) ? u.cost : null
  return { content, usage, cost }
}
