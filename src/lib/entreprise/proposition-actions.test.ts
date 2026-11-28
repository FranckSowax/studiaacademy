import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Refus par rôle, enregistrement de l'analyse et décisions sur les
 * formations proposées. Faux client Supabase et faux WhatsApp : aucun réseau.
 */

const ADMIN = '7b0f3a52-9f0e-4c1d-8a55-1d2c3b4a5f60'
const ENTREPRISE = '3f1c2b7a-6d5e-4f80-9a1b-2c3d4e5f6071'
const LIVE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const P_DATA = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const P_SECU = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const P_MESURE = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
const FORMATION = '99999999-9999-4999-8999-999999999999'

const etat = { user: null as { id: string } | null, role: null as string | null }

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: etat.user } }) },
    rpc: async () => ({ data: etat.role, error: null }),
  }),
}))
vi.mock('next/navigation', () => ({
  redirect: (vers: string) => {
    throw new Error(`REDIRECTION:${vers}`)
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const whatsapp = vi.fn()
vi.mock('@/lib/whatsapp', () => ({
  sendWhatsApp: async (telephone: string, message: string) => {
    whatsapp(telephone, message)
    return true
  },
}))

interface Operation {
  table: string
  type: 'select' | 'insert' | 'update'
  valeurs?: unknown
  filtres: Record<string, unknown>
}
const base = {
  tables: {} as Record<string, Record<string, unknown>[]>,
  erreurInsertion: null as { code: string } | null,
  operations: [] as Operation[],
}
const clientsService = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    clientsService()
    return {
      from(table: string) {
        const op: Operation = { table, type: 'select', filtres: {} }
        base.operations.push(op)
        const lignes = () =>
          (base.tables[table] ?? []).filter((l) =>
            Object.entries(op.filtres).every(([c, v]) => (Array.isArray(v) ? v.includes(l[c]) : l[c] === v)),
          )
        const resultat = () =>
          op.type === 'insert' && base.erreurInsertion ? { data: null, error: base.erreurInsertion } : { data: lignes(), error: null }
        const requete = {
          select: () => requete,
          order: () => requete,
          limit: () => requete,
          is: () => requete,
          eq(colonne: string, valeur: unknown) {
            op.filtres[colonne] = valeur
            return requete
          },
          in(colonne: string, valeurs: unknown[]) {
            op.filtres[colonne] = valeurs
            return requete
          },
          insert(valeurs: unknown) {
            op.type = 'insert'
            op.valeurs = valeurs
            return requete
          },
          update(valeurs: unknown) {
            op.type = 'update'
            op.valeurs = valeurs
            return requete
          },
          maybeSingle: async () => {
            const r = resultat()
            return { data: r.data?.[0] ?? null, error: r.error }
          },
          then: (suite: (r: { data: unknown; error: unknown }) => unknown) => suite(resultat()),
        }
        return requete
      },
    }
  },
}))

const actions = await import('./proposition-actions')

const ENTREES: [string, () => Promise<unknown>][] = [
  ['lancerAnalyse', () => actions.lancerAnalyse(ENTREPRISE)],
  ['deciderProposition', () => actions.deciderProposition(ENTREPRISE, P_DATA, 'retenue')],
  ['ajouterProposition', () => actions.ajouterProposition(ENTREPRISE, { catalogue_ref: 'F1' })],
  ['lierFormation', () => actions.lierFormation(ENTREPRISE, P_MESURE, FORMATION)],
]

const ecritures = () => base.operations.filter((o) => o.type !== 'select')

