import { describe, expect, it } from 'vitest'
import {
  calculerTableauDeBord,
  estVide,
  evolution,
  isPeriode,
  origineConversation,
  tranches,
  type DonneesBrutes,
} from './dashboard-metrics'
import { donneesExemple } from './dashboard-demo'

const MAINTENANT = new Date('2026-11-28T12:00:00.000Z')
const VIDE: DonneesBrutes = { comptes: [], inscriptions: [], reservations: [], formations: [], evenements: [], conversations: [] }

describe('tranches', () => {
  it('découpe 30 jours en 30 tranches d’un jour, la dernière contenant aujourd’hui', () => {
    const t = tranches('30j', MAINTENANT)
    expect(t).toHaveLength(30)
    expect(new Date(t[29].debut).toISOString()).toBe('2026-11-28T00:00:00.000Z')
    expect(new Date(t[0].debut).toISOString()).toBe('2026-10-30T00:00:00.000Z')
    expect(t[29].fin - t[29].debut).toBe(24 * 3600 * 1000)
  })

  it('découpe 90 jours en 13 semaines contiguës', () => {
    const t = tranches('90j', MAINTENANT)
    expect(t).toHaveLength(13)
    expect(t.every((c, i) => i === 0 || c.debut === t[i - 1].fin)).toBe(true)
    expect(new Date(t[12].fin).toISOString()).toBe('2026-11-29T00:00:00.000Z')
  })

  it('découpe 12 mois en mois calendaires, en passant l’année', () => {
    const t = tranches('12m', MAINTENANT)
    expect(t).toHaveLength(12)
    expect(new Date(t[0].debut).toISOString()).toBe('2025-12-01T00:00:00.000Z')
    expect(new Date(t[11].debut).toISOString()).toBe('2026-11-01T00:00:00.000Z')
    expect(t[11].label).toBe('nov')
  })
})

describe('evolution', () => {
  it('donne le pourcentage d’évolution, ou rien sans période précédente', () => {
    expect(evolution({ valeur: 12, precedent: 8 })).toBe(50)
    expect(evolution({ valeur: 6, precedent: 8 })).toBe(-25)
    expect(evolution({ valeur: 4, precedent: 0 })).toBeNull()
  })
})

describe('origineConversation', () => {
  it('nomme la page du site, la publicité ou le message direct', () => {
    expect(origineConversation({ created_at: null, source: { type: 'site', kind: 'devis' } })).toBe('Demande de devis')
    expect(origineConversation({ created_at: null, source: { type: 'site', kind: 'inconnu' } })).toBe('Site (autre page)')
    expect(origineConversation({ created_at: null, source: { type: 'ad' } })).toBe('Publicité')
    expect(origineConversation({ created_at: null, source: null })).toBe('Message direct')
  })
})

