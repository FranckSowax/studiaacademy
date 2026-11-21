import { createHmac, randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Faux client service Supabase, en mémoire : profils (dont la création
 * par handle_new_user à l'inscription), collaborateurs, et la fonction
 * upsert_live_progression avec la même règle que la migration
 * (une ligne par user_id + formation_code, envoi plus ancien ignoré).
 */
interface Ligne {
  user_id: string
  formation_code: string
  points: number
  source_mis_a_jour: string
  [k: string]: unknown
}

const base = {
  profiles: new Map<string, { id: string; email: string; role: string | null }>(),
  progressions: [] as Ligne[],
  createUser: vi.fn(),
}

function fauxAdmin() {
  return {
    from(table: string) {
      const filtres: Record<string, string> = {}
      const requete = {
        select: () => requete,
        eq: (col: string, val: string) => {
          filtres[col] = val
          return requete
        },
        maybeSingle: async () => {
          if (table === 'profiles') {
            const p = [...base.profiles.values()].find((x) => x.email === filtres.email)
            return { data: p ? { id: p.id, role: p.role } : null, error: null }
          }
          return { data: null, error: null }
        },
      }
      return requete
    },
    auth: { admin: { createUser: base.createUser } },
    async rpc(nom: string, a: Record<string, unknown>) {
      if (nom !== 'upsert_live_progression') return { data: null, error: { message: 'inconnue' } }
      const nouvelle: Ligne = {
        user_id: a.p_user_id as string,
        formation_code: a.p_formation_code as string,
        formation_label: a.p_formation_label,
        points: a.p_points as number,
        niveau: a.p_niveau,
        exercices_reussis: a.p_exercices_reussis,
        exercices_total: a.p_exercices_total,
        serie_jours: a.p_serie_jours,
        source_mis_a_jour: a.p_source_mis_a_jour as string,
      }
      const i = base.progressions.findIndex(
        (l) => l.user_id === nouvelle.user_id && l.formation_code === nouvelle.formation_code
      )
      if (i === -1) {
        base.progressions.push(nouvelle)
        return { data: true, error: null }
      }
      if (new Date(base.progressions[i].source_mis_a_jour) > new Date(nouvelle.source_mis_a_jour)) {
        return { data: false, error: null }
      }
      base.progressions[i] = nouvelle
      return { data: true, error: null }
    },
  }
}

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => fauxAdmin() }))

const { POST } = await import('./route')

const SECRET = 'secret-de-test-studia-live-0123456789abcdef'
const URL_ROUTE = 'https://academy.test/api/integrations/studia-live/progression'

function corps(surcharge: Record<string, unknown> = {}, progression: Record<string, unknown> = {}) {
  return {
    email: 'Apprenant@Exemple.GA',
    prenom: 'Awa',
    progression: {
      formation_code: 'pc-express',
      formation_label: 'PC Express',
      points: 145,
      niveau: 'Débutant',
      exercices_reussis: 12,
      exercices_total: 92,
      serie_jours: 3,
      mis_a_jour: '2026-11-21T10:00:00.000Z',
      ...progression,
    },
    ...surcharge,
  }
}

function requete(
  donnees: unknown,
  opts: { secret?: string; timestamp?: number; signature?: string } = {}
) {
  const brut = typeof donnees === 'string' ? donnees : JSON.stringify(donnees)
  const ts = String(opts.timestamp ?? Math.floor(Date.now() / 1000))
  const sig =
    opts.signature ??
    createHmac('sha256', opts.secret ?? SECRET).update(`${ts}.${brut}`).digest('hex')
  return new Request(URL_ROUTE, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-studia-timestamp': ts,
      'x-studia-signature': sig,
    },
    body: brut,
  })
}

