import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { genererQuizFinal } from '@/lib/mistral'
import type { LessonQuizQuestion } from '@/types/formation'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Question valide ? (options cohérentes, bonne réponse dans les bornes). */
function isValid(q: LessonQuizQuestion): boolean {
  return (
    !!q?.question &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    typeof q.reponse_correcte === 'number' &&
    q.reponse_correcte >= 0 &&
    q.reponse_correcte < q.options.length
  )
}

/**
 * Crée un Kahoot professeur : génère les questions (format Kahoot) à partir
 * d'un contenu source combiné (texte + URL + PDF/DOC déjà extraits côté client),
 * puis enregistre le Kahoot pour le professeur.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!teacher) return NextResponse.json({ error: 'Profil professeur requis' }, { status: 403 })

  const body = await request.json()
  const titre = (body.titre ?? '').trim()
  const matiere = (body.matiere ?? '').trim() || null
  const niveau = (body.niveau ?? '').trim() || null
  const sourceContent = (body.source_content ?? '').trim()
  const nbQuestions = Math.min(20, Math.max(5, Number(body.nb_questions) || 10))

  if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
  if (sourceContent.length < 50) {
    return NextResponse.json({ error: 'Ajoutez une source de contenu suffisante (cours, lien, PDF…).' }, { status: 400 })
  }

  try {
    const result = await genererQuizFinal({
      formation_titre: titre,
      niveau: niveau ?? '',
      contenu: sourceContent,
    })
    const questions = ((result.questions ?? []) as LessonQuizQuestion[])
      .filter(isValid)
      .slice(0, nbQuestions)

    if (questions.length === 0) {
      return NextResponse.json({ error: 'La génération n\'a produit aucune question exploitable. Réessayez avec plus de contenu.' }, { status: 200 })
    }

    const { data: kahoot, error } = await supabase
      .from('teacher_kahoots')
      .insert({
        teacher_id: teacher.id,
        titre,
        matiere,
        niveau,
        source_content: sourceContent.slice(0, 20000),
        questions,
        nb_questions: questions.length,
        generation_status: 'done',
      })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 200 })

    return NextResponse.json({ success: true, kahoot_id: kahoot.id, count: questions.length })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur de génération'
    return NextResponse.json({ error: message }, { status: 200 })
  }
}
