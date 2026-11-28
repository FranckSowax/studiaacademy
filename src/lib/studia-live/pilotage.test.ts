import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  envoyerFinalesLive, lienRapportValide, lireSessionLive, listerSessionsLive, MESSAGES_ERREUR_LIVE, RELANCE_MAX, sansLiens,
} from './pilotage'

const SECRET = 'secret-de-test-studia-live-0123456789abcdef'
const LIVE = 'https://live.test'
const SESSION = '3f1c2b7a-6d5e-4f80-9a1b-2c3d4e5f6071'
const P1 = '11111111-1111-4111-8111-111111111111'
const P2 = '22222222-2222-4222-8222-222222222222'

const fauxFetch = vi.fn()
const erreurs = vi.fn()

function reponse(status: number, corps: unknown) {
  return new Response(JSON.stringify(corps), { status, headers: { 'content-type': 'application/json' } })
}
const signature = (message: string) => createHmac('sha256', SECRET).update(message).digest('hex')

const DETAIL = {
  contrat: 1,
  session: { id: SESSION, code: 'NXUPU9', titre: 'Atelier IA' },
  formateur: null,
  indicateurs: { indice: 59, synthese: 'Bonne session.' },
  activites: [],
  participants: [{ id: P1, prenom: 'Awa', email: 'awa@exemple.ga', reponses: [] }],
  reponses_anonymes: [],
  liens: { rapport_direction: `${LIVE}/rapport/abc`, rapport_direction_expire_le: '2026-12-28T00:00:00Z' },
}

