import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runCorrectionSession } from '@/lib/workers/correction'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface CopieInput {
  nom: string
  prenom: string
  phone?: string
  parent_phone?: string
  class_student_id?: string
  files: string[] // chemins Supabase Storage
}

interface CreateSessionBody {
  titre: string
  matiere: string
  niveau: string
  class_id?: string
  // Corrigé de référence (étape 2)
  bareme: { questions: Array<{ numero: number; enonce: string; reponse_attendue: string; points_max: number }> }
  corrige_reference?: string
  corrige_files?: string[]
  corrige_type?: 'manuel' | 'upload' | 'mixte'
  // Copies + élèves (étape 3)
  copies: CopieInput[]
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

  const hasBareme = (body.bareme?.questions?.length ?? 0) > 0
  const hasCorrige = Boolean(body.corrige_reference?.trim())
  if (!hasBareme && !hasCorrige) {
    return NextResponse.json(
      { error: 'Fournir un corrigé (upload OCR) ou un barème manuel' },
      { status: 400 }
    )
  }

  const corrigeType: 'manuel' | 'upload' | 'mixte' =
    hasBareme && hasCorrige ? 'mixte' : hasCorrige ? 'upload' : 'manuel'

  // Créer la session
  const { data: session, error: sessionError } = await supabase
    .from('correction_sessions')
    .insert({
      teacher_id: teacher.id,
      class_id: body.class_id ?? null,
      titre: body.titre,
      matiere: body.matiere,
      niveau: body.niveau,
      bareme: body.bareme ?? { questions: [] },
      corrige_reference: body.corrige_reference ?? null,
      corrige_files: body.corrige_files ?? [],
      corrige_type: corrigeType,
      nb_copies: body.copies.length,
      status: 'processing',
    })
    .select()
    .single()

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  // Créer les jobs (une copie par élève)
  const jobs = body.copies.map((c) => ({
    session_id: session.id,
    class_student_id: c.class_student_id ?? null,
    eleve_nom: c.nom,
    eleve_prenom: c.prenom,
    eleve_phone: c.phone ?? null,
    parent_phone: c.parent_phone ?? null,
    input_files: c.files,
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
