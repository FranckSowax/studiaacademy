import { describe, expect, it } from 'vitest'
import {
  detailPlaces,
  estErreurComplet,
  etatPlaces,
  libelleBandeau,
  lirePlacesMax,
  prendUnePlace,
} from './places'

describe('etatPlaces', () => {
  it('ne limite rien sans maximum', () => {
    expect(etatPlaces(null, 40)).toBeNull()
    expect(etatPlaces(undefined, 0)).toBeNull()
    expect(etatPlaces(0, 0)).toBeNull()
  })

  it('compte les places restantes', () => {
    expect(etatPlaces(20, 17)).toEqual({ max: 20, prises: 17, restantes: 3, complet: false })
    expect(etatPlaces(20, null)).toEqual({ max: 20, prises: 0, restantes: 20, complet: false })
  })

  it('est complet à la limite, et ne descend jamais sous zéro', () => {
    expect(etatPlaces(20, 20)?.complet).toBe(true)
    expect(etatPlaces(20, 23)).toEqual({ max: 20, prises: 23, restantes: 0, complet: true })
  })
})

describe('libellés', () => {
  it('affiche « Places limitées » puis « Complet » sur la couverture', () => {
    expect(libelleBandeau(etatPlaces(20, 3)!)).toBe('Places limitées')
    expect(libelleBandeau(etatPlaces(20, 20)!)).toBe('Complet')
  })

  it('détaille les places sur la fiche', () => {
    expect(detailPlaces(etatPlaces(20, 4)!)).toBe('16 places restantes sur 20')
    expect(detailPlaces(etatPlaces(20, 17)!)).toBe('Plus que 3 places sur 20')
    expect(detailPlaces(etatPlaces(20, 19)!)).toBe('Plus qu’une place sur 20')
    expect(detailPlaces(etatPlaces(20, 20)!)).toBe('Complet · 20 places attribuées')
  })
})

describe('lirePlacesMax', () => {
  it('lit un champ vide comme « pas de limite »', () => {
    expect(lirePlacesMax('')).toBeNull()
    expect(lirePlacesMax('   ')).toBeNull()
    expect(lirePlacesMax(null)).toBeNull()
  })

  it('accepte un entier positif', () => {
    expect(lirePlacesMax('25')).toBe(25)
    expect(lirePlacesMax(12)).toBe(12)
  })

  it('refuse zéro, les négatifs, les décimaux et le texte', () => {
    expect(lirePlacesMax('0')).toBeUndefined()
    expect(lirePlacesMax('-5')).toBeUndefined()
    expect(lirePlacesMax('2.5')).toBeUndefined()
    expect(lirePlacesMax('vingt')).toBeUndefined()
    expect(lirePlacesMax('1000000')).toBeUndefined()
  })
})

describe('places prises et erreur de la base', () => {
  it('compte les inscriptions en attente, ouvertes ou terminées', () => {
    expect(prendUnePlace('pending')).toBe(true)
    expect(prendUnePlace('active')).toBe(true)
    expect(prendUnePlace('completed')).toBe(true)
    expect(prendUnePlace('rejected')).toBe(false)
    expect(prendUnePlace(null)).toBe(false)
  })

  it('reconnaît le refus « formation complète » de la base', () => {
    expect(estErreurComplet('FORMATION_COMPLETE')).toBe(true)
    expect(estErreurComplet('P0001: FORMATION_COMPLETE')).toBe(true)
    expect(estErreurComplet('duplicate key')).toBe(false)
    expect(estErreurComplet(null)).toBe(false)
  })
})
