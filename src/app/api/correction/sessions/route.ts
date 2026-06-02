import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runCorrectionSession } from '@/lib/workers/correction'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface EleveInput {
  nom: string
  prenom: string
  phone?: string
  parent_phone?: string
  files: string[] // chemins Supabase Storage
}

interface CreateSessionBody {
  titre: string
  matiere: string
  niveau: string
  class_id?: string
  bareme: { questions: Array<{ numero: number; enonce: string; reponse_attendue: string; points_max: number }> }
  eleves: EleveInput[]
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

  const body = (await request.json()) as CreateSessionBody

  // Créer la session
  const { data: session, error: sessionError } = await supabase
    .from('correction_sessions')
    .insert({
      teacher_id: teacher.id,
      class_id: body.class_id ?? null,
      titre: body.titre,
      matiere: body.matiere,
      niveau: body.niveau,
      bareme: body.bareme,
      nb_copies: body.eleves.length,
      status: 'processing',
    })
    .select()
    .single()

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  // Créer les jobs (une copie par élève)
  const jobs = body.eleves.map((e) => ({
    session_id: session.id,
    eleve_nom: e.nom,
    eleve_prenom: e.prenom,
    eleve_phone: e.phone ?? null,
    parent_phone: e.parent_phone ?? null,
    input_files: e.files,
    status: 'pending' as const,
  }))

  const { error: jobsError } = await supabase.from('correction_jobs').insert(jobs)
  if (jobsError) {
    return NextResponse.json({ error: jobsError.message }, { status: 500 })
  }

  // Lancer le worker en arrière-plan (Railway = pas de timeout)
  void runCorrectionSession(session.id)

  return NextResponse.json({ session_id: session.id, nb_jobs: jobs.length })
}
