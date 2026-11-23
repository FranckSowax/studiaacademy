import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Faux client Supabase (session, rôle d'équipe, profil), faux limiteur
 * d'appels et Studia Live simulé par un faux `fetch` : aucun réseau.
 */
interface Compte {
  id: string
  email: string | null
  email_confirmed_at: string | null
  user_metadata: Record<string, unknown>
}

const etat = {
  user: null as Compte | null,
  role: null as string | null,
  erreurRole: false,
  profil: null as { full_name: string | null } | null,
  quota: true,
}
const quotas = vi.fn()

interface Fiche {
  user_id: string | null
  email: string | null
  role: string
  is_active: boolean
}
const base = { fiches: [] as Fiche[], erreurFiches: false }

/** Faux client service : applique réellement eq / is sur les fiches. */
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      let lignes = [...base.fiches]
      const requete = {
        select: () => requete,
        eq(col: keyof Fiche, val: unknown) {
          lignes = lignes.filter((l) => l[col] === val)
          return requete
        },
        is(col: keyof Fiche, val: null) {
          lignes = lignes.filter((l) => l[col] === val)
          return requete
        },
        maybeSingle: async () =>
          base.erreurFiches ? { data: null, error: { code: 'XX000' } } : { data: lignes[0] ?? null, error: null },
      }
      return requete
    },
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: etat.user } }) },
    rpc: async (nom: string) =>
      nom === 'current_staff_role' && !etat.erreurRole
        ? { data: etat.role, error: null }
        : { data: null, error: { code: 'XX000' } },
    from: () => {
      const requete = { select: () => requete, eq: () => requete, maybeSingle: async () => ({ data: etat.profil }) }
      return requete
    },
  }),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  RATE_LIMITS: { liveFormateurTicketPerUser: { limit: 5, windowSeconds: 60 } },
  consumeRateLimit: async (cle: string, regle: unknown) => {
    quotas(cle, regle)
    return etat.quota
  },
}))

const { POST } = await import('./route')

const SECRET = 'secret-de-test-studia-live-0123456789abcdef'
const LIVE = 'https://live.test'
const ADMIN = '7b0f3a52-9f0e-4c1d-8a55-1d2c3b4a5f60'
const ENTREE = `${LIVE}/entree/formateur?t=ticket-a-usage-unique`

