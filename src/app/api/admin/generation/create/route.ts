import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractSource, type SourceInput } from '@/lib/formations/source-extract'
import { genererSommaire } from '@/lib/mistral'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface Body {
  titre: string
  niveau: string
  objectif?: string
  matiere?: string
  source: SourceInput
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
  }

  const body = (await request.json()) as Body

  // Créer l'enregistrement (statut extracting)
  const { data: gen, error } = await supabase
    .from('formation_generations')
    .insert({
      created_by: user.id,
      titre: body.titre,
      niveau: body.niveau,
      objectif: body.objectif ?? null,
      matiere: body.matiere ?? null,
      source_type: body.source.type,
      status: 'extracting',
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    // 1. Extraire le texte de la source
    const sourceContent = await extractSource(body.source)
    if (!sourceContent.trim()) throw new Error('Aucun contenu extrait de la source')

    await supabase
      .from('formation_generations')
      .update({ source_content: sourceContent })
      .eq('id', gen.id)

    // 2. Générer le sommaire
    const outline = await genererSommaire({
      titre: body.titre,
      niveau: body.niveau,
      objectif: body.objectif,
      source_content: sourceContent,
    })

    await supabase
      .from('formation_generations')
      .update({ outline: outline.sections ?? [], status: 'outline_ready' })
      .eq('id', gen.id)

    return NextResponse.json({ generation_id: gen.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur'
    await supabase
      .from('formation_generations')
      .update({ status: 'extracting', error_message: message })
      .eq('id', gen.id)
    return NextResponse.json({ error: message, generation_id: gen.id }, { status: 200 })
  }
}
