import { afterEach, describe, expect, it } from 'vitest'
import { cheminInterne, originePublique } from './origine'

function requete(headers: Record<string, string> = {}) {
  return new Request('https://localhost:8080/api/integrations/studia-live/acces?e=x', { headers })
}

describe('originePublique', () => {
  const sauvegarde = process.env.NEXT_PUBLIC_SITE_URL
  afterEach(() => {
    if (sauvegarde === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
    else process.env.NEXT_PUBLIC_SITE_URL = sauvegarde
  })

  it("préfère l'hôte public annoncé par le proxy à l'origine interne du conteneur", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    const r = requete({ 'x-forwarded-host': 'studia.academy', 'x-forwarded-proto': 'https' })
    expect(originePublique(r)).toBe('https://studia.academy')
  })

  it('utilise NEXT_PUBLIC_SITE_URL quand elle est configurée, sans / final', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.studia.academy/'
    const r = requete({ 'x-forwarded-host': 'autre.example' })
    expect(originePublique(r)).toBe('https://www.studia.academy')
  })

  it("retombe sur l'origine de la requête sans proxy ni configuration (dev local)", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(originePublique(requete())).toBe('https://localhost:8080')
  })

  it('ignore un en-tête x-forwarded-host malformé', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(originePublique(requete({ 'x-forwarded-host': 'evil.example/..@' }))).toBe(
      'https://localhost:8080'
    )
  })
})

describe('cheminInterne', () => {
  it('garde un chemin relatif au site', () => {
    expect(cheminInterne('/dashboard?x=1')).toBe('/dashboard?x=1')
  })
  it('refuse une autre origine ou une valeur absente', () => {
    expect(cheminInterne('https://evil.example')).toBe('/')
    expect(cheminInterne('//evil.example')).toBe('/')
    expect(cheminInterne(null, '/dashboard')).toBe('/dashboard')
  })
})
