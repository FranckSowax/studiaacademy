import { describe, expect, it } from 'vitest'
import { fillTemplate, MAX_QUICK_REPLIES, sanitizeQuickReplies } from './quick-replies'
import { mediaKindForMime, sniffMime } from './library'

let n = 0
const makeId = () => `id-${++n}`

describe('phrases rapides', () => {
  it('écarte les entrées vides ou invalides et crée les identifiants manquants', () => {
    const out = sanitizeQuickReplies(
      [
        { title: 'Tarifs', text: 'Nos tarifs : …' },
        { title: '', text: 'sans titre' },
        { title: 'Sans texte', text: '   ' },
        'pas un objet',
        { id: 'garde-moi', title: 'Horaires', text: 'Ouvert du lundi au vendredi' },
      ],
      makeId,
    )
    expect(out.map((r) => r.title)).toEqual(['Tarifs', 'Horaires'])
    expect(out[1].id).toBe('garde-moi')
    expect(out[0].id).toMatch(/^id-/)
  })

  it('est bornée et coupe les textes trop longs', () => {
    const many = Array.from({ length: MAX_QUICK_REPLIES + 5 }, (_, i) => ({ title: `T${i}`, text: 'x'.repeat(2000) }))
    const out = sanitizeQuickReplies(many, makeId)
    expect(out).toHaveLength(MAX_QUICK_REPLIES)
    expect(out[0].text).toHaveLength(1000)
  })

  it('refuse des identifiants en double', () => {
    const out = sanitizeQuickReplies([{ id: 'a', title: '1', text: '1' }, { id: 'a', title: '2', text: '2' }], makeId)
    expect(new Set(out.map((r) => r.id)).size).toBe(2)
  })

  it('remplit {nom} {prenom} {numero}', () => {
    expect(
      fillTemplate('Bonjour {prenom} ({nom}), on vous rappelle au {numero}.', {
        name: 'Marie Nguema',
        phone: '+241 07 67 01 58',
      }),
    ).toBe('Bonjour Marie (Marie Nguema), on vous rappelle au +241 07 67 01 58.')
  })

  it('laisse visible une variable inconnue plutôt qu’un blanc', () => {
    expect(fillTemplate('Bonjour {prenom} !', { name: null, phone: null })).toBe('Bonjour {prenom} !')
  })
})

describe('médiathèque', () => {
  const bytes = (...b: number[]) => new Uint8Array(b)
  const ascii = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)))

  it('reconnaît le type réel d’après le contenu', () => {
    expect(sniffMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(sniffMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png')
    expect(sniffMime(ascii('RIFF....WEBPVP8 '))).toBe('image/webp')
    expect(sniffMime(ascii('....ftypisom....'))).toBe('video/mp4')
    expect(sniffMime(ascii('%PDF-1.7'))).toBe('application/pdf')
  })

  it('refuse un fichier déguisé (HTML renommé en .jpg, SVG)', () => {
    expect(sniffMime(ascii('<html><script>alert(1)</script>'))).toBeNull()
    expect(sniffMime(ascii('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull()
  })

  it('choisit le bon envoi WhatsApp', () => {
    expect(mediaKindForMime('image/png')).toBe('image')
    expect(mediaKindForMime('video/mp4')).toBe('video')
    expect(mediaKindForMime('application/pdf')).toBe('document')
  })
})
