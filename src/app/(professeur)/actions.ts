'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TeacherProfile } from '@/types/teacher'

/**
 * Récupère le profil professeur de l'utilisateur courant (ou null).
 */
export async function getTeacherProfile(): Promise<TeacherProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data as TeacherProfile | null
}

/**
 * Active le mode professeur + crée le profil + le profil de correction initial.
 */
export async function activateTeacherMode(formData: {
  matiere: string
  niveau_enseignement: string
  etablissement: string
  ville: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // Créer le profil professeur
  const { data: teacherProfile, error: tpError } = await supabase
    .from('teacher_profiles')
    .upsert(
      {
        user_id: user.id,
        matiere: formData.matiere,
        niveau_enseignement: formData.niveau_enseignement,
        etablissement: formData.etablissement,
        ville: formData.ville || 'Libreville',
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (tpError) return { success: false, error: tpError.message }

  // Créer le profil de correction par défaut
  await supabase.from('correction_profiles').upsert(
    {
      teacher_id: teacherProfile.id,
      wizard_config: {
        severite: 'standard',
        points_partiels: 'demi_points',
        tolerance_ortho: 'mineure',
        valorise_demarche: true,
      },
      version: 0,
    },
    { onConflict: 'teacher_id' }
  )

  // Marquer le profil utilisateur
  await supabase
    .from('profiles')
    .update({ is_teacher: true, teacher_onboarding_done: true })
    .eq('id', user.id)

  revalidatePath('/professeur')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Crée une classe.
 */
export async function createClasse(data: {
  nom: string
  niveau: string
  annee_scolaire: string
  nb_eleves: number
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: tp } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!tp) return { success: false, error: 'Profil professeur introuvable' }

  const { error } = await supabase.from('classes').insert({
    teacher_id: tp.id,
    nom: data.nom,
    niveau: data.niveau,
    annee_scolaire: data.annee_scolaire,
    nb_eleves: data.nb_eleves,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/professeur/classes')
  return { success: true }
}

/**
 * Supprime une classe.
 */
export async function deleteClasse(classeId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false }

  await supabase.from('classes').delete().eq('id', classeId)
  revalidatePath('/professeur/classes')
  return { success: true }
}

/**
 * Met à jour le profil de correction (wizard).
 */
export async function updateCorrectionWizard(config: {
  severite: string
  points_partiels: string
  tolerance_ortho: string
  valorise_demarche: boolean
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: tp } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!tp) return { success: false, error: 'Profil professeur introuvable' }

  const { error } = await supabase
    .from('correction_profiles')
    .update({ wizard_config: config })
    .eq('teacher_id', tp.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/professeur/correction/profil')
  return { success: true }
}
