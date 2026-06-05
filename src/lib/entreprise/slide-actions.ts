'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { ok: me?.role === 'admin' || me?.role === 'super_admin', supabase }
}

export interface SlideInput {
  id?: string
  ordre?: number
  titre: string
  sous_titre?: string
  texte?: string
  cta_label?: string
  cta_href?: string
  image_url?: string
  side?: string
  couleur?: string
  is_active?: boolean
}

export async function saveSlide(input: SlideInput): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false, error: 'Accès admin requis' }
  if (!input.titre?.trim()) return { success: false, error: 'Titre requis' }

  const payload = {
    titre: input.titre.trim(),
    sous_titre: input.sous_titre ?? null,
    texte: input.texte ?? null,
    cta_label: input.cta_label ?? null,
    cta_href: input.cta_href ?? null,
    image_url: input.image_url ?? null,
    side: input.side ?? 'right',
    couleur: input.couleur ?? '#7C3AED',
    is_active: input.is_active ?? true,
    ordre: input.ordre ?? 0,
  }
  const { error } = input.id
    ? await supabase.from('entreprise_slides').update(payload).eq('id', input.id)
    : await supabase.from('entreprise_slides').insert(payload)
  if (error) return { success: false, error: error.message }

  revalidatePath('/entreprise')
  revalidatePath('/admin/entreprise/slides')
  return { success: true }
}

export async function deleteSlide(id: string): Promise<{ success: boolean }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  await supabase.from('entreprise_slides').delete().eq('id', id)
  revalidatePath('/entreprise')
  revalidatePath('/admin/entreprise/slides')
  return { success: true }
}

export async function moveSlide(id: string, dir: 'up' | 'down'): Promise<{ success: boolean }> {
  const { ok, supabase } = await assertAdmin()
  if (!ok) return { success: false }
  const { data: all } = await supabase.from('entreprise_slides').select('id, ordre').order('ordre', { ascending: true })
  const list = all ?? []
  const i = list.findIndex((s) => s.id === id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= list.length) return { success: false }
  const a = list[i], b = list[j]
  await supabase.from('entreprise_slides').update({ ordre: b.ordre }).eq('id', a.id)
  await supabase.from('entreprise_slides').update({ ordre: a.ordre }).eq('id', b.id)
  revalidatePath('/entreprise')
  revalidatePath('/admin/entreprise/slides')
  return { success: true }
}
