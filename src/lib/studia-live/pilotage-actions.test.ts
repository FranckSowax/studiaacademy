import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Refus par rôle et parcours d'envoi du pilotage Studia Live.
 * Faux client Supabase (session, rôle d'équipe, tables de suivi), faux
 * envoi d'e-mail et Studia Live simulé par un faux `fetch` : aucun réseau.
 */

const SECRET = 'secret-de-test-studia-live-0123456789abcdef'
const LIVE = 'https://live.test'
const SESSION = '3f1c2b7a-6d5e-4f80-9a1b-2c3d4e5f6071'
const ADMIN = '7b0f3a52-9f0e-4c1d-8a55-1d2c3b4a5f60'
const P1 = '11111111-1111-4111-8111-111111111111'
const P2 = '22222222-2222-4222-8222-222222222222'
const LIEN = `${LIVE}/rapport/jeton-frais`

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

const emails = vi.fn()
vi.mock('@/lib/email/send', () => ({
  isEmailConfigured: () => true,
  sendEmail: async (message: unknown) => {
    emails(message)
    return true
  },
}))

// ---------- Faux client service ----------

interface Operation {
  table: string
  type: 'select' | 'update' | 'insert' | 'upsert'
  valeurs?: Record<string, unknown>
}
const base = { fiche: null as Record<string, unknown> | null, operations: [] as Operation[] }
const clientsService = vi.fn()

function fauxClientService() {
  clientsService()
  return {
    from(table: string) {
      const op: Operation = { table, type: 'select' }
      base.operations.push(op)
      const lignes = () => (table === 'live_sessions_suivi' && base.fiche ? [base.fiche] : [])
      const requete = {
        select: () => requete,
        eq: () => requete,
        in: () => requete,
        not: () => requete,
        order: () => requete,
        limit: () => requete,
        update(valeurs: Record<string, unknown>) {
          op.type = 'update'
          op.valeurs = valeurs
          return requete
        },
        upsert(valeurs: Record<string, unknown>) {
          op.type = 'upsert'
          op.valeurs = valeurs
          return requete
        },
        insert(valeurs: Record<string, unknown>) {
          op.type = 'insert'
          op.valeurs = valeurs
          return Promise.resolve({ error: null })
        },
        maybeSingle: async () => ({ data: lignes()[0] ?? null, error: null }),
        then: (suite: (r: { data: unknown[]; error: null }) => unknown) => suite({ data: lignes(), error: null }),
      }
      return requete
    },
  }
}
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: fauxClientService }))

const actions = await import('./pilotage-actions')
const { GET: exporter } = await import('@/app/api/admin/studia-live/[id]/export/route')
const { POST: tacheNuit } = await import('@/app/api/studia-live/jobs/sync/route')
const { default: PageListe } = await import('@/app/(admin)/admin/studia-live/page')
const { default: PageFiche } = await import('@/app/(admin)/admin/studia-live/[id]/page')

const fauxFetch = vi.fn()

const DETAIL = {
  contrat: 1,
  session: { id: SESSION, code: 'NXUPU9', titre: 'Atelier IA', date_formation: '2026-11-20' },
  formateur: null,
  indicateurs: { indice: 59, synthese: 'Bonne session.' },
  activites: [],
  participants: [
    { id: P1, prenom: 'Awa', email: 'awa@exemple.ga', finale: { envoyee_le: '2026-11-21T09:00:00Z', lien: null }, reponses: [] },
    { id: P2, prenom: 'Jean', email: null, finale: null, reponses: [] },
  ],
  reponses_anonymes: [],
}
const reponse = (status: number, corps: unknown) =>
  new Response(JSON.stringify(corps), { status, headers: { 'content-type': 'application/json' } })

