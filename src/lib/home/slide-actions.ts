'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { MAX_HOME_SLIDES } from '@/lib/home/slides'

export interface HomeSlideInput {
  id?: string
  titre: string
  sous_titre?: string | null
  texte?: string | null
  cta_label?: string | null
  cta_href?: string | null
  image_url?: string | null
  is_active?: boolean
}

type Result = { success: boolean; error?: string }

// Lien interne (/formations) ou externe en https — jamais javascript:, data:, //hôte…
const SAFE_URL = /^(\/[^/]|\/$|https:\/\/)/

const clean = (v: string | null | undefined, max: number) => {
  const t = (v ?? '').trim().slice(0, max)
  return t === '' ? null : t
}

/** Client Supabase de l'utilisateur, uniquement s'il est admin (les policies RLS revérifient). */
async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: isAdmin } = await supabase.rpc('is_admin')
  return isAdmin === true ? supabase : null
}

function revalidate() {
  revalidatePath('/')
  revalidatePath('/admin/accueil')
}

export async function saveHomeSlide(input: HomeSlideInput): Promise<Result> {
  const supabase = await adminClient()
  if (!supabase) return { success: false, error: 'Accès admin requis' }

  const titre = clean(input.titre, 120)
  if (!titre) return { success: false, error: 'Titre requis' }

  const ctaHref = clean(input.cta_href, 500)
  const imageUrl = clean(input.image_url, 1000)
  if (ctaHref && !SAFE_URL.test(ctaHref)) {
    return { success: false, error: 'Lien du bouton invalide : utilisez /page ou https://…' }
  }
  if (imageUrl && !SAFE_URL.test(imageUrl)) {
    return { success: false, error: "URL de l'image invalide : utilisez https://…" }
  }

  const payload = {
    titre,
    sous_titre: clean(input.sous_titre, 160),
    texte: clean(input.texte, 400),
    cta_label: clean(input.cta_label, 40),
    cta_href: ctaHref,
    image_url: imageUrl,
    is_active: input.is_active ?? true,
  }

  if (input.id) {
    const { error } = await supabase.from('home_slides').update(payload).eq('id', input.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { data: existing, error: listError } = await supabase.from('home_slides').select('ordre')
    if (listError) return { success: false, error: listError.message }
    if ((existing ?? []).length >= MAX_HOME_SLIDES) {
      return { success: false, error: `Maximum ${MAX_HOME_SLIDES} slides. Supprimez-en un pour en ajouter.` }
    }
    const ordre = Math.max(-1, ...(existing ?? []).map((s) => s.ordre as number)) + 1
    const { error } = await supabase.from('home_slides').insert({ ...payload, ordre })
    if (error) return { success: false, error: error.message }
  }

  revalidate()
  return { success: true }
}

export async function deleteHomeSlide(id: string): Promise<Result> {
  const supabase = await adminClient()
  if (!supabase) return { success: false, error: 'Accès admin requis' }
  const { error } = await supabase.from('home_slides').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidate()
  return { success: true }
}

export async function moveHomeSlide(id: string, dir: 'up' | 'down'): Promise<Result> {
  const supabase = await adminClient()
  if (!supabase) return { success: false, error: 'Accès admin requis' }

  const { data, error } = await supabase
    .from('home_slides')
    .select('id')
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return { success: false, error: error.message }

  const ids = (data ?? []).map((s) => s.id as string)
  const i = ids.indexOf(id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= ids.length) return { success: false, error: 'Déplacement impossible' }
  ;[ids[i], ids[j]] = [ids[j], ids[i]]

  // Renumérotation complète : robuste même si des ordres étaient en doublon.
  for (const [ordre, slideId] of ids.entries()) {
    const { error: updateError } = await supabase.from('home_slides').update({ ordre }).eq('id', slideId)
    if (updateError) return { success: false, error: updateError.message }
  }

  revalidate()
  return { success: true }
}
