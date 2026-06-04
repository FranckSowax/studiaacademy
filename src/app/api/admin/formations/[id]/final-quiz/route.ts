import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { genererQuizFinal } from '@/lib/mistral'
import type { LessonQuizQuestion } from '@/types/formation'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TARGET = 10 // nombre de questions visées pour le Kahoot final

/** Mélange (Fisher-Yates). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Question valide ? (4 options, bonne réponse cohérente). */
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
 * Assemble le quiz final (Kahoot) d'une formation :
 * 1) pioche dans les questions déjà générées par leçon (réparties équitablement),
 * 2) complète par l'IA seulement s'il en manque pour atteindre TARGET.
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
    .select('titre, contenu, quiz')
    .eq('formation_id', id)
    .order('ordre', { ascending: true })

  // 1) Banque de questions par leçon → sélection répartie (round-robin) puis mélange.
  const pools = (lessons ?? []).map((l) =>
    shuffle(((l.quiz as LessonQuizQuestion[]) ?? []).filter(isValid))
  )
  const picked: LessonQuizQuestion[] = []
  const seen = new Set<string>()
  let added = true
  while (added && picked.length < TARGET) {
    added = false
    for (const pool of pools) {
      if (picked.length >= TARGET) break
      const q = pool.shift()
      if (!q) continue
      const key = q.question.trim().toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      picked.push(q)
      added = true
    }
  }

  // 2) Compléter par l'IA s'il manque des questions (et qu'il y a du contenu).
  let aiAdded = 0
  if (picked.length < TARGET) {
    const contenu = (lessons ?? [])
      .map((l) => `## ${l.titre}\n${l.contenu ?? ''}`)
      .join('\n\n')

    if (contenu.trim().length >= 50) {
      try {
        const result = await genererQuizFinal({
          formation_titre: formation.titre,
          niveau: formation.niveau ?? '',
          contenu,
        })
        for (const q of (result.questions ?? []) as LessonQuizQuestion[]) {
          if (picked.length >= TARGET) break
          if (!isValid(q)) continue
          const key = q.question.trim().toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          picked.push(q)
          aiAdded++
        }
      } catch {
        // On garde au moins les questions des leçons.
      }
    }
  }

  if (picked.length === 0) {
    return NextResponse.json(
      { error: "Aucune question disponible : générez d'abord les leçons (avec leurs quiz)." },
      { status: 200 }
    )
  }

  const finalQuiz = shuffle(picked)
  await supabase
    .from('formations')
    .update({ final_quiz: finalQuiz, final_quiz_generated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({
    success: true,
    count: finalQuiz.length,
    fromLessons: finalQuiz.length - aiAdded,
    fromAI: aiAdded,
  })
}
