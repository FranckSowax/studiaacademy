import { describe, expect, it } from 'vitest'
import { calculerDevis, calculerLigne, FORMULES, getPrestation, nombreDeGroupes, PRESTATIONS, prixSeance } from './tarifs'

/** Tests calés sur les chiffres de la « Grille tarifaire Studia Academy » du 28 novembre 2026. */

const total = (saisie: Parameters<typeof calculerDevis>[0]) => calculerDevis(saisie).total_ht
const formule = (code: string, participants: number) => FORMULES.find((f) => f.code === code)!.lignes(participants)

describe('unités et règles de base', () => {
  it('R1 : séance = durée × 225 000, arrondie aux 25 000 supérieurs', () => {
    expect(prixSeance(2)).toBe(450_000)
    expect(prixSeance(3)).toBe(675_000)
    expect(prixSeance(3.5)).toBe(800_000)
    expect(prixSeance(6)).toBe(1_350_000)
  })

  it('R2 : aucune séance sur mesure sous 450 000', () => {
    expect(prixSeance(1)).toBe(450_000)
    expect(prixSeance(1.5)).toBe(450_000)
    expect(prixSeance(0.5)).toBe(450_000)
  })

  it('R3 : nombre de groupes = participants ÷ taille maximale, arrondi au supérieur', () => {
    expect(nombreDeGroupes(38, 40)).toBe(1)
    expect(nombreDeGroupes(40, 40)).toBe(1)
    expect(nombreDeGroupes(41, 40)).toBe(2)
    expect(nombreDeGroupes(45, 15)).toBe(3)
    expect(nombreDeGroupes(0, 15)).toBe(1)
  })

  it('la grille porte les prix et tailles du chapitre 4', () => {
    const grille = Object.fromEntries(PRESTATIONS.map((p) => [p.code, [p.prix, p.tailleMax]]))
    expect(grille).toEqual({
      preparation: [500_000, null], atelier_ia: [450_000, 40], atelier_metier: [675_000, 20], demi_journee: [800_000, 20],
      journee: [1_350_000, 15], session_direction: [450_000, null], journee_referents: [1_350_000, 6], clinique: [175_000, null],
      mesure_impact: [250_000, null], pc_express_1h: [250_000, 15], pc_soiree: [450_000, 15], pc_soiree_suivi: [600_000, 15],
      pc_clavier: [350_000, 15],
    })
  })
})

describe('chapitre 5 : compter les groupes', () => {
  it.each([
    [38, 'atelier_ia', 1, 450_000, 11_842],
    [60, 'atelier_ia', 2, 765_000, 12_750],
    [38, 'demi_journee', 2, 1_360_000, 35_789],
    [45, 'journee', 3, 3_240_000, 72_000],
    [45, 'pc_soiree', 3, 1_215_000, 27_000],
  ])('%i participants en %s : %i groupe(s), %i HT, %i par personne', (participants, code, groupes, attendu, parPersonne) => {
    expect(calculerLigne({ code, participants }).groupes).toBe(groupes)
    const devis = calculerDevis({ participants, lignes: [{ code, participants }] })
    expect(devis.total_ht).toBe(attendu)
    expect(devis.par_personne).toBe(parPersonne)
  })

  it('détaille le premier groupe plein tarif et les suivants remisés', () => {
    expect(calculerLigne({ code: 'atelier_ia', participants: 60 }).lignes).toEqual([
      { libelle: 'Atelier d’initiation IA (2 h)', detail: 'Groupe 1, 40 participants au plus par groupe', quantite: 1, prix_unitaire: 450_000, montant: 450_000 },
      { libelle: 'Atelier d’initiation IA (2 h)', detail: 'Groupe 2, contenu identique (−30 %)', quantite: 1, prix_unitaire: 315_000, montant: 315_000 },
    ])
    expect(calculerLigne({ code: 'pc_soiree', participants: 45 }).lignes[1]).toMatchObject({
      detail: 'Groupes 2 à 3 (−15 %)', quantite: 2, prix_unitaire: 382_500, montant: 765_000,
    })
  })
})

describe('chapitre 6 : formules', () => {
  it.each([
    ['decouverte', 38, 950_000, 25_000],
    ['recommandee', 38, 1_375_000, 36_184],
    ['montee', 15, 3_625_000, 241_667],
    ['pc_express', 15, 450_000, 30_000],
    ['pc_express', 45, 1_215_000, 27_000],
  ])('%s à %i : %i HT, %i par personne', (code, participants, attendu, parPersonne) => {
    const devis = calculerDevis({ participants, lignes: formule(code, participants) })
    expect(devis.total_ht).toBe(attendu)
    expect(devis.par_personne).toBe(parPersonne)
  })
})

describe('chapitre 7 : exemples de devis', () => {
  it('A. banque, 25 cadres : 1 375 000, soit 55 000 par personne', () => {
    const devis = calculerDevis({ participants: 25, lignes: formule('recommandee', 25) })
    expect(devis.total_ht).toBe(1_375_000)
    expect(devis.par_personne).toBe(55_000)
  })

  it('B. industriel, 60 techniciens en demi-journées : 3 195 000, soit 53 250 par personne', () => {
    const devis = calculerDevis({
      participants: 60,
      lignes: [{ code: 'preparation' }, { code: 'demi_journee', participants: 60 }, { code: 'clinique', quantite: 3 }, { code: 'mesure_impact' }],
    })
    expect(devis.lignes.map((l) => l.montant)).toEqual([500_000, 800_000, 1_120_000, 525_000, 250_000])
    expect(devis.total_ht).toBe(3_195_000)
    expect(devis.par_personne).toBe(53_250)
  })

  it('C. administration, 40 agents en PC Express : 1 215 000, soit 30 375 par personne', () => {
    const devis = calculerDevis({ participants: 40, lignes: [{ code: 'pc_soiree', participants: 40 }] })
    expect(devis.total_ht).toBe(1_215_000)
    expect(devis.par_personne).toBe(30_375)
  })
})

