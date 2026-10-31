import { describe, expect, it } from 'vitest'
import { resolveIdentity } from './identity'
import { MAX_PINS, pinsKey, sanitizePins, togglePin } from './settings'
import {
  formatPhone,
  formatRelativeTime,
  initials,
  normalizeSearch,
  orderWithPins,
  parseFilter,
} from './list'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'

describe('identité', () => {
  it('admin et super_admin ont accès', () => {
    expect(resolveIdentity({ id: A, role: 'admin', full_name: 'Awa Ndong' })).toEqual({ id: A, name: 'Awa Ndong', role: 'admin' })
    expect(resolveIdentity({ id: A, role: 'super_admin' })?.role).toBe('admin')
  })
  it('un collaborateur seulement avec inbox_access', () => {
    expect(resolveIdentity({ id: B, role: 'user', inbox_access: true, email: 'paul@x.ga' })).toEqual({ id: B, name: 'paul', role: 'collab' })
    expect(resolveIdentity({ id: B, role: 'user', inbox_access: false })).toBeNull()
    expect(resolveIdentity({ id: B, role: 'user' })).toBeNull()
    expect(resolveIdentity(null)).toBeNull()
  })
})

describe('épingles', () => {
  it('sont propres à chaque personne', () => {
    expect(pinsKey({ id: A, role: 'admin' })).not.toBe(pinsKey({ id: B, role: 'admin' }))
    expect(pinsKey({ id: A, role: 'collab' })).toBe(`inbox_pins:collab:${A}`)
  })
  it('ne gardent que des uuid, sans doublon', () => {
    expect(sanitizePins([A, 'pas-un-uuid', 42, A.toUpperCase(), B, null])).toEqual([A, B])
    expect(sanitizePins('n’importe quoi')).toEqual([])
  })
  it('sont bornées', () => {
    const many = Array.from({ length: MAX_PINS + 10 }, (_, i) => `${String(i).padStart(8, '0')}-1111-4111-8111-111111111111`)
    expect(sanitizePins(many)).toHaveLength(MAX_PINS)
  })
  it('épingler met en tête, désépingler retire', () => {
    expect(togglePin([A, B], C, true)).toEqual([C, A, B])
    expect(togglePin([A, B, C], B, false)).toEqual([A, C])
    expect(togglePin([A, B], B, true)).toEqual([B, A])
  })
})

describe('liste', () => {
  it('les épinglées passent devant en gardant l’ordre par date', () => {
    const rows = [{ id: A }, { id: B }, { id: C }]
    expect(orderWithPins(rows, [C, A]).map((r) => r.id)).toEqual([A, C, B])
  })
  it('filtre inconnu → À répondre', () => {
    expect(parseFilter('hot')).toBe('hot')
    expect(parseFilter('drop table')).toBe('to_reply')
    expect(parseFilter(null)).toBe('to_reply')
  })
  it('recherche : syntaxe retirée, chiffres extraits', () => {
    expect(normalizeSearch('  +241 07 67 01 58 ')).toEqual({ text: '+241 07 67 01 58', digits: '24107670158' })
    expect(normalizeSearch('a,b),or(id.eq.x')?.text).toBe('a b or id.eq.x')
    expect(normalizeSearch('Marie')?.digits).toBe('')
    expect(normalizeSearch('   ')).toBeNull()
  })
  it('numéro lisible', () => {
    expect(formatPhone('24107670158')).toBe('+241 07 67 01 58')
    expect(formatPhone('33612345678')).toBe('+33612345678')
    expect(formatPhone(null)).toBe('')
  })
  it('heure relative', () => {
    const now = new Date('2026-10-31T15:00:00Z')
    expect(formatRelativeTime('2026-10-31T14:59:40Z', now)).toBe("à l'instant")
    expect(formatRelativeTime('2026-10-31T14:48:00Z', now)).toBe('12 min')
    expect(formatRelativeTime('2026-10-30T15:00:00Z', now)).toBe('hier')
    expect(formatRelativeTime('2026-10-03T10:00:00Z', now)).toBe('3 oct.')
    expect(formatRelativeTime(null, now)).toBe('')
  })
  it('initiales', () => {
    expect(initials('Marie Nguema')).toBe('MN')
    expect(initials(null, '24107670158')).toBe('58')
  })
})
