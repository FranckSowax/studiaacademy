// ============================================
// Client Mistral API — Studia Academy
// ============================================

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'

export type MistralModel =
  | 'mistral-large-latest'
  | 'mistral-small-latest'
  | 'pixtral-large-latest'

interface MistralTextMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface MistralImageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: string
}

interface MistralVisionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | MistralImageContent[]
}

type MistralMessage = MistralTextMessage | MistralVisionMessage

interface MistralChatOptions {
  model: MistralModel
  messages: MistralMessage[]
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

interface MistralChoice {
  message: { content: string }
  finish_reason: string
}

interface MistralResponse {
  choices: MistralChoice[]
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

function getApiKey(): string {
  const key = process.env.MISTRAL_API_KEY
  if (!key) {
    throw new Error('MISTRAL_API_KEY non configurée dans les variables d\'environnement')
  }
  return key
}

/**
 * Appel générique à l'API Mistral chat completions.
 */
export async function mistralChat(options: MistralChatOptions): Promise<string> {
  const { model, messages, temperature = 0.3, maxTokens = 4096, jsonMode = false } = options

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  }

  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mistral API erreur ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as MistralResponse
  return data.choices[0]?.message?.content ?? ''
}

/**
 * Appel Mistral attendant une sortie JSON stricte.
 * Parse et retourne l'objet typé.
 */
export async function mistralChatJSON<T>(options: MistralChatOptions): Promise<T> {
  const content = await mistralChat({ ...options, jsonMode: true })
  try {
    return JSON.parse(content) as T
  } catch {
    // Tentative d'extraction du bloc JSON si du texte entoure la réponse
    const match = content.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0]) as T
    }
    throw new Error('Réponse Mistral non parsable en JSON : ' + content.slice(0, 200))
  }
}

/**
 * OCR d'images via Pixtral (vision).
 * Accepte des URLs d'images ou des data URLs base64.
 */
export async function mistralOCR(
  imageUrls: string[],
  instruction: string
): Promise<string> {
  const content: MistralImageContent[] = [
    { type: 'text', text: instruction },
    ...imageUrls.map((url) => ({ type: 'image_url' as const, image_url: url })),
  ]

  return mistralChat({
    model: 'pixtral-large-latest',
    messages: [{ role: 'user', content }],
    temperature: 0.1,
    maxTokens: 4096,
  })
}
