// ============================================
// Scoring déterministe du diagnostic entreprise
// ============================================

import type { AssessmentQuestion, DomainScore, NiveauCompetence } from '@/types/entreprise'

export function niveauFromPct(pct: number): NiveauCompetence {
  if (pct >= 90) return 'expert'
  if (pct >= 70) return 'avance'
  if (pct >= 40) return 'intermediaire'
  return 'debutant'
}

export const NIVEAU_LABELS: Record<NiveauCompetence, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert',
}

export interface ScoredAnswer {
  question_id: string
  domaine: string
  competence: string
  reponse_index: number
  est_correcte: boolean
  points_obtenus: number
  points_max: number
}

export interface ScoringResult {
  answers: ScoredAnswer[]
  score_global: number
  score_sur: number
  scores_domaines: Record<string, DomainScore>
}

/**
 * Calcule le score d'une soumission à partir des questions (avec bonne réponse)
 * et des réponses du salarié (index par question_id).
 */
export function scoreSubmission(
  questions: AssessmentQuestion[],
  reponses: Record<string, number>
): ScoringResult {
  const answers: ScoredAnswer[] = []
  const domAgg: Record<string, { obtenu: number; max: number }> = {}
  let global = 0
  let sur = 0

  for (const q of questions) {
    const idx = reponses[q.id]
    const correcte = idx === q.reponse_correcte
    const pts = correcte ? q.points : 0
    answers.push({
      question_id: q.id,
      domaine: q.domaine,
      competence: q.competence,
      reponse_index: typeof idx === 'number' ? idx : -1,
      est_correcte: correcte,
      points_obtenus: pts,
      points_max: q.points,
    })
    global += pts
    sur += q.points
    if (!domAgg[q.domaine]) domAgg[q.domaine] = { obtenu: 0, max: 0 }
    domAgg[q.domaine].obtenu += pts
    domAgg[q.domaine].max += q.points
  }

  const scores_domaines: Record<string, DomainScore> = {}
  for (const [dom, v] of Object.entries(domAgg)) {
    const pct = v.max > 0 ? Math.round((v.obtenu / v.max) * 100) : 0
    scores_domaines[dom] = { obtenu: v.obtenu, max: v.max, pct, niveau: niveauFromPct(pct) }
  }

  return { answers, score_global: global, score_sur: sur, scores_domaines }
}
