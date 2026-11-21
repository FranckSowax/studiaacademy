import { afterEach, describe, expect, it, vi } from 'vitest'
import { avertirSiNonConfigure, codeLiveActif, configLancement, urlStudiaLive } from './lancement'

const SECRET = 'secret-de-test-studia-live-0123456789abcdef'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('configuration du lancement Studia Live', () => {
  it('retire le « / » final de STUDIA_LIVE_URL et refuse une valeur invalide', () => {
    vi.stubEnv('STUDIA_LIVE_URL', 'https://live.test/')
    expect(urlStudiaLive()).toBe('https://live.test')
    vi.stubEnv('STUDIA_LIVE_URL', 'pas une adresse')
    expect(urlStudiaLive()).toBeNull()
  })

  it('codeLiveActif : code seulement si tout est configuré et le code bien formé', () => {
    vi.stubEnv('STUDIA_LIVE_URL', 'https://live.test')
    vi.stubEnv('STUDIA_LINK_SECRET', SECRET)
    expect(configLancement()).toEqual({ url: 'https://live.test', secret: SECRET })
    expect(codeLiveActif({ live_code: 'pc-express' })).toBe('pc-express')
    expect(codeLiveActif({ live_code: null })).toBeNull()
    expect(codeLiveActif({})).toBeNull()
    expect(codeLiveActif({ live_code: 'PC Express' })).toBeNull()
    vi.stubEnv('STUDIA_LINK_SECRET', 'trop-court')
    expect(codeLiveActif({ live_code: 'pc-express' })).toBeNull()
  })

  it('avertit au démarrage en nommant la variable manquante, sans rien dire si tout est là', () => {
    const avert = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('STUDIA_LIVE_URL', '')
    vi.stubEnv('STUDIA_LINK_SECRET', SECRET)
    avertirSiNonConfigure()
    expect(avert).toHaveBeenCalledTimes(1)
    expect(avert.mock.calls[0][0]).toContain('STUDIA_LIVE_URL')
    expect(avert.mock.calls[0][0]).not.toContain(SECRET)

    avert.mockClear()
    vi.stubEnv('STUDIA_LIVE_URL', 'https://live.test')
    avertirSiNonConfigure()
    expect(avert).not.toHaveBeenCalled()
  })
})
