import { describe, expect, it } from 'vitest'
import {
  compterFormations,
  DEFAULT_FILTERS,
  filtrerFormations,
  filtresActifs,
  listerCategories,
  normaliser,
  trierFormations,
} from './admin-filter'

const base = { sous_titre: null, formateur_nom: null, secteur_slug: null }
const FORMATIONS = [
  { ...base, id: 'a', titre: 'Excel pour débutants', categorie: 'Bureautique', prix_fcfa: 15000, is_published: true, created_at: '2026-11-01T10:00:00Z' },
  { ...base, id: 'b', titre: 'Découvrir l’IA', categorie: 'IA', prix_fcfa: 0, is_published: true, created_at: '2026-11-20T10:00:00Z' },
  { ...base, id: 'c', titre: 'Éducation numérique', categorie: 'IA', prix_fcfa: 25000, is_published: false, created_at: '2026-11-10T10:00:00Z', formateur_nom: 'Awa Ndong' },
  { ...base, id: 'd', titre: 'Formation métier RH', categorie: null, prix_fcfa: 0, is_published: false, created_at: '2026-11-25T10:00:00Z', secteur_slug: 'ressources-humaines' },
]
const ids = (liste: { id: string }[]) => liste.map((f) => f.id)

describe('filtrerFormations', () => {
  it('rend tout sans filtre', () => {
    expect(filtrerFormations(FORMATIONS, DEFAULT_FILTERS)).toHaveLength(4)
  })

  it('filtre par statut de publication', () => {
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, status: 'published' }))).toEqual(['a', 'b'])
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, status: 'draft' }))).toEqual(['c', 'd'])
  })

  it('sépare la collection Upgrade Métier du catalogue', () => {
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, collection: 'metier' }))).toEqual(['d'])
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, collection: 'catalogue' }))).toEqual(['a', 'b', 'c'])
  })

  it('filtre par prix et par catégorie', () => {
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, price: 'free' }))).toEqual(['b', 'd'])
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, price: 'paid' }))).toEqual(['a', 'c'])
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, categorie: 'IA' }))).toEqual(['b', 'c'])
  })

  it('cherche sans tenir compte des accents ni de la casse, y compris sur le formateur', () => {
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, q: 'EDUC' }))).toEqual(['c'])
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, q: 'ndong' }))).toEqual(['c'])
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, q: 'bureautique' }))).toEqual(['a'])
  })

  it('cumule les filtres', () => {
    expect(ids(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, categorie: 'IA', status: 'draft', price: 'paid' }))).toEqual(['c'])
    expect(filtrerFormations(FORMATIONS, { ...DEFAULT_FILTERS, categorie: 'IA', q: 'excel' })).toEqual([])
  })
})

describe('trierFormations', () => {
  it('trie par date, titre, prix et nombre d’inscrits sans modifier l’entrée', () => {
    expect(ids(trierFormations(FORMATIONS, 'recent'))).toEqual(['d', 'b', 'c', 'a'])
    expect(ids(trierFormations(FORMATIONS, 'titre'))).toEqual(['b', 'c', 'a', 'd'])
    expect(ids(trierFormations(FORMATIONS, 'prix')).slice(0, 2)).toEqual(['c', 'a'])
    expect(ids(trierFormations(FORMATIONS, 'inscrits', { a: 3, c: 9 })).slice(0, 2)).toEqual(['c', 'a'])
    expect(ids(FORMATIONS)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('aides de la liste', () => {
  it('liste les catégories sans doublon ni vide', () => {
    expect(listerCategories(FORMATIONS)).toEqual(['Bureautique', 'IA'])
  })

  it('compte les formations', () => {
    expect(compterFormations(FORMATIONS)).toEqual({ total: 4, publiees: 2, brouillons: 2, metier: 1 })
  })

  it('détecte un filtre actif', () => {
    expect(filtresActifs(DEFAULT_FILTERS)).toBe(false)
    expect(filtresActifs({ ...DEFAULT_FILTERS, q: 'x' })).toBe(true)
    expect(filtresActifs({ ...DEFAULT_FILTERS, price: 'paid' })).toBe(true)
  })

  it('normalise accents et casse', () => {
    expect(normaliser('  Éducation Numérique ')).toBe('education numerique')
  })
})
