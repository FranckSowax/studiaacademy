import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async (host: string) => {
    const table: Record<string, string> = {
      'public.example': '93.184.216.34',
      'evil.example': '169.254.169.254',
      'rebind.example': '10.0.0.5',
    }
    if (/^[\d.]+$/.test(host) || host.includes(':')) return [{ address: host, family: 4 }]
    const address = table[host]
    if (!address) throw new Error('ENOTFOUND')
    return [{ address, family: 4 }]
  }),
}))

import {
  assertProjectStorageUrl,
  isBlockedAddress,
  parsePublicHttpUrl,
  safeFetch,
  UnsafeUrlError,
} from './safe-fetch'

describe('isBlockedAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    '::',
    'fd12:3456::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    'not-an-ip',
  ])('bloque %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true)
  })

  it.each(['8.8.8.8', '93.184.216.34', '2606:4700:4700::1111'])('autorise %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false)
  })
})

describe('parsePublicHttpUrl', () => {
  it.each([
    'file:///etc/passwd',
    'gopher://host/',
    'http://user:pass@public.example/',
    'http://public.example:6379/',
    'pas une url',
  ])('refuse %s', (raw) => {
    expect(() => parsePublicHttpUrl(raw)).toThrow(UnsafeUrlError)
  })

  it('accepte une URL https standard', () => {
    expect(parsePublicHttpUrl('https://public.example/page').hostname).toBe('public.example')
  })
})

describe('safeFetch', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it("refuse un hôte qui résout vers l'endpoint de métadonnées", async () => {
    await expect(safeFetch('http://evil.example/')).rejects.toThrow(UnsafeUrlError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuse une IP privée littérale', async () => {
    await expect(safeFetch('http://127.0.0.1/admin')).rejects.toThrow(UnsafeUrlError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('revalide la destination de chaque redirection', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 302, headers: { location: 'http://rebind.example/secret' } }),
    )
    await expect(safeFetch('https://public.example/')).rejects.toThrow(UnsafeUrlError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' })
  })

  it("renvoie le contenu d'une page publique", async () => {
    fetchMock.mockResolvedValueOnce(new Response('<p>Bonjour</p>', { status: 200 }))
    const res = await safeFetch('https://public.example/')
    expect(res.ok).toBe(true)
    expect(res.text()).toBe('<p>Bonjour</p>')
  })

  it('coupe une réponse trop volumineuse', async () => {
    fetchMock.mockResolvedValueOnce(new Response('x'.repeat(2048), { status: 200 }))
    await expect(safeFetch('https://public.example/', { maxBytes: 1024 })).rejects.toThrow(
      'Contenu trop volumineux',
    )
  })
})

describe('assertProjectStorageUrl', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co'))
  afterEach(() => vi.unstubAllEnvs())

  it('accepte une URL signée du projet', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/sign/cours-sources/a.pdf?token=t'
    expect(assertProjectStorageUrl(url).pathname).toContain('/storage/v1/object/')
  })

  it.each([
    'https://other.supabase.co/storage/v1/object/sign/x.pdf',
    'https://abc.supabase.co/rest/v1/profiles',
    'http://169.254.169.254/latest/meta-data/',
    'https://abc.supabase.co.evil.example/storage/v1/object/x',
  ])('refuse %s', (url) => {
    expect(() => assertProjectStorageUrl(url)).toThrow(UnsafeUrlError)
  })
})
