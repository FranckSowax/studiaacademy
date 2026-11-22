import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Faux client Supabase (session de l'élève) et Studia Live simulé par
 * un faux `fetch` : aucun appel réseau, aucune base réelle.
 */
const etat = {
  user: null as null | { id: string; email: string; user_metadata: Record<string, unknown> },
  formation: null as null | { id: string; slug: string; live_code?: string | null },
  inscription: null as null | { status: string },
  profil: null as null | { full_name: string | null },
}

function fauxSupabase() {
  return {
    auth: { getUser: async () => ({ data: { user: etat.user } }) },
    from(table: string) {
      const requete = {
        select: () => requete,
        eq: () => requete,
        single: async () => ({ data: table === 'formations' ? etat.formation : null }),
        maybeSingle: async () => ({
          data: table === 'formation_enrollments' ? etat.inscription : table === 'profiles' ? etat.profil : null,
        }),
      }
      return requete
    },
  }
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => fauxSupabase() }))

const { GET } = await import('./route')

const SECRET = 'secret-de-test-studia-live-0123456789abcdef'
const LIVE = 'https://live.test'
const ELEVE = '7b0f3a52-9f0e-4c1d-8a55-1d2c3b4a5f60'
const ENTREE = `${LIVE}/entree?t=ticket-a-usage-unique`

const fauxFetch = vi.fn()
const erreurs = vi.fn()

function appeler(slug = 'pc-express-a1b2', entetes: Record<string, string> = {}) {
  return GET(new Request(`https://localhost:8080/formations/${slug}/suivre`, { headers: entetes }), {
    params: Promise.resolve({ slug }),
  })
}

function reponseLive(status: number, corps: unknown) {
  return new Response(JSON.stringify(corps), { status, headers: { 'content-type': 'application/json' } })
}

