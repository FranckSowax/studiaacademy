import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Faux client service Supabase : une table `formations` en mémoire, qui
 * applique réellement les filtres demandés par la route (eq, not … is
 * null) et ne renvoie que les colonnes sélectionnées.
 */
type Formation = Record<string, unknown>

const base = { formations: [] as Formation[], erreur: false, colonnes: '' }

function fauxAdmin() {
  return {
    from(table: string) {
      let lignes = table === 'formations' ? [...base.formations] : []
      const requete = {
        select(colonnes: string) {
          base.colonnes = colonnes
          return requete
        },
        eq(col: string, val: unknown) {
          lignes = lignes.filter((l) => l[col] === val)
          return requete
        },
        not(col: string, op: string, val: unknown) {
          if (op === 'is' && val === null) lignes = lignes.filter((l) => l[col] != null)
          return requete
        },
        async order(col: string) {
          if (base.erreur) return { data: null, error: { message: 'panne' } }
          const cols = base.colonnes.split(',').map((c) => c.trim())
          const tri = [...lignes].sort((a, b) => Number(a[col]) - Number(b[col]))
          return { data: tri.map((l) => Object.fromEntries(cols.map((c) => [c, l[c]]))), error: null }
        },
      }
      return requete
    },
  }
}

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => fauxAdmin() }))

const { GET } = await import('./route')
const { couverturePublique } = await import('@/lib/studia-live/couverture')

const SECRET = 'secret-de-test-studia-live-0123456789abcdef'
const URL_ROUTE = 'https://academy.test/api/integrations/studia-live/formations'
const COUVERTURE = 'https://abc.supabase.co/storage/v1/object/public/formations/f1/cover-1.jpg'

function formation(surcharge: Formation = {}): Formation {
  return {
    id: 'f1',
    slug: 'pc-express-209h',
    live_code: 'pc-express',
    titre: 'PC EXPRESS',
    sous_titre: 'Des raccourcis pour raccourcir votre temps',
    cover_image: COUVERTURE,
    is_published: true,
    ordre: 1,
    prix_fcfa: 25000,
    formateur_nom: 'Awa Ndong',
    description: 'Texte long',
    ...surcharge,
  }
}

function requete(opts: { secret?: string; timestamp?: number; signature?: string; sans?: boolean } = {}) {
  if (opts.sans) return new Request(URL_ROUTE)
  const ts = String(opts.timestamp ?? Math.floor(Date.now() / 1000))
  // Corps vide : la chaîne signée se termine par un point.
  const sig = opts.signature ?? createHmac('sha256', opts.secret ?? SECRET).update(`${ts}.`).digest('hex')
  return new Request(URL_ROUTE, {
    headers: { 'x-studia-timestamp': ts, 'x-studia-signature': sig },
  })
}

