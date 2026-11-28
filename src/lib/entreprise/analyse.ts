import type { DonneesSessionLive } from '@/lib/studia-live/pilotage'
import { enTexte } from '@/lib/studia-live/suivi-regles'
import { CATALOGUE_B2B, type CatalogueFormation } from './catalogue'
import { DOMAINES } from './competences'

/**
 * Analyse des sessions passées d'une entreprise, par règles (aucune IA,
 * aucun service tiers) : elle ne lit que les indicateurs agrégés de
 * Studia Live — taux de réussite par thème et recommandations — jamais
 * une réponse ni un nom de participant.
 *
 * Règles, toutes explicables dans la justification de chaque proposition :
 *  1. un thème sous 60 % de réussite est « à renforcer » ;
 *  2. chaque thème et chaque priorité sont reliés à un domaine de
 *     compétences par mots-clés ;
 *  3. une formation du catalogue est proposée quand elle couvre un domaine
 *     à renforcer ; son score croît avec l'écart au seuil et les priorités ;
 *  4. un thème à renforcer qu'aucun domaine ne couvre devient une
 *     formation sur mesure, à créer ;
 *  5. un thème à 80 % ou plus ouvre le niveau suivant du même domaine.
 */

export const SEUIL_A_RENFORCER = 60
export const SEUIL_MAITRISE = 80
const POIDS_PRIORITE = 15
const SCORE_APPROFONDISSEMENT = 5
const MAX_CATALOGUE = 4
const MAX_SUR_MESURE = 3

