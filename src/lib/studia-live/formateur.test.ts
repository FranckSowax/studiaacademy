import { describe, expect, it } from 'vitest'
import { peutEntrerCommeFormateur } from './formateur'

describe('peutEntrerCommeFormateur', () => {
  it('admin et super admin seulement', () => {
    expect(peutEntrerCommeFormateur('admin')).toBe(true)
    expect(peutEntrerCommeFormateur('super_admin')).toBe(true)
  })

  it('ni agent messagerie, ni compte sans rôle d’équipe (élève, professeur en libre-service)', () => {
    expect(peutEntrerCommeFormateur('agent')).toBe(false)
    expect(peutEntrerCommeFormateur(null)).toBe(false)
  })
})