describe('calculerTableauDeBord', () => {
  const DONNEES: DonneesBrutes = {
    comptes: [
      { created_at: '2026-11-27T10:00:00Z' },
      { created_at: '2026-11-20T10:00:00Z' },
      { created_at: '2026-10-15T10:00:00Z' }, // période précédente
      { created_at: null },
    ],
    formations: [{ id: 'f1', titre: 'Excel' }, { id: 'f2', titre: 'IA' }],
    inscriptions: [
      // validée et payée dans la période
      { formation_id: 'f1', status: 'active', requested_at: '2026-11-21T09:00:00Z', granted_at: '2026-11-22T09:00:00Z', payment_method: 'airtel_money', payment_amount_fcfa: 25000 },
      // en attente de validation
      { formation_id: 'f1', status: 'pending', requested_at: '2026-11-26T09:00:00Z', granted_at: null, payment_method: 'cash', payment_amount_fcfa: 25000 },
      // gratuite : compte comme inscription, pas comme revenu
      { formation_id: 'f2', status: 'active', requested_at: '2026-11-25T09:00:00Z', granted_at: '2026-11-25T09:00:00Z' },
      // demandée avant, validée dans la période : revenu de la période, demande de la précédente
      { formation_id: 'f2', status: 'active', requested_at: '2026-10-20T09:00:00Z', granted_at: '2026-11-05T09:00:00Z', payment_method: 'cash', payment_amount_fcfa: 10000 },
      // refusée : jamais un revenu
      { formation_id: 'f2', status: 'rejected', requested_at: '2026-11-24T09:00:00Z', granted_at: null, payment_method: 'airtel_money', payment_amount_fcfa: 10000 },
    ],
    reservations: [
      { session_id: 'e1', status: 'confirmed', created_at: '2026-11-23T09:00:00Z', decided_at: '2026-11-24T09:00:00Z', payment_method: 'cash', payment_amount_fcfa: 15000 },
      { session_id: 'e1', status: 'reserved', created_at: '2026-11-27T09:00:00Z', payment_method: 'airtel_money', payment_amount_fcfa: 15000 },
      { session_id: 'e1', status: 'cancelled', created_at: '2026-11-27T10:00:00Z' },
    ],
    evenements: [
      { id: 'e1', titre: 'Masterclass', date_debut: '2026-12-05T09:00:00Z', places_total: 20, places_reservees: 12 },
      { id: 'e0', titre: 'Passé', date_debut: '2026-11-01T09:00:00Z', places_total: 20, places_reservees: 20 },
    ],
    conversations: [
      { created_at: '2026-11-27T09:00:00Z', source: { type: 'site', kind: 'presentiel' } },
      { created_at: '2026-11-26T09:00:00Z', source: { type: 'direct' } },
      { created_at: '2026-11-25T09:00:00Z', source: { type: 'direct' } },
    ],
  }
  const t = calculerTableauDeBord(DONNEES, '30j', MAINTENANT)

  it('compte les revenus validés, à la date de validation', () => {
    expect(t.indicateurs.revenus).toEqual({ valeur: 50000, precedent: 0 })
    expect(t.serie.reduce((s, p) => s + p.airtel, 0)).toBe(25000)
    expect(t.serie.reduce((s, p) => s + p.especes, 0)).toBe(25000)
  })

  it('additionne les paiements en attente, formations et événements confondus', () => {
    expect(t.aValider).toEqual({ nombre: 2, montant: 40000 })
  })

  it('compare chaque indicateur à la période précédente', () => {
    expect(t.indicateurs.comptes).toEqual({ valeur: 2, precedent: 1 })
    expect(t.indicateurs.inscriptions).toEqual({ valeur: 4, precedent: 1 })
    expect(t.indicateurs.reservations).toEqual({ valeur: 2, precedent: 0 })
    expect(t.indicateurs.contacts).toEqual({ valeur: 3, precedent: 0 })
  })

  it('construit l’entonnoir de la période', () => {
    expect(t.entonnoir.map((l) => l.valeur)).toEqual([2, 7, 3])
  })

  it('classe les formations les plus demandées', () => {
    expect(t.topFormations).toEqual([{ label: 'Excel', valeur: 2 }, { label: 'IA', valeur: 2 }])
  })

  it('ne garde que les événements à venir pour le remplissage', () => {
    expect(t.remplissage).toHaveLength(1)
    expect(t.remplissage[0]).toMatchObject({ label: 'Masterclass', valeur: 12, max: 20 })
  })

  it('répartit les contacts par origine, du plus fréquent au moins fréquent', () => {
    expect(t.origines).toEqual([
      { label: 'Message direct', valeur: 2 },
      { label: 'Réservation en présentiel', valeur: 1 },
    ])
  })

  it('garde une somme de série égale aux indicateurs', () => {
    expect(t.serie.reduce((s, p) => s + p.comptes, 0)).toBe(t.indicateurs.comptes.valeur)
    expect(t.serie.reduce((s, p) => s + p.enLigne, 0)).toBe(t.indicateurs.inscriptions.valeur)
    expect(t.serie.reduce((s, p) => s + p.presentiel, 0)).toBe(t.indicateurs.reservations.valeur)
  })

  it('signale une période sans activité', () => {
    expect(estVide(calculerTableauDeBord(VIDE, '30j', MAINTENANT))).toBe(true)
    expect(estVide(t)).toBe(false)
  })
})

describe('données d’exemple', () => {
  it('sont reproductibles et remplissent tous les graphiques', () => {
    const a = calculerTableauDeBord(donneesExemple(MAINTENANT), '90j', MAINTENANT)
    const b = calculerTableauDeBord(donneesExemple(MAINTENANT), '90j', MAINTENANT)
    expect(a).toEqual(b)
    expect(a.indicateurs.revenus.valeur).toBeGreaterThan(0)
    expect(a.topFormations.length).toBeGreaterThan(2)
    expect(a.remplissage.length).toBeGreaterThan(2)
    expect(a.origines.length).toBeGreaterThan(2)
  })

  it('n’acceptent que les périodes connues', () => {
    expect(isPeriode('90j')).toBe(true)
    expect(isPeriode('7j')).toBe(false)
  })
})
