import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Refus par rôle, envoi et lecture publique du bilan d'entreprise.
 * Faux client Supabase et faux envoi d'e-mail : aucun réseau.
 */

const ADMIN = '7b0f3a52-9f0e-4c1d-8a55-1d2c3b4a5f60'
const ENTREPRISE = '3f1c2b7a-6d5e-4f80-9a1b-2c3d4e5f6071'
const LIVE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const RAPPORT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const MAINTENANT = Date.parse('2026-11-28T12:00:00Z')

const etat = { user: null as { id: string } | null, role: null as string | null, origine: 'https://www.studia.academy' as string | null }

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
vi.mock('next/headers', () => ({ headers: async () => ({ get: (nom: string) => (nom === 'origin' ? etat.origine : null) }) }))

const emails = vi.fn()
const envoi = { accepte: true }
vi.mock('@/lib/email/send', () => ({
  isEmailConfigured: () => true,
  sendEmail: async (message: unknown) => {
    emails(message)
    return envoi.accepte
  },
}))

interface Operation {
  table: string
  type: 'select' | 'insert' | 'update'
  valeurs?: Record<string, unknown>
  filtres: Record<string, unknown>
}
const base = { tables: {} as Record<string, Record<string, unknown>[]>, operations: [] as Operation[] }
const clientsService = vi.fn()

function fauxClient() {
  clientsService()
  return {
    from(table: string) {
      const op: Operation = { table, type: 'select', filtres: {} }
      base.operations.push(op)
      const lignes = () =>
        (base.tables[table] ?? []).filter((l) =>
          Object.entries(op.filtres).every(([c, v]) => (Array.isArray(v) ? v.includes(l[c]) : l[c] === v)),
        )
      const resultat = () => (op.type === 'insert' ? { data: [{ id: RAPPORT }], error: null } : { data: lignes(), error: null })
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
        insert(valeurs: Record<string, unknown>) {
          op.type = 'insert'
          op.valeurs = valeurs
          return requete
        },
        update(valeurs: Record<string, unknown>) {
          op.type = 'update'
          op.valeurs = valeurs
          return requete
        },
        single: async () => ({ data: resultat().data[0] ?? null, error: null }),
        maybeSingle: async () => ({ data: resultat().data[0] ?? null, error: null }),
        then: (suite: (r: { data: unknown; error: unknown }) => unknown) => suite(resultat()),
      }
      return requete
    },
  }
}
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: fauxClient }))

const actions = await import('./bilan-actions')
const { lireBilanPublic } = await import('./bilan-acces')
const { empreinteJeton, genererJeton } = await import('./bilan-jeton')
const { default: PageApercu } = await import('@/app/(admin)/admin/entreprise/[id]/bilan/page')

const SAISIE = { email: 'direction@sobraga.ga', emailConfirme: 'direction@sobraga.ga', nom: 'Mme Obame' }
const ENTREES: [string, () => Promise<unknown>][] = [
  ['apercuBilan', () => actions.apercuBilan(ENTREPRISE, SAISIE)],
  ['envoyerBilan', () => actions.envoyerBilan(ENTREPRISE, SAISIE)],
  ['revoquerBilan', () => actions.revoquerBilan(ENTREPRISE, RAPPORT)],
  ['page aperçu', () => PageApercu({ params: Promise.resolve({ id: ENTREPRISE }) })],
]

