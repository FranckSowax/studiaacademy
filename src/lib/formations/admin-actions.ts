'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whapi'
import type { LessonType } from '@/types/formation'

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase, user: null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const ok = profile?.role === 'admin' || profile?.role === 'super_admin'
  return { ok, supabase, user }
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

// ── Formations CRUD ─────────────────────────

export async function saveFormation(input: {
  id?: string
  titre: string
  sous_titre?: string
  description?: string
  cover_image?: string
  categorie?: string
  niveau?: string
  duree_estimee?: string
  prix_fcfa?: number
  objectifs?: string[]
  prerequis?: string[]
  formateur_nom?: string
  formateur_bio?: string
  is_published?: boolean
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false, error: 'Accès admin requis' }

  const payload = {
    titre: input.titre,
    slug: slugify(input.titre) + '-' + Math.random().toString(36).slice(2, 6),
    sous_titre: input.sous_titre ?? null,
    description: input.description ?? null,
    cover_image: input.cover_image ?? null,
    categorie: input.categorie ?? null,
    niveau: input.niveau ?? 'Tous niveaux',
    duree_estimee: input.duree_estimee ?? null,
    prix_fcfa: input.prix_fcfa ?? 0,
    objectifs: input.objectifs ?? [],
    prerequis: input.prerequis ?? [],
    formateur_nom: input.formateur_nom ?? null,
    formateur_bio: input.formateur_bio ?? null,
    is_published: input.is_published ?? false,
  }

  if (input.id) {
    const { slug, ...updatable } = payload
    void slug
    const { error } = await supabase.from('formations').update(updatable).eq('id', input.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/formations')
    return { success: true, id: input.id }
  }

  const { data, error } = await supabase.from('formations').insert(payload).select('id').single()
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/formations')
  return { success: true, id: data.id }
}

export async function togglePublishFormation(id: string, publish: boolean) {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  await supabase.from('formations').update({ is_published: publish }).eq('id', id)
  revalidatePath('/admin/formations')
  revalidatePath('/formations/en-ligne')
  return { success: true }
}

export async function deleteFormation(id: string) {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  await supabase.from('formations').delete().eq('id', id)
  revalidatePath('/admin/formations')
  return { success: true }
}

// ── Leçons CRUD ─────────────────────────────

export async function saveLesson(input: {
  id?: string
  formation_id: string
  ordre: number
  titre: string
  type: LessonType
  video_url?: string
  contenu?: string
  document_url?: string
  duree_minutes?: number
  is_preview?: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false, error: 'Accès admin requis' }

  const payload = {
    formation_id: input.formation_id,
    ordre: input.ordre,
    titre: input.titre,
    type: input.type,
    video_url: input.video_url ?? null,
    contenu: input.contenu ?? null,
    document_url: input.document_url ?? null,
    duree_minutes: input.duree_minutes ?? 0,
    is_preview: input.is_preview ?? false,
  }

  const { error } = input.id
    ? await supabase.from('formation_lessons').update(payload).eq('id', input.id)
    : await supabase.from('formation_lessons').insert(payload)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/admin/formations/${input.formation_id}`)
  return { success: true }
}

export async function deleteLesson(id: string, formationId: string) {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  await supabase.from('formation_lessons').delete().eq('id', id)
  revalidatePath(`/admin/formations/${formationId}`)
  return { success: true }
}

// ── Validation des inscriptions ─────────────

export async function decideEnrollment(
  enrollmentId: string,
  decision: 'active' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase, user } = await assertAdmin()
  if (!ok || !user) return { success: false, error: 'Accès admin requis' }

  const { data: enr } = await supabase
    .from('formation_enrollments')
    .select('*, formations(titre, slug), profiles!formation_enrollments_user_id_fkey(full_name)')
    .eq('id', enrollmentId)
    .single()

  const { error } = await supabase
    .from('formation_enrollments')
    .update({
      status: decision,
      granted_at: decision === 'active' ? new Date().toISOString() : null,
      granted_by: user.id,
    })
    .eq('id', enrollmentId)
  if (error) return { success: false, error: error.message }

  // Notifier l'élève
  if (enr?.phone) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studiaacademy-production.up.railway.app'
    if (decision === 'active') {
      await sendWhatsApp(
        enr.phone,
        `🎉 Accès accordé !\nVotre formation *${enr.formations?.titre ?? ''}* est disponible.\n▶️ Commencez ici : ${baseUrl}/apprendre/${enr.formations?.slug ?? ''}\n— Studia Academy`
      )
    } else {
      await sendWhatsApp(
        enr.phone,
        `Bonjour, concernant votre demande pour *${enr.formations?.titre ?? ''}*, contactez-nous pour finaliser votre inscription. — Studia Academy`
      )
    }
  }

  revalidatePath('/admin/formations/inscriptions')
  return { success: true }
}

// ── Sessions présentiel CRUD ────────────────

export async function saveSession(input: {
  id?: string
  titre: string
  description?: string
  categorie?: string
  cover_image?: string
  date_debut: string
  date_fin?: string
  lieu?: string
  ville?: string
  places_total?: number
  prix_fcfa?: number
  formateur_nom?: string
  is_published?: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false, error: 'Accès admin requis' }

  const payload = {
    titre: input.titre,
    description: input.description ?? null,
    categorie: input.categorie ?? null,
    cover_image: input.cover_image ?? null,
    date_debut: input.date_debut,
    date_fin: input.date_fin ?? null,
    lieu: input.lieu ?? null,
    ville: input.ville ?? 'Libreville',
    places_total: input.places_total ?? 20,
    prix_fcfa: input.prix_fcfa ?? 0,
    formateur_nom: input.formateur_nom ?? null,
    is_published: input.is_published ?? false,
  }

  const { error } = input.id
    ? await supabase.from('presentiel_sessions').update(payload).eq('id', input.id)
    : await supabase.from('presentiel_sessions').insert(payload)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/presentiel')
  revalidatePath('/formations/presentiel')
  return { success: true }
}

export async function deleteSession(id: string) {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  await supabase.from('presentiel_sessions').delete().eq('id', id)
  revalidatePath('/admin/presentiel')
  return { success: true }
}
