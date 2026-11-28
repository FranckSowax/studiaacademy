// ============================================
// Tableau de bord admin — données d'exemple (mode aperçu)
// ============================================
// Jeu de données fictif et reproductible, pour voir le tableau de bord rempli
// avant que l'activité réelle ne le soit. Il n'est affiché que sur demande
// (« Aperçu avec des données d'exemple ») et toujours signalé comme tel.

import type { DonneesBrutes } from './dashboard-metrics'

const JOUR = 24 * 3600 * 1000

// PRNG déterministe (mulberry32) : mêmes chiffres à chaque affichage
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FORMATIONS = [
  { id: 'demo-rh', titre: 'L’IA pour recruter', prix: 25000 },
  { id: 'demo-compta', titre: 'L’IA pour la comptabilité', prix: 25000 },
  { id: 'demo-marketing', titre: 'Créer ses visuels avec l’IA', prix: 15000 },
  { id: 'demo-excel', titre: 'Excel pour débutants', prix: 15000 },
  { id: 'demo-chatgpt', titre: 'Découvrir ChatGPT', prix: 0 },
  { id: 'demo-education', titre: 'L’IA en classe', prix: 0 },
]
const EVENEMENTS = [
  { id: 'demo-e1', titre: 'Masterclass : l’IA pour recruter', dans: 6, total: 20, reservees: 17, prix: 15000 },
  { id: 'demo-e2', titre: 'Présentation de Studia Live', dans: 9, total: 40, reservees: 22, prix: 0 },
  { id: 'demo-e3', titre: 'Formation : Excel pour débutants', dans: 13, total: 15, reservees: 6, prix: 20000 },
  { id: 'demo-e4', titre: 'Masterclass : visuels avec l’IA', dans: 20, total: 20, reservees: 4, prix: 15000 },
]
const ORIGINES = [
  { type: 'direct', kind: null, poids: 34 },
  { type: 'site', kind: 'formation', poids: 24 },
  { type: 'ad', kind: null, poids: 18 },
  { type: 'site', kind: 'presentiel', poids: 12 },
  { type: 'site', kind: 'contact', poids: 8 },
  { type: 'site', kind: 'devis', poids: 4 },
]

/**
 * Données d'exemple sur 14 mois, en croissance régulière, plus calmes le week-end.
 *
 * @example
 * calculerTableauDeBord(donneesExemple(new Date()), '90j', new Date())
 */
export function donneesExemple(maintenant: Date): DonneesBrutes {
  const rnd = mulberry32(20261128)
  const fin = Math.floor(maintenant.getTime() / JOUR) * JOUR
  const JOURS = 420
  const iso = (t: number) => new Date(t).toISOString()
  const tirer = <T extends { poids: number }>(liste: T[]): T => {
    let r = rnd() * liste.reduce((s, x) => s + x.poids, 0)
    for (const x of liste) {
      r -= x.poids
      if (r <= 0) return x
    }
    return liste[liste.length - 1]
  }
  // Popularité décroissante des formations
  const formationsPonderees = FORMATIONS.map((f, i) => ({ ...f, poids: FORMATIONS.length - i }))

  const donnees: DonneesBrutes = {
    comptes: [],
    inscriptions: [],
    reservations: [],
    conversations: [],
    formations: FORMATIONS.map((f) => ({ id: f.id, titre: f.titre })),
    evenements: EVENEMENTS.map((e) => ({
      id: e.id,
      titre: e.titre,
      date_debut: iso(fin + e.dans * JOUR + 9 * 3600 * 1000),
      places_total: e.total,
      places_reservees: e.reservees,
    })),
  }

  for (let j = JOURS; j >= 0; j--) {
    const jour = fin - j * JOUR
    const avancement = 1 - j / JOURS // 0 → 1 : l'activité grandit
    const weekEnd = [0, 6].includes(new Date(jour).getUTCDay()) ? 0.45 : 1
    const volume = (1.2 + 4.2 * avancement) * weekEnd
    const moment = () => jour + Math.floor(rnd() * 14 * 3600 * 1000) + 7 * 3600 * 1000
    const nombre = (moyenne: number) => Math.max(0, Math.round(moyenne * (0.5 + rnd())))

    for (let k = nombre(volume); k > 0; k--) donnees.comptes.push({ created_at: iso(moment()) })

    for (let k = nombre(volume * 0.9); k > 0; k--) {
      const o = tirer(ORIGINES)
      donnees.conversations.push({ created_at: iso(moment()), source: { type: o.type, kind: o.kind } })
    }

    for (let k = nombre(volume * 0.42); k > 0; k--) {
      const f = tirer(formationsPonderees)
      const demande = moment()
      const r = rnd()
      // Les demandes des 3 derniers jours attendent encore leur validation.
      const status = f.prix === 0 ? 'active' : j <= 3 && r < 0.6 ? 'pending' : r < 0.82 ? 'active' : r < 0.9 ? 'rejected' : 'pending'
      donnees.inscriptions.push({
        formation_id: f.id,
        status,
        requested_at: iso(demande),
        granted_at: status === 'active' ? iso(demande + Math.floor(rnd() * 2 * JOUR)) : null,
        payment_method: f.prix > 0 ? (rnd() < 0.68 ? 'airtel_money' : 'cash') : null,
        payment_amount_fcfa: f.prix > 0 ? f.prix : null,
      })
    }

    for (let k = nombre(volume * 0.16); k > 0; k--) {
      const e = EVENEMENTS[Math.floor(rnd() * EVENEMENTS.length)]
      const cree = moment()
      const r = rnd()
      const status = j <= 2 && e.prix > 0 && r < 0.7 ? 'reserved' : r < 0.86 ? 'confirmed' : r < 0.94 ? 'cancelled' : 'reserved'
      donnees.reservations.push({
        session_id: e.id,
        status,
        created_at: iso(cree),
        decided_at: status === 'confirmed' ? iso(cree + Math.floor(rnd() * JOUR)) : null,
        payment_method: e.prix > 0 ? (rnd() < 0.6 ? 'airtel_money' : 'cash') : null,
        payment_amount_fcfa: e.prix > 0 ? e.prix : null,
      })
    }
  }

  return donnees
}
