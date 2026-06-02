import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runQcmGeneration } from '@/lib/workers/qcm'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface CreateDevoirBody {
  titre: string
  matiere: string
  niveau: string
  class_id?: string
  source_content: string
  nb_questions_qcm: number
  nb_questions_ouvertes: number
  duree_minutes: number
  difficulte: string
}

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

  const body = (await request.json()) as CreateDevoirBody

  const { data: devoir, error } = await supabase
    .from('qcm_devoirs')
    .insert({
      teacher_id: teacher.id,
      class_id: body.class_id ?? null,
      titre: body.titre,
      matiere: body.matiere,
      niveau: body.niveau,
      source_content: body.source_content,
      nb_questions_qcm: body.nb_questions_qcm,
      nb_questions_ouvertes: body.nb_questions_ouvertes,
      duree_minutes: body.duree_minutes,
      difficulte: body.difficulte,
      generation_status: 'pending',
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Génération en arrière-plan
  void runQcmGeneration(devoir.id)

  return NextResponse.json({ devoir_id: devoir.id })
}