/** Texte comparable : minuscules, sans accents ni ponctuation. */
export function normaliser(v: string): string {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Mots-clés par domaine, cherchés dans le texte normalisé (bords de mot à gauche).
const MOTS_CLES: Record<string, RegExp> = {
  ia_generative: /\b(ia|intelligence artificielle|prompt|chatgpt|copilot|claude|gemini|generati|assistant|llm)/,
  data: /\b(donnee|data|tableau de bord|tableaux de bord|indicateur|kpi|chiffre|excel|tableur|statisti|reporting)/,
  // « sécurité » seule est trop large (incendie, routière…) : il faut un contexte numérique.
  securite: /\b(cyber|mot de passe|mots de passe|phishing|hameconnage|confidential|rgpd|piratage|securite (informatique|numerique|des donnees|en ligne))/,
  communication_digitale: /\b(marketing|reseaux sociaux|reseau social|communication|contenu|relation client|service client|vente|commercial)/,
  gestion_projet: /\b(projet|organisation|planif|automatis|no code|process|workflow|changement|productivit|pilotage)/,
  bureautique: /\b(bureautique|word|e mail|email|messagerie|document|collaborati|agenda|powerpoint)/,
}

/** Domaines de compétences évoqués par un texte libre (titre de thème, recommandation). */
export function domainesDuTexte(texte: string): string[] {
  const t = normaliser(texte)
  return Object.entries(MOTS_CLES)
    .filter(([, motif]) => motif.test(t))
    .map(([domaine]) => domaine)
}

const libelleDomaine = (slug: string) => DOMAINES.find((d) => d.slug === slug)?.libelle ?? slug

export interface ThemeAgrege {
  titre: string
  /** Taux de réussite moyen, pondéré par le nombre de réponses. */
  taux: number
  /** Nombre de sessions où le thème a été évalué. */
  sessions: number
  domaines: string[]
}

export interface PrioriteRelevee {
  axe: string | null
  texte: string
  domaines: string[]
}

export interface PropositionCalculee {
  type: 'catalogue' | 'sur_mesure'
  /** Référence du catalogue (F1…F8), ou null pour une formation sur mesure. */
  catalogue_ref: string | null
  titre: string
  justification: string
  score: number
}

export interface AnalyseEntreprise {
  /** Sessions dont le détail a pu être lu. */
  sessions_analysees: number
  sessions_sans_detail: number
  themes_a_renforcer: ThemeAgrege[]
  themes_maitrises: ThemeAgrege[]
  priorites: PrioriteRelevee[]
  propositions: PropositionCalculee[]
}

const nombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const pourcent = (n: number) => `${Math.round(n)} %`

/** Thèmes de toutes les sessions, regroupés par titre (accents et casse ignorés). */
function agregerThemes(sessions: { donnees: DonneesSessionLive | null }[]): ThemeAgrege[] {
  const parCle = new Map<string, { titre: string; somme: number; poids: number; sessions: number }>()
  for (const s of sessions) {
    for (const t of s.donnees?.indicateurs?.themes ?? []) {
      const titre = enTexte(t?.titre).trim()
      if (!titre || !nombre(t.taux)) continue
      const reponses = (t.questions ?? []).reduce((n, q) => n + (nombre(q?.nb) ? q.nb : 0), 0)
      const poids = reponses > 0 ? reponses : 1
      const cle = normaliser(titre)
      const actuel = parCle.get(cle) ?? { titre, somme: 0, poids: 0, sessions: 0 }
      actuel.somme += t.taux * poids
      actuel.poids += poids
      actuel.sessions += 1
      parCle.set(cle, actuel)
    }
  }
  return [...parCle.values()].map((t) => ({
    titre: t.titre,
    taux: t.somme / t.poids,
    sessions: t.sessions,
    domaines: domainesDuTexte(t.titre),
  }))
}

function releverPriorites(sessions: { donnees: DonneesSessionLive | null }[]): PrioriteRelevee[] {
  const vues = new Set<string>()
  const priorites: PrioriteRelevee[] = []
  for (const s of sessions) {
    for (const r of s.donnees?.indicateurs?.recommandations ?? []) {
      if (r?.type !== 'priorite') continue
      const texte = enTexte(r.texte).trim()
      const axe = enTexte(r.axe).trim() || null
      const cle = normaliser(`${axe ?? ''} ${texte}`)
      if (!texte || vues.has(cle)) continue
      vues.add(cle)
      priorites.push({ axe, texte, domaines: domainesDuTexte(`${axe ?? ''} ${texte}`) })
    }
  }
  return priorites
}

function proposerCatalogue(formation: CatalogueFormation, faibles: ThemeAgrege[], priorites: PrioriteRelevee[]): PropositionCalculee | null {
  const couvre = (domaines: string[]) => domaines.some((d) => formation.domaines.includes(d))
  const themes = faibles.filter((t) => couvre(t.domaines))
  const prios = priorites.filter((p) => couvre(p.domaines))
  if (themes.length === 0 && prios.length === 0) return null

  const raisons: string[] = []
  for (const t of themes.slice(0, 2)) raisons.push(`thème « ${t.titre} » à ${pourcent(t.taux)} de réussite`)
  if (themes.length > 2) raisons.push(`${themes.length - 2} autre${themes.length > 3 ? 's' : ''} thème${themes.length > 3 ? 's' : ''} à renforcer`)
  if (prios.length > 0) raisons.push(`${prios.length} priorité${prios.length > 1 ? 's' : ''} relevée${prios.length > 1 ? 's' : ''} par les formateurs`)
  const domaines = formation.domaines.map(libelleDomaine).join(', ')

  return {
    type: 'catalogue',
    catalogue_ref: formation.ref,
    titre: formation.titre,
    justification: `${raisons.join(' ; ')}. Domaine couvert : ${domaines}.`.replace(/^./, (c) => c.toUpperCase()),
    score: Math.round(themes.reduce((n, t) => n + (SEUIL_A_RENFORCER - t.taux), 0) + prios.length * POIDS_PRIORITE),
  }
}

/**
 * Analyse les sessions passées et calcule les formations à proposer.
 *
 * @example
 * const a = analyserSessions(sessions)
 * a.propositions[0] // { type: 'catalogue', catalogue_ref: 'F4', titre: 'Data & tableaux de bord…', … }
 */
export function analyserSessions(sessions: { donnees: DonneesSessionLive | null }[]): AnalyseEntreprise {
  const lues = sessions.filter((s) => s.donnees)
  const themes = agregerThemes(lues)
  const faibles = themes.filter((t) => t.taux < SEUIL_A_RENFORCER).sort((a, b) => a.taux - b.taux)
  const maitrises = themes.filter((t) => t.taux >= SEUIL_MAITRISE).sort((a, b) => b.taux - a.taux)
  const priorites = releverPriorites(lues)

  // Règle 3 : catalogue sur les domaines à renforcer.
  const catalogue = CATALOGUE_B2B.map((f) => proposerCatalogue(f, faibles, priorites))
    .filter((p): p is PropositionCalculee => p !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CATALOGUE)

  // Règle 5 : niveau suivant sur les domaines maîtrisés, s'il reste de la place.
  const dejaProposees = new Set(catalogue.map((p) => p.catalogue_ref))
  const domainesFaibles = new Set(faibles.flatMap((t) => t.domaines))
  for (const t of maitrises) {
    if (catalogue.length >= MAX_CATALOGUE) break
    const suite = CATALOGUE_B2B.find(
      (f) =>
        f.niveau !== 'Initiation' &&
        !dejaProposees.has(f.ref) &&
        f.domaines.some((d) => t.domaines.includes(d)) &&
        !f.domaines.some((d) => domainesFaibles.has(d)),
    )
    if (!suite) continue
    dejaProposees.add(suite.ref)
    catalogue.push({
      type: 'catalogue',
      catalogue_ref: suite.ref,
      titre: suite.titre,
      justification: `Thème « ${t.titre} » maîtrisé à ${pourcent(t.taux)} : l’équipe peut passer au niveau ${suite.niveau.toLowerCase()}.`,
      score: SCORE_APPROFONDISSEMENT,
    })
  }

  // Règle 4 : ce que le catalogue ne couvre pas devient du sur-mesure.
  const surMesure: PropositionCalculee[] = []
  const titres = new Set<string>()
  const ajouter = (sujet: string, justification: string, score: number) => {
    const cle = normaliser(sujet)
    if (!cle || titres.has(cle) || surMesure.length >= MAX_SUR_MESURE) return
    titres.add(cle)
    surMesure.push({ type: 'sur_mesure', catalogue_ref: null, titre: `Sur mesure : ${sujet}`, justification, score })
  }
  for (const t of faibles.filter((x) => x.domaines.length === 0)) {
    ajouter(
      t.titre,
      `Thème « ${t.titre} » à ${pourcent(t.taux)} de réussite sur ${t.sessions} session${t.sessions > 1 ? 's' : ''}, sans formation correspondante au catalogue.`,
      Math.round(SEUIL_A_RENFORCER - t.taux),
    )
  }
  for (const p of priorites.filter((x) => x.domaines.length === 0 && x.axe)) {
    ajouter(p.axe as string, `Priorité relevée par les formateurs : ${p.texte}`, POIDS_PRIORITE)
  }

  return {
    sessions_analysees: lues.length,
    sessions_sans_detail: sessions.length - lues.length,
    themes_a_renforcer: faibles,
    themes_maitrises: maitrises,
    priorites,
    propositions: [...catalogue, ...surMesure.sort((a, b) => b.score - a.score)],
  }
}
