import { describe, expect, it } from 'vitest'
import type { DonneesSessionLive } from '@/lib/studia-live/pilotage'
import { analyserSessions, domainesDuTexte, normaliser } from './analyse'

type Theme = { titre: string; taux: number | null; questions?: { titre: string; taux: number; nb: number }[] }
type Reco = { type: string; axe: string | null; texte: string }

const session = (themes: Theme[], recommandations: Reco[] = []) => ({
  donnees: { indicateurs: { themes, recommandations }, participants: [{ prenom: 'Awa', email: 'awa@exemple.ga' }] } as unknown as DonneesSessionLive,
})

describe('normaliser et domainesDuTexte', () => {
  it('ignore la casse, les accents et la ponctuation', () => {
    expect(normaliser('  Sécurité : mots-de-passe ! ')).toBe('securite mots de passe')
  })

  it.each([
    ['Rédiger un bon prompt', ['ia_generative']],
    ['Lire un tableau de bord', ['data']],
    ['Mots de passe et phishing', ['securite']],
    ['Automatisation des process', ['gestion_projet']],
    ['Relation client sur les réseaux sociaux', ['communication_digitale']],
    ['E-mail et documents partagés', ['bureautique']],
    ['Copilot pour analyser les données', ['ia_generative', 'data']],
    ['Sécurité informatique au bureau', ['securite']],
    ['Sécurité incendie', []],
    ['Gestes et postures en entrepôt', []],
    ['La mairie', []],
  ])('%s → %j', (texte, attendu) => {
    expect(domainesDuTexte(texte)).toEqual(attendu)
  })
})

describe('analyserSessions', () => {
  it('propose le catalogue sur les thèmes à renforcer, le plus faible d’abord', () => {
    const a = analyserSessions([
      session([
        { titre: 'Lire un tableau de bord', taux: 30 },
        { titre: 'Mots de passe', taux: 50 },
        { titre: 'Rédiger un prompt', taux: 70 },
      ]),
    ])
    expect(a.themes_a_renforcer.map((t) => t.titre)).toEqual(['Lire un tableau de bord', 'Mots de passe'])
    expect(a.propositions.map((p) => [p.catalogue_ref, p.score])).toEqual([['F4', 30], ['F5', 10]])
    expect(a.propositions[0]).toMatchObject({ type: 'catalogue', titre: 'Data & tableaux de bord : piloter par les chiffres' })
    expect(a.propositions[0].justification).toBe(
      'Thème « Lire un tableau de bord » à 30 % de réussite. Domaine couvert : Data & tableaux de bord.',
    )
  })

  it('regroupe un même thème entre sessions, pondéré par le nombre de réponses', () => {
    const a = analyserSessions([
      session([{ titre: 'Tableaux de bord', taux: 20, questions: [{ titre: 'q', taux: 20, nb: 30 }] }]),
      session([{ titre: 'tableaux de BORD ', taux: 60, questions: [{ titre: 'q', taux: 60, nb: 10 }] }]),
    ])
    expect(a.themes_a_renforcer).toHaveLength(1)
    expect(a.themes_a_renforcer[0]).toMatchObject({ taux: 30, sessions: 2 })
  })

  it('les priorités des formateurs pèsent dans le score et sont dédoublonnées', () => {
    const priorite = { type: 'priorite', axe: 'Sécurité', texte: 'Revoir la gestion des mots de passe.' }
    const a = analyserSessions([
      session([{ titre: 'Prompts', taux: 55 }], [priorite, { type: 'atout', axe: 'Data', texte: 'Bonne lecture des chiffres.' }]),
      session([], [priorite]),
    ])
    expect(a.priorites).toHaveLength(1)
    const securite = a.propositions.find((p) => p.catalogue_ref === 'F5')
    expect(securite).toMatchObject({ score: 15 })
    expect(securite?.justification).toContain('1 priorité relevée par les formateurs')
    // Un atout ne déclenche aucune proposition.
    expect(a.propositions.some((p) => p.catalogue_ref === 'F4')).toBe(false)
  })

  it('un thème à renforcer hors catalogue devient une formation sur mesure', () => {
    const a = analyserSessions([
      session(
        [{ titre: 'Gestes et postures en entrepôt', taux: 35 }],
        [{ type: 'priorite', axe: 'Logistique', texte: 'Adapter les exemples au quai de chargement.' }],
      ),
    ])
    expect(a.propositions).toEqual([
      {
        type: 'sur_mesure', catalogue_ref: null, titre: 'Sur mesure : Gestes et postures en entrepôt', score: 25,
        justification: 'Thème « Gestes et postures en entrepôt » à 35 % de réussite sur 1 session, sans formation correspondante au catalogue.',
      },
      {
        type: 'sur_mesure', catalogue_ref: null, titre: 'Sur mesure : Logistique', score: 15,
        justification: 'Priorité relevée par les formateurs : Adapter les exemples au quai de chargement.',
      },
    ])
  })

  it('un thème maîtrisé ouvre le niveau suivant, jamais une initiation', () => {
    const a = analyserSessions([session([{ titre: 'Rédiger un prompt', taux: 88 }])])
    expect(a.themes_maitrises.map((t) => t.titre)).toEqual(['Rédiger un prompt'])
    expect(a.propositions).toHaveLength(1)
    expect(a.propositions[0]).toMatchObject({ catalogue_ref: 'F2', score: 5 })
    expect(a.propositions[0].justification).toContain('maîtrisé à 88 %')
  })

  it('plafonne à quatre formations du catalogue et trois sur mesure', () => {
    const a = analyserSessions([
      session([
        { titre: 'Prompts', taux: 10 }, { titre: 'Tableau de bord', taux: 10 }, { titre: 'Phishing', taux: 10 },
        { titre: 'Marketing', taux: 10 }, { titre: 'Projet', taux: 10 }, { titre: 'Bureautique', taux: 10 },
        { titre: 'Soudure', taux: 10 }, { titre: 'Conduite d’engins', taux: 10 }, { titre: 'Hygiène alimentaire', taux: 10 },
        { titre: 'Accueil physique', taux: 10 },
      ]),
    ])
    expect(a.propositions.filter((p) => p.type === 'catalogue')).toHaveLength(4)
    expect(a.propositions.filter((p) => p.type === 'sur_mesure')).toHaveLength(3)
  })

  it('ignore les sessions sans détail et les taux non mesurés', () => {
    const a = analyserSessions([{ donnees: null }, session([{ titre: 'Tableau de bord', taux: null }])])
    expect(a).toMatchObject({ sessions_analysees: 1, sessions_sans_detail: 1, themes_a_renforcer: [], propositions: [] })
  })

  it('ne lit aucune donnée nominative', () => {
    const a = analyserSessions([session([{ titre: 'Phishing', taux: 20 }])])
    expect(JSON.stringify(a)).not.toMatch(/Awa|awa@/)
  })
})
