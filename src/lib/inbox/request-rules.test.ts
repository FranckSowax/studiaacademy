import { describe, expect, it } from 'vitest'
import {
  appendNote,
  isRequestStatus,
  makeRequestRef,
  MAX_NOTE_LENGTH,
  MAX_NOTES,
  MAX_REQUEST_PHOTOS,
  mergePhotos,
  parseNotes,
  parsePhotos,
  serializeNotes,
  statusChangeNote,
  type RequestNote,
  type RequestPhoto,
} from './request-rules'

const REF = (n: number) => n.toString(16).padStart(32, '0')
const UUID_A = '11111111-1111-4111-8111-111111111111'
const UUID_B = '22222222-2222-4222-8222-222222222222'

describe('référence de recherche', () => {
  it('W- suivi de 8 caractères hexadécimaux majuscules', () => {
    expect(makeRequestRef(new Uint8Array([0x1a, 0x2b, 0x3c, 0x4d]))).toBe('W-1A2B3C4D')
    expect(makeRequestRef(new Uint8Array([0, 1, 2, 3, 99]))).toBe('W-00010203')
  })
  it('refuse moins de 4 octets', () => {
    expect(() => makeRequestRef(new Uint8Array([1, 2]))).toThrow()
  })
})

describe('notes empilées', () => {
  const at = new Date('2026-10-31T14:00:00Z')
  const first = appendNote([], { authorId: 'u1', authorName: 'Awa', text: '  Cherche une formation Excel avancé  ', at })

  it('ajoute à la fin, signée et horodatée, sans modifier l’original', () => {
    const base: RequestNote[] = first ?? []
    const next = appendNote(base, { authorId: 'u2', authorName: 'Paul', text: 'Le client préfère le samedi', at })
    expect(base).toHaveLength(1)
    expect(next?.map((n) => n.authorName)).toEqual(['Awa', 'Paul'])
    expect(next?.[0].text).toBe('Cherche une formation Excel avancé')
    expect(next?.[1].at).toBe('2026-10-31T14:00:00.000Z')
  })
  it('texte vide → refus', () => {
    expect(appendNote([], { authorId: null, authorName: 'x', text: '   ', at })).toBeNull()
  })
  it('texte coupé à la longueur maximale', () => {
    expect(appendNote([], { authorId: null, authorName: 'x', text: 'a'.repeat(5000), at })?.[0].text).toHaveLength(MAX_NOTE_LENGTH)
  })
  it('plafond de notes atteint → refus', () => {
    const full = Array.from({ length: MAX_NOTES }, () => first?.[0] as RequestNote)
    expect(appendNote(full, { authorId: null, authorName: 'x', text: 'encore', at })).toBeNull()
  })
  it('aller-retour stockage, entrées abîmées ignorées', () => {
    const stored = [...serializeNotes(first ?? []), null, { text: '' }, { at: 'x' }, 'texte']
    expect(parseNotes(stored)).toEqual(first)
    expect(parseNotes('pas un tableau')).toEqual([])
  })
})

describe('photos', () => {
  const msg = (n: number): RequestPhoto => ({ kind: 'message', ref: REF(n) })

  it('dédoublonne et plafonne à 10, en comptant les refusées', () => {
    const existing = [msg(1), msg(2)]
    const added = [msg(2), ...Array.from({ length: 12 }, (_, i) => msg(i + 10))]
    const r = mergePhotos(existing, added)
    expect(r.photos).toHaveLength(MAX_REQUEST_PHOTOS)
    expect(r.added).toBe(8)
    expect(r.overflow).toBe(4)
    expect(r.photos.slice(0, 2)).toEqual(existing)
  })
  it('ne relit que des photos valides (pas de chemin arbitraire)', () => {
    const parsed = parsePhotos([
      { kind: 'message', ref: REF(1) },
      { kind: 'message', ref: '../secret' },
      { kind: 'upload', path: `requests/${UUID_A}/${UUID_B}.jpg` },
      { kind: 'upload', path: '../../wa_media_library/x.pdf' },
      { kind: 'upload', path: `requests/${UUID_A}/${UUID_B}.pdf` },
      42,
    ])
    expect(parsed).toEqual([
      { kind: 'message', ref: REF(1) },
      { kind: 'upload', path: `requests/${UUID_A}/${UUID_B}.jpg` },
    ])
  })
})

describe('statuts', () => {
  it('liste fermée', () => {
    expect(isRequestStatus('searching')).toBe(true)
    expect(isRequestStatus('en_cours')).toBe(false)
  })
  it('note de traçabilité lisible', () => {
    expect(statusChangeNote('todo', 'proposed')).toBe('Statut : À traiter → Proposition envoyée')
  })
})
