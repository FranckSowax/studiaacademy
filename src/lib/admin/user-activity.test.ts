import { describe, expect, it } from 'vitest'
import {
  chronologie,
  dateLaPlusRecente,
  indicateurs,
  joursActifs,
  moyenne,
  niveauActivite,
  progressionPourcent,
  provenanceCompte,
  serieDeJours,
  trancheProgression,
} from './user-activity'

const MAINTENANT = new Date('2026-11-26T12:00:00Z')

describe('provenanceCompte', () => {
  it('Studia Live prime sur tout le reste', () => {
    expect(provenanceCompte({ source: 'studia_live', fournisseurs: ['google'], estCollaborateur: true })).toBe('studia_live')
  })
  it('fiche de l’équipe, puis Google, puis inscription sur le site', () => {
    expect(provenanceCompte({ estCollaborateur: true, fournisseurs: ['google'] })).toBe('equipe')
    expect(provenanceCompte({ fournisseurs: ['email', 'google'] })).toBe('google')
    expect(provenanceCompte({ fournisseurs: ['email'] })).toBe('site')
    expect(provenanceCompte({})).toBe('site')
  })
  it('une source inconnue ne compte pas', () => {
    expect(provenanceCompte({ source: 'autre' })).toBe('site')
  })
})

describe('niveauActivite', () => {
  it.each([
    [null, 'jamais'],
    ['pas une date', 'jamais'],
    ['2026-11-26T08:00:00Z', 'actif_7j'],
    ['2026-11-19T12:00:00Z', 'actif_7j'],
    ['2026-11-19T11:59:59Z', 'actif_30j'],
    ['2026-10-27T12:00:00Z', 'actif_30j'],
    ['2026-10-27T11:59:59Z', 'inactif'],
    ['2025-01-01T00:00:00Z', 'inactif'],
  ])('%s → %s', (date, attendu) => {
    expect(niveauActivite(date, MAINTENANT)).toBe(attendu)
  })
})

describe('dateLaPlusRecente', () => {
  it('ignore les valeurs vides ou invalides', () => {
    expect(dateLaPlusRecente([null, undefined, '', 'x', '2026-01-02T00:00:00Z', '2026-03-01T00:00:00Z'])).toBe('2026-03-01T00:00:00Z')
    expect(dateLaPlusRecente([null, 'x'])).toBeNull()
    expect(dateLaPlusRecente([])).toBeNull()
  })
})

describe('progression', () => {
  it('pourcentage borné entre 0 et 100, null si le total est inconnu', () => {
    expect(progressionPourcent(3, 12)).toBe(25)
    expect(progressionPourcent(0, 12)).toBe(0)
    expect(progressionPourcent(15, 12)).toBe(100)
    expect(progressionPourcent(3, 0)).toBeNull()
  })
  it('moyenne des progressions connues uniquement', () => {
    expect(moyenne([100, 50, null])).toBe(75)
    expect(moyenne([null, null])).toBeNull()
    expect(moyenne([])).toBeNull()
  })
  it.each([
    [null, 'aucune'],
    [0, 'aucune'],
    [1, 'debut'],
    [49, 'debut'],
    [50, 'avance'],
    [99, 'avance'],
    [100, 'termine'],
  ])('tranche de %s → %s', (pourcent, attendu) => {
    expect(trancheProgression(pourcent)).toBe(attendu)
  })
})

describe('jours actifs et série', () => {
  it('compte les jours distincts', () => {
    expect(joursActifs(['2026-11-26T08:00:00Z', '2026-11-26T19:00:00Z', '2026-11-25T10:00:00Z', '']).size).toBe(2)
  })
  it('série jusqu’à aujourd’hui', () => {
    expect(serieDeJours(new Set(['2026-11-26', '2026-11-25', '2026-11-24', '2026-11-22']), MAINTENANT)).toBe(3)
  })
  it('série qui s’arrête hier : toujours comptée', () => {
    expect(serieDeJours(new Set(['2026-11-25', '2026-11-24']), MAINTENANT)).toBe(2)
  })
  it('aucune activité récente : 0', () => {
    expect(serieDeJours(new Set(['2026-11-20']), MAINTENANT)).toBe(0)
    expect(serieDeJours(new Set(), MAINTENANT)).toBe(0)
  })
})

describe('chronologie', () => {
  it('du plus récent au plus ancien, sans dates invalides, limitée', () => {
    const resultat = chronologie(
      [
        { date: '2026-01-01T00:00:00Z', type: 'compte', titre: 'A' },
        { date: 'invalide', type: 'lecon', titre: 'X' },
        { date: '2026-03-01T00:00:00Z', type: 'quiz', titre: 'C' },
        { date: '2026-02-01T00:00:00Z', type: 'lecon', titre: 'B' },
      ],
      2
    )
    expect(resultat.map((e) => e.titre)).toEqual(['C', 'B'])
  })
})

describe('indicateurs', () => {
  it('compte les comptes, les nouveaux, les actifs et les formations', () => {
    const chiffres = indicateurs(
      [
        { inscritLe: '2026-11-20T00:00:00Z', activite: 'actif_7j', formations: 2, formationsTerminees: 1 },
        { inscritLe: '2026-01-05T00:00:00Z', activite: 'inactif', formations: 0, formationsTerminees: 0 },
        { inscritLe: null, activite: 'jamais', formations: 1, formationsTerminees: 1 },
      ],
      MAINTENANT
    )
    expect(chiffres).toEqual({ comptes: 3, nouveaux30j: 1, actifs7j: 1, avecFormation: 2, formationsTerminees: 2 })
  })
})
