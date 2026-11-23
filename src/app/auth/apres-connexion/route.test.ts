import { beforeEach, describe, expect, it, vi } from 'vitest'

interface Fiche {
  user_id: string | null
  email: string | null
  role: string
  is_active: boolean
}

const etat = {
  user: null as null | { id: string; email: string; email_confirmed_at: string | null },
  accountType: null as string | null,
  fiches: [] as Fiche[],
  erreurFiches: false,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: etat.user } }) },
    from: () => {
      const requete = {
        select: () => requete,
        eq: () => requete,
        maybeSingle: async () => ({ data: { account_type: etat.accountType } }),
      }
      return requete
    },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      let lignes = [...etat.fiches]
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
          etat.erreurFiches ? { data: null, error: { code: 'XX000' } } : { data: lignes[0] ?? null, error: null },
      }
      return requete
    },
  }),
}))

const { GET } = await import('./route')

const ID = '7b0f3a52-9f0e-4c1d-8a55-1d2c3b4a5f60'
const fiche = (s: Partial<Fiche> = {}): Fiche => ({
  user_id: null,
  email: 'demo@exemple.com',
  role: 'formateur',
  is_active: true,
  ...s,
})

beforeEach(() => {
  etat.user = { id: ID, email: 'demo@exemple.com', email_confirmed_at: '2026-01-01T00:00:00Z' }
  etat.accountType = null
  etat.fiches = []
  etat.erreurFiches = false
})

async function destination() {
  const res = await GET()
  expect(res.status).toBe(307)
  expect(res.headers.get('cache-control')).toBe('no-store')
  return res.headers.get('location')
}

describe('GET /auth/apres-connexion', () => {
  it('non connecté : page de connexion', async () => {
    etat.user = null
    expect(await destination()).toBe('/login')
  })

  it('élève : tableau de bord', async () => {
    expect(await destination()).toBe('/dashboard')
  })

  it.each([
    ['fiche formateur retrouvée par e-mail', [fiche()]],
    ['fiche formateur liée au compte', [fiche({ user_id: ID })]],
  ])('formateur désigné (%s) : espace professeur', async (_nom, fiches) => {
    etat.fiches = fiches
    expect(await destination()).toBe('/professeur')
  })

  it.each([
    ['fiche désactivée', [fiche({ is_active: false })]],
    ['fiche agent messagerie', [fiche({ role: 'agent' })]],
    ['fiche admin', [fiche({ role: 'admin' })]],
    ['fiche d’un autre e-mail', [fiche({ email: 'autre@exemple.com' })]],
  ])('%s : tableau de bord', async (_nom, fiches) => {
    etat.fiches = fiches
    expect(await destination()).toBe('/dashboard')
  })

  it('types de compte existants conservés : professeur et pro', async () => {
    etat.accountType = 'teacher'
    expect(await destination()).toBe('/professeur')
    etat.accountType = 'pro'
    expect(await destination()).toBe('/pro')
  })

  it('fiches illisibles : on retombe sur le type de compte, sans erreur', async () => {
    etat.fiches = [fiche()]
    etat.erreurFiches = true
    expect(await destination()).toBe('/dashboard')
  })

  it('destinations toujours relatives (pas d’adresse interne du conteneur)', async () => {
    etat.fiches = [fiche()]
    expect(await destination()).toMatch(/^\/[a-z]/)
  })
})
