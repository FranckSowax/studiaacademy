import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Devis entreprise : numéro, contenu, refus par rôle, enregistrement,
 * envoi et lecture publique. Faux client Supabase et faux e-mail : aucun réseau.
 */

const ADMIN = '7b0f3a52-9f0e-4c1d-8a55-1d2c3b4a5f60'
const ENTREPRISE = '3f1c2b7a-6d5e-4f80-9a1b-2c3d4e5f6071'
const DEVIS = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const MAINTENANT = Date.parse('2026-11-28T12:00:00Z')

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
vi.mock('next/headers', () => ({ headers: async () => ({ get: (nom: string) => (nom === 'origin' ? 'https://www.studia.academy' : null) }) }))

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
  type: 'select' | 'insert' | 'update' | 'delete'
  valeurs?: Record<string, unknown>
  filtres: Record<string, unknown>
}
const base = {
  tables: {} as Record<string, Record<string, unknown>[]>,
  operations: [] as Operation[],
  /** Numéros déjà pris : l'insertion échoue en doublon pour ceux-là. */
  numerosPris: new Set<string>(),
}
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
      const resultat = () => {
        if (op.type === 'insert') {
          return base.numerosPris.has(String(op.valeurs?.numero)) ? { data: null, error: { code: '23505' } } : { data: [{ id: DEVIS }], error: null }
        }
        return { data: lignes(), error: null }
      }
      const requete = {
        select: () => requete,
        order: () => requete,
        limit: () => requete,
        like: () => requete,
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
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: fauxClient }))

const actions = await import('./devis-actions')
const { codeEntreprise, composerEmailDevis, devisDepuisSaisie, fcfa, lireDevisConserve, nettoyerSaisie, numeroDevis } = await import('./devis')
const { lireDevisPublic } = await import('./devis-acces')
const { empreinteJeton, genererJeton } = await import('./bilan-jeton')
const { DevisView } = await import('@/components/entreprise/DevisView')
const { default: PageApercu } = await import('@/app/(admin)/admin/entreprise/[id]/devis/[devisId]/page')

const SAISIE = {
  participants: 60,
  lignes: [{ code: 'preparation' }, { code: 'demi_journee', participants: 60 }, { code: 'clinique', quantite: 3 }, { code: 'mesure_impact' }],
}
const CONTACT = { email: 'rh@sobraga.ga', emailConfirme: 'rh@sobraga.ga', nom: 'M. Ondo' }

const contenu = (numero = 'DEV-2026-SOB-001') =>
  devisDepuisSaisie({ numero, objet: 'Demi-journées pratiques', entreprise: 'Sobraga', contactNom: 'M. Ondo', saisie: nettoyerSaisie(SAISIE) }, MAINTENANT).contenu

const ligneDevis = (surcharge: Record<string, unknown> = {}) => ({
  id: DEVIS, company_id: ENTREPRISE, numero: 'DEV-2026-SOB-001', objet: 'Demi-journées pratiques', saisie: SAISIE, contenu: contenu(),
  total_ht: 3_195_000, statut: 'brouillon', destinataire: null, envoye_le: null, decide_le: null, created_at: '2026-11-28T12:00:00Z', ...surcharge,
})

const ENTREES: [string, () => Promise<unknown>][] = [
  ['enregistrerDevis', () => actions.enregistrerDevis(ENTREPRISE, { objet: 'Initiation', saisie: SAISIE })],
  ['supprimerBrouillon', () => actions.supprimerBrouillon(ENTREPRISE, DEVIS)],
  ['apercuEnvoiDevis', () => actions.apercuEnvoiDevis(ENTREPRISE, DEVIS, CONTACT)],
  ['envoyerDevis', () => actions.envoyerDevis(ENTREPRISE, DEVIS, CONTACT)],
  ['deciderDevis', () => actions.deciderDevis(ENTREPRISE, DEVIS, 'accepte')],
  ['page aperçu', () => PageApercu({ params: Promise.resolve({ id: ENTREPRISE, devisId: DEVIS }) })],
]

