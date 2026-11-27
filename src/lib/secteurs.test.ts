import { describe, expect, it } from 'vitest'
import { getSecteur, SECTEURS } from './secteurs'

describe('SECTEURS', () => {
  it('propose une seule formation par secteur, sur 11 secteurs aux slugs uniques', () => {
    expect(SECTEURS).toHaveLength(11)
    expect(new Set(SECTEURS.map((s) => s.slug)).size).toBe(11)
    for (const s of SECTEURS) expect(s.formation.titre.length).toBeGreaterThan(0)
  })

  it('bâtit chaque formation sur 5 cas réels du métier', () => {
    for (const s of SECTEURS) {
      expect(s.formation.cas, s.slug).toHaveLength(5)
      for (const c of s.formation.cas) {
        expect(c.titre.length, s.slug).toBeGreaterThan(10)
        expect(c.outil.length, s.slug).toBeGreaterThan(0)
      }
    }
  })

  it('favorise les outils gratuits : le premier outil est gratuit et ils sont majoritaires', () => {
    for (const s of SECTEURS) {
      const { outils } = s.formation
      const gratuits = outils.filter((o) => o.acces === 'gratuit')
      expect(outils[0].acces, s.slug).toBe('gratuit')
      expect(gratuits.length, s.slug).toBeGreaterThan(outils.length / 2)
    }
  })

  it('retrouve un secteur par son slug', () => {
    expect(getSecteur('secretariat')?.label).toBe('Secrétariat & Assistanat')
    expect(getSecteur('inconnu')).toBeUndefined()
  })
})
