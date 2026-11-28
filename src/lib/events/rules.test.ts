import { describe, expect, it } from 'vitest'
import {
  dateEvenement,
  etatReservation,
  isEventType,
  lienEvenement,
  occurrences,
  OCCURRENCES_MAX,
  peutDecider,
  placesRestantes,
  slidePourEvenement,
  typeEvenement,
} from './rules'

describe('types d’événements', () => {
  it('reconnaît les quatre types et rien d’autre', () => {
    expect(isEventType('masterclass')).toBe(true)
    expect(isEventType('presentation')).toBe(true)
    expect(isEventType('atelier')).toBe(false)
  })

  it('traite un événement sans type comme une formation', () => {
    expect(typeEvenement({})).toBe('formation')
    expect(typeEvenement({ type: 'inconnu' })).toBe('formation')
    expect(typeEvenement({ type: 'evenement' })).toBe('evenement')
  })
})

describe('occurrences', () => {
  const DEBUT = '2026-12-05T09:00:00.000Z'

  it('ne donne qu’une date sans récurrence, quel que soit le nombre demandé', () => {
    expect(occurrences(DEBUT, null, 'none', 6)).toEqual([{ debut: DEBUT, fin: null }])
  })

  it('répète chaque semaine en gardant l’heure et la durée', () => {
    const dates = occurrences(DEBUT, '2026-12-05T12:00:00.000Z', 'weekly', 3)
    expect(dates.map((d) => d.debut)).toEqual([
      '2026-12-05T09:00:00.000Z',
      '2026-12-12T09:00:00.000Z',
      '2026-12-19T09:00:00.000Z',
    ])
    expect(dates[2].fin).toBe('2026-12-19T12:00:00.000Z')
  })

  it('répète toutes les deux semaines', () => {
    expect(occurrences(DEBUT, null, 'biweekly', 2)[1].debut).toBe('2026-12-19T09:00:00.000Z')
  })

  it('répète chaque mois le même jour, en passant l’année', () => {
    expect(occurrences(DEBUT, null, 'monthly', 3).map((d) => d.debut)).toEqual([
      '2026-12-05T09:00:00.000Z',
      '2027-01-05T09:00:00.000Z',
      '2027-02-05T09:00:00.000Z',
    ])
  })

  it('ramène au dernier jour quand le mois est plus court', () => {
    const dates = occurrences('2027-01-31T09:00:00.000Z', null, 'monthly', 3).map((d) => d.debut)
    expect(dates).toEqual(['2027-01-31T09:00:00.000Z', '2027-02-28T09:00:00.000Z', '2027-03-31T09:00:00.000Z'])
  })

  it('borne le nombre de dates', () => {
    expect(occurrences(DEBUT, null, 'weekly', 500)).toHaveLength(OCCURRENCES_MAX)
    expect(occurrences(DEBUT, null, 'weekly', 0)).toHaveLength(1)
    expect(occurrences(DEBUT, null, 'weekly', Number.NaN)).toHaveLength(1)
  })

  it('ne renvoie rien pour une date invalide', () => {
    expect(occurrences('pas une date', null, 'weekly', 3)).toEqual([])
  })
})

describe('slide d’accueil', () => {
  const EVENEMENT = {
    id: 'abc',
    titre: 'L’IA pour recruter',
    type: 'masterclass',
    date_debut: '2026-12-05T09:00:00.000Z',
    lieu: 'Centre Studia',
    description: 'Deux heures   de pratique.',
    cover_image: 'https://exemple.test/a.jpg',
    prix_fcfa: 10000,
  }

  it('affiche la date à l’heure de Libreville', () => {
    expect(dateEvenement('2026-12-05T09:00:00.000Z')).toBe('samedi 5 décembre 2026 à 10 h 00')
  })

  it('annonce le type, la date, le lieu et renvoie vers la carte de l’événement', () => {
    const slide = slidePourEvenement(EVENEMENT)
    expect(slide.titre).toBe('L’IA pour recruter')
    expect(slide.sous_titre).toBe('Masterclass · samedi 5 décembre 2026 à 10 h 00 · Centre Studia')
    expect(slide.texte).toBe('Deux heures de pratique.')
    expect(slide.cta_label).toBe('S’inscrire')
    expect(slide.cta_href).toBe('/formations/presentiel#evenement-abc')
    expect(slide.cta_href).toBe(lienEvenement('abc'))
    expect(slide.image_url).toBe('https://exemple.test/a.jpg')
  })

  it('propose de réserver une place quand l’événement est gratuit', () => {
    expect(slidePourEvenement({ ...EVENEMENT, prix_fcfa: 0 }).cta_label).toBe('Réserver ma place')
  })

  it('respecte les longueurs acceptées par la table des slides', () => {
    const slide = slidePourEvenement({ ...EVENEMENT, titre: 'T'.repeat(300), description: 'd'.repeat(900), lieu: 'L'.repeat(300) })
    expect(slide.titre.length).toBeLessThanOrEqual(120)
    expect(slide.sous_titre.length).toBeLessThanOrEqual(160)
    expect(slide.texte?.length).toBeLessThanOrEqual(400)
    expect(slide.cta_label.length).toBeLessThanOrEqual(40)
  })
})

describe('réservations', () => {
  it('distingue un paiement à valider d’une simple réservation', () => {
    expect(etatReservation({ status: 'reserved', payment_method: 'airtel_money' })).toBe('a_valider')
    expect(etatReservation({ status: 'reserved', payment_method: null })).toBe('reservee')
    expect(etatReservation({ status: 'confirmed', payment_method: 'cash' })).toBe('confirmee')
    expect(etatReservation({ status: 'cancelled' })).toBe('annulee')
  })

  it('ne laisse décider que ce qui peut encore l’être', () => {
    expect(peutDecider('reserved', 'confirmed')).toBe(true)
    expect(peutDecider('reserved', 'cancelled')).toBe(true)
    expect(peutDecider('confirmed', 'cancelled')).toBe(true)
    expect(peutDecider('confirmed', 'confirmed')).toBe(false)
    expect(peutDecider('cancelled', 'confirmed')).toBe(false)
  })

  it('ne donne jamais un nombre de places négatif', () => {
    expect(placesRestantes({ places_total: 20, places_reservees: 5 })).toBe(15)
    expect(placesRestantes({ places_total: 20, places_reservees: 25 })).toBe(0)
  })
})