const ecriture = (type: Operation['type']) => base.operations.find((o) => o.table === 'company_quotes' && o.type === type)

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  clientsService.mockReset()
  emails.mockReset()
  envoi.accepte = true
  base.operations = []
  base.numerosPris = new Set()
  base.tables = {
    company_profiles: [{ id: ENTREPRISE, nom_entreprise: 'Sobraga', contact_nom: 'M. Ondo', contact_email: 'rh@sobraga.ga' }],
    company_quotes: [],
  }
  etat.user = { id: ADMIN }
  etat.role = 'admin'
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('numéro et contenu', () => {
  it('numérote comme DEV-2026-SOB-001', () => {
    expect(numeroDevis(2026, 'Sobraga', 1)).toBe('DEV-2026-SOB-001')
    expect(numeroDevis(2026, 'BGFI Bank Gabon', 12)).toBe('DEV-2026-BGF-012')
    expect(codeEntreprise('Éts Ndong & Fils')).toBe('ETS')
    expect(codeEntreprise('3M')).toBe('MXX')
    expect(codeEntreprise('')).toBe('XXX')
  })

  it('fige le devis de l’exemple B de la grille : 3 195 000 HT, 53 250 par collaborateur', () => {
    const c = contenu()
    expect(c).toMatchObject({
      numero: 'DEV-2026-SOB-001', entreprise: 'Sobraga', total_ht: 3_195_000, par_personne: 53_250, participants: 60,
      emis_le: '2026-11-28T12:00:00.000Z', valable_jusqu_au: '2026-12-28T12:00:00.000Z',
    })
    expect(c.lignes.map((l) => l.montant)).toEqual([500_000, 800_000, 1_120_000, 525_000, 250_000])
    expect(c.non_inclus).toContain('Déplacements hors Libreville')
    expect(c.conditions.join(' ')).toContain('50 % à la commande')
    expect(c.conditions.join(' ')).toContain('valable 30 jours')
    // Les remarques internes de la grille ne figurent jamais sur le devis.
    expect(JSON.stringify(c)).not.toMatch(/alertes|Pas de préparation/)
  })

  it('ne garde de la saisie que les champs connus', () => {
    const propre = nettoyerSaisie({
      participants: '38', remise_programme_pct: '7,5', total_ht: 1,
      lignes: [{ code: 'atelier_ia', participants: '38', prix: 1, theme: '  Cadres  ' }, { pas: 'une ligne' }, null],
    })
    expect(propre).toEqual({
      participants: 38, remise_programme_pct: 7.5,
      lignes: [{ code: 'atelier_ia', participants: 38, groupes: null, remise_groupes: true, quantite: null, theme: 'Cadres', duree_h: null, taille_max: null }],
    })
    expect(nettoyerSaisie(null)).toEqual({ lignes: [], participants: null, remise_programme_pct: null })
  })

  it('relit un devis conservé et refuse une autre forme', () => {
    expect(lireDevisConserve(JSON.parse(JSON.stringify(contenu())))).toEqual(contenu())
    expect(lireDevisConserve({ version: 2 })).toBeNull()
    expect(lireDevisConserve(null)).toBeNull()
  })

  it('formate les montants en FCFA', () => {
    expect(fcfa(3_195_000)).toBe('3 195 000 FCFA')
    expect(fcfa(382_500)).toBe('382 500 FCFA')
  })

  it('e-mail : montant, coût par collaborateur, lien, HTML échappé', () => {
    const lien = 'https://www.studia.academy/devis/abc?x=1&y=2'
    const mail = composerEmailDevis({ contenu: { ...contenu(), objet: 'IA <cadres>' }, contactNom: 'M. Ondo', lien })
    expect(mail.sujet).toBe('Devis DEV-2026-SOB-001 — IA <cadres>')
    for (const attendu of ['Bonjour M. Ondo,', '3 195 000 FCFA hors taxes', '53 250 FCFA par collaborateur', lien, '28 décembre 2026']) {
      expect(mail.texte).toContain(attendu)
    }
    expect(mail.html).toContain('IA &lt;cadres&gt;')
    expect(mail.html).toContain('href="https://www.studia.academy/devis/abc?x=1&amp;y=2"')
    expect(composerEmailDevis({ contenu: contenu(), contactNom: null, lien: null }).html).not.toContain('href=')
  })

  it('la page du devis se rend, avec total, conditions et mention', () => {
    const page = renderToStaticMarkup(createElement(DevisView, { devis: contenu(), mention: 'Accepté' }))
    for (const attendu of ['DEV-2026-SOB-001', 'Sobraga', 'M. Ondo', '3 195 000 FCFA', '53 250 FCFA', 'Groupes 2 à 3, contenu identique', 'TVA en sus', 'Non compris', 'Accepté', 'Bon pour accord']) {
      expect(page).toContain(attendu)
    }
  })
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

describe('enregistrerDevis', () => {
  it('crée un brouillon numéroté, en recalculant le total côté serveur', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MAINTENANT)
    const r = await actions.enregistrerDevis(ENTREPRISE, { objet: '  Demi-journées  pratiques ', saisie: { ...SAISIE, total_ht: 1 } })
    expect(r).toEqual({ ok: true, devisId: DEVIS, numero: 'DEV-2026-SOB-001', alertes: [] })
    const cree = ecriture('insert')?.valeurs
    expect(cree).toMatchObject({ company_id: ENTREPRISE, numero: 'DEV-2026-SOB-001', objet: 'Demi-journées pratiques', total_ht: 3_195_000, cree_par: ADMIN })
    expect((cree?.contenu as { total_ht: number }).total_ht).toBe(3_195_000)
  })

  it('poursuit la numérotation de l’entreprise, et saute un numéro déjà pris', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MAINTENANT)
    base.tables.company_quotes = [{ numero: 'DEV-2026-SOB-001' }, { numero: 'DEV-2026-SOB-004' }]
    base.numerosPris = new Set(['DEV-2026-SOB-005'])
    const r = await actions.enregistrerDevis(ENTREPRISE, { objet: 'Suite', saisie: SAISIE })
    expect(r.ok && r.numero).toBe('DEV-2026-SOB-006')
  })

  it('refuse un devis sans objet ou sans prestation', async () => {
    expect((await actions.enregistrerDevis(ENTREPRISE, { objet: ' ', saisie: SAISIE })).ok).toBe(false)
    expect(await actions.enregistrerDevis(ENTREPRISE, { objet: 'Vide', saisie: { lignes: [{ code: 'inconnue' }] } })).toEqual({
      ok: false, error: 'Ajoutez au moins une prestation au devis.',
    })
    expect(ecriture('insert')).toBeUndefined()
  })

  it('met à jour un brouillon, jamais un devis envoyé', async () => {
    base.tables.company_quotes = [ligneDevis()]
    const r = await actions.enregistrerDevis(ENTREPRISE, { devisId: DEVIS, objet: 'Initiation', saisie: { participants: 25, lignes: [{ code: 'preparation' }, { code: 'atelier_ia', participants: 25 }] } })
    expect(r.ok && r.numero).toBe('DEV-2026-SOB-001')
    expect(ecriture('update')?.valeurs).toMatchObject({ objet: 'Initiation', total_ht: 950_000 })
    expect(ecriture('update')?.filtres).toEqual({ id: DEVIS, company_id: ENTREPRISE, statut: 'brouillon' })

    base.operations = []
    base.tables.company_quotes = [ligneDevis({ statut: 'envoye' })]
    const refus = await actions.enregistrerDevis(ENTREPRISE, { devisId: DEVIS, objet: 'Initiation', saisie: SAISIE })
    expect(refus.ok).toBe(false)
    expect(ecriture('update')).toBeUndefined()
  })

  it('ne supprime qu’un brouillon de cette entreprise', async () => {
    base.tables.company_quotes = [ligneDevis()]
    expect(await actions.supprimerBrouillon(ENTREPRISE, DEVIS)).toEqual({ ok: true })
    expect(ecriture('delete')?.filtres).toEqual({ id: DEVIS, company_id: ENTREPRISE, statut: 'brouillon' })
    base.tables.company_quotes = [ligneDevis({ statut: 'envoye' })]
    expect((await actions.supprimerBrouillon(ENTREPRISE, DEVIS)).ok).toBe(false)
  })
})

