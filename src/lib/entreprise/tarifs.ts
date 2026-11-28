/**
 * Grille tarifaire entreprise de Studia Academy (pur, partagé serveur /
 * interface). Source : « Grille tarifaire Studia Academy », 28 novembre
 * 2026, règles marquées « Validé ». Montants en FCFA hors taxes.
 *
 * Principe : on vend des séances, pas des places. Le prix d'une séance
 * dépend de sa durée ; chaque format a une taille maximale, et au-delà on
 * ajoute des groupes — chaque groupe est une séance de plus.
 *
 * Règles appliquées ici :
 *  R1  séance = durée × 225 000, arrondi aux 25 000 supérieurs ;
 *  R2  plancher : aucune séance sur mesure sous 450 000 ;
 *  R3  taille maximale par format → nombre de groupes ;
 *  R4  préparation 500 000, une fois par mission ;
 *  R5  pas de préparation pour PC Express ;
 *  R6  séance IA répétée à l'identique : −30 % dès le 2e groupe ;
 *  R7  PC Express : −15 % par groupe supplémentaire ;
 *  R8  remise de programme : 10 % au plus.
 * Les remises R6 et R7 se décochent ligne par ligne (contenu différent,
 * ou programme déjà remisé).
 */

export const PRIX_HEURE = 225_000
export const PLANCHER_SEANCE = 450_000
export const REMISE_PROGRAMME_MAX = 10
const ARRONDI = 25_000

export type FamillePrestation = 'ia' | 'pc_express'

/**
 * `seance` : facturée par groupe (participants ÷ taille maximale).
 * `unite`  : forfait ou unité, quantité saisie à la main.
 */
export type ModePrestation = 'seance' | 'unite'

export interface Prestation {
  code: string
  libelle: string
  duree: string | null
  famille: FamillePrestation
  mode: ModePrestation
  prix: number
  /** Participants au plus par groupe ; null hors séance. */
  tailleMax: number | null
  /** Remise des groupes suivants (0,30 = −30 %). */
  remiseGroupes: number
  /** Précision affichée sous le libellé dans le constructeur de devis. */
  aide: string
}

export const PRESTATIONS: readonly Prestation[] = [
  { code: 'preparation', libelle: 'Préparation sur mesure', duree: null, famille: 'ia', mode: 'unite', prix: 500_000, tailleMax: null, remiseGroupes: 0, aide: 'Diagnostic en ligne, synthèse direction, exercices sur vos cas. Une fois par mission.' },
  { code: 'atelier_ia', libelle: 'Atelier d’initiation IA', duree: '2 h', famille: 'ia', mode: 'seance', prix: 450_000, tailleMax: 40, remiseGroupes: 0.3, aide: 'Jusqu’à 40 participants par groupe, à deux animateurs.' },
  { code: 'atelier_metier', libelle: 'Atelier métier ou thématique', duree: '3 h', famille: 'ia', mode: 'seance', prix: 675_000, tailleMax: 20, remiseGroupes: 0.3, aide: 'Jusqu’à 20 participants par groupe.' },
  { code: 'demi_journee', libelle: 'Demi-journée', duree: '3 h 30', famille: 'ia', mode: 'seance', prix: 800_000, tailleMax: 20, remiseGroupes: 0.3, aide: 'Jusqu’à 20 participants par groupe.' },
  { code: 'journee', libelle: 'Journée', duree: '6 h', famille: 'ia', mode: 'seance', prix: 1_350_000, tailleMax: 15, remiseGroupes: 0.3, aide: 'Jusqu’à 15 participants par groupe.' },
  { code: 'session_direction', libelle: 'Session direction', duree: '2 h', famille: 'ia', mode: 'unite', prix: 450_000, tailleMax: null, remiseGroupes: 0, aide: 'Comité de direction.' },
  { code: 'journee_referents', libelle: 'Journée référents IA', duree: '6 h', famille: 'ia', mode: 'seance', prix: 1_350_000, tailleMax: 6, remiseGroupes: 0.3, aide: '3 à 6 référents par groupe.' },
  { code: 'clinique', libelle: 'Clinique de suivi à distance', duree: '1 h 30', famille: 'ia', mode: 'unite', prix: 175_000, tailleMax: null, remiseGroupes: 0, aide: 'Une par groupe : indiquez le nombre de cliniques.' },
  { code: 'mesure_impact', libelle: 'Mesure d’impact et rapport direction', duree: null, famille: 'ia', mode: 'unite', prix: 250_000, tailleMax: null, remiseGroupes: 0, aide: 'Nouvelle mesure auprès des participants, rapport avant / après.' },
  { code: 'pc_express_1h', libelle: 'PC Express, format Express', duree: '1 h', famille: 'pc_express', mode: 'seance', prix: 250_000, tailleMax: 15, remiseGroupes: 0.15, aide: 'Groupes de 12 à 15, préparation comprise.' },
  { code: 'pc_soiree', libelle: 'PC Express Soirée', duree: '2 h', famille: 'pc_express', mode: 'seance', prix: 450_000, tailleMax: 15, remiseGroupes: 0.15, aide: 'Groupes de 12 à 15, préparation comprise.' },
  { code: 'pc_soiree_suivi', libelle: 'PC Express Soirée + suivi coaché J+7 et J+21 + rapport', duree: '2 h + 2 × 20 min', famille: 'pc_express', mode: 'seance', prix: 600_000, tailleMax: 15, remiseGroupes: 0.15, aide: 'Groupes de 12 à 15, préparation comprise.' },
  { code: 'pc_clavier', libelle: 'Clavier à 6 doigts', duree: '1 h 30 + 3 semaines', famille: 'pc_express', mode: 'seance', prix: 350_000, tailleMax: 15, remiseGroupes: 0.15, aide: 'Groupes de 12 à 15, préparation comprise.' },
]