beforeEach(() => {
  vi.stubEnv('STUDIA_LINK_SECRET', SECRET)
  base.formations = [formation()]
  base.erreur = false
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('GET /api/integrations/studia-live/formations', () => {
  it('signature valide : 200, no-store, formations au format attendu', async () => {
    const res = await GET(requete())
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({
      formations: [
        {
          live_code: 'pc-express',
          titre: 'PC EXPRESS',
          sous_titre: 'Des raccourcis pour raccourcir votre temps',
          couverture_url: COUVERTURE,
        },
      ],
    })
  })

  it.each<[string, Parameters<typeof requete>[0]]>([
    ['signature fausse', { signature: 'a'.repeat(64) }],
    ['autre secret', { secret: 'un-autre-secret-de-test-0123456789abcdef' }],
    ['en-têtes absents', { sans: true }],
  ])('signature invalide (%s) : 401, aucune formation', async (_nom, opts) => {
    const res = await GET(requete(opts))
    expect(res.status).toBe(401)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({ error: 'signature_invalide' })
  })

  it('signature calculée sans le point final : 401', async () => {
    const ts = Math.floor(Date.now() / 1000)
    const signature = createHmac('sha256', SECRET).update(String(ts)).digest('hex')
    expect((await GET(requete({ timestamp: ts, signature }))).status).toBe(401)
  })

  it.each([
    ['vieux de 6 minutes', -360],
    ['en avance de 6 minutes', 360],
  ])('horodatage périmé (%s) : 401 malgré une signature correcte', async (_nom, decalage) => {
    const res = await GET(requete({ timestamp: Math.floor(Date.now() / 1000) + decalage }))
    expect(res.status).toBe(401)
  })

  it('horodatage vieux de 4 minutes : accepté', async () => {
    const res = await GET(requete({ timestamp: Math.floor(Date.now() / 1000) - 240 }))
    expect(res.status).toBe(200)
  })

  it('formation sans live_code : absente', async () => {
    base.formations.push(formation({ id: 'f2', live_code: null, titre: 'IA et recrutement', ordre: 2 }))
    const { formations } = await (await GET(requete())).json()
    expect(formations.map((f: { live_code: string }) => f.live_code)).toEqual(['pc-express'])
  })

  it('formation non publiée : absente, même avec un live_code', async () => {
    base.formations.push(
      formation({ id: 'f3', live_code: 'excel-express', titre: 'Brouillon', is_published: false, ordre: 2 })
    )
    const corps = await (await GET(requete())).text()
    expect(JSON.parse(corps).formations).toHaveLength(1)
    expect(corps).not.toContain('excel-express')
    expect(corps).not.toContain('Brouillon')
  })

  it('formation sans image : couverture_url à null', async () => {
    base.formations = [formation({ cover_image: null })]
    const { formations } = await (await GET(requete())).json()
    expect(formations[0].couverture_url).toBeNull()
  })

  it('sous-titre non renseigné : chaîne vide', async () => {
    base.formations = [formation({ sous_titre: null })]
    const { formations } = await (await GET(requete())).json()
    expect(formations[0].sous_titre).toBe('')
  })

  it('ni prix, ni donnée personnelle, ni autre champ dans la réponse', async () => {
    const res = await GET(requete())
    const corps = await res.text()
    expect(Object.keys(JSON.parse(corps).formations[0]).sort()).toEqual([
      'couverture_url',
      'live_code',
      'sous_titre',
      'titre',
    ])
    expect(corps).not.toMatch(/25000|Awa|prix|formateur|description|slug/)
    expect(base.colonnes).toBe('live_code, titre, sous_titre, cover_image')
  })

  it('formations triées par ordre du catalogue', async () => {
    base.formations = [
      formation({ id: 'b', live_code: 'excel-express', ordre: 5 }),
      formation({ id: 'a', live_code: 'pc-express', ordre: 2 }),
    ]
    const { formations } = await (await GET(requete())).json()
    expect(formations.map((f: { live_code: string }) => f.live_code)).toEqual(['pc-express', 'excel-express'])
  })

  it('aucune formation reliée : liste vide', async () => {
    base.formations = []
    expect(await (await GET(requete())).json()).toEqual({ formations: [] })
  })

  it('503 si STUDIA_LINK_SECRET est absent, 500 si la lecture échoue', async () => {
    base.erreur = true
    expect((await GET(requete())).status).toBe(500)
    vi.stubEnv('STUDIA_LINK_SECRET', '')
    expect((await GET(requete())).status).toBe(503)
  })
})

describe('couverturePublique', () => {
  it('garde une adresse https publique telle quelle', () => {
    expect(couverturePublique(COUVERTURE)).toBe(COUVERTURE)
  })

  it('ramène une adresse signée Supabase à son adresse publique, sans jeton', () => {
    expect(
      couverturePublique(
        'https://abc.supabase.co/storage/v1/object/sign/formations/f1/cover-1.jpg?token=eyJhbGciOi'
      )
    ).toBe(COUVERTURE)
  })

  it.each([
    ['vide', ''],
    ['nulle', null],
    ['http non chiffré', 'http://exemple.ga/image.jpg'],
    ['chemin relatif', '/images/cover.jpg'],
    ['données en ligne', 'data:image/png;base64,AAAA'],
  ])('renvoie null pour une adresse %s', (_nom, valeur) => {
    expect(couverturePublique(valeur)).toBeNull()
  })
})
