import { describe, expect, it } from 'vitest'
import { computeFiaLine, sumFiaTotals } from '@/lib/formations-ia-pricing'
import { buildCartMessages, finalizeUrl, type CartLineView } from './cart-messages'

const F1 = { prixFcfa: 95000, prixGroupeFcfa: 80750 }
const F4 = { prixFcfa: null, prixGroupeFcfa: null }

describe('prix unique (formations-ia-pricing)', () => {
  it('individuel : toujours une personne, tarif plein', () => {
    expect(computeFiaLine(F1, 'individuel', 5)).toEqual({ participants: 1, groupRate: false, unitPrice: 95000, total: 95000 })
  })
  it('entreprise de 2 : tarif plein', () => {
    expect(computeFiaLine(F1, 'entreprise', 2)).toMatchObject({ groupRate: false, unitPrice: 95000, total: 190000 })
  })
  it('entreprise de 3 : tarif groupe', () => {
    expect(computeFiaLine(F1, 'entreprise', '3')).toMatchObject({ groupRate: true, unitPrice: 80750, total: 242250 })
  })
  it('sur devis : prix inconnu (null), jamais 0', () => {
    expect(computeFiaLine(F4, 'individuel', 1)).toMatchObject({ unitPrice: null, total: null })
  })
  it('participants invalides → 1', () => {
    expect(computeFiaLine(F1, 'entreprise', 'abc').participants).toBe(1)
    expect(computeFiaLine(F1, 'entreprise', -4).participants).toBe(1)
  })
  it('total du panier inconnu dès qu’une ligne l’est', () => {
    expect(sumFiaTotals([{ total: 95000 }, { total: 145000 }])).toBe(240000)
    expect(sumFiaTotals([{ total: 95000 }, { total: null }])).toBeNull()
    expect(sumFiaTotals([])).toBeNull()
  })
})

describe('messages du panier', () => {
  const line = (over: Partial<CartLineView> = {}): CartLineView => ({
    code: 'F1',
    title: 'IA : Les Bases',
    slug: 'ia-les-bases',
    sessionDate: '2026-11-26',
    lieu: 'Libreville',
    participants: 1,
    groupRate: false,
    unitPrice: 95000,
    total: 95000,
    inscriptionCode: 'FIA-ABC123',
    ...over,
  })

  it('accueil, une fiche par formation, puis le récapitulatif', () => {
    const msgs = buildCartMessages({
      firstName: 'Marie',
      type: 'individuel',
      lines: [line(), line({ code: 'F2', title: 'IA & Communication', slug: 'ia-communication', total: 145000, unitPrice: 145000 })],
      total: 240000,
    })
    expect(msgs).toHaveLength(4)
    expect(msgs[0]).toContain('Marie')
    expect(msgs[1]).toContain('F1 — IA : Les Bases')
    expect(msgs[1]).toMatch(/\/formations-ia\/ia-les-bases/)
    expect(msgs[3]).toContain('Récapitulatif')
    expect(msgs[3]).toMatch(/Total : 240\s000 FCFA/)
  })

  it('un total inconnu s’affiche « sur devis », jamais « 0 »', () => {
    const msgs = buildCartMessages({
      firstName: 'Paul',
      type: 'individuel',
      lines: [line({ code: 'F4', unitPrice: null, total: null })],
      total: null,
    })
    expect(msgs[1]).toContain('sur devis')
    expect(msgs[2]).toContain('Total : sur devis')
    expect(msgs[2]).not.toMatch(/\b0 FCFA/)
  })

  it('le lien de finalisation ne contient ni numéro ni nom', () => {
    const url = finalizeUrl(line(), 'individuel') ?? ''
    expect(url).toContain('code=FIA-ABC123')
    expect(url).not.toMatch(/241\d{6,}|Marie|prenom|tel/i)
  })

  it('pas de lien de finalisation tant que l’inscription n’existe pas', () => {
    expect(finalizeUrl(line({ inscriptionCode: null }), 'individuel')).toBeNull()
  })

  it('mot d’accueil personnalisé', () => {
    expect(buildCartMessages({ firstName: 'X', type: 'individuel', lines: [line()], total: 95000, intro: 'Comme convenu :' })[0]).toBe(
      'Comme convenu :',
    )
  })
})
