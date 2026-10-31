import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isValidPhone, normalizePhone, sendWhatsApp, toChatId } from './index'
import { parseInboundMessage, verifyWahaSignature } from './webhook'

describe('normalizePhone / isValidPhone', () => {
  it.each([
    // Le 0 gabonais est conservé à l'international
    ['07 67 01 58', '24107670158'],
    ['06 12 34 56', '24106123456'],
    ['+241 07 67 01 58', '24107670158'],
    ['00241 07 67 01 58', '24107670158'],
    ['24107670158', '24107670158'],
    ['(077) 12-34-56', '241077123456'],
    // Numéro étranger complet : inchangé
    ['+33 6 12 34 56 78', '33612345678'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected)
    expect(isValidPhone(normalizePhone(raw))).toBe(true)
  })

  it('rejette un numéro non numérique', () => {
    expect(isValidPhone(normalizePhone('abc'))).toBe(false)
  })

  it('construit un chatId WAHA', () => {
    expect(toChatId('07 67 01 58')).toBe('24107670158@c.us')
  })
})

describe('sendWhatsApp', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('WAHA_BASE_URL', 'https://waha.internal/')
    vi.stubEnv('WAHA_API_KEY', 'test-key')
    vi.stubEnv('WAHA_SESSION', '')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("appelle /api/sendText avec la clé et la session par défaut", async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 201 }))
    await expect(sendWhatsApp('077123456', 'Bonjour')).resolves.toBe(true)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://waha.internal/api/sendText')
    expect(init.headers['X-Api-Key']).toBe('test-key')
    expect(JSON.parse(init.body)).toEqual({
      session: 'default',
      chatId: '241077123456@c.us',
      text: 'Bonjour',
    })
  })

  it('retourne false sans lever si WAHA répond une erreur', async () => {
    fetchMock.mockResolvedValueOnce(new Response('down', { status: 500 }))
    await expect(sendWhatsApp('077123456', 'x')).resolves.toBe(false)
  })

  it("n'appelle pas WAHA pour un numéro invalide", async () => {
    await expect(sendWhatsApp('abc', 'x')).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("n'appelle pas WAHA si la configuration est absente", async () => {
    vi.stubEnv('WAHA_API_KEY', '')
    await expect(sendWhatsApp('077123456', 'x')).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('verifyWahaSignature', () => {
  it("valide l'exemple de la documentation WAHA", () => {
    const body = '{"event":"message","session":"default","engine":"WEBJS"}'
    const sig =
      '208f8a55dde9e05519e898b10b89bf0d0b3b0fdf11fdbf09b6b90476301b98d8097c462b2b17a6ce93b6b47a136cf2e78a33a63f6752c2c1631777076153fa89'
    expect(verifyWahaSignature(body, sig, 'sha512', 'my-secret-key')).toBe(true)
  })

  it('refuse une signature fausse, absente ou un autre algorithme', () => {
    const body = '{"a":1}'
    const sig = createHmac('sha512', 'k').update(body).digest('hex')
    expect(verifyWahaSignature(body, sig, 'sha512', 'autre')).toBe(false)
    expect(verifyWahaSignature(body, null, 'sha512', 'k')).toBe(false)
    expect(verifyWahaSignature(body, sig, 'sha256', 'k')).toBe(false)
    expect(verifyWahaSignature(body + ' ', sig, 'sha512', 'k')).toBe(false)
  })
})

describe('parseInboundMessage', () => {
  const now = 1_760_000_000_000
  const base = {
    id: 'evt_01',
    timestamp: now,
    event: 'message',
    session: 'default',
    payload: {
      id: 'false_24177123456@c.us_AAA',
      timestamp: now / 1000,
      from: '24177123456@c.us',
      fromMe: false,
      body: 'Bonjour',
      hasMedia: false,
    },
  }

  it('extrait un message entrant individuel', () => {
    expect(parseInboundMessage(base, now)).toMatchObject({
      eventId: 'evt_01',
      from: '24177123456@c.us',
      body: 'Bonjour',
    })
  })

  it.each([
    ['nos propres messages', { ...base, payload: { ...base.payload, fromMe: true } }],
    ['les groupes', { ...base, payload: { ...base.payload, from: '1203@g.us' } }],
    ['les autres événements', { ...base, event: 'session.status' }],
    ['les événements rejoués trop vieux', { ...base, timestamp: now - 10 * 60 * 1000 }],
  ])('ignore %s', (_label, event) => {
    expect(parseInboundMessage(event, now)).toBeNull()
  })
})
