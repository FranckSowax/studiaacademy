import { describe, expect, it } from 'vitest'
import {
  estSecteurValide,
  horsCollectionMetier,
  indexerParSecteur,
  type LigneFormationSecteur,
} from './secteur-link'

const ligne = (p: Partial<LigneFormationSecteur>): LigneFormationSecteur => ({
  slug: 'formation-x',
  titre: 'Formation X',
  prix_fcfa: 0,
  live_code: null,
  secteur_slug: null,
  ...p,
})

describe('estSecteurValide', () => {
  it('accepte un slug de secteur connu et refuse le reste', () => {
    expect(estSecteurValide('secretariat')).toBe(true)
    expect(estSecteurValide('dirigeant')).toBe(false)
    expect(estSecteurValide('')).toBe(false)
  })
})

describe('horsCollectionMetier', () => {
  const liste = [{ slug: 'pc-express' }, { slug: 'assistant-ab12' }, { slug: 'sbam' }]

  it('retire des listes les formations rattachées à un secteur', () => {
    const collection = indexerParSecteur([ligne({ slug: 'assistant-ab12', secteur_slug: 'secretariat' })])
    expect(horsCollectionMetier(liste, collection).map((f) => f.slug)).toEqual(['pc-express', 'sbam'])
  })

  it('laisse la liste intacte quand la collection est vide', () => {
    expect(horsCollectionMetier(liste, new Map())).toBe(liste)
  })
})

describe('indexerParSecteur', () => {
  it('range chaque formation sous son secteur, avec son code Studia Live', () => {
    const index = indexerParSecteur([
      ligne({ slug: 'assistant-ab12', titre: 'Assistant augmenté', secteur_slug: 'secretariat', live_code: 'ASSIST1' }),
      ligne({ slug: 'rh-cd34', secteur_slug: 'ressources-humaines', prix_fcfa: 25000 }),
    ])
    expect(index.size).toBe(2)
    expect(index.get('secretariat')).toEqual({
      slug: 'assistant-ab12',
      titre: 'Assistant augmenté',
      prix_fcfa: 0,
      live_code: 'ASSIST1',
    })
    expect(index.get('ressources-humaines')?.prix_fcfa).toBe(25000)
  })

  it('ignore les formations sans secteur ou au secteur inconnu', () => {
    const index = indexerParSecteur([ligne({}), ligne({ secteur_slug: 'inconnu' })])
    expect(index.size).toBe(0)
  })

  it('garde la première formation quand deux visent le même secteur', () => {
    const index = indexerParSecteur([
      ligne({ slug: 'recente', secteur_slug: 'sante' }),
      ligne({ slug: 'ancienne', secteur_slug: 'sante' }),
    ])
    expect(index.get('sante')?.slug).toBe('recente')
  })
})