describe('envoyerDevis', () => {
  it('refuse une adresse non confirmée : rien n’est lu, rien n’est envoyé', async () => {
    const r = await actions.envoyerDevis(ENTREPRISE, DEVIS, { ...CONTACT, emailConfirme: 'autre@sobraga.ga' })
    expect(r).toEqual({ ok: false, error: 'Confirmez l’adresse du contact avant l’envoi.' })
    expect(clientsService).not.toHaveBeenCalled()
    expect(emails).not.toHaveBeenCalled()
  })

  it('envoie le lien au seul contact confirmé, date le devis du jour et ne conserve que l’empreinte du jeton', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.parse('2026-12-05T09:00:00Z'))
    base.tables.company_quotes = [ligneDevis()]
    const r = await actions.envoyerDevis(ENTREPRISE, DEVIS, { ...CONTACT, email: ' RH@Sobraga.GA ' })
    if (!r.ok) throw new Error(r.error)
    expect(r.destinataire).toBe('rh@sobraga.ga')
    expect(r.lien).toMatch(/^https:\/\/www\.studia\.academy\/devis\/[A-Za-z0-9_-]{43}$/)
    const jeton = r.lien.split('/').pop() as string

    expect(emails).toHaveBeenCalledTimes(1)
    expect(emails.mock.calls[0][0]).toMatchObject({ to: 'rh@sobraga.ga' })
    expect(emails.mock.calls[0][0].text).toContain(r.lien)

    const maj = ecriture('update')?.valeurs
    expect(maj).toMatchObject({
      statut: 'envoye', destinataire: 'rh@sobraga.ga', jeton_hash: empreinteJeton(jeton), total_ht: 3_195_000,
      envoye_le: '2026-12-05T09:00:00.000Z', lien_expire_le: '2027-03-05T09:00:00.000Z',
    })
    expect((maj?.contenu as { emis_le: string; valable_jusqu_au: string })).toMatchObject({
      emis_le: '2026-12-05T09:00:00.000Z', valable_jusqu_au: '2027-01-04T09:00:00.000Z',
    })
    expect(JSON.stringify(base.operations)).not.toContain(jeton)
  })

  it('e-mail refusé : le devis reste un brouillon', async () => {
    envoi.accepte = false
    base.tables.company_quotes = [ligneDevis()]
    expect((await actions.envoyerDevis(ENTREPRISE, DEVIS, CONTACT)).ok).toBe(false)
    expect(ecriture('update')).toBeUndefined()
  })

  it('renvoyer un devis garde sa date ; un devis décidé ne se renvoie plus', async () => {
    base.tables.company_quotes = [ligneDevis({ statut: 'envoye' })]
    const r = await actions.envoyerDevis(ENTREPRISE, DEVIS, CONTACT)
    expect(r.ok).toBe(true)
    expect((ecriture('update')?.valeurs?.contenu as { emis_le: string }).emis_le).toBe('2026-11-28T12:00:00.000Z')

    base.operations = []
    emails.mockReset()
    base.tables.company_quotes = [ligneDevis({ statut: 'accepte' })]
    expect((await actions.envoyerDevis(ENTREPRISE, DEVIS, CONTACT)).ok).toBe(false)
    expect(emails).not.toHaveBeenCalled()
  })

  it('décision : seulement sur un devis envoyé', async () => {
    base.tables.company_quotes = [ligneDevis({ statut: 'envoye' })]
    expect(await actions.deciderDevis(ENTREPRISE, DEVIS, 'accepte')).toEqual({ ok: true })
    expect(ecriture('update')?.valeurs?.statut).toBe('accepte')
    expect((await actions.deciderDevis(ENTREPRISE, DEVIS, 'brouillon')).ok).toBe(false)
    base.tables.company_quotes = [ligneDevis()]
    expect((await actions.deciderDevis(ENTREPRISE, DEVIS, 'accepte')).ok).toBe(false)
  })
})

