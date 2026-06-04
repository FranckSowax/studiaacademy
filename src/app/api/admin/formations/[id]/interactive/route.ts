import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { genererLeconInteractive } from '@/lib/mistral'
import type { LessonQuizQuestion } from '@/types/formation'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Génère le cours interactif (blocs + questions tissées) pour chaque leçon
 * texte d'une formation existante.
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

  const { data: formation } = await supabase.from('formations').select('niveau').eq('id', id).single()
  if (!formation) return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 })

  const { data: lessons } = await supabase
    .from('formation_lessons')
    .select('id, titre, contenu, quiz')
    .eq('formation_id', id)
    .order('ordre', { ascending: true })

  const eligibles = (lessons ?? []).filter((l) => (l.contenu ?? '').trim().length > 80)
  if (eligibles.length === 0) {
    return NextResponse.json({ error: 'Aucune leçon texte à rendre interactive.' }, { status: 200 })
  }

  let done = 0
  for (const l of eligibles) {
    try {
      const inter = await genererLeconInteractive({
        titre: l.titre as string,
        niveau: formation.niveau ?? '',
        contenu: l.contenu as string,
        quiz: (l.quiz as LessonQuizQuestion[]) ?? [],
      })
      const blocks = Array.isArray(inter.blocks) ? inter.blocks : []
      if (blocks.length > 0) {
        await supabase.from('formation_lessons').update({ blocks }).eq('id', l.id)
        done++
      }
    } catch {
      // On continue avec les autres leçons.
    }
  }

  return NextResponse.json({ success: true, count: done, total: eligibles.length })
}