beforeEach(() => {
  vi.stubEnv('STUDIA_LINK_SECRET', SECRET)
  base.profiles.clear()
  base.progressions = []
  base.createUser.mockReset()
  base.createUser.mockImplementation(async ({ email }: { email: string }) => {
    // Simule handle_new_user : profil (et portefeuille) créés à l'inscription.
    const id = randomUUID()
    base.profiles.set(id, { id, email, role: 'user' })
    return { data: { user: { id } }, error: null }
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/integrations/studia-live/progression', () => {
  it('accepte un appel correctement signé et enregistre la progression', async () => {
    const existant = randomUUID()
    base.profiles.set(existant, { id: existant, email: 'apprenant@exemple.ga', role: 'user' })

    const res = await POST(requete(corps()))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, academy_user_id: existant, statut: 'enregistre' })
    expect(base.createUser).not.toHaveBeenCalled()
    expect(base.progressions).toHaveLength(1)
    expect(base.progressions[0]).toMatchObject({
      user_id: existant,
      formation_code: 'pc-express',
      points: 145,
      exercices_reussis: 12,
      exercices_total: 92,
      serie_jours: 3,
    })
  })

  it('refuse une signature invalide (401)', async () => {
    const res = await POST(requete(corps(), { secret: 'un-autre-secret-de-plus-de-32-caracteres!!' }))
    expect(res.status).toBe(401)
    expect(base.progressions).toHaveLength(0)
  })

  it('refuse une signature calculée sur un autre corps (401)', async () => {
    const ts = Math.floor(Date.now() / 1000)
    const sigAutreCorps = createHmac('sha256', SECRET)
      .update(`${ts}.${JSON.stringify(corps({ prenom: 'Autre' }))}`)
      .digest('hex')
    const res = await POST(requete(corps(), { timestamp: ts, signature: sigAutreCorps }))
    expect(res.status).toBe(401)
  })

  it('refuse un horodatage de plus de 5 minutes (401)', async () => {
    const res = await POST(requete(corps(), { timestamp: Math.floor(Date.now() / 1000) - 301 }))
    expect(res.status).toBe(401)
    expect(base.progressions).toHaveLength(0)
  })

  it.each([
    ['JSON illisible', '{pas du json'],
    ['e-mail invalide', corps({ email: 'pas-un-email' })],
    ['prénom vide', corps({ prenom: '   ' })],
    ['prénom trop long', corps({ prenom: 'a'.repeat(61) })],
    ['code de formation mal formé', corps({}, { formation_code: 'PC Express' })],
    ['points négatifs', corps({}, { points: -1 })],
    ['points au-delà de la borne', corps({}, { points: 1_000_001 })],
    ['points non entiers', corps({}, { points: 1.5 })],
    ['exercices au-delà de la borne', corps({}, { exercices_total: 10_001 })],
    ['date non ISO', corps({}, { mis_a_jour: 'hier' })],
    ['progression absente', { email: 'a@b.ga', prenom: 'Awa' }],
  ])('refuse un corps invalide (400) : %s', async (_cas, donnees) => {
    const res = await POST(requete(donnees))
    expect(res.status).toBe(400)
    expect(base.progressions).toHaveLength(0)
  })

  it('crée le compte d’un e-mail inconnu, une seule fois', async () => {
    const res = await POST(requete(corps()))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(base.createUser).toHaveBeenCalledTimes(1)
    expect(base.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'apprenant@exemple.ga',
        email_confirm: true,
        user_metadata: { full_name: 'Awa', source: 'studia_live' },
      })
    )
    expect(json.academy_user_id).toBe([...base.profiles.keys()][0])

    // Second envoi pour le même e-mail : compte retrouvé, pas recréé.
    const res2 = await POST(requete(corps({}, { mis_a_jour: '2026-11-21T11:00:00.000Z' })))
    expect(res2.status).toBe(200)
    expect((await res2.json()).academy_user_id).toBe(json.academy_user_id)
    expect(base.createUser).toHaveBeenCalledTimes(1)
    expect(base.profiles.size).toBe(1)
  })

  it('met à jour la ligne existante sans créer de doublon', async () => {
    await POST(requete(corps()))
    const res = await POST(
      requete(corps({}, { points: 210, exercices_reussis: 20, mis_a_jour: '2026-11-21T12:00:00.000Z' }))
    )

    expect(res.status).toBe(200)
    expect((await res.json()).statut).toBe('enregistre')
    expect(base.progressions).toHaveLength(1)
    expect(base.progressions[0]).toMatchObject({ points: 210, exercices_reussis: 20 })
  })

  it('ignore un appel plus ancien que la valeur stockée (200, sans écriture)', async () => {
    await POST(requete(corps({}, { points: 210, mis_a_jour: '2026-11-21T12:00:00.000Z' })))
    const res = await POST(requete(corps({}, { points: 100, mis_a_jour: '2026-11-21T09:00:00.000Z' })))

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, statut: 'ignore' })
    expect(base.progressions).toHaveLength(1)
    expect(base.progressions[0].points).toBe(210)
  })

  it('ne renvoie jamais 2xx si l’enregistrement échoue', async () => {
    base.createUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'boom' } })
    const res = await POST(requete(corps()))
    expect(res.status).toBe(500)
  })

  it('répond 503 si STUDIA_LINK_SECRET est absent', async () => {
    vi.stubEnv('STUDIA_LINK_SECRET', '')
    const res = await POST(requete(corps()))
    expect(res.status).toBe(503)
  })
})
