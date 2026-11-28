'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { accesFormationAutorise } from '@/lib/formations/free-access'

// ── Côté élève ──────────────────────────────

// L'inscription à une formation PAYANTE (mode de paiement, preuve Airtel Money)
// passe par POST /api/formations/inscription : voir src/app/api/formations/inscription/route.ts.

/**
 * Inscription immédiate à une formation gratuite (compte Studia suffisant).
 * Aucune validation manuelle / WhatsApp : l'accès est accordé directement.
 */
export async function enrollFree(
  formationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connectez-vous pour accéder à la formation' }

  // Sécurité : ne pas accorder l'accès gratuit à une formation payante
  const { data: formation } = await supabase
    .from('formations')
    .select('prix_fcfa')
    .eq('id', formationId)
    .single()
  if (!formation) return { success: false, error: 'Formation introuvable' }
  if ((formation.prix_fcfa ?? 0) > 0) return { success: false, error: 'Cette formation est payante' }
  // Formations gratuites pas encore ouvertes au public : comptes autorisés uniquement.
  if (!accesFormationAutorise(formation, user.email)) {
    return { success: false, error: "Cette formation n'est pas encore ouverte aux inscriptions." }
  }

  const { error } = await supabase.from('formation_enrollments').upsert(
    {
      formation_id: formationId,
      user_id: user.id,
      status: 'active',
    },
    { onConflict: 'formation_id,user_id' }
  )
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/formations')
  return { success: true }
}

/**
 * Marque une leçon comme complétée (progression).
 */
export async function toggleLessonComplete(
  enrollmentId: string,
  lessonId: string,
  completed: boolean
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: enr } = await supabase
    .from('formation_enrollments')
    .select('progress, formation_id')
    .eq('id', enrollmentId)
    .eq('user_id', user.id)
    .single()
  if (!enr) return { success: false }

  const current = (enr.progress as string[]) ?? []
  const next = completed
    ? Array.from(new Set([...current, lessonId]))
    : current.filter((id) => id !== lessonId)

  await supabase
    .from('formation_enrollments')
    .update({ progress: next })
    .eq('id', enrollmentId)
    .eq('user_id', user.id)

  // Journal daté des complétions (pour le classement / l'évolution)
  if (completed) {
    await supabase.from('lesson_completions').upsert(
      { user_id: user.id, formation_id: enr.formation_id, lesson_id: lessonId },
      { onConflict: 'user_id,lesson_id' }
    )
  } else {
    await supabase.from('lesson_completions').delete().eq('user_id', user.id).eq('lesson_id', lessonId)
  }

  return { success: true }
}

/**
 * Enregistre le résultat du quiz final (Kahoot) d'une formation.
 */
export async function saveFinalQuizResult(input: {
  formation_id: string
  score: number
  max_score: number
  correct_count: number
  total_questions: number
  duree_secondes: number
}): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false }

  await supabase.from('formation_quiz_results').insert({
    formation_id: input.formation_id,
    user_id: user.id,
    score: input.score,
    max_score: input.max_score,
    correct_count: input.correct_count,
    total_questions: input.total_questions,
    duree_secondes: input.duree_secondes,
  })
  return { success: true }
}

// La réservation d'un événement en présentiel (payant ou non) passe par
// POST /api/evenements/inscription : voir src/app/api/evenements/inscription/route.ts.
