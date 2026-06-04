'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { buildQuestionSet } from './competences'
import type { CompanyProfile } from '@/types/entreprise'

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = ''
  for (let i = 0; i < 6; i++) c += chars[Math.floor((globalThis.crypto?.getRandomValues?.(new Uint32Array(1))?.[0] ?? 0) % chars.length)]
  return c
}

/** Récupère le profil entreprise de l'utilisateur courant (ou null). */
export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('company_profiles').select('*').eq('user_id', user.id).maybeSingle()
  return data as CompanyProfile | null
}

/** Crée ou met à jour le profil entreprise. */
export async function saveCompanyProfile(input: {
  nom_entreprise: string
  secteur?: string
  effectif_estime?: string
  ville?: string
  contact_nom?: string
  contact_phone?: string
  contact_email?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connexion requise' }
  if (!input.nom_entreprise?.trim()) return { success: false, error: 'Nom de l\'entreprise requis' }

  const { error } = await supabase.from('company_profiles').upsert(
    { user_id: user.id, ...input, nom_entreprise: input.nom_entreprise.trim() },
    { onConflict: 'user_id' }
  )
  if (error) return { success: false, error: error.message }
  revalidatePath('/entreprise/diagnostic')
  return { success: true }
}

/** Crée un diagnostic (test) : snapshot des questions, code + lien, statut ouvert. */
export async function createAssessment(input: {
  titre: string
  description?: string
  domaines: string[]
  niveau_cible?: string
  seuil_analyse?: number
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connexion requise' }

  const { data: company } = await supabase.from('company_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) return { success: false, error: 'Profil entreprise requis' }
  if (!input.titre?.trim()) return { success: false, error: 'Titre requis' }
  if (!input.domaines || input.domaines.length === 0) return { success: false, error: 'Sélectionnez au moins un domaine' }

  const questions = buildQuestionSet(input.domaines)
  if (questions.length === 0) return { success: false, error: 'Aucune question pour ces domaines' }
  const total_points = questions.reduce((s, q) => s + q.points, 0)

  // code unique
  let access_code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: exist } = await supabase.from('company_assessments').select('id').eq('access_code', access_code).maybeSingle()
    if (!exist) break
    access_code = genCode()
  }

  const { data, error } = await supabase
    .from('company_assessments')
    .insert({
      company_id: company.id,
      created_by: user.id,
      titre: input.titre.trim(),
      description: input.description ?? null,
      domaines: input.domaines,
      niveau_cible: input.niveau_cible ?? null,
      questions,
      total_points,
      access_code,
      seuil_analyse: input.seuil_analyse ?? 5,
      status: 'open',
    })
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/entreprise/diagnostic')
  return { success: true, id: data.id }
}

/** Ouvre / ferme un diagnostic. */
export async function setAssessmentStatus(id: string, status: 'open' | 'closed'): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }
  await supabase.from('company_assessments').update({ status }).eq('id', id)
  revalidatePath(`/entreprise/diagnostic/${id}`)
  return { success: true }
}