/** Code de la ligne libre : une séance dont on saisit la durée et la taille de groupe. */
export const SUR_MESURE = 'sur_mesure'

export const getPrestation = (code: string): Prestation | undefined => PRESTATIONS.find((p) => p.code === code)

/** R1 + R2 : prix d'une séance sur mesure à partir de sa durée en heures. */
export function prixSeance(dureeHeures: number): number {
  const brut = Math.ceil((dureeHeures * PRIX_HEURE) / ARRONDI) * ARRONDI
  return Math.max(PLANCHER_SEANCE, brut)
}

/** R3 : nombre de groupes pour un effectif et une taille maximale. */
export const nombreDeGroupes = (participants: number, tailleMax: number) => Math.max(1, Math.ceil(participants / tailleMax))

// ---------- Saisie et calcul ----------

export interface LigneSaisie {
  code: string
  /** Séance : effectif concerné, qui donne le nombre de groupes. */
  participants?: number | null
  /** Séance : nombre de groupes imposé (au moins celui qu'exige l'effectif). */
  groupes?: number | null
  /** Séance : appliquer la remise des groupes suivants (par défaut oui). */
  remise_groupes?: boolean
  /** Unité : nombre de forfaits ou d'unités (par défaut 1). */
  quantite?: number | null
  /** Thème ou formation visée, ajouté au libellé (« Atelier métier — Maintenance »). */
  theme?: string | null
  /** Sur mesure : durée en heures et taille maximale du groupe. */
  duree_h?: number | null
  taille_max?: number | null
}

export interface LigneDevis {
  libelle: string
  detail: string | null
  quantite: number
  prix_unitaire: number
  montant: number
}

export interface DevisSaisie {
  lignes: LigneSaisie[]
  /** Effectif total concerné, pour afficher le coût par personne. */
  participants?: number | null
  /** Remise de programme en pourcentage (0 à 10). */
  remise_programme_pct?: number | null
}

export interface DevisCalcule {
  lignes: LigneDevis[]
  sous_total: number
  remise_programme_pct: number
  remise_programme: number
  total_ht: number
  participants: number | null
  par_personne: number | null
  /** Points d'attention pour l'admin ; jamais affichés au client. */
  alertes: string[]
}

const entier = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : Number.NaN
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : null
}
const heures = (h: number) => {
  const minutes = Math.round(h * 60)
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}
const pourcent = (r: number) => `−${Math.round(r * 100)} %`