/** Toutes les entrées protégées de ce chantier : actions, route d'export, pages. */
const ENTREES: [string, () => Promise<unknown>][] = [
  ['synchroniserLive', () => actions.synchroniserLive()],
  ['actualiserSessionLive', () => actions.actualiserSessionLive(SESSION)],
  ['enregistrerSuivi', () => actions.enregistrerSuivi(SESSION, { statut_suivi: 'clos' })],
  ['apercuRapport', () => actions.apercuRapport(SESSION, { email: 'direction@client.ga' })],
  ['envoyerRapport', () => actions.envoyerRapport(SESSION, { email: 'direction@client.ga', emailConfirme: 'direction@client.ga' })],
  ['envoyerFinalesManquantes', () => actions.envoyerFinalesManquantes(SESSION)],
  ['relancerParticipants', () => actions.relancerParticipants(SESSION, [P1], true)],
  ['export CSV', () => exporter(new Request('http://localhost/x'), { params: Promise.resolve({ id: SESSION }) })],
  ['page liste', () => PageListe()],
  ['page fiche', () => PageFiche({ params: Promise.resolve({ id: SESSION }) })],
]

beforeEach(() => {
  vi.stubEnv('STUDIA_LINK_SECRET', SECRET)
  vi.stubEnv('STUDIA_LIVE_URL', LIVE)
  vi.stubEnv('INBOX_CRON_SECRET', 'secret-de-cron-0123456789')
  vi.stubGlobal('fetch', fauxFetch)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  fauxFetch.mockReset()
  emails.mockReset()
  clientsService.mockReset()
  base.operations = []
  base.fiche = { live_session_id: SESSION, code: 'NXUPU9', titre: 'Atelier IA', date_formation: '2026-11-20', resume: {}, statut_suivi: 'a_traiter', donnees: DETAIL }
  etat.user = { id: ADMIN }
  etat.role = 'admin'
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('refus par rôle', () => {
  const PROFILS: [string, { id: string } | null, string | null, string][] = [
    ['personne non connectée', null, null, '/equipe/connexion'],
    ['client sans rôle d’équipe', { id: ADMIN }, null, '/dashboard'],
    ['agent messagerie', { id: ADMIN }, 'agent', '/dashboard'],
    ['rôle inconnu', { id: ADMIN }, 'formateur', '/dashboard'],
  ]

  for (const [profil, user, role, destination] of PROFILS) {
    it.each(ENTREES)(`${profil} : %s est refusé avant toute lecture`, async (_nom, appeler) => {
      etat.user = user
      etat.role = role
      await expect(appeler()).rejects.toThrow(`REDIRECTION:${destination}`)
      expect(clientsService).not.toHaveBeenCalled()
      expect(fauxFetch).not.toHaveBeenCalled()
      expect(emails).not.toHaveBeenCalled()
    })
  }

  it.each(['admin', 'super_admin'])('%s : l’export CSV est servi, sans cache', async (role) => {
    etat.role = role
    const r = (await exporter(new Request('http://localhost/x'), { params: Promise.resolve({ id: SESSION }) })) as Response
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toBe('text/csv; charset=utf-8')
    expect(r.headers.get('cache-control')).toBe('private, no-store')
    expect(r.headers.get('content-disposition')).toBe('attachment; filename="studia-live-NXUPU9-2026-11-20.csv"')
    expect(await r.text()).toContain('Awa;awa@exemple.ga')
  })
})

describe('tâche planifiée', () => {
  const appel = (autorisation?: string) =>
    tacheNuit(new Request('http://localhost/api/studia-live/jobs/sync', { method: 'POST', headers: autorisation ? { authorization: autorisation } : {} }) as never)

  it('refuse sans secret, ou avec un mauvais secret', async () => {
    expect((await appel()).status).toBe(401)
    expect((await appel('Bearer mauvais-secret-0123456789')).status).toBe(401)
    expect(clientsService).not.toHaveBeenCalled()
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('refuse tout si le secret de cron n’est pas configuré', async () => {
    vi.stubEnv('INBOX_CRON_SECRET', '')
    expect((await appel('Bearer ')).status).toBe(503)
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('avec le secret : synchronise et ne renvoie que des compteurs', async () => {
    fauxFetch.mockImplementation(async (url: string) =>
      url.includes('?limite=')
        ? reponse(200, { contrat: 1, total: 1, limite: 20, decalage: 0, sessions: [{ id: SESSION, code: 'NXUPU9', titre: 'Atelier IA' }] })
        : reponse(200, { ...DETAIL, liens: { rapport_direction: LIEN } }),
    )
    const r = await appel('Bearer secret-de-cron-0123456789')
    expect(r.status).toBe(200)
    const corps = await r.json()
    expect(corps).toEqual({ total: 1, nouvelles: 0, details_recharges: 1, details_en_echec: 0, supprimees: 0 })
    expect(JSON.stringify(base.operations)).not.toContain('jeton-frais')
  })
})

describe('rapport au commanditaire', () => {
  const detailFrais = () => reponse(200, { ...DETAIL, liens: { rapport_direction: LIEN, rapport_direction_expire_le: '2026-12-28T10:00:00Z' } })

  it('refuse une adresse non confirmée, sans appel ni e-mail', async () => {
    const r = await actions.envoyerRapport(SESSION, { email: 'direction@client.ga', emailConfirme: 'autre@client.ga' })
    expect(r).toEqual({ ok: false, error: 'Confirmez l’adresse du commanditaire avant l’envoi.' })
    expect(fauxFetch).not.toHaveBeenCalled()
    expect(emails).not.toHaveBeenCalled()
  })

  it('redemande le lien, l’envoie à la seule adresse confirmée, journalise et passe le statut', async () => {
    fauxFetch.mockImplementation(async () => detailFrais())
    const r = await actions.envoyerRapport(SESSION, { email: ' Direction@Client.GA ', emailConfirme: 'direction@client.ga', nom: 'Mme Obame' })
    expect(r).toEqual({ ok: true, destinataire: 'direction@client.ga' })

    expect(fauxFetch).toHaveBeenCalledTimes(1)
    expect(fauxFetch.mock.calls[0][0]).toBe(`${LIVE}/api/integrations/studia-academy/sessions/${SESSION}`)

    expect(emails).toHaveBeenCalledTimes(1)
    const mail = emails.mock.calls[0][0]
    expect(mail.to).toBe('direction@client.ga')
    expect(mail.text).toContain(LIEN)
    expect(mail.text).toContain('30 jours')
    expect(mail.html).toContain(LIEN)

    const journal = base.operations.find((o) => o.table === 'live_sessions_envois')
    expect(journal?.type).toBe('insert')
    expect(journal?.valeurs).toMatchObject({ live_session_id: SESSION, type: 'rapport_direction', destinataires: 'direction@client.ga', par: ADMIN })

    const majs = base.operations.filter((o) => o.table === 'live_sessions_suivi' && o.type === 'update')
    expect(majs.some((o) => o.valeurs?.statut_suivi === 'rapport_envoye' && o.valeurs?.commanditaire_email === 'direction@client.ga')).toBe(true)
    // Le lien n'est jamais conservé : ni dans `donnees`, ni dans le journal.
    expect(JSON.stringify(base.operations)).not.toContain('jeton-frais')
  })

  it('sans lien fourni par Studia Live : rien n’est envoyé', async () => {
    fauxFetch.mockImplementation(async () => reponse(200, DETAIL))
    const r = await actions.envoyerRapport(SESSION, { email: 'direction@client.ga', emailConfirme: 'direction@client.ga' })
    expect(r.ok).toBe(false)
    expect(emails).not.toHaveBeenCalled()
  })

  it('l’aperçu ne demande aucun lien à Studia Live', async () => {
    const r = await actions.apercuRapport(SESSION, { email: 'direction@client.ga', nom: 'Mme Obame' })
    expect(r.ok && r.apercu.texte).toContain('[lien généré au moment de l’envoi]')
    expect(fauxFetch).not.toHaveBeenCalled()
  })
})

describe('finales et relances', () => {
  const bilan = { envoyes: 1, echecs: 0, sans_email: 1, deja: 0, academy: 1 }
  const live = () =>
    fauxFetch.mockImplementation(async (_url: string, init: RequestInit) => (init.method === 'POST' ? reponse(200, bilan) : reponse(200, DETAIL)))

  it('finales manquantes : corps `{}`, journal « finales »', async () => {
    live()
    expect(await actions.envoyerFinalesManquantes(SESSION)).toEqual({ ok: true, bilan })
    const envoi = fauxFetch.mock.calls.find(([, init]) => init.method === 'POST')
    expect(envoi?.[0]).toBe(`${LIVE}/api/integrations/studia-academy/sessions/${SESSION}/finales`)
    expect(envoi?.[1].body).toBe('{}')
    expect(base.operations.find((o) => o.table === 'live_sessions_envois')?.valeurs).toMatchObject({ type: 'finales', resultat: bilan })
  })

  it('relance : exige la confirmation', async () => {
    const r = await actions.relancerParticipants(SESSION, [P1], false)
    expect(r).toEqual({ ok: false, error: 'Confirmez la relance avant l’envoi.' })
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('relance : jamais plus de 50 participants, jamais un inconnu', async () => {
    const trop = Array.from({ length: 51 }, (_, i) => `${String(i).padStart(8, '0')}-0000-4000-8000-000000000000`)
    expect((await actions.relancerParticipants(SESSION, trop, true)).ok).toBe(false)
    expect((await actions.relancerParticipants(SESSION, ['99999999-9999-4999-8999-999999999999'], true)).ok).toBe(false)
    expect((await actions.relancerParticipants(SESSION, [], true)).ok).toBe(false)
    expect(fauxFetch).not.toHaveBeenCalled()
  })

  it('relance confirmée : `forcer` sur la sélection, journal « relance_finales »', async () => {
    live()
    expect(await actions.relancerParticipants(SESSION, [P1], true)).toEqual({ ok: true, bilan })
    const envoi = fauxFetch.mock.calls.find(([, init]) => init.method === 'POST')
    expect(envoi?.[1].body).toBe(JSON.stringify({ participant_ids: [P1], forcer: true }))
    expect(base.operations.find((o) => o.table === 'live_sessions_envois')?.valeurs).toMatchObject({
      type: 'relance_finales', destinataires: 'awa@exemple.ga', par: ADMIN,
    })
  })

  it('échec côté Studia Live : message en français, échec journalisé', async () => {
    fauxFetch.mockImplementation(async () => reponse(503, { error: 'email_non_configure' }))
    const r = await actions.envoyerFinalesManquantes(SESSION)
    expect(r).toEqual({ ok: false, error: 'L’envoi d’e-mails n’est pas configuré dans Studia Live.' })
    expect(base.operations.find((o) => o.table === 'live_sessions_envois')?.valeurs).toMatchObject({ resultat: { echec: 'email_non_configure' } })
  })
})

describe('suivi', () => {
  it('refuse un statut inconnu et un e-mail invalide', async () => {
    expect((await actions.enregistrerSuivi(SESSION, { statut_suivi: 'archive' })).ok).toBe(false)
    expect((await actions.enregistrerSuivi(SESSION, { statut_suivi: 'clos', commanditaire_email: 'pas-un-email' })).ok).toBe(false)
    expect(base.operations.filter((o) => o.type === 'update')).toEqual([])
  })

  it('enregistre le suivi nettoyé', async () => {
    const r = await actions.enregistrerSuivi(SESSION, { statut_suivi: 'relance', commanditaire_nom: '  Mme Obame ', commanditaire_email: 'Direction@Client.GA', notes: '' })
    expect(r).toEqual({ ok: true })
    expect(base.operations.find((o) => o.type === 'update')?.valeurs).toEqual({
      statut_suivi: 'relance', commanditaire_nom: 'Mme Obame', commanditaire_email: 'direction@client.ga', responsable_id: null, notes: null,
    })
  })
})
