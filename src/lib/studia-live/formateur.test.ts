import { describe, expect, it } from 'vitest'
import { peutEntrerCommeFormateur } from './formateur'

const fiche = (role: string, is_active = true) => ({ user_id: 'u1', role, is_active })

describe('peutEntrerCommeFormateur', () => {
  it('admin et super admin, avec ou sans fiche', () => {
    expect(peutEntrerCommeFormateur('admin')).toBe(true)
    expect(peutEntrerCommeFormateur('super_admin', null)).toBe(true)
    expect(peutEntrerCommeFormateur('admin', fiche('admin'))).toBe(true)
  })

  it('fiche « formateur » active, sans rôle d’équipe', () => {
    expect(peutEntrerCommeFormateur(null, fiche('formateur'))).toBe(true)
  })

  it('ni agent messagerie, ni compte sans fiche (élève, professeur en libre-service)', () => {
    expect(peutEntrerCommeFormateur('agent', fiche('agent'))).toBe(false)
    expect(peutEntrerCommeFormateur('agent')).toBe(false)
    expect(peutEntrerCommeFormateur(null)).toBe(false)
    expect(peutEntrerCommeFormateur(null, null)).toBe(false)
  })

  it('une fiche désactivée coupe tout, même pour un admin', () => {
    expect(peutEntrerCommeFormateur(null, fiche('formateur', false))).toBe(false)
    expect(peutEntrerCommeFormateur('admin', fiche('admin', false))).toBe(false)
    expect(peutEntrerCommeFormateur('super_admin', fiche('formateur', false))).toBe(false)
  })
})

describe('estFicheFormateurActive', () => {
  it('vrai seulement pour une fiche « formateur » active', async () => {
    const { estFicheFormateurActive } = await import('./formateur')
    expect(estFicheFormateurActive(fiche('formateur'))).toBe(true)
    expect(estFicheFormateurActive(fiche('formateur', false))).toBe(false)
    expect(estFicheFormateurActive(fiche('admin'))).toBe(false)
    expect(estFicheFormateurActive(fiche('agent'))).toBe(false)
    expect(estFicheFormateurActive(null)).toBe(false)
    expect(estFicheFormateurActive(undefined)).toBe(false)
  })
})
