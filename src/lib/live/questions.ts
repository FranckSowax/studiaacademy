// ============================================
// Séparation questions publiques / bonnes réponses pour le jeu live
// ============================================

import type { LessonQuizQuestion } from '@/types/formation'

/** Question telle que visible par les joueurs (sans réponse ni explication). */
export type PublicLiveQuestion = Pick<LessonQuizQuestion, 'question' | 'options'>

/**
 * Retire bonnes réponses et explications d'un jeu de questions.
 *
 * @example
 * const { publicQuestions, answers } = splitLiveQuestions(formation.final_quiz)
 */
export function splitLiveQuestions(questions: LessonQuizQuestion[]): {
  publicQuestions: PublicLiveQuestion[]
  answers: number[]
} {
  const publicQuestions: PublicLiveQuestion[] = []
  const answers: number[] = []
  for (const q of questions) {
    publicQuestions.push({ question: q.question, options: [...q.options] })
    answers.push(q.reponse_correcte)
  }
  return { publicQuestions, answers }
}

/**
 * Supprime les champs sensibles d'un tableau de questions potentiellement
 * complet (parties créées avant la séparation des réponses).
 */
export function stripLiveAnswers(questions: unknown): PublicLiveQuestion[] {
  if (!Array.isArray(questions)) return []
  return questions.map((q) => {
    const { question, options } = (q ?? {}) as Partial<LessonQuizQuestion>
    return { question: question ?? '', options: Array.isArray(options) ? [...options] : [] }
  })
}

/**
 * Bonne réponse d'une question : table secrète en priorité, sinon
 * ancien format (réponse stockée dans la question).
 */
export function answerAt(
  index: number,
  secretAnswers: unknown,
  legacyQuestions: unknown,
): number | null {
  if (Array.isArray(secretAnswers) && typeof secretAnswers[index] === 'number') {
    return secretAnswers[index] as number
  }
  if (Array.isArray(legacyQuestions)) {
    const legacy = (legacyQuestions[index] as Partial<LessonQuizQuestion> | undefined)?.reponse_correcte
    if (typeof legacy === 'number') return legacy
  }
  return null
}
