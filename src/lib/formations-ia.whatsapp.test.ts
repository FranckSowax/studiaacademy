import { describe, expect, it } from 'vitest'
import { afficherNumeroWhatsApp } from './formations-ia'

describe('afficherNumeroWhatsApp', () => {
  it('met en forme un numéro gabonais par paires après l’indicatif', () => {
    expect(afficherNumeroWhatsApp('24107670158')).toBe('+241 07 67 01 58')
    expect(afficherNumeroWhatsApp('+241 07 67 01 58')).toBe('+241 07 67 01 58')
  })

  it('rend un numéro d’un autre pays tel quel, précédé de +', () => {
    expect(afficherNumeroWhatsApp('33612345678')).toBe('+33612345678')
  })
})