/**
 * Calcule les lignes de devis d'une prestation.
 *
 * @example
 * calculerLigne({ code: 'atelier_ia', participants: 60 })
 * // 2 groupes : 450 000 + 315 000 (−30 %)
 */
export function calculerLigne(saisie: LigneSaisie): { lignes: LigneDevis[]; groupes: number; alertes: string[] } {
  const alertes: string[] = []
  const theme = typeof saisie.theme === 'string' ? saisie.theme.replace(/\s+/g, ' ').trim().slice(0, 120) : ''

  let prestation: Prestation | undefined
  if (saisie.code === SUR_MESURE) {
    const duree = typeof saisie.duree_h === 'number' && Number.isFinite(saisie.duree_h) ? Math.min(12, Math.max(0.5, saisie.duree_h)) : null
    if (duree === null) return { lignes: [], groupes: 0, alertes: ['Séance sur mesure : indiquez sa durée.'] }
    prestation = {
      code: SUR_MESURE, libelle: 'Séance sur mesure', duree: heures(duree), famille: 'ia', mode: 'seance', prix: prixSeance(duree),
      tailleMax: entier(saisie.taille_max, 1, 60) ?? 20, remiseGroupes: 0.3, aide: '',
    }
  } else {
    prestation = getPrestation(saisie.code)
  }
  if (!prestation) return { lignes: [], groupes: 0, alertes: ['Prestation inconnue : la ligne est ignorée.'] }

  const libelle = `${prestation.libelle}${prestation.duree ? ` (${prestation.duree})` : ''}${theme ? ` — ${theme}` : ''}`

  if (prestation.mode === 'unite') {
    const quantite = entier(saisie.quantite, 1, 50) ?? 1
    return { lignes: [{ libelle, detail: null, quantite, prix_unitaire: prestation.prix, montant: quantite * prestation.prix }], groupes: 0, alertes }
  }

  const tailleMax = prestation.tailleMax ?? 1
  const participants = entier(saisie.participants, 1, 5000)
  const requis = participants === null ? 1 : nombreDeGroupes(participants, tailleMax)
  const voulus = entier(saisie.groupes, 1, 100)
  if (voulus !== null && voulus < requis) {
    alertes.push(`${prestation.libelle} : ${participants} participants demandent au moins ${requis} groupes de ${tailleMax}.`)
  }
  const groupes = Math.max(requis, voulus ?? requis)
  const remise = saisie.remise_groupes === false ? 0 : prestation.remiseGroupes
  const taille = `${tailleMax} participants au plus par groupe`

  if (groupes === 1 || remise === 0) {
    return {
      lignes: [{
        libelle,
        detail: groupes === 1 ? `1 groupe, ${taille}` : `${groupes} groupes, ${taille}`,
        quantite: groupes, prix_unitaire: prestation.prix, montant: groupes * prestation.prix,
      }],
      groupes, alertes,
    }
  }
  const remisee = Math.round(prestation.prix * (1 - remise))
  const suivants = groupes - 1
  return {
    lignes: [
      { libelle, detail: `Groupe 1, ${taille}`, quantite: 1, prix_unitaire: prestation.prix, montant: prestation.prix },
      {
        libelle,
        detail: `${suivants === 1 ? 'Groupe 2' : `Groupes 2 à ${groupes}`}${prestation.famille === 'ia' ? ', contenu identique' : ''} (${pourcent(remise)})`,
        quantite: suivants, prix_unitaire: remisee, montant: suivants * remisee,
      },
    ],
    groupes, alertes,
  }
}

/**
 * Calcule un devis complet : lignes, remise de programme, total HT et
 * coût par personne.
 *
 * @example
 * calculerDevis({ participants: 25, lignes: [{ code: 'preparation' }, { code: 'atelier_ia', participants: 25 }] })
 * // total_ht 950 000, par_personne 38 000
 */