const creation = () => base.operations.find((o) => o.table === 'company_reports' && o.type === 'insert')

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  clientsService.mockReset()
  emails.mockReset()
  envoi.accepte = true
  base.operations = []
  base.tables = {
    company_profiles: [{ id: ENTREPRISE, nom_entreprise: 'Sobraga' }],
    company_sessions: [{ id: 'l', company_id: ENTREPRISE, live_session_id: LIVE, presentiel_session_id: null }],
    live_sessions_suivi: [
      {
        live_session_id: LIVE, code: 'NXUPU9', titre: 'Atelier IA', date_formation: '2026-11-20',
        resume: { nb_participants: 2, indice: 59, reussite_moy: 45, satisfaction: 4.6 },
        donnees: {
          participants: [
            { id: 'p1', prenom: 'Awa', email: 'awa@exemple.ga', reponses: [{ texte: 'réponse secrète' }] },
            { id: 'p2', prenom: 'Jean', email: 'jean@exemple.ga', reponses: [] },
          ],
          indicateurs: { themes: [{ titre: 'Lire un tableau de bord', taux: 30 }], recommandations: [] },
        },
      },
    ],
    company_members: [],
    company_assessments: [],
    company_proposals: [
      { company_id: ENTREPRISE, type: 'catalogue', catalogue_ref: 'F4', titre: 'Data', justification: 'Thème à 30 %.', statut: 'retenue', formation_id: null },
    ],
    company_reports: [],
  }
  etat.user = { id: ADMIN }
  etat.role = 'admin'
  etat.origine = 'https://www.studia.academy'
})

afterEach(() => {
  vi.useRealTimers()
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
      expect(emails).not.toHaveBeenCalled()
    })
  }
})

describe('envoyerBilan', () => {
  it('refuse une adresse non confirmée : ni bilan créé, ni e-mail', async () => {
    const r = await actions.envoyerBilan(ENTREPRISE, { ...SAISIE, emailConfirme: 'autre@sobraga.ga' })
    expect(r).toEqual({ ok: false, error: 'Confirmez l’adresse de la direction avant l’envoi.' })
    expect(clientsService).not.toHaveBeenCalled()
    expect(emails).not.toHaveBeenCalled()
  })

  it('fige le bilan, envoie le lien à la seule adresse confirmée et ne conserve que l’empreinte du jeton', async () => {
    const r = await actions.envoyerBilan(ENTREPRISE, { ...SAISIE, email: ' Direction@Sobraga.GA ' })
    if (!r.ok) throw new Error(r.error)
    expect(r.destinataire).toBe('direction@sobraga.ga')
    expect(r.lien).toMatch(/^https:\/\/www\.studia\.academy\/bilan\/[A-Za-z0-9_-]{43}$/)
    const jeton = r.lien.split('/').pop() as string

    const cree = creation()?.valeurs
    expect(cree).toMatchObject({ company_id: ENTREPRISE, destinataire: 'direction@sobraga.ga', envoye_par: ADMIN, jeton_hash: empreinteJeton(jeton) })
    // Ni le jeton en clair, ni un participant, ni une réponse ne sont conservés.
    expect(JSON.stringify(base.operations)).not.toContain(jeton)
    expect(JSON.stringify(cree)).not.toMatch(/Awa|awa@|jean@|réponse secrète/)
    expect((cree?.contenu as { formations: unknown[] }).formations).toHaveLength(1)

    expect(emails).toHaveBeenCalledTimes(1)
    const mail = emails.mock.calls[0][0]
    expect(mail.to).toBe('direction@sobraga.ga')
    expect(mail.text).toContain(r.lien)
    expect(mail.text + mail.html).not.toMatch(/Awa|awa@|jean@/)

    const majs = base.operations.filter((o) => o.type === 'update')
    expect(majs.find((o) => o.table === 'company_reports')?.valeurs).toEqual({ envoye: true })
    expect(majs.find((o) => o.table === 'company_profiles')?.valeurs).toEqual({ direction_email: 'direction@sobraga.ga', direction_nom: 'Mme Obame' })
  })

  it('lien valable 30 jours', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MAINTENANT)
    await actions.envoyerBilan(ENTREPRISE, SAISIE)
    expect(creation()?.valeurs?.expire_le).toBe('2026-12-28T12:00:00.000Z')
  })

  it('e-mail refusé : le bilan n’est jamais marqué envoyé', async () => {
    envoi.accepte = false
    const r = await actions.envoyerBilan(ENTREPRISE, SAISIE)
    expect(r).toEqual({ ok: false, error: 'L’e-mail n’a pas pu être envoyé. Réessayez dans un instant.' })
    expect(base.operations.some((o) => o.type === 'update')).toBe(false)
  })

  it('sans session clôturée : rien à envoyer', async () => {
    base.tables.company_sessions = []
    expect((await actions.envoyerBilan(ENTREPRISE, SAISIE)).ok).toBe(false)
    expect((await actions.apercuBilan(ENTREPRISE, SAISIE)).ok).toBe(false)
    expect(emails).not.toHaveBeenCalled()
    expect(creation()).toBeUndefined()
  })

  it('n’utilise pas une origine non sûre pour le lien', async () => {
    etat.origine = 'http://attaquant.test'
    const r = await actions.envoyerBilan(ENTREPRISE, SAISIE)
    expect(r.ok && r.lien.startsWith('https://www.studia.academy/bilan/')).toBe(true)
  })

  it('l’aperçu ne crée aucun lien et n’envoie rien', async () => {
    const r = await actions.apercuBilan(ENTREPRISE, SAISIE)
    expect(r.ok && r.apercu.texte).toContain('[lien généré au moment de l’envoi]')
    expect(r.ok && r.formations).toBe(1)
    expect(creation()).toBeUndefined()
    expect(emails).not.toHaveBeenCalled()
  })
})

