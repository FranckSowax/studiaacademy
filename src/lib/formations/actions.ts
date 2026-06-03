'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp } from '@/lib/whapi'

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
    .select('progress')
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // Réservation possible sans compte → client admin (RLS contournée côté serveur)
  const admin = createAdminClient()

  // Vérifier places disponibles
  const { data: session } = await admin
    .from('presentiel_sessions')
    .select('titre, places_total, places_reservees, date_debut, lieu')
    .eq('id', input.session_id)
    .single()
  if (!session) return { success: false, error: 'Session introuvable' }
  if (session.places_reservees >= session.places_total) {
    return { success: false, error: 'Session complète' }
  }

  const { error } = await admin.from('presentiel_reservations').insert({
    session_id: input.session_id,
    user_id: user?.id ?? null,
    prenom: input.prenom,
    nom: input.nom,
    email: input.email ?? null,
    phone: input.phone,
    status: 'reserved',
  })
  if (error) return { success: false, error: error.message }

  await admin
    .from('presentiel_sessions')
    .update({ places_reservees: session.places_reservees + 1 })
    .eq('id', input.session_id)

  // Confirmation WhatsApp à l'élève + notif équipe
  await sendWhatsApp(
    input.phone,
    `✅ Réservation confirmée !\n*${session.titre}*\n📅 ${new Date(session.date_debut).toLocaleDateString('fr-FR', { dateStyle: 'long' })}\n📍 ${session.lieu ?? 'Libreville'}\nÀ bientôt chez Studia Academy 🎓`
  )
  const studiaPhone = process.env.STUDIA_TEAM_PHONE
  if (studiaPhone) {
    await sendWhatsApp(
      studiaPhone,
      `🎟️ Nouvelle réservation présentiel\n*${session.titre}*\n👤 ${input.prenom} ${input.nom}\n📱 ${input.phone}`
    )
  }

  revalidatePath('/formations/presentiel')
  return { success: true }
}
