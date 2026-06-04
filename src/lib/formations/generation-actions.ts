'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { OutlineSection } from '@/types/generation'

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase, user: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { ok: profile?.role === 'admin' || profile?.role === 'super_admin', supabase, user }
}

/**
 * Valide (et éventuellement édite) le sommaire, puis crée les sections.
 */
export async function validateOutline(
  generationId: string,
  outline: OutlineSection[]
): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false, error: 'Accès admin requis' }

  // Sauvegarder l'outline + statut
  await supabase
    .from('formation_generations')
    .update({ outline, status: 'outline_validated' })
    .eq('id', generationId)

  // Recréer les sections depuis l'outline validé
  await supabase.from('formation_generation_sections').delete().eq('generation_id', generationId)
  const rows = outline.map((s, i) => ({
    generation_id: generationId,
    ordre: i + 1,
    titre: s.titre,
    outline_description: s.description,
    points_cles: s.points_cles ?? [],
    status: 'pending' as const,
  }))
  const { error } = await supabase.from('formation_generation_sections').insert(rows)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/admin/formations/generer/${generationId}`)
  return { success: true }
}

/**
 * Met à jour le contenu/quiz d'une section après revue manuelle.
 */
export async function saveSectionEdit(
  sectionId: string,
  generationId: string,
  patch: { titre?: string; content?: string }
): Promise<{ success: boolean }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  await supabase
    .from('formation_generation_sections')
    .update({ ...patch, status: 'validated' })
    .eq('id', sectionId)
  revalidatePath(`/admin/formations/generer/${generationId}`)
  return { success: true }
}

/**
 * Supprime un brouillon de génération.
 */
export async function deleteGeneration(id: string): Promise<{ success: boolean }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  await supabase.from('formation_generations').delete().eq('id', id)
  revalidatePath('/admin/formations')
  return { success: true }
}

/**
 * Publie la génération : crée une formation (brouillon) + ses leçons
 * (chaque section = une leçon texte + son quiz de 5 questions).
 */
export async function publishGeneration(
  generationId: string
): Promise<{ success: boolean; error?: string; formationId?: string }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false, error: 'Accès admin requis' }

  const { data: gen } = await supabase
    .from('formation_generations')
    .select('*')
    .eq('id', generationId)
    .single()
  if (!gen) return { success: false, error: 'Génération introuvable' }

  const { data: sections } = await supabase
    .from('formation_generation_sections')
    .select('*')
    .eq('generation_id', generationId)
    .order('ordre', { ascending: true })

  const generated = (sections ?? []).filter((s) => s.content)
  if (generated.length === 0) {
    return { success: false, error: 'Aucune section générée à publier' }
  }

  // Si déjà publiée : on met à jour la formation existante (pas de doublon).
  let formationId = gen.formation_id as string | null

  if (formationId) {
    // Re-synchronise les leçons depuis le sommaire (l'atelier est la source).
    await supabase.from('formation_lessons').delete().eq('formation_id', formationId)
  } else {
    // Première publication : créer la formation publiée.
    const slug =
      gen.titre
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 50) +
      '-' +
      Math.random().toString(36).slice(2, 6)

    const { data: formation, error: fErr } = await supabase
      .from('formations')
      .insert({
        slug,
        titre: gen.titre,
        sous_titre: gen.objectif ?? null,
        categorie: gen.matiere ?? null,
        niveau: gen.niveau,
        description: `Formation générée à partir de ${gen.source_type ?? 'une source'}.`,
        is_published: true,
      })
      .select('id')
      .single()
    if (fErr) return { success: false, error: fErr.message }
    formationId = formation.id
  }

  // Créer une leçon par section (texte + quiz embarqué)
  const lessons = generated.map((s, i) => ({
    formation_id: formationId,
    ordre: i + 1,
    titre: s.titre,
    type: 'texte' as const,
    contenu: s.content,
    quiz: s.quiz ?? [],
    duree_minutes: s.duree_minutes ?? 10,
    is_preview: i === 0, // 1ère leçon en aperçu gratuit
  }))
  const { error: lErr } = await supabase.from('formation_lessons').insert(lessons)
  if (lErr) return { success: false, error: lErr.message }

  await supabase
    .from('formation_generations')
    .update({ status: 'published', formation_id: formationId })
    .eq('id', generationId)

  revalidatePath('/admin/formations')
  revalidatePath('/formations/en-ligne')
  revalidatePath('/formations')
  return { success: true, formationId: formationId ?? undefined }
}
