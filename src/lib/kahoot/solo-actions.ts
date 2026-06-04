'use server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Enregistre le score d'un élève ayant joué un Kahoot professeur en solo
 * (asynchrone, sans compte). Écriture via admin (joueurs anonymes).
 */
export async function saveKahootSoloResult(input: {
  kahoot_id: string
  pseudo: string
  score: number
  correct_count: number
  total_questions: number
}): Promise<{ success: boolean }> {
  const admin = createAdminClient()
  const { error } = await admin.from('kahoot_solo_results').insert({
    kahoot_id: input.kahoot_id,
    pseudo: input.pseudo.slice(0, 24),
    score: Math.max(0, Math.round(input.score)),
    correct_count: input.correct_count,
    total_questions: input.total_questions,
  })
  return { success: !error }
}