beforeEach(() => {
  vi.stubEnv('STUDIA_LINK_SECRET', SECRET)
  vi.stubEnv('STUDIA_LIVE_URL', `${LIVE}/`)
  vi.stubGlobal('fetch', fauxFetch)
  vi.spyOn(console, 'error').mockImplementation(erreurs)
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-28T10:00:00Z'))
  fauxFetch.mockReset()
  erreurs.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('signature des appels', () => {
  it('signe un GET sur `${timestamp}.` (corps vide) et n’envoie pas de corps', async () => {
    fauxFetch.mockResolvedValue(reponse(200, { contrat: 1, total: 0, limite: 20, decalage: 0, sessions: [] }))
    const r = await listerSessionsLive({ decalage: 40 })
    expect(r.ok).toBe(true)

    const [url, init] = fauxFetch.mock.calls[0]
    expect(url).toBe(`${LIVE}/api/integrations/studia-academy/sessions?limite=20&decalage=40`)
    const ts = String(Math.floor(Date.parse('2026-11-28T10:00:00Z') / 1000))
    expect(init.method).toBe('GET')
    expect(init.body).toBeUndefined()
    expect(init.headers['X-Studia-Timestamp']).toBe(ts)
    expect(init.headers['X-Studia-Signature']).toBe(signature(`${ts}.`))
    expect(init.cache).toBe('no-store')
    expect(init.redirect).toBe('error')
  })

  it('plafonne la limite de la liste à 20', async () => {
    fauxFetch.mockResolvedValue(reponse(200, { contrat: 1, total: 0, limite: 20, decalage: 0, sessions: [] }))
    await listerSessionsLive({ limite: 500 })
    expect(fauxFetch.mock.calls[0][0]).toContain('limite=20&decalage=0')
  })

  it('signe un POST sur le corps exact envoyé', async () => {
    fauxFetch.mockResolvedValue(reponse(200, { envoyes: 1, echecs: 0, sans_email: 0, deja: 0, academy: 1 }))
    const r = await envoyerFinalesLive(SESSION, { participantIds: [P1, P2, P1], forcer: true })
    expect(r).toEqual({ ok: true, data: { envoyes: 1, echecs: 0, sans_email: 0, deja: 0, academy: 1 } })

    const [url, init] = fauxFetch.mock.calls[0]
    expect(url).toBe(`${LIVE}/api/integrations/studia-academy/sessions/${SESSION}/finales`)
    expect(init.body).toBe(JSON.stringify({ participant_ids: [P1, P2], forcer: true }))
    expect(init.headers['Content-Type']).toBe('application/json')
    const ts = init.headers['X-Studia-Timestamp']
    expect(init.headers['X-Studia-Signature']).toBe(signature(`${ts}.${init.body}`))
  })

  it('envoie `{}` pour les finales manquantes, sans `forcer`', async () => {
    fauxFetch.mockResolvedValue(reponse(200, { envoyes: 3, echecs: 0, sans_email: 2, deja: 30, academy: 3 }))
    await envoyerFinalesLive(SESSION, { tous: true })
    expect(fauxFetch.mock.calls[0][1].body).toBe('{}')
  })

  it('n’ajoute pas `forcer` à un envoi ciblé simple', async () => {
    fauxFetch.mockResolvedValue(reponse(200, { envoyes: 1, echecs: 0, sans_email: 0, deja: 0, academy: 0 }))
    await envoyerFinalesLive(SESSION, { participantIds: [P1], forcer: false })
    expect(fauxFetch.mock.calls[0][1].body).toBe(JSON.stringify({ participant_ids: [P1] }))
  })
})

describe('liaison non configurée', () => {
  it.each([
    ['sans adresse', () => vi.stubEnv('STUDIA_LIVE_URL', '')],
    ['sans secret', () => vi.stubEnv('STUDIA_LINK_SECRET', '')],
    ['secret trop court', () => vi.stubEnv('STUDIA_LINK_SECRET', 'court')],
  ])('%s : aucun appel, message dédié', async (_nom, casser) => {
    casser()
    for (const r of [await listerSessionsLive(), await lireSessionLive(SESSION), await envoyerFinalesLive(SESSION, { tous: true })]) {
      expect(r).toEqual({ ok: false, code: 'non_configure', message: 'Liaison Studia Live non configurée' })
    }
    expect(fauxFetch).not.toHaveBeenCalled()
  })
})

describe('erreurs du contrat', () => {
  it.each([
    [401, { error: 'signature_invalide' }, 'signature_invalide'],
    [404, { error: 'session_introuvable' }, 'session_introuvable'],
    [503, { error: 'service_indisponible' }, 'service_indisponible'],
    [503, { error: 'email_non_configure' }, 'email_non_configure'],
    [400, { error: 'relance_forcee_ciblee_uniquement' }, 'relance_forcee_ciblee_uniquement'],
    [400, { erreur: 'participants_invalides' }, 'participants_invalides'],
    [401, 'pas du JSON', 'signature_invalide'],
    [500, { error: 'boom', stack: 'at secret.ts:1' }, 'erreur_inconnue'],
  ] as const)('HTTP %i %j → %s, en français', async (status, corps, code) => {
    fauxFetch.mockResolvedValue(reponse(status, corps))
    const r = await envoyerFinalesLive(SESSION, { tous: true })
    expect(r).toEqual({ ok: false, code, message: MESSAGES_ERREUR_LIVE[code] })
  })

  it('ne remonte jamais l’erreur brute ni le corps reçu', async () => {
    fauxFetch.mockResolvedValue(reponse(500, { error: 'TypeError: x is undefined', email: 'awa@exemple.ga' }))
    const r = await lireSessionLive(SESSION)
    expect(JSON.stringify(r)).not.toMatch(/TypeError|awa@/)
    expect(JSON.stringify(erreurs.mock.calls)).not.toMatch(/TypeError|awa@/)
  })

  it('délai dépassé', async () => {
    fauxFetch.mockRejectedValue(Object.assign(new Error('The operation timed out'), { name: 'TimeoutError' }))
    const r = await lireSessionLive(SESSION)
    expect(r).toMatchObject({ ok: false, code: 'delai_depasse' })
  })

  it('réseau en panne', async () => {
    fauxFetch.mockRejectedValue(new TypeError('fetch failed'))
    const r = await listerSessionsLive()
    expect(r).toMatchObject({ ok: false, code: 'injoignable', message: 'Impossible de joindre Studia Live.' })
  })

  it.each([
    ['liste sans tableau', () => listerSessionsLive(), { contrat: 1, total: 3 }],
    ['session sans identifiant valide', () => listerSessionsLive(), { total: 1, sessions: [{ id: 'x', code: 'A', titre: 'T' }] }],
    ['détail sans participants', () => lireSessionLive(SESSION), { session: DETAIL.session, indicateurs: {} }],
    ['bilan sans compteur', () => envoyerFinalesLive(SESSION, { tous: true }), { ok: true }],
  ])('réponse 200 hors contrat : %s', async (_nom, appel, corps) => {
    fauxFetch.mockResolvedValue(reponse(200, corps))
    expect(await appel()).toMatchObject({ ok: false, code: 'reponse_invalide' })
  })
})

describe('garde-fous avant l’appel', () => {
  it('refuse un identifiant de session mal formé sans appeler Studia Live', async () => {
    expect(await lireSessionLive('../ticket')).toMatchObject({ ok: false, code: 'session_introuvable' })
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it(`refuse une relance forcée de plus de ${RELANCE_MAX} participants`, async () => {
    const ids = Array.from({ length: RELANCE_MAX + 1 }, (_, i) => `${String(i).padStart(8, '0')}-0000-4000-8000-000000000000`)
    const r = await envoyerFinalesLive(SESSION, { participantIds: ids, forcer: true })
    expect(r).toMatchObject({ ok: false, code: 'relance_forcee_ciblee_uniquement' })
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('refuse une sélection vide ou mal formée', async () => {
    expect(await envoyerFinalesLive(SESSION, { participantIds: [], forcer: true })).toMatchObject({ code: 'participants_invalides' })
    expect(await envoyerFinalesLive(SESSION, { participantIds: ['abc'], forcer: false })).toMatchObject({ code: 'participants_invalides' })
    expect(fauxFetch).not.toHaveBeenCalled()
  })
})

describe('détail et lien du rapport', () => {
  it('lit le détail et complète les tableaux absents', async () => {
    fauxFetch.mockResolvedValue(reponse(200, { ...DETAIL, activites: undefined, reponses_anonymes: undefined }))
    const r = await lireSessionLive(SESSION)
    if (!r.ok) throw new Error('détail attendu')
    expect(r.data.activites).toEqual([])
    expect(r.data.reponses_anonymes).toEqual([])
    expect(r.data.liens.rapport_direction).toBe(`${LIVE}/rapport/abc`)
  })

  it('retire les liens avant conservation', async () => {
    fauxFetch.mockResolvedValue(reponse(200, DETAIL))
    const r = await lireSessionLive(SESSION)
    if (!r.ok) throw new Error('détail attendu')
    expect(sansLiens(r.data)).not.toHaveProperty('liens')
    expect(JSON.stringify(sansLiens(r.data))).not.toContain('/rapport/abc')
  })

  it('n’accepte qu’un lien chez Studia Live ou en https', () => {
    expect(lienRapportValide(`${LIVE}/rapport/abc`)).toBe(`${LIVE}/rapport/abc`)
    expect(lienRapportValide('https://rapports.studia.test/r/1')).toBe('https://rapports.studia.test/r/1')
    expect(lienRapportValide('http://ailleurs.test/r/1')).toBeNull()
    expect(lienRapportValide('javascript:alert(1)')).toBeNull()
    expect(lienRapportValide(null)).toBeNull()
  })
})