beforeEach(() => {
  vi.stubEnv('STUDIA_TEAM_PHONE', '24100000000')
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.studia.academy/')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  clientsService.mockReset()
  whatsapp.mockReset()
  base.operations = []
  base.erreurInsertion = null
  base.tables = {
    company_profiles: [{ id: ENTREPRISE, nom_entreprise: 'Sobraga' }],
    company_sessions: [{ id: 'l', company_id: ENTREPRISE, live_session_id: LIVE, presentiel_session_id: null }],
    live_sessions_suivi: [
      {
        live_session_id: LIVE, code: 'NXUPU9', titre: 'Atelier IA',
        donnees: {
          participants: [{ prenom: 'Awa', email: 'awa@exemple.ga' }],
          indicateurs: {
            themes: [
              { titre: 'Lire un tableau de bord', taux: 30 },
              { titre: 'Mots de passe', taux: 50 },
              { titre: 'Gestes en entrepôt', taux: 40 },
            ],
            recommandations: [],
          },
        },
      },
    ],
    company_proposals: [
      { id: P_DATA, company_id: ENTREPRISE, type: 'catalogue', catalogue_ref: 'F4', titre: 'Data', statut: 'proposee', formation_id: null },
      { id: P_SECU, company_id: ENTREPRISE, type: 'catalogue', catalogue_ref: 'F5', titre: 'Cybersécurité', statut: 'ecartee', formation_id: null },
      { id: P_MESURE, company_id: ENTREPRISE, type: 'sur_mesure', catalogue_ref: null, titre: 'Copilot logistique', statut: 'proposee', formation_id: null },
    ],
    formations: [{ id: FORMATION, titre: 'Copilot pour la logistique' }],
  }
  etat.user = { id: ADMIN }
  etat.role = 'admin'
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('refus par rôle', () => {
  const PROFILS: [string, { id: string } | null, string | null, string][] = [
    ['personne non connectée', null, null, '/equipe/connexion'],
    ['client sans rôle d’équipe', { id: ADMIN }, null, '/dashboard'],
    ['agent messagerie', { id: ADMIN }, 'agent', '/dashboard'],
  ]
  for (const [profil, user, role, destination] of PROFILS) {
    it.each(ENTREES)(`${profil} : %s est refusé avant toute lecture`, async (_nom, appeler) => {
      etat.user = user
      etat.role = role
      await expect(appeler()).rejects.toThrow(`REDIRECTION:${destination}`)
      expect(clientsService).not.toHaveBeenCalled()
      expect(whatsapp).not.toHaveBeenCalled()
    })
  }
})

describe('lancerAnalyse', () => {
  it('ajoute les nouvelles propositions et ne touche pas aux décisions prises', async () => {
    const r = await actions.lancerAnalyse(ENTREPRISE)
    expect(r).toEqual({ ok: true, sessions: 1, ajoutees: 1, mises_a_jour: 1 })

    // Nouvelle : le thème hors catalogue devient du sur-mesure. F4 et F5 existent déjà.
    const insertion = base.operations.find((o) => o.type === 'insert')
    expect(insertion?.valeurs).toEqual([
      expect.objectContaining({
        company_id: ENTREPRISE, type: 'sur_mesure', catalogue_ref: null, titre: 'Sur mesure : Gestes en entrepôt',
        origine: 'analyse', cree_par: ADMIN,
      }),
    ])
    // F4 encore « proposée » : justification et score rafraîchis. F5 écartée : intacte.
    const majs = base.operations.filter((o) => o.type === 'update')
    expect(majs).toHaveLength(1)
    expect(majs[0].filtres).toEqual({ id: P_DATA, statut: 'proposee' })
    expect(majs[0].valeurs).toMatchObject({ score: 30 })
  })

  it('n’écrit aucune donnée nominative dans les propositions', async () => {
    await actions.lancerAnalyse(ENTREPRISE)
    expect(JSON.stringify(ecritures())).not.toMatch(/Awa|awa@/)
  })

  it('sans session lisible : rien à analyser, rien d’écrit', async () => {
    base.tables.company_sessions = []
    const r = await actions.lancerAnalyse(ENTREPRISE)
    expect(r.ok).toBe(false)
    expect(ecritures()).toEqual([])
  })
})

describe('deciderProposition', () => {
  it('retenir une formation sur mesure prévient l’équipe, sans donnée de participant', async () => {
    const r = await actions.deciderProposition(ENTREPRISE, P_MESURE, 'retenue')
    expect(r).toEqual({ ok: true, equipePrevenue: true })
    expect(base.operations.find((o) => o.type === 'update')?.valeurs).toMatchObject({ statut: 'retenue', decidee_par: ADMIN })
    expect(whatsapp).toHaveBeenCalledTimes(1)
    const [telephone, message] = whatsapp.mock.calls[0]
    expect(telephone).toBe('24100000000')
    expect(message).toContain('Sobraga')
    expect(message).toContain('« Copilot logistique »')
    expect(message).toContain(`https://www.studia.academy/admin/entreprise/${ENTREPRISE}`)
  })

  it('retenir une formation du catalogue ne prévient personne', async () => {
    expect(await actions.deciderProposition(ENTREPRISE, P_DATA, 'retenue')).toEqual({ ok: true, equipePrevenue: false })
    expect(whatsapp).not.toHaveBeenCalled()
  })

  it('remettre en attente efface la décision', async () => {
    await actions.deciderProposition(ENTREPRISE, P_SECU, 'proposee')
    expect(base.operations.find((o) => o.type === 'update')?.valeurs).toEqual({ statut: 'proposee', decidee_par: null, decidee_le: null })
  })

  it('refuse une décision inconnue ou une proposition d’une autre entreprise', async () => {
    expect((await actions.deciderProposition(ENTREPRISE, P_DATA, 'validee' as never)).ok).toBe(false)
    base.tables.company_proposals[0].company_id = '00000000-0000-4000-8000-000000000000'
    expect(await actions.deciderProposition(ENTREPRISE, P_DATA, 'retenue')).toEqual({ ok: false, error: 'Proposition introuvable.' })
    expect(ecritures()).toEqual([])
  })

  it('sans numéro d’équipe : la décision est prise, personne n’est prévenu', async () => {
    vi.stubEnv('STUDIA_TEAM_PHONE', '')
    expect(await actions.deciderProposition(ENTREPRISE, P_MESURE, 'retenue')).toEqual({ ok: true, equipePrevenue: false })
  })
})

describe('ajouterProposition et lierFormation', () => {
  it('ajoute une formation du catalogue avec son titre officiel', async () => {
    expect(await actions.ajouterProposition(ENTREPRISE, { catalogue_ref: 'F1', titre: 'titre ignoré' })).toEqual({ ok: true })
    expect(base.operations.find((o) => o.type === 'insert')?.valeurs).toMatchObject({
      type: 'catalogue', catalogue_ref: 'F1', titre: 'IA générative au travail : produire 3× plus vite', origine: 'manuelle', cree_par: ADMIN,
    })
  })

  it('ajoute un besoin sur mesure, refuse un titre vide ou une référence inconnue', async () => {
    expect(await actions.ajouterProposition(ENTREPRISE, { titre: '  Copilot   quai ' })).toEqual({ ok: true })
    expect(base.operations.find((o) => o.type === 'insert')?.valeurs).toMatchObject({ type: 'sur_mesure', catalogue_ref: null, titre: 'Copilot quai' })
    expect((await actions.ajouterProposition(ENTREPRISE, { titre: ' ' })).ok).toBe(false)
    expect((await actions.ajouterProposition(ENTREPRISE, { catalogue_ref: 'F99' })).ok).toBe(false)
  })

  it('signale un doublon', async () => {
    base.erreurInsertion = { code: '23505' }
    expect(await actions.ajouterProposition(ENTREPRISE, { catalogue_ref: 'F4' })).toEqual({
      ok: false, error: 'Cette formation est déjà proposée à l’entreprise.',
    })
  })

  it('relie une formation existante, refuse une formation inconnue', async () => {
    expect(await actions.lierFormation(ENTREPRISE, P_MESURE, FORMATION)).toEqual({ ok: true })
    const maj = base.operations.find((o) => o.type === 'update')
    expect(maj?.valeurs).toEqual({ formation_id: FORMATION })
    expect(maj?.filtres).toEqual({ id: P_MESURE, company_id: ENTREPRISE })

    base.operations = []
    expect((await actions.lierFormation(ENTREPRISE, P_MESURE, '12121212-1212-4121-8121-121212121212')).ok).toBe(false)
    expect((await actions.lierFormation(ENTREPRISE, P_MESURE, 'x')).ok).toBe(false)
    expect(ecritures()).toEqual([])
  })
})
