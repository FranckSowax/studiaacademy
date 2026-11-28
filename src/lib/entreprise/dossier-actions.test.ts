import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Refus par rôle et rattachement des sessions d'un dossier entreprise.
 * Faux client Supabase (session, rôle d'équipe, tables) : aucun réseau.
 */

const ADMIN = '7b0f3a52-9f0e-4c1d-8a55-1d2c3b4a5f60'
const ENTREPRISE = '3f1c2b7a-6d5e-4f80-9a1b-2c3d4e5f6071'
const LIVE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const EVENEMENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const LIEN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const U1 = '11111111-1111-4111-8111-111111111111'
const U2 = '22222222-2222-4222-8222-222222222222'
const U3 = '33333333-3333-4333-8333-333333333333'

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
  notFound: () => {
    throw new Error('INTROUVABLE')
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// ---------- Faux client service ----------

interface Operation {
  table: string
  type: 'select' | 'insert' | 'update' | 'upsert' | 'delete'
  valeurs?: unknown
  filtres: Record<string, unknown>
}
const base = {
  tables: {} as Record<string, Record<string, unknown>[]>,
  erreurInsertion: null as { code: string } | null,
  operations: [] as Operation[],
}
const clientsService = vi.fn()

function fauxClientService() {
  clientsService()
  return {
    from(table: string) {
      const op: Operation = { table, type: 'select', filtres: {} }
      base.operations.push(op)
      const lignes = () =>
        (base.tables[table] ?? []).filter((l) =>
          Object.entries(op.filtres).every(([c, v]) => (Array.isArray(v) ? v.includes(l[c]) : l[c] === v)),
        )
      const resultat = () => {
        if (op.type === 'insert' && base.erreurInsertion) return { data: null, error: base.erreurInsertion }
        if (op.type === 'insert') return { data: [{ id: ENTREPRISE }], error: null }
        return { data: lignes(), error: null }
      }
      const requete = {
        select: () => requete,
        order: () => requete,
        limit: () => requete,
        is: () => requete,
        not: () => requete,
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
        upsert(valeurs: unknown) {
          op.type = 'upsert'
          op.valeurs = valeurs
          return requete
        },
        delete() {
          op.type = 'delete'
          return requete
        },
        single: async () => {
          const r = resultat()
          return { data: r.data?.[0] ?? null, error: r.error }
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
}
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: fauxClientService }))

const actions = await import('./dossier-actions')
const { default: PageListe } = await import('@/app/(admin)/admin/entreprise/page')
const { default: PageFiche } = await import('@/app/(admin)/admin/entreprise/[id]/page')

const ENTREES: [string, () => Promise<unknown>][] = [
  ['creerEntreprise', () => actions.creerEntreprise({ nom_entreprise: 'Sobraga' })],
  ['modifierEntreprise', () => actions.modifierEntreprise(ENTREPRISE, { nom_entreprise: 'Sobraga' })],
  ['rattacherSessions', () => actions.rattacherSessions(ENTREPRISE, [{ source: 'live', session_id: LIVE }])],
  ['detacherSession', () => actions.detacherSession(ENTREPRISE, LIEN)],
  ['actualiserEtiquettes', () => actions.actualiserEtiquettes(ENTREPRISE)],
  ['page liste', () => PageListe()],
  ['page fiche', () => PageFiche({ params: Promise.resolve({ id: ENTREPRISE }) })],
]

const participants = (...comptes: (string | null)[]) => ({
  participants: comptes.map((academy_user_id, n) => ({ id: `p${n}`, prenom: `P${n}`, email: null, academy_user_id })),
})

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  clientsService.mockReset()
  base.operations = []
  base.erreurInsertion = null
  base.tables = {
    company_profiles: [{ id: ENTREPRISE, nom_entreprise: 'Sobraga' }],
    company_sessions: [{ id: LIEN, company_id: ENTREPRISE, live_session_id: LIVE, presentiel_session_id: null }],
    live_sessions_suivi: [{ live_session_id: LIVE, code: 'NXUPU9', titre: 'Atelier IA', donnees: participants(U1, U2, null) }],
    profiles: [{ id: U1, role: 'user' }, { id: ADMIN, role: 'admin', full_name: 'Admin' }],
    company_members: [{ company_id: ENTREPRISE, user_id: U3 }],
    collaborators: [],
  }
  etat.user = { id: ADMIN }
  etat.role = 'admin'
})

afterEach(() => vi.restoreAllMocks())

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
    })
  }
})

