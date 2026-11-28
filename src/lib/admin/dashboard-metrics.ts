// ============================================
// Tableau de bord admin — calculs (règles pures, sans E/S)
// ============================================
// À partir des lignes brutes (comptes, inscriptions, réservations, événements,
// conversations WhatsApp), calcule les indicateurs et les séries des
// graphiques pour une période donnée, comparée à la période précédente.

export const PERIODES = ['30j', '90j', '12m'] as const
export type Periode = (typeof PERIODES)[number]

export const PERIODE_LABELS: Record<Periode, string> = {
  '30j': '30 jours',
  '90j': '90 jours',
  '12m': '12 mois',
}

export function isPeriode(value: unknown): value is Periode {
  return typeof value === 'string' && (PERIODES as readonly string[]).includes(value)
}

// ── Lignes brutes ───────────────────────────

export interface LigneCompte {
  created_at: string | null
}
export interface LigneInscription {
  formation_id: string
  status: string
  requested_at: string | null
  granted_at: string | null
  payment_method?: string | null
  payment_amount_fcfa?: number | null
}
export interface LigneReservation {
  session_id: string
  status: string
  created_at: string | null
  decided_at?: string | null
  payment_method?: string | null
  payment_amount_fcfa?: number | null
}
export interface LigneFormation {
  id: string
  titre: string
}
export interface LigneEvenement {
  id: string
  titre: string
  date_debut: string
  places_total: number
  places_reservees: number
}
export interface LigneConversation {
  created_at: string | null
  source?: { type?: string | null; kind?: string | null } | null
}

export interface DonneesBrutes {
  comptes: LigneCompte[]
  inscriptions: LigneInscription[]
  reservations: LigneReservation[]
  formations: LigneFormation[]
  evenements: LigneEvenement[]
  conversations: LigneConversation[]
}

// ── Résultat ────────────────────────────────

export interface Indicateur {
  valeur: number
  precedent: number
}
export interface PointSerie {
  /** Libellé court de la tranche (« 12 nov. », « nov. »). */
  label: string
  comptes: number
  enLigne: number
  presentiel: number
  airtel: number
  especes: number
}
export interface LigneBarre {
  label: string
  valeur: number
  /** Complément affiché sous le libellé (date d'un événement…). */
  detail?: string
  /** Maximum propre à la ligne (places d'un événement) ; sinon le maximum de la liste. */
  max?: number
}
export interface TableauDeBord {
  periode: Periode
  indicateurs: {
    revenus: Indicateur
    comptes: Indicateur
    inscriptions: Indicateur
    reservations: Indicateur
    contacts: Indicateur
  }
  aValider: { nombre: number; montant: number }
  serie: PointSerie[]
  entonnoir: LigneBarre[]
  topFormations: LigneBarre[]
  remplissage: LigneBarre[]
  origines: LigneBarre[]
}

// ── Fenêtre de temps ────────────────────────

const JOUR = 24 * 3600 * 1000
const FUSEAU = 'Africa/Libreville'

interface Tranche {
  debut: number
  fin: number
  label: string
}

