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

  it('commence par un outil gratuit vérifié dans chaque formation', () => {
    for (const s of SECTEURS) expect(s.formation.outils[0].acces, s.slug).toBe('gratuit')
  })

  it("n'annonce un accès gratuit ou payant qu'avec sa source officielle et sa date de vérification", () => {
    for (const s of SECTEURS)
      for (const o of s.formation.outils) {
        if (o.acces === 'a_verifier') continue
        expect(o.source, `${s.slug} / ${o.nom}`).toMatch(/^https:\/\//)
        expect(o.verifie_le, `${s.slug} / ${o.nom}`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
  })

  it('retrouve un secteur par son slug', () => {
    expect(getSecteur('secretariat')?.label).toBe('Secrétariat & Assistanat')
    expect(getSecteur('inconnu')).toBeUndefined()
  })
})