export function calculerDevis(saisie: DevisSaisie): DevisCalcule {
  const alertes: string[] = []
  const lignes: LigneDevis[] = []
  const codes: string[] = []
  for (const l of Array.isArray(saisie?.lignes) ? saisie.lignes.slice(0, 40) : []) {
    const calcul = calculerLigne(l)
    lignes.push(...calcul.lignes)
    alertes.push(...calcul.alertes)
    if (calcul.lignes.length > 0) codes.push(l.code)
  }

  const prestations = codes.map((c) => (c === SUR_MESURE ? { famille: 'ia', mode: 'seance' } : getPrestation(c))).filter(Boolean)
  const seancesIa = prestations.some((p) => p?.famille === 'ia' && p.mode === 'seance')
  const preparations = codes.filter((c) => c === 'preparation').length
  if (preparations > 0 && !seancesIa) alertes.push('La préparation ne se facture pas pour PC Express seul : elle est comprise dans le prix de la soirée.')
  if (preparations > 1) alertes.push('La préparation se facture une fois par mission.')
  if (preparations === 0 && seancesIa) alertes.push('Pas de préparation : à ajouter si les exercices sont écrits sur les cas du client.')

  const sousTotal = lignes.reduce((n, l) => n + l.montant, 0)
  const demandee = typeof saisie?.remise_programme_pct === 'number' && Number.isFinite(saisie.remise_programme_pct) ? saisie.remise_programme_pct : 0
  const pct = Math.min(REMISE_PROGRAMME_MAX, Math.max(0, demandee))
  if (demandee > REMISE_PROGRAMME_MAX) alertes.push(`La remise de programme est plafonnée à ${REMISE_PROGRAMME_MAX} %.`)
  if (pct > 0 && lignes.some((l) => l.detail?.includes('−'))) {
    alertes.push('Remise de programme et remise par groupe se cumulent sur ce devis : vérifiez que c’est voulu.')
  }
  const remiseProgramme = Math.round((sousTotal * pct) / 100)
  const total = sousTotal - remiseProgramme
  const participants = entier(saisie?.participants, 1, 100_000)

  return {
    lignes,
    sous_total: sousTotal,
    remise_programme_pct: pct,
    remise_programme: remiseProgramme,
    total_ht: total,
    participants,
    par_personne: participants ? Math.round(total / participants) : null,
    alertes,
  }
}

// ---------- Formules de démarchage ----------

export interface Formule {
  code: string
  libelle: string
  description: string
  lignes: (participants: number) => LigneSaisie[]
}

/** Formules à présenter en démarchage : elles préremplissent un devis, que l'on ajuste ensuite. */
export const FORMULES: readonly Formule[] = [
  {
    code: 'decouverte', libelle: 'Découverte', description: 'Préparation + atelier IA 2 h',
    lignes: (p) => [{ code: 'preparation' }, { code: 'atelier_ia', participants: p }],
  },
  {
    code: 'recommandee', libelle: 'Recommandée', description: 'Découverte + clinique 30 jours + mesure d’impact',
    lignes: (p) => [
      { code: 'preparation' }, { code: 'atelier_ia', participants: p },
      { code: 'clinique', quantite: nombreDeGroupes(p, 40) }, { code: 'mesure_impact' },
    ],
  },
  {
    code: 'montee', libelle: 'Montée en compétence', description: 'Préparation + journée socle + journée métier + clinique + mesure',
    lignes: (p) => [
      { code: 'preparation' }, { code: 'journee', participants: p, theme: 'Socle' }, { code: 'journee', participants: p, theme: 'Métier' },
      { code: 'clinique', quantite: nombreDeGroupes(p, 15) }, { code: 'mesure_impact' },
    ],
  },
  {
    code: 'pc_express', libelle: 'PC Express', description: 'Soirées de 2 h, groupes de 12 à 15',
    lignes: (p) => [{ code: 'pc_soiree', participants: p }],
  },
]

/** Ce qui n'est jamais compris dans un devis (R9). */
export const NON_INCLUS = [
  'Licences logicielles (Microsoft 365, Copilot ou autre)',
  'Salle et ordinateurs des participants',
  'Restauration',
  'Déplacements hors Libreville',
] as const

/** Conditions de paiement et de report (R10). */
export const CONDITIONS = [
  'Paiement : 50 % à la commande, 50 % après la séance.',
  'Report sans frais jusqu’à 7 jours avant la séance ; au-delà, la moitié de la séance est due.',
] as const

export const VALIDITE_DEVIS_JOURS = 30
