import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { genererQuizFinal } from '@/lib/mistral'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Génère (ou régénère) le quiz final IA d'une formation à partir de ses leçons.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
  }

  const { data: formation } = await supabase.from('formations').select('titre, niveau').eq('id', id).single()
  if (!formation) return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 })

  const { data: lessons } = await supabase
    .from('formation_lessons')
    .select('titre, contenu')
    .eq('formation_id', id)
    .order('ordre', { ascending: true })

  const contenu = (lessons ?? [])
    .map((l) => `## ${l.titre}\n${l.contenu ?? ''}`)
    .join('\n\n')

  if (contenu.trim().length < 50) {
    return NextResponse.json({ error: 'La formation n\'a pas assez de contenu pour générer un quiz.' }, { status: 400 })
  }

  try {
    const result = await genererQuizFinal({
      formation_titre: formation.titre,
      niveau: formation.niveau ?? '',
      contenu,
    })

    await supabase
      .from('formations')
      .update({ final_quiz: result.questions ?? [], final_quiz_generated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ success: true, count: result.questions?.length ?? 0 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur de génération'
    return NextResponse.json({ error: message }, { status: 200 })
  }
}
