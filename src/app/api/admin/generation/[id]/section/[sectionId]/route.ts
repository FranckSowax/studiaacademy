import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { genererSection } from '@/lib/mistral'
import { syncLessonsFromGeneration } from '@/lib/formations/generation-actions'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Génère le contenu (paragraphe + quiz) d'UNE section.
 * Déclenché manuellement par l'admin, section par section.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const { id, sectionId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
  }

  const { data: gen } = await supabase.from('formation_generations').select('*').eq('id', id).single()
  if (!gen) return NextResponse.json({ error: 'Génération introuvable' }, { status: 404 })

  const { data: section } = await supabase
    .from('formation_generation_sections')
    .select('*')
    .eq('id', sectionId)
    .single()
  if (!section) return NextResponse.json({ error: 'Section introuvable' }, { status: 404 })

  await supabase
    .from('formation_generation_sections')
    .update({ status: 'generating', error_message: null })
    .eq('id', sectionId)

  try {
    const result = await genererSection({
      formation_titre: gen.titre,
      niveau: gen.niveau,
      sommaire: (gen.outline as { titre: string }[]) ?? [],
      section: {
        titre: section.titre,
        description: section.outline_description ?? '',
        points_cles: (section.points_cles as string[]) ?? [],
      },
      source_content: gen.source_content ?? '',
    })

    await supabase
      .from('formation_generation_sections')
      .update({
        content: result.content,
        quiz: result.quiz ?? [],
        duree_minutes: result.duree_minutes ?? 10,
        status: 'generated',
      })
      .eq('id', sectionId)

    // Si la formation est déjà publiée, refléter immédiatement la nouvelle section.
    if (gen.formation_id) {
      await syncLessonsFromGeneration(supabase, id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur génération'
    await supabase
      .from('formation_generation_sections')
      .update({ status: 'error', error_message: message })
      .eq('id', sectionId)
    return NextResponse.json({ error: message }, { status: 200 })
  }
}