describe('lecture publique par jeton', () => {
  const jeton = genererJeton()
  const ligne = (surcharge: Record<string, unknown> = {}) => ({
    jeton_hash: empreinteJeton(jeton), contenu: contenu(), statut: 'envoye', lien_expire_le: '2027-02-26T12:00:00Z', ...surcharge,
  })
  const lire = (j: unknown) => lireDevisPublic(fauxClient() as never, j, MAINTENANT)

  it('sert le devis du bon jeton, envoyé ou décidé', async () => {
    base.tables.company_quotes = [ligne()]
    expect((await lire(jeton))?.contenu.numero).toBe('DEV-2026-SOB-001')
    base.tables.company_quotes = [ligne({ statut: 'accepte' })]
    expect((await lire(jeton))?.statut).toBe('accepte')
  })

  it.each([
    ['brouillon', { statut: 'brouillon' }],
    ['lien expiré', { lien_expire_le: '2026-11-28T11:59:59Z' }],
    ['sans date d’expiration', { lien_expire_le: null }],
    ['contenu illisible', { contenu: { version: 9 } }],
  ])('refuse un devis %s', async (_cas, surcharge) => {
    base.tables.company_quotes = [ligne(surcharge)]
    expect(await lire(jeton)).toBeNull()
  })

  it('refuse un jeton inconnu, et ne cherche même pas un jeton mal formé', async () => {
    base.tables.company_quotes = [ligne()]
    expect(await lire(genererJeton())).toBeNull()
    base.operations = []
    for (const mauvais of ['', 'abc', '../../admin', null]) expect(await lire(mauvais)).toBeNull()
    expect(base.operations).toEqual([])
  })
})
