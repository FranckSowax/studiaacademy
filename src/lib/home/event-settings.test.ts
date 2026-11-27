import { describe, expect, it } from 'vitest'
import { estAfficheAccueil, normaliserReglages, REGLAGES_PAR_DEFAUT } from './event-settings'

describe('normaliserReglages', () => {
  it('ligne valide : valeurs reprises', () => {
    expect(normaliserReglages({ evenements_max: 3, afficher_journees_ia: false })).toEqual({ max: 3, journeesIa: false })
    expect(normaliserReglages({ evenements_max: 10, afficher_journees_ia: true })).toEqual({ max: 10, journeesIa: true })
  })

  it.each([
    ['rien', null],
    ['indéfini', undefined],
    ['ligne vide', {}],
    ['texte', 'x'],
  ])('%s : réglages par défaut', (_cas, ligne) => {
    expect(normaliserReglages(ligne)).toEqual(REGLAGES_PAR_DEFAUT)
  })

  it.each([0, 11, -1, 2.5, '4', null])('nombre maximum invalide (%s) : valeur par défaut', (max) => {
    expect(normaliserReglages({ evenements_max: max, afficher_journees_ia: false })).toEqual({
      max: REGLAGES_PAR_DEFAUT.max,
      journeesIa: false,
    })
  })

  it('journées IA non booléen : valeur par défaut', () => {
    expect(normaliserReglages({ evenements_max: 4, afficher_journees_ia: 'non' }).journeesIa).toBe(true)
  })
})

describe('estAfficheAccueil', () => {
  it('affiché sauf si explicitement masqué', () => {
    expect(estAfficheAccueil({ afficher_accueil: true })).toBe(true)
    expect(estAfficheAccueil({})).toBe(true)
    expect(estAfficheAccueil({ afficher_accueil: null })).toBe(true)
    expect(estAfficheAccueil({ afficher_accueil: false })).toBe(false)
  })
})