describe('entreprise', () => {
  it('crée l’entreprise sans compte client, signée par l’admin', async () => {
    const r = await actions.creerEntreprise({ nom_entreprise: ' Sobraga ', contact_email: 'RH@Sobraga.GA' })
    expect(r).toEqual({ ok: true, id: ENTREPRISE })
    const creation = base.operations.find((o) => o.table === 'company_profiles' && o.type === 'insert')
    expect(creation?.valeurs).toMatchObject({ nom_entreprise: 'Sobraga', contact_email: 'rh@sobraga.ga', cree_par_admin: ADMIN })
    expect(creation?.valeurs).not.toHaveProperty('user_id')
  })

  it('refuse une saisie invalide sans rien écrire', async () => {
    expect((await actions.creerEntreprise({ nom_entreprise: '' })).ok).toBe(false)
    expect((await actions.modifierEntreprise(ENTREPRISE, { nom_entreprise: 'A', contact_email: 'x' })).ok).toBe(false)
    expect(base.operations.filter((o) => o.type !== 'select')).toEqual([])
  })

  it('refuse un responsable qui n’est pas admin', async () => {
    const r = await actions.creerEntreprise({ nom_entreprise: 'Sobraga', responsable_id: U1 })
    expect(r).toEqual({ ok: false, error: 'Le responsable doit être un admin actif.' })
    expect(base.operations.some((o) => o.type === 'insert')).toBe(false)
  })
})

describe('rattachement et étiquettes', () => {
  it('rattache une session Studia Live et un événement, sans doublon', async () => {
    const r = await actions.rattacherSessions(ENTREPRISE, [
      { source: 'live', session_id: LIVE },
      { source: 'live', session_id: LIVE },
      { source: 'presentiel', session_id: EVENEMENT },
    ])
    expect(r).toMatchObject({ ok: true, rattachees: 2 })
    expect(base.operations.find((o) => o.table === 'company_sessions' && o.type === 'insert')?.valeurs).toEqual([
      { company_id: ENTREPRISE, live_session_id: LIVE, presentiel_session_id: null, rattachee_par: ADMIN },
      { company_id: ENTREPRISE, live_session_id: null, presentiel_session_id: EVENEMENT, rattachee_par: ADMIN },
    ])
  })

  it('étiquette les comptes Academy existants et retire ceux qui ne viennent plus d’aucune session', async () => {
    const r = await actions.actualiserEtiquettes(ENTREPRISE)
    // U1 existe ; U2 a été supprimé d'Academy ; U3 portait l'étiquette sans venir d'une session.
    expect(r).toEqual({ ok: true, etiquetes: 1 })
    expect(base.operations.find((o) => o.table === 'company_members' && o.type === 'upsert')?.valeurs).toEqual([
      { company_id: ENTREPRISE, user_id: U1 },
    ])
    const retrait = base.operations.find((o) => o.table === 'company_members' && o.type === 'delete')
    expect(retrait?.filtres).toEqual({ company_id: ENTREPRISE, user_id: [U3] })
  })

  it('refuse une session déjà rattachée à une entreprise', async () => {
    base.erreurInsertion = { code: '23505' }
    const r = await actions.rattacherSessions(ENTREPRISE, [{ source: 'live', session_id: LIVE }])
    expect(r).toEqual({ ok: false, error: 'Une de ces sessions est déjà rattachée à une entreprise.' })
  })

  it('refuse une sélection vide, trop longue ou mal formée', async () => {
    expect((await actions.rattacherSessions(ENTREPRISE, [])).ok).toBe(false)
    expect((await actions.rattacherSessions(ENTREPRISE, [{ source: 'autre' as never, session_id: LIVE }])).ok).toBe(false)
    expect((await actions.rattacherSessions(ENTREPRISE, [{ source: 'live', session_id: 'x' }])).ok).toBe(false)
    const trop = Array.from({ length: 51 }, () => ({ source: 'live' as const, session_id: LIVE }))
    expect((await actions.rattacherSessions(ENTREPRISE, trop)).ok).toBe(false)
    expect(base.operations.some((o) => o.type === 'insert')).toBe(false)
  })

  it('entreprise inconnue : rien n’est rattaché', async () => {
    base.tables.company_profiles = []
    expect(await actions.rattacherSessions(ENTREPRISE, [{ source: 'live', session_id: LIVE }])).toEqual({ ok: false, error: 'Entreprise introuvable.' })
    expect(base.operations.some((o) => o.type === 'insert')).toBe(false)
  })

  it('détache seulement un lien de cette entreprise, puis recalcule les étiquettes', async () => {
    expect(await actions.detacherSession(ENTREPRISE, LIEN)).toEqual({ ok: true })
    const suppression = base.operations.find((o) => o.table === 'company_sessions' && o.type === 'delete')
    expect(suppression?.filtres).toEqual({ id: LIEN, company_id: ENTREPRISE })
    expect(base.operations.some((o) => o.table === 'company_members')).toBe(true)
  })
})
