import { afterEach, describe, expect, it, vi } from 'vitest'
import { accesFormationAutorise, comptesFormationsGratuites, estFormationGratuite } from './free-access'

const GRATUITE = { prix_fcfa: 0 }
const PAYANTE = { prix_fcfa: 45000 }
const VARIABLE = 'FREE_FORMATIONS_ALLOWED_EMAILS'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('estFormationGratuite', () => {
  it('prix absent, nul ou à 0 : gratuite ; prix positif : payante', () => {
    expect(estFormationGratuite({})).toBe(true)
    expect(estFormationGratuite({ prix_fcfa: null })).toBe(true)
    expect(estFormationGratuite(GRATUITE)).toBe(true)
    expect(estFormationGratuite(PAYANTE)).toBe(false)
  })
})

describe('accesFormationAutorise — réglage par défaut', () => {
  it('formation gratuite : seul le compte de démonstration passe', () => {
    vi.stubEnv(VARIABLE, '')
    expect(accesFormationAutorise(GRATUITE, 'demo@studia-academy.com')).toBe(true)
    expect(accesFormationAutorise(GRATUITE, '  Demo@Studia-Academy.COM ')).toBe(true)
    expect(accesFormationAutorise(GRATUITE, 'awa.ndong@exemple.ga')).toBe(false)
  })

  it('compte sans adresse : refusé', () => {
    vi.stubEnv(VARIABLE, '')
    expect(accesFormationAutorise(GRATUITE, null)).toBe(false)
    expect(accesFormationAutorise(GRATUITE, undefined)).toBe(false)
    expect(accesFormationAutorise(GRATUITE, '')).toBe(false)
  })

  it('une adresse qui ressemble au compte autorisé ne passe pas', () => {
    vi.stubEnv(VARIABLE, '')
    expect(accesFormationAutorise(GRATUITE, 'demo@studia-academy.com.evil.example')).toBe(false)
    expect(accesFormationAutorise(GRATUITE, 'xdemo@studia-academy.com')).toBe(false)
    expect(accesFormationAutorise(GRATUITE, 'demo+1@studia-academy.com')).toBe(false)
  })

  it('formation payante : jamais bloquée par cette règle', () => {
    vi.stubEnv(VARIABLE, '')
    expect(accesFormationAutorise(PAYANTE, 'awa.ndong@exemple.ga')).toBe(true)
    expect(accesFormationAutorise(PAYANTE, null)).toBe(true)
  })
})

describe('accesFormationAutorise — variable FREE_FORMATIONS_ALLOWED_EMAILS', () => {
  it('liste : ces comptes uniquement, le compte de démonstration n’est plus implicite', () => {
    vi.stubEnv(VARIABLE, ' Awa.Ndong@Exemple.GA , equipe@studia-academy.com ')
    expect(accesFormationAutorise(GRATUITE, 'awa.ndong@exemple.ga')).toBe(true)
    expect(accesFormationAutorise(GRATUITE, 'equipe@studia-academy.com')).toBe(true)
    expect(accesFormationAutorise(GRATUITE, 'demo@studia-academy.com')).toBe(false)
  })

  it('« * » : ouvert à tous les comptes', () => {
    vi.stubEnv(VARIABLE, '*')
    expect(comptesFormationsGratuites()).toBeNull()
    expect(accesFormationAutorise(GRATUITE, 'awa.ndong@exemple.ga')).toBe(true)
  })

  it('variable mal remplie : retour au compte de démonstration, jamais ouvert à tous', () => {
    vi.stubEnv(VARIABLE, ' , ,')
    expect(accesFormationAutorise(GRATUITE, 'demo@studia-academy.com')).toBe(true)
    expect(accesFormationAutorise(GRATUITE, 'awa.ndong@exemple.ga')).toBe(false)
  })
})