const fauxFetch = vi.fn()
const erreurs = vi.fn()

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
  quotas.mockReset()
  fauxFetch.mockResolvedValue(reponseLive(200, { url: ENTREE, expire_dans: 300 }))
  etat.user = {
    id: ADMIN,
    email: 'Awa.Ndong@Exemple.GA',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    user_metadata: {},
  }
  etat.role = 'admin'
  etat.erreurRole = false
  etat.profil = { full_name: 'Awa Ndong' }
  etat.quota = true
  base.fiches = []
  base.erreurFiches = false
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('POST /api/studia-live/formateur', () => {
  it('administrateur : appel signé correct, réponse { url } sans cache', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({ url: ENTREE })

    expect(fauxFetch).toHaveBeenCalledTimes(1)
    const [adresse, init] = fauxFetch.mock.calls[0] as [string, RequestInit]
    expect(adresse).toBe(`${LIVE}/api/integrations/studia-academy/formateur/ticket`)
    expect(init.method).toBe('POST')
    expect(init.cache).toBe('no-store')
    expect(JSON.parse(init.body as string)).toEqual({ email: 'awa.ndong@exemple.ga', prenom: 'Awa' })
    expect(new Headers(init.headers).get('content-type')).toBe('application/json')
  })

  it('la signature porte sur le corps exact envoyé, avec un horodatage courant', async () => {
    etat.profil = { full_name: 'Éloïse "Lo" N\'Guema' }
    const avant = Math.floor(Date.now() / 1000)
    await POST()
    const init = fauxFetch.mock.calls[0][1] as RequestInit
    const entetes = new Headers(init.headers)
    const ts = entetes.get('x-studia-timestamp') as string
    expect(ts).toMatch(/^\d{10}$/)
    expect(Number(ts)).toBeGreaterThanOrEqual(avant)
    expect(Number(ts)).toBeLessThanOrEqual(Math.floor(Date.now() / 1000))
    const attendue = createHmac('sha256', SECRET).update(`${ts}.${init.body as string}`).digest('hex')
    expect(entetes.get('x-studia-signature')).toBe(attendue)
  })

  it('super admin : accepté aussi', async () => {
    etat.role = 'super_admin'
    expect((await POST()).status).toBe(200)
  })

  it.each([
    ['élève (aucun rôle d’équipe)', null],
    ['agent messagerie', 'agent'],
    ['rôle inconnu', 'formateur'],
    ['valeur inattendue', ''],
  ])('compte non autorisé (%s) : 403, aucun appel à Studia Live', async (_nom, role) => {
    etat.role = role
    const res = await POST()
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe('acces_refuse')
    expect(fauxFetch).not.toHaveBeenCalled()
    expect(quotas).not.toHaveBeenCalled()
  })

  describe('formateur désigné par un administrateur (fiche collaborateur)', () => {
    const fiche = (surcharge: Partial<Fiche> = {}): Fiche => ({
      user_id: ADMIN,
      email: 'awa.ndong@exemple.ga',
      role: 'formateur',
      is_active: true,
      ...surcharge,
    })

    beforeEach(() => {
      etat.role = null // ni admin ni agent : current_staff_role renvoie NULL pour un formateur
    })

    it('fiche « formateur » active liée au compte : ticket délivré', async () => {
      base.fiches = [fiche()]
      const res = await POST()
      expect(res.status).toBe(200)
      expect(JSON.parse(fauxFetch.mock.calls[0][1].body as string).email).toBe('awa.ndong@exemple.ga')
    })

    it('fiche pas encore liée, retrouvée par l’e-mail confirmé du compte : ticket délivré', async () => {
      base.fiches = [fiche({ user_id: null })]
      expect((await POST()).status).toBe(200)
    })

    it.each([
      ['fiche désactivée', [fiche({ is_active: false })]],
      ['fiche désactivée, retrouvée par e-mail', [fiche({ user_id: null, is_active: false })]],
      ['fiche « agent messagerie »', [fiche({ role: 'agent' })]],
      ['fiche d’un autre e-mail', [fiche({ user_id: null, email: 'autre@exemple.ga' })]],
      ['fiche du même e-mail déjà liée à un autre compte', [fiche({ user_id: 'autre-compte' })]],
      ['aucune fiche (élève, professeur en libre-service)', []],
    ])('%s : 403, aucun appel à Studia Live', async (_nom, fiches) => {
      base.fiches = fiches
      const res = await POST()
      expect(res.status).toBe(403)
      expect(fauxFetch).not.toHaveBeenCalled()
    })

    it('e-mail non confirmé : la fiche non liée n’est pas retenue', async () => {
      base.fiches = [fiche({ user_id: null })]
      etat.user = { ...(etat.user as Compte), email_confirmed_at: null }
      expect((await POST()).status).toBe(403)
      expect(fauxFetch).not.toHaveBeenCalled()
    })

    it('lecture des fiches impossible : 403 (échec fermé)', async () => {
      base.fiches = [fiche()]
      base.erreurFiches = true
      expect((await POST()).status).toBe(403)
      expect(fauxFetch).not.toHaveBeenCalled()
    })
  })

  it('administrateur dont la fiche est désactivée : 403', async () => {
    base.fiches = [{ user_id: ADMIN, email: 'awa.ndong@exemple.ga', role: 'admin', is_active: false }]
    expect((await POST()).status).toBe(403)
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('rôle illisible en base : 403 (échec fermé)', async () => {
    etat.erreurRole = true
    expect((await POST()).status).toBe(403)
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('non connecté : 401, aucun appel', async () => {
    etat.user = null
    expect((await POST()).status).toBe(401)
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it.each([
    ['e-mail non confirmé', { email_confirmed_at: null }],
    ['compte sans e-mail', { email: null }],
  ])('%s : 403, aucun appel', async (_nom, surcharge) => {
    etat.user = { ...(etat.user as Compte), ...surcharge }
    const res = await POST()
    expect(res.status).toBe(403)
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('la route ne lit aucun e-mail venu du navigateur : seul celui du compte connecté part', async () => {
    // POST() ne reçoit même pas la requête : un corps { email: "autre@…" } est sans effet.
    expect(POST.length).toBe(0)
    etat.user = { ...(etat.user as Compte), user_metadata: { email: 'autre.prof@exemple.ga' } }
    etat.profil = { full_name: 'Awa Ndong', ...({ email: 'autre.prof@exemple.ga' } as object) }
    await POST()
    const corps = fauxFetch.mock.calls[0][1].body as string
    expect(JSON.parse(corps).email).toBe('awa.ndong@exemple.ga')
    expect(corps).not.toContain('autre.prof')
  })

  it('limite les appels par compte : 429 au-delà, sans appeler Studia Live', async () => {
    etat.quota = false
    const res = await POST()
    expect(res.status).toBe(429)
    expect(fauxFetch).not.toHaveBeenCalled()
    expect(quotas).toHaveBeenCalledWith(`live-formateur:${ADMIN}`, { limit: 5, windowSeconds: 60 })
  })

  it.each([['STUDIA_LIVE_URL'], ['STUDIA_LINK_SECRET']])('%s absente : 503, aucun appel', async (variable) => {
    vi.stubEnv(variable, '')
    const res = await POST()
    expect(res.status).toBe(503)
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it.each([
    ['401 signature_invalide', () => Promise.resolve(reponseLive(401, { error: 'signature_invalide' })), 502, 'studia_live_signature', /mal configurée/],
    ['400 corps_invalide', () => Promise.resolve(reponseLive(400, { error: 'corps_invalide' })), 502, 'studia_live_corps', /adresse e-mail ou prénom/],
    ['503', () => Promise.resolve(reponseLive(503, { error: 'indisponible' })), 502, 'studia_live_indisponible', /momentanément indisponible/],
    ['500', () => Promise.resolve(reponseLive(500, { error: 'boom', stack: 'at secret.ts:12' })), 502, 'studia_live_indisponible', /momentanément indisponible/],
    ['réseau coupé', () => Promise.reject(new TypeError('fetch failed')), 502, 'studia_live_indisponible', /momentanément indisponible/],
    ['délai dépassé', () => Promise.reject(new DOMException('délai', 'TimeoutError')), 504, 'studia_live_delai', /pas répondu à temps/],
    ['200 sans adresse', () => Promise.resolve(reponseLive(200, {})), 502, 'studia_live_reponse', /réponse inattendue/],
    ['200 non JSON', () => Promise.resolve(new Response('<html>', { status: 200 })), 502, 'studia_live_reponse', /réponse inattendue/],
    ['adresse hors Studia Live', () => Promise.resolve(reponseLive(200, { url: 'https://ailleurs.test/entree/formateur?t=x' })), 502, 'studia_live_reponse', /réponse inattendue/],
  ])('refus de Studia Live (%s) : message clair en français, jamais l’erreur brute', async (_nom, reponse, status, code, message) => {
    fauxFetch.mockImplementation(reponse)
    const res = await POST()
    expect(res.status).toBe(status)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const corps = await res.json()
    expect(corps.error).toBe(code)
    expect(corps.message).toMatch(message)
    expect(corps.url).toBeUndefined()
    expect(JSON.stringify(corps)).not.toMatch(/signature_invalide|corps_invalide|boom|stack|fetch failed|ailleurs/)
  })

  it('le délai accordé à Studia Live est de 10 secondes', async () => {
    const delai = vi.spyOn(AbortSignal, 'timeout')
    await POST()
    expect(delai).toHaveBeenCalledWith(10_000)
  })

  it('l’adresse du ticket n’est jamais journalisée', async () => {
    const journal = vi.spyOn(console, 'log').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const avert = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await POST()
    for (const espion of [journal, info, avert, erreurs]) {
      expect(JSON.stringify(espion.mock.calls)).not.toContain('ticket-a-usage-unique')
    }
  })

  it('prénom : valeur générique ignorée, repli sur l’e-mail', async () => {
    etat.profil = { full_name: 'Utilisateur' }
    etat.user = { ...(etat.user as Compte), email: 'demo@exemple.com' }
    await POST()
    expect(JSON.parse(fauxFetch.mock.calls[0][1].body as string)).toEqual({ email: 'demo@exemple.com', prenom: 'Demo' })
  })
})