beforeEach(() => {
  vi.stubEnv('STUDIA_LINK_SECRET', SECRET)
  vi.stubEnv('STUDIA_LIVE_URL', LIVE)
  vi.stubGlobal('fetch', fauxFetch)
  vi.spyOn(console, 'error').mockImplementation(erreurs)
  fauxFetch.mockReset()
  erreurs.mockReset()
  fauxFetch.mockResolvedValue(reponseLive(200, { url: ENTREE }))
  etat.user = { id: ELEVE, email: 'Awa.Ndong@Exemple.GA', user_metadata: {} }
  etat.formation = { id: 'f-1', slug: 'pc-express-a1b2', live_code: 'pc-express' }
  etat.inscription = { status: 'active' }
  etat.profil = { full_name: 'Awa Ndong' }
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('GET /formations/[slug]/suivre', () => {
  it('élève non connecté : page de connexion, aucun appel à Studia Live', async () => {
    etat.user = null
    const res = await appeler()
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      '/login?redirect=/formations/pc-express-a1b2/suivre'
    )
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it.each([
    ['sans inscription', null],
    ['demande en attente', { status: 'pending' }],
    ['demande refusée', { status: 'rejected' }],
  ])('élève sans droit (%s) : fiche de la formation, aucun appel', async (_nom, inscription) => {
    etat.inscription = inscription
    const res = await appeler()
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/formations/en-ligne/pc-express-a1b2')
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('formation introuvable : 404', async () => {
    etat.formation = null
    const res = await appeler('inconnue')
    expect(res.status).toBe(404)
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it.each([
    ['nul', null],
    ['colonne pas encore migrée', undefined],
  ])('formation sans live_code (%s) : lecteur actuel', async (_nom, liveCode) => {
    etat.formation = { id: 'f-2', slug: 'rh-ia-recrutement', live_code: liveCode }
    const res = await appeler('rh-ia-recrutement')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/apprendre/rh-ia-recrutement')
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it.each([
    ['STUDIA_LIVE_URL', 'STUDIA_LIVE_URL'],
    ['STUDIA_LINK_SECRET', 'STUDIA_LINK_SECRET'],
  ])('%s absente : lecteur actuel même avec un live_code', async (_nom, variable) => {
    vi.stubEnv(variable, '')
    const res = await appeler()
    expect(res.headers.get('location')).toBe('/apprendre/pc-express-a1b2')
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('formation avec live_code : appel signé correct puis redirection 302 vers l’adresse reçue', async () => {
    const avant = Math.floor(Date.now() / 1000)
    const res = await appeler()

    expect(fauxFetch).toHaveBeenCalledTimes(1)
    const [adresse, init] = fauxFetch.mock.calls[0] as [string, RequestInit]
    expect(adresse).toBe(`${LIVE}/api/integrations/studia-academy/ticket`)
    expect(init.method).toBe('POST')
    expect(init.cache).toBe('no-store')
    expect(init.signal).toBeInstanceOf(AbortSignal)

    // Corps : e-mail en minuscules, prénom, identifiant Academy, code Live
    expect(typeof init.body).toBe('string')
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'awa.ndong@exemple.ga',
      prenom: 'Awa',
      academy_user_id: ELEVE,
      formation_code: 'pc-express',
    })

    const entetes = new Headers(init.headers)
    expect(entetes.get('content-type')).toBe('application/json')
    const ts = entetes.get('x-studia-timestamp') as string
    expect(ts).toMatch(/^\d{10}$/)
    expect(Number(ts)).toBeGreaterThanOrEqual(avant)
    expect(Number(ts)).toBeLessThanOrEqual(Math.floor(Date.now() / 1000))

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(ENTREE)
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('la signature est calculée sur le corps exact envoyé', async () => {
    etat.profil = { full_name: 'Éloïse "Lo" N\'Guema' }
    await appeler()
    const init = fauxFetch.mock.calls[0][1] as RequestInit
    const entetes = new Headers(init.headers)
    const ts = entetes.get('x-studia-timestamp')
    const attendue = createHmac('sha256', SECRET).update(`${ts}.${init.body as string}`).digest('hex')
    expect(entetes.get('x-studia-signature')).toBe(attendue)
    // …et pas sur une autre sérialisation du même contenu
    const autre = JSON.stringify(JSON.parse(init.body as string), null, 1)
    expect(createHmac('sha256', SECRET).update(`${ts}.${autre}`).digest('hex')).not.toBe(attendue)
  })

  it('ni e-mail ni prénom dans une adresse ; ticket jamais journalisé', async () => {
    const journal = vi.spyOn(console, 'log').mockImplementation(() => {})
    const avert = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await appeler()
    const adresse = fauxFetch.mock.calls[0][0] as string
    expect(adresse).not.toMatch(/awa|exemple/i)
    expect(res.headers.get('location')).not.toMatch(/awa|exemple/i)
    for (const espion of [journal, avert, erreurs]) {
      expect(JSON.stringify(espion.mock.calls)).not.toContain('ticket-a-usage-unique')
    }
  })

  it('prénom : repli sur le début de l’e-mail si le profil n’a pas de nom', async () => {
    etat.profil = { full_name: null }
    await appeler()
    expect(JSON.parse(fauxFetch.mock.calls[0][1].body as string).prenom).toBe('awa.ndong')
  })

  it.each([
    ['erreur 500', () => Promise.resolve(reponseLive(500, { error: 'panne' }))],
    ['refus 401', () => Promise.resolve(reponseLive(401, { error: 'signature_invalide' }))],
    ['réponse 201', () => Promise.resolve(reponseLive(201, { url: ENTREE }))],
    ['200 sans adresse', () => Promise.resolve(reponseLive(200, {}))],
    ['200 non JSON', () => Promise.resolve(new Response('<html>', { status: 200 }))],
    ['adresse hors Studia Live', () => Promise.resolve(reponseLive(200, { url: 'https://ailleurs.test/entree?t=x' }))],
    ['dépassement de délai', () => Promise.reject(new DOMException('délai', 'TimeoutError'))],
    ['réseau coupé', () => Promise.reject(new TypeError('fetch failed'))],
  ])('Studia Live en échec (%s) : page d’erreur, pas de redirection vers Live ni vers l’ancien lecteur', async (_nom, reponse) => {
    fauxFetch.mockImplementation(reponse)
    const res = await appeler()
    expect(res.status).toBe(303)
    const cible = res.headers.get('location')
    expect(cible).toBe('/formations/pc-express-a1b2/suivre/indisponible')
    expect(cible).not.toContain('/apprendre/')
    expect(cible).not.toContain('localhost')
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('le délai accordé à Studia Live est de 10 secondes', async () => {
    const delai = vi.spyOn(AbortSignal, 'timeout')
    await appeler()
    expect(delai).toHaveBeenCalledWith(10_000)
  })

  it.each([
    ['préchargement Next', { 'next-router-prefetch': '1', rsc: '1' }],
    ['navigation client Next', { rsc: '1' }],
    ['fetch du navigateur', { 'sec-fetch-mode': 'cors' }],
  ])('%s : aucun ticket demandé', async (_nom, entetes) => {
    const res = await appeler('pc-express-a1b2', entetes)
    expect(res.status).toBe(204)
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('navigation réelle du navigateur (sec-fetch-mode: navigate) : ticket demandé', async () => {
    const res = await appeler('pc-express-a1b2', { 'sec-fetch-mode': 'navigate' })
    expect(res.status).toBe(302)
    expect(fauxFetch).toHaveBeenCalledTimes(1)
  })
})