describe('chapitre 8 : phase 2 SOBRAGA', () => {
  it('PC Express sans remise par groupe : 3 × 450 000 = 1 350 000', () => {
    const ligne = calculerLigne({ code: 'pc_soiree', participants: 38, remise_groupes: false })
    expect(ligne.lignes).toEqual([
      { libelle: 'PC Express Soirée (2 h)', detail: '3 groupes, 15 participants au plus par groupe', quantite: 3, prix_unitaire: 450_000, montant: 1_350_000 },
    ])
  })

  it('ateliers métier : chaque famille au plein tarif ; une famille de plus de 20 ajoute 472 500', () => {
    expect(total({ lignes: [{ code: 'atelier_metier', participants: 18, theme: 'Maintenance' }] })).toBe(675_000)
    expect(total({ lignes: [{ code: 'atelier_metier', participants: 24, theme: 'Maintenance' }] })).toBe(675_000 + 472_500)
    expect(calculerLigne({ code: 'atelier_metier', participants: 18, theme: ' Maintenance ' }).lignes[0].libelle).toBe(
      'Atelier métier ou thématique (3 h) — Maintenance',
    )
  })

  it('remise de programme de 10 % au plus (R8)', () => {
    const lignes = [{ code: 'journee', participants: 15 }]
    expect(calculerDevis({ lignes, remise_programme_pct: 10 })).toMatchObject({ sous_total: 1_350_000, remise_programme: 135_000, total_ht: 1_215_000 })
    const trop = calculerDevis({ lignes, remise_programme_pct: 25 })
    expect(trop.remise_programme_pct).toBe(10)
    expect(trop.alertes).toContain('La remise de programme est plafonnée à 10 %.')
    expect(calculerDevis({ lignes, remise_programme_pct: -5 }).remise_programme).toBe(0)
  })
})

describe('garde-fous', () => {
  it('un nombre de groupes imposé ne peut pas être inférieur à ce qu’exige l’effectif', () => {
    const ligne = calculerLigne({ code: 'journee', participants: 45, groupes: 1 })
    expect(ligne.groupes).toBe(3)
    expect(ligne.alertes[0]).toContain('au moins 3 groupes de 15')
    expect(calculerLigne({ code: 'journee', participants: 10, groupes: 2 }).groupes).toBe(2)
  })

  it('séance sur mesure : prix par la durée, groupes par la taille saisie', () => {
    const ligne = calculerLigne({ code: 'sur_mesure', duree_h: 4, taille_max: 12, participants: 30, theme: 'Copilot logistique' })
    expect(ligne.groupes).toBe(3)
    expect(ligne.lignes[0]).toMatchObject({ libelle: 'Séance sur mesure (4 h) — Copilot logistique', prix_unitaire: 900_000 })
    expect(ligne.lignes[1]).toMatchObject({ quantite: 2, prix_unitaire: 630_000 })
    expect(calculerLigne({ code: 'sur_mesure', participants: 10 }).lignes).toEqual([])
  })

  it('signale la préparation mal placée, en double ou absente (R4, R5)', () => {
    expect(calculerDevis({ lignes: [{ code: 'preparation' }, { code: 'pc_soiree', participants: 15 }] }).alertes[0]).toContain('PC Express seul')
    expect(calculerDevis({ lignes: [{ code: 'preparation' }, { code: 'preparation' }, { code: 'journee', participants: 10 }] }).alertes).toContain(
      'La préparation se facture une fois par mission.',
    )
    expect(calculerDevis({ lignes: [{ code: 'atelier_ia', participants: 30 }] }).alertes[0]).toContain('Pas de préparation')
    expect(calculerDevis({ lignes: formule('recommandee', 30) }).alertes).toEqual([])
  })

  it('signale le cumul remise de programme + remise par groupe', () => {
    const devis = calculerDevis({ lignes: [{ code: 'preparation' }, { code: 'atelier_ia', participants: 60 }], remise_programme_pct: 10 })
    expect(devis.alertes.some((a) => a.includes('se cumulent'))).toBe(true)
  })

  it('ignore une prestation inconnue et borne les quantités', () => {
    const devis = calculerDevis({ lignes: [{ code: 'inconnue' }, { code: 'clinique', quantite: 999 }, { code: 'mesure_impact', quantite: -3 }] })
    expect(devis.lignes.map((l) => l.quantite)).toEqual([50, 1])
    expect(devis.alertes).toContain('Prestation inconnue : la ligne est ignorée.')
    expect(calculerDevis({ lignes: [] })).toMatchObject({ lignes: [], total_ht: 0, par_personne: null })
    expect(calculerDevis(null as never).total_ht).toBe(0)
  })

  it('toutes les formules ne référencent que des prestations de la grille', () => {
    for (const f of FORMULES) for (const l of f.lignes(30)) expect(getPrestation(l.code)).toBeDefined()
  })
})
