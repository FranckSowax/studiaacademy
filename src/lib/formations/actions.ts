'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidPhone, normalizePhone, sendWhatsApp } from '@/lib/whatsapp'
import { consumeRateLimit, currentClientIp, RATE_LIMITS } from '@/lib/security/rate-limit'

// ── Côté élève ──────────────────────────────

/**
 * L'élève demande l'accès à une formation en ligne.
 * Notifie l'équipe Studia via WhatsApp.
 */
export async function requestEnrollment(input: {
  formation_id: string
  phone: string
  message?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connectez-vous pour demander l\'accès' }

  const { data: formation } = await supabase
    .from('formations')
    .select('titre')
    .eq('id', input.formation_id)
    .single()

  const { error } = await supabase.from('formation_enrollments').upsert(
    {
      formation_id: input.formation_id,
      user_id: user.id,
      phone: input.phone,
      message: input.message ?? null,
      status: 'pending',
    },
    { onConflict: 'formation_id,user_id' }
  )
  if (error) return { success: false, error: error.message }

  // Notifier l'équipe (numéro Studia)
  const studiaPhone = process.env.STUDIA_TEAM_PHONE
  if (studiaPhone) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()
    await sendWhatsApp(
      studiaPhone,
      `📚 Nouvelle demande de formation\n*${formation?.titre ?? ''}*\n👤 ${profile?.full_name ?? profile?.email}\n📱 ${input.phone}\n${input.message ? `💬 ${input.message}` : ''}`
    )
  }

  revalidatePath('/dashboard/formations')
  return { success: true }
}

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

/**
 * Réservation d'une place pour une session présentiel.
 * Fonctionne avec ou sans compte (user_id facultatif).
 */
export async function reserveSession(input: {
  session_id: string
  prenom: string
  nom: string
  email?: string
  phone: string
}): Promise<{ success: boolean; error?: string }> {
  const prenom = String(input.prenom ?? '').trim().slice(0, 60)
  const nom = String(input.nom ?? '').trim().slice(0, 60)
  const phone = normalizePhone(String(input.phone ?? ''))
  if (!prenom || !nom) return { success: false, error: 'Nom et prénom requis' }
  if (!isValidPhone(phone)) return { success: false, error: 'Numéro de téléphone invalide' }

  if (!(await consumeRateLimit(`reserve:ip:${await currentClientIp()}`, RATE_LIMITS.reservationPerIp))) {
    return { success: false, error: 'Trop de réservations. Réessayez plus tard.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // Réservation possible sans compte → client admin (RLS contournée côté serveur)
  const admin = createAdminClient()

  const { data: session } = await admin
    .from('presentiel_sessions')
    .select('titre, date_debut, lieu')
    .eq('id', input.session_id)
    .single()
  if (!session) return { success: false, error: 'Session introuvable' }

  // WHY: décrément atomique — deux réservations simultanées ne peuvent pas
  // dépasser places_total.
  const { data: seatOk, error: seatError } = await admin.rpc('reserve_presentiel_seat', {
    p_session_id: input.session_id,
  })
  if (seatError) return { success: false, error: 'Réservation indisponible' }
  if (seatOk !== true) return { success: false, error: 'Session complète' }

  const { error } = await admin.from('presentiel_reservations').insert({
    session_id: input.session_id,
    user_id: user?.id ?? null,
    prenom,
    nom,
    email: input.email ? String(input.email).slice(0, 200) : null,
    phone,
    status: 'reserved',
  })
  if (error) {
    await admin.rpc('release_presentiel_seat', { p_session_id: input.session_id })
    return { success: false, error: 'Réservation impossible' }
  }

  // Confirmation WhatsApp à l'élève (quota par destinataire) + notif équipe
  if (await consumeRateLimit(`wa:to:${phone}`, RATE_LIMITS.whatsappPerRecipient)) {
    await sendWhatsApp(
      phone,
      `✅ Réservation confirmée !\n*${session.titre}*\n📅 ${new Date(session.date_debut).toLocaleDateString('fr-FR', { dateStyle: 'long' })}\n📍 ${session.lieu ?? 'Libreville'}\nÀ bientôt chez Studia Academy 🎓`
    )
  }
  const studiaPhone = process.env.STUDIA_TEAM_PHONE
  if (studiaPhone) {
    await sendWhatsApp(
      studiaPhone,
      `🎟️ Nouvelle réservation présentiel\n*${session.titre}*\n👤 ${prenom} ${nom}\n📱 +${phone}`
    )
  }

  revalidatePath('/formations/presentiel')
  return { success: true }
}