describe('revoquerBilan', () => {
  it('ne désactive qu’un bilan de cette entreprise', async () => {
    base.tables.company_reports = [{ id: RAPPORT, company_id: ENTREPRISE }]
    expect(await actions.revoquerBilan(ENTREPRISE, RAPPORT)).toEqual({ ok: true })
    const maj = base.operations.find((o) => o.type === 'update')
    expect(maj?.filtres).toEqual({ id: RAPPORT, company_id: ENTREPRISE })
    expect(typeof maj?.valeurs?.revoque_le).toBe('string')

    base.tables.company_reports = []
    expect((await actions.revoquerBilan(ENTREPRISE, RAPPORT)).ok).toBe(false)
  })
})

describe('lecture publique par jeton', () => {
  const jeton = genererJeton()
  const contenu = { version: 1, entreprise: 'Sobraga', genere_le: '2026-11-28T12:00:00Z', indicateurs: { sessions: 1, participations: 2 } }
  const ligne = (surcharge: Record<string, unknown> = {}) => ({
    jeton_hash: empreinteJeton(jeton), contenu, envoye: true, expire_le: '2026-12-28T12:00:00Z', revoque_le: null, ...surcharge,
  })
  const lire = (j: unknown) => lireBilanPublic(fauxClient() as never, j, MAINTENANT)

  it('sert le bilan du bon jeton', async () => {
    base.tables.company_reports = [ligne()]
    const r = await lire(jeton)
    expect(r?.bilan.entreprise).toBe('Sobraga')
    expect(r?.expire_le).toBe('2026-12-28T12:00:00Z')
  })

  it.each([
    ['expiré', { expire_le: '2026-11-28T11:59:59Z' }],
    ['révoqué', { revoque_le: '2026-11-27T10:00:00Z' }],
    ['e-mail jamais parti', { envoye: false }],
    ['contenu illisible', { contenu: { version: 9 } }],
  ])('refuse un lien %s', async (_cas, surcharge) => {
    base.tables.company_reports = [ligne(surcharge)]
    expect(await lire(jeton)).toBeNull()
  })

  it('refuse un jeton inconnu, et ne cherche même pas un jeton mal formé', async () => {
    base.tables.company_reports = [ligne()]
    expect(await lire(genererJeton())).toBeNull()
    base.operations = []
    for (const mauvais of ['', 'abc', '../../admin', `${jeton}x`, null]) expect(await lire(mauvais)).toBeNull()
    expect(base.operations).toEqual([])
  })
})
