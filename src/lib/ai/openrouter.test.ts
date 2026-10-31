import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openRouterChat, OpenRouterError } from './openrouter'

describe('openRouterChat', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('appelle l’endpoint avec la clé et renvoie contenu, usage et coût', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"intent_score":80}' } }],
          usage: { prompt_tokens: 900, completion_tokens: 120, cost: 0.00042 },
        }),
        { status: 200 },
      ),
    )
    const r = await openRouterChat({ model: 'fournisseur/modele', messages: [{ role: 'user', content: 'x' }] })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer test-key')
    expect(JSON.parse(init.body).model).toBe('fournisseur/modele')
    expect(r).toEqual({ content: '{"intent_score":80}', usage: { promptTokens: 900, completionTokens: 120 }, cost: 0.00042 })
  })

  it('coût absent → null (jamais 0)', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), { status: 200 }))
    const r = await openRouterChat({ model: 'm', messages: [] })
    expect(r.cost).toBeNull()
    expect(r.usage).toBeNull()
  })

  it('erreur HTTP → OpenRouterError sans recopier le corps', async () => {
    fetchMock.mockResolvedValueOnce(new Response('détail avec le dialogue', { status: 402 }))
    await expect(openRouterChat({ model: 'm', messages: [] })).rejects.toThrow(new OpenRouterError('OpenRouter a répondu 402'))
  })

  it('sans clé : refus avant tout appel', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '')
    await expect(openRouterChat({ model: 'm', messages: [] })).rejects.toThrow('OPENROUTER_API_KEY')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
