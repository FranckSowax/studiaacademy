import { describe, expect, it } from 'vitest'
import { PRENOM_MAX, prenomEleve } from './prenom'

describe('prenomEleve', () => {
  it('prénom présent sur le profil : envoyé tel quel', () => {
    expect(
      prenomEleve({
        profil: { prenom: 'Marie-Claire', full_name: 'Autre Nom' },
        metadonnees: { first_name: 'Autre' },
        email: 'mc@exemple.ga',
      })
    ).toBe('Marie-Claire')
  })

  it.each([['prenom'], ['first_name'], ['given_name']])(
    'prénom absent du profil mais présent dans les métadonnées (%s) : celui des métadonnées',
    (cle) => {
      expect(
        prenomEleve({
          profil: { full_name: 'Ndong Awa' },
          metadonnees: { [cle]: 'Awa', full_name: 'Ndong Awa' },
          email: 'x@exemple.ga',
        })
      ).toBe('Awa')
    }
  )

  it('seul le nom complet existe : son premier mot (profil, puis métadonnées)', () => {
    expect(prenomEleve({ profil: { full_name: 'Awa Ndong Obame' }, email: 'x@exemple.ga' })).toBe('Awa')
    expect(
      prenomEleve({ profil: { full_name: '' }, metadonnees: { name: 'Éloïse Mba' }, email: 'x@exemple.ga' })
    ).toBe('Éloïse')
  })

  it('rien n’existe : partie de l’e-mail avant le @, première lettre en majuscule', () => {
    expect(prenomEleve({ profil: null, metadonnees: {}, email: 'awa.ndong@exemple.ga' })).toBe('Awa.ndong')
    expect(prenomEleve({ profil: { full_name: null }, metadonnees: null, email: 'demo@studia-academy.com' })).toBe('Demo')
  })

  it('valeur entourée d’espaces : nettoyée', () => {
    expect(prenomEleve({ profil: { prenom: '   Awa  ' }, email: 'x@exemple.ga' })).toBe('Awa')
    expect(prenomEleve({ profil: { full_name: '  \t Awa   Ndong ' }, email: 'x@exemple.ga' })).toBe('Awa')
    expect(prenomEleve({ profil: { prenom: 'Jean   Pierre' }, email: 'x@exemple.ga' })).toBe('Jean Pierre')
  })

  it('prénom de plus de 60 caractères : coupé à 60, sans espace final ni caractère cassé', () => {
    const long = prenomEleve({ profil: { prenom: 'A'.repeat(59) + ' Bcd' }, email: 'x@exemple.ga' })
    expect(long).toBe('A'.repeat(59))
    // Lettres hors du plan de base (2 unités UTF-16 chacune) : 60 caractères entiers
    const astral = prenomEleve({ profil: { prenom: '𝒜'.repeat(80) }, email: 'x@exemple.ga' })
    expect(Array.from(astral)).toHaveLength(PRENOM_MAX)
    expect(astral).toBe('𝒜'.repeat(60))
    const email = prenomEleve({ email: `${'b'.repeat(64)}@exemple.ga` })
    expect(email).toBe('B' + 'b'.repeat(59))
  })

  it.each([
    ['Utilisateur Démo', 'demo@studia-academy.com', 'Demo'],
    ['utilisateur', 'paul@exemple.ga', 'Paul'],
    ['UTILISATRICE', 'awa@exemple.ga', 'Awa'],
    ['User 4821', 'kevin@exemple.ga', 'Kevin'],
    ['Élève', 'sena@exemple.ga', 'Sena'],
  ])('« %s » est une valeur générique : jamais envoyée, repli sur l’e-mail', (nom, email, attendu) => {
    for (const sources of [
      { profil: { full_name: nom }, metadonnees: { full_name: nom } },
      { profil: { prenom: nom.split(' ')[0] }, metadonnees: { first_name: nom.split(' ')[0] } },
    ]) {
      const prenom = prenomEleve({ ...sources, email })
      expect(prenom).toBe(attendu)
      expect(prenom.toLowerCase()).not.toMatch(/^utilisat|^user$/)
    }
  })

  it('profil contenant « Utilisateur » et e-mail demo@exemple.com : « Demo »', () => {
    expect(prenomEleve({ profil: { full_name: 'Utilisateur' }, email: 'demo@exemple.com' })).toBe('Demo')
    expect(
      prenomEleve({
        profil: { full_name: 'Utilisateur' },
        metadonnees: { full_name: 'Utilisateur' },
        email: 'demo@exemple.com',
      })
    ).toBe('Demo')
  })

  it.each([
    ['Utilisateur'],
    ['utilisateur'],
    ['UTILISATEUR'],
    ['  Utilisateur  '],
    ['Utilisateur\u00a0Démo'],
    ['\u200bUtilisateur'],
    ['Utilisateur1'],
    ['Utilisateur.'],
    ['user_42'],
    ['User'],
    ['Élève'],
    ['ELEVE'],
    [''],
    ['   '],
    ['\u200b'],
    ['---'],
  ])('valeur générique ou vide %j : traitée comme absente, quelle que soit la source', (valeur) => {
    for (const sources of [
      { profil: { prenom: valeur } },
      { profil: { full_name: valeur } },
      { metadonnees: { first_name: valeur } },
      { metadonnees: { full_name: valeur, name: valeur } },
      { profil: { prenom: valeur, full_name: valeur }, metadonnees: { given_name: valeur, name: valeur } },
    ]) {
      expect(prenomEleve({ ...sources, email: 'demo@exemple.com' })).toBe('Demo')
    }
  })

  it('un prénom en alphabet non latin est gardé', () => {
    expect(prenomEleve({ profil: { full_name: 'محمد علي' }, email: 'x@exemple.ga' })).toBe('محمد')
    expect(prenomEleve({ profil: { prenom: '小明' }, email: 'x@exemple.ga' })).toBe('小明')
  })

  it('un prénom qui commence comme un mot générique reste un prénom', () => {
    expect(prenomEleve({ profil: { full_name: 'Userine Mba' }, email: 'x@exemple.ga' })).toBe('Userine')
    expect(prenomEleve({ profil: { full_name: 'Eleveline Obame' }, email: 'x@exemple.ga' })).toBe('Eleveline')
  })

  it('un vrai prénom derrière une source générique est quand même trouvé', () => {
    expect(
      prenomEleve({
        profil: { full_name: 'Utilisateur' },
        metadonnees: { full_name: 'Franck Migan' },
        email: 'f@exemple.ga',
      })
    ).toBe('Franck')
  })

  it('jamais vide, jamais plus de 60 caractères, même sans aucune source', () => {
    for (const sources of [{}, { email: '' }, { email: '@exemple.ga' }, { profil: { full_name: '   ' }, email: null }]) {
      const prenom = prenomEleve(sources)
      expect(prenom.length).toBeGreaterThan(0)
      expect(prenom.length).toBeLessThanOrEqual(PRENOM_MAX)
      expect(prenom).not.toBe('Utilisateur')
    }
  })

  it('ignore les valeurs qui ne sont pas du texte', () => {
    expect(prenomEleve({ profil: { prenom: 42, full_name: { a: 1 } }, email: 'awa@exemple.ga' })).toBe('Awa')
  })
})
