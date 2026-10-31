import { describe, expect, it } from 'vitest'
import { buildSiteRequestAck, isSiteRequestKind, MAX_DETAILS_LENGTH, siteSource } from './site-request-rules'

describe('buildSiteRequestAck', () => {
  it('salue par le prénom et reprend la formation', () => {
    const text = buildSiteRequestAck({ kind: 'formation', name: 'Marie Ndong', title: 'L’IA pour recruter' })
    expect(text.split('\n')[0]).toBe('Bonjour Marie 👋')
    expect(text).toContain('votre demande d’accès à la formation « L’IA pour recruter »')
    expect(text).toContain('Un conseiller vous répond ici même')
  })

  it('reste correct sans nom ni titre', () => {
    const text = buildSiteRequestAck({ kind: 'contact' })
    expect(text.split('\n')[0]).toBe('Bonjour 👋')
    expect(text).toContain('Nous avons bien reçu votre message sur le site Studia Academy.')
    expect(text).not.toContain('« »')
  })

  it('reprend le message du client, aplati et tronqué', () => {
    const long = `Bonjour\n\nje   voudrais ${'x'.repeat(MAX_DETAILS_LENGTH)}`
    const text = buildSiteRequestAck({ kind: 'contact', details: long })
    const line = text.split('\n').find((l) => l.startsWith('Votre message'))
    expect(line).toBeDefined()
    expect(line).toContain('Bonjour je voudrais')
    expect(line?.endsWith('… »')).toBe(true)
  })

  it('ignore un message vide', () => {
    expect(buildSiteRequestAck({ kind: 'devis', details: '   ' })).not.toContain('Votre message')
  })
})

describe('siteSource', () => {
  it('garde un chemin interne', () => {
    expect(siteSource({ kind: 'formation', title: ' Titre ', page: '/formations/x' })).toEqual({
      type: 'site',
      kind: 'formation',
      title: 'Titre',
      page: '/formations/x',
    })
  })

  it('rejette une URL externe ou protocol-relative', () => {
    expect(siteSource({ kind: 'contact', page: 'https://evil.example' }).page).toBeNull()
    expect(siteSource({ kind: 'contact', page: '//evil.example' }).page).toBeNull()
  })
})

describe('isSiteRequestKind', () => {
  it('reconnaît les types connus seulement', () => {
    expect(isSiteRequestKind('devis')).toBe(true)
    expect(isSiteRequestKind('autre')).toBe(false)
    expect(isSiteRequestKind(42)).toBe(false)
  })
})
