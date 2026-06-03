'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { KeyFigure } from '@/types/labs'

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { ok: profile?.role === 'admin' || profile?.role === 'super_admin', supabase }
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
}

export async function saveSolution(input: {
  id?: string
  nom: string
  tagline?: string
  description?: string
  logo_url?: string
  cover_image?: string
  video_url?: string
  app_url?: string
  categorie?: string
  badge?: string
  has_detail_page?: boolean
  key_figures?: KeyFigure[]
  features?: string[]
  is_published?: boolean
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false, error: 'Accès admin requis' }

  const base = {
    nom: input.nom,
    tagline: input.tagline ?? null,
    description: input.description ?? null,
    logo_url: input.logo_url ?? null,
    cover_image: input.cover_image ?? null,
    video_url: input.video_url ?? null,
    app_url: input.app_url ?? null,
    categorie: input.categorie ?? null,
    badge: input.badge ?? null,
    has_detail_page: input.has_detail_page ?? true,
    key_figures: input.key_figures ?? [],
    features: input.features ?? [],
    is_published: input.is_published ?? false,
  }

  if (input.id) {
    const { error } = await supabase.from('labs_solutions').update(base).eq('id', input.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/labs')
    revalidatePath('/studia-labs')
    return { success: true, id: input.id }
  }

  const { data, error } = await supabase
    .from('labs_solutions')
    .insert({ ...base, slug: slugify(input.nom) + '-' + Math.random().toString(36).slice(2, 6) })
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/labs')
  revalidatePath('/studia-labs')
  return { success: true, id: data.id }
}

export async function togglePublishSolution(id: string, publish: boolean) {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  await supabase.from('labs_solutions').update({ is_published: publish }).eq('id', id)
  revalidatePath('/admin/labs')
  revalidatePath('/studia-labs')
  return { success: true }
}

export async function deleteSolution(id: string) {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  await supabase.from('labs_solutions').delete().eq('id', id)
  revalidatePath('/admin/labs')
  return { success: true }
}