const minuitUtc = (t: number) => Math.floor(t / JOUR) * JOUR
const libelleJour = (t: number) =>
  new Date(t).toLocaleDateString('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'short' })
const libelleMois = (t: number) =>
  new Date(t).toLocaleDateString('fr-FR', { timeZone: 'UTC', month: 'short' }).replace('.', '')

/**
 * Tranches de la période, de la plus ancienne à la plus récente : 30 jours
 * (par jour), 13 semaines (par semaine) ou 12 mois calendaires (par mois).
 * La dernière tranche contient `maintenant`.
 */
export function tranches(periode: Periode, maintenant: Date): Tranche[] {
  const fin = minuitUtc(maintenant.getTime()) + JOUR
  if (periode === '12m') {
    const y = maintenant.getUTCFullYear()
    const m = maintenant.getUTCMonth()
    return Array.from({ length: 12 }, (_, i) => {
      const debut = Date.UTC(y, m - 11 + i, 1)
      return { debut, fin: Date.UTC(y, m - 10 + i, 1), label: libelleMois(debut) }
    })
  }
  const pas = periode === '30j' ? 1 : 7
  const nombre = periode === '30j' ? 30 : 13
  return Array.from({ length: nombre }, (_, i) => {
    const debut = fin - (nombre - i) * pas * JOUR
    return { debut, fin: debut + pas * JOUR, label: libelleJour(debut) }
  })
}

const instant = (iso: string | null | undefined): number | null => {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}
const dans = (t: number | null, debut: number, fin: number) => t !== null && t >= debut && t < fin

/**
 * Évolution en pourcentage entre deux périodes. `null` quand la période
 * précédente est vide : un pourcentage n'aurait pas de sens.
 *
 * @example
 * evolution({ valeur: 12, precedent: 8 }) // 50
 * evolution({ valeur: 4, precedent: 0 })  // null
 */
export function evolution(i: Indicateur): number | null {
  if (i.precedent <= 0) return null
  return Math.round(((i.valeur - i.precedent) / i.precedent) * 100)
}

const ORIGINE_LABELS: Record<string, string> = {
  formation: 'Demande de formation en ligne',
  presentiel: 'Réservation en présentiel',
  'formation-ia': 'Formations IA',
  devis: 'Demande de devis',
  contact: 'Formulaire de contact',
  partenariat: 'Partenariat',
}

/** Origine lisible d'une conversation WhatsApp (page du site, publicité, message direct). */
export function origineConversation(c: LigneConversation): string {
  const type = c.source?.type
  if (type === 'site') return ORIGINE_LABELS[c.source?.kind ?? ''] ?? 'Site (autre page)'
  if (type === 'ad' || type === 'ads' || type === 'publicite') return 'Publicité'
  return 'Message direct'
}

const paye = (montant: number | null | undefined) => (typeof montant === 'number' && montant > 0 ? montant : 0)
const ouverte = (status: string) => status === 'active' || status === 'completed'

/**
 * Calcule le tableau de bord pour une période.
 *
 * - revenus : paiements validés par un admin (inscription ouverte ou place
 *   confirmée), datés du jour de la validation ;
 * - inscriptions / réservations : demandes reçues dans la période ;
 * - à valider : paiements en attente, toutes dates confondues.
 */
export function calculerTableauDeBord(donnees: DonneesBrutes, periode: Periode, maintenant: Date): TableauDeBord {
  const cases = tranches(periode, maintenant)
  const debut = cases[0].debut
  const fin = cases[cases.length - 1].fin
  const avant = debut - (fin - debut)

  // Événements datés une fois pour toutes
  const comptes = donnees.comptes.map((c) => instant(c.created_at))
  const demandes = donnees.inscriptions.map((i) => ({ t: instant(i.requested_at), i }))
  const resas = donnees.reservations.map((r) => ({ t: instant(r.created_at), r }))
  const contacts = donnees.conversations.map((c) => ({ t: instant(c.created_at), c }))
  const encaissements = [
    ...donnees.inscriptions
      .filter((i) => ouverte(i.status) && paye(i.payment_amount_fcfa) > 0)
      .map((i) => ({ t: instant(i.granted_at) ?? instant(i.requested_at), montant: paye(i.payment_amount_fcfa), mode: i.payment_method })),
    ...donnees.reservations
      .filter((r) => r.status === 'confirmed' && paye(r.payment_amount_fcfa) > 0)
      .map((r) => ({ t: instant(r.decided_at) ?? instant(r.created_at), montant: paye(r.payment_amount_fcfa), mode: r.payment_method })),
  ]

  const compter = (ts: (number | null)[], a: number, b: number) => ts.filter((t) => dans(t, a, b)).length
  const somme = (a: number, b: number) =>
    encaissements.filter((e) => dans(e.t, a, b)).reduce((s, e) => s + e.montant, 0)
  const indicateur = (ts: (number | null)[]): Indicateur => ({
    valeur: compter(ts, debut, fin),
    precedent: compter(ts, avant, debut),
  })

  const serie: PointSerie[] = cases.map((c) => ({
    label: c.label,
    comptes: compter(comptes, c.debut, c.fin),
    enLigne: compter(demandes.map((d) => d.t), c.debut, c.fin),
    presentiel: compter(resas.filter((x) => x.r.status !== 'cancelled').map((x) => x.t), c.debut, c.fin),
    airtel: encaissements.filter((e) => e.mode === 'airtel_money' && dans(e.t, c.debut, c.fin)).reduce((s, e) => s + e.montant, 0),
    especes: encaissements.filter((e) => e.mode !== 'airtel_money' && dans(e.t, c.debut, c.fin)).reduce((s, e) => s + e.montant, 0),
  }))

  // Paiements en attente de validation
  const enAttente = [
    ...donnees.inscriptions.filter((i) => i.status === 'pending' && i.payment_method),
    ...donnees.reservations.filter((r) => r.status === 'reserved' && r.payment_method),
  ]

  // Entonnoir de la période : comptes créés → demandes → accès ouverts ou places confirmées
  const demandesPeriode = demandes.filter((d) => dans(d.t, debut, fin))
  const resasPeriode = resas.filter((x) => dans(x.t, debut, fin))
  const entonnoir: LigneBarre[] = [
    { label: 'Comptes créés', valeur: compter(comptes, debut, fin) },
    { label: 'Demandes d’inscription', valeur: demandesPeriode.length + resasPeriode.length },
    {
      label: 'Inscriptions validées',
      valeur:
        demandesPeriode.filter((d) => ouverte(d.i.status)).length +
        resasPeriode.filter((x) => x.r.status === 'confirmed').length,
    },
  ]

  // Formations les plus demandées sur la période
  const titres = new Map(donnees.formations.map((f) => [f.id, f.titre]))
  const parFormation = new Map<string, number>()
  for (const d of demandesPeriode) parFormation.set(d.i.formation_id, (parFormation.get(d.i.formation_id) ?? 0) + 1)
  const topFormations = [...parFormation.entries()]
    .map(([id, valeur]) => ({ label: titres.get(id) ?? 'Formation supprimée', valeur }))
    .sort((a, b) => b.valeur - a.valeur || a.label.localeCompare(b.label, 'fr'))
    .slice(0, 5)

  // Remplissage des prochains événements
  const maintenantMs = maintenant.getTime()
  const remplissage = donnees.evenements
    .filter((e) => (instant(e.date_debut) ?? 0) >= maintenantMs - JOUR)
    .sort((a, b) => a.date_debut.localeCompare(b.date_debut))
    .slice(0, 5)
    .map((e) => ({
      label: e.titre,
      valeur: Math.min(e.places_reservees, e.places_total),
      max: e.places_total,
      detail: new Date(e.date_debut).toLocaleDateString('fr-FR', { timeZone: FUSEAU, weekday: 'short', day: 'numeric', month: 'short' }),
    }))

  // Origine des contacts WhatsApp de la période
  const parOrigine = new Map<string, number>()
  for (const x of contacts.filter((k) => dans(k.t, debut, fin))) {
    const label = origineConversation(x.c)
    parOrigine.set(label, (parOrigine.get(label) ?? 0) + 1)
  }
  const origines = [...parOrigine.entries()]
    .map(([label, valeur]) => ({ label, valeur }))
    .sort((a, b) => b.valeur - a.valeur || a.label.localeCompare(b.label, 'fr'))

  return {
    periode,
    indicateurs: {
      revenus: { valeur: somme(debut, fin), precedent: somme(avant, debut) },
      comptes: indicateur(comptes),
      inscriptions: indicateur(demandes.map((d) => d.t)),
      reservations: indicateur(resas.filter((x) => x.r.status !== 'cancelled').map((x) => x.t)),
      contacts: indicateur(contacts.map((k) => k.t)),
    },
    aValider: {
      nombre: enAttente.length,
      montant: enAttente.reduce((s, x) => s + paye(x.payment_amount_fcfa), 0),
    },
    serie,
    entonnoir,
    topFormations,
    remplissage,
    origines,
  }
}

/** Vrai si la période ne contient aucune activité (page vide à expliquer). */
export function estVide(t: TableauDeBord): boolean {
  const i = t.indicateurs
  return i.revenus.valeur + i.comptes.valeur + i.inscriptions.valeur + i.reservations.valeur + i.contacts.valeur === 0
}
