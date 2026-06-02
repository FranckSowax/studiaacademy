// ============================================
// Worker — Correction de copie
// OCR (Pixtral) → Correction (Mistral) → maj job
// ============================================

import { createAdminClient } from '@/lib/supabase/admin'
import { ocrCopie, corrigerCopie } from '@/lib/mistral'
import type { CorrectionResult, LearnedPatterns, FewShotExample, Bareme } from '@/types/teacher'

/**
 * Génère une URL signée pour un fichier du bucket privé "copies".
 */
async function getSignedUrls(paths: string[]): Promise<string[]> {
  const admin = createAdminClient()
  const urls: string[] = []
  for (const path of paths) {
    const { data } = await admin.storage
      .from('copies')
      .createSignedUrl(path, 600) // 10 min
    if (data?.signedUrl) urls.push(data.signedUrl)
  }
  return urls
}

/**
 * Traite un job de correction de bout en bout.
 * Met à jour le statut/progression en temps réel (Supabase Realtime).
 */
export async function runCorrectionJob(jobId: string): Promise<void> {
  const admin = createAdminClient()

  try {
    // 1. Charger le job + la session + le profil de correction
    await admin
      .from('correction_jobs')
      .update({ status: 'processing', progress: 10 })
      .eq('id', jobId)

    const { data: job } = await admin
      .from('correction_jobs')
      .select('*, correction_sessions(*, teacher_profiles(*))')
      .eq('id', jobId)
      .single()

    if (!job) throw new Error('Job introuvable')

    const session = job.correction_sessions
    const teacher = session.teacher_profiles

    const { data: correctionProfile } = await admin
      .from('correction_profiles')
      .select('*')
      .eq('teacher_id', teacher.id)
      .single()

    // 2. OCR des copies (Pixtral)
    const signedUrls = await getSignedUrls(job.input_files)
    if (signedUrls.length === 0) throw new Error('Aucun fichier accessible')

    await admin.from('correction_jobs').update({ progress: 35 }).eq('id', jobId)

    const ocrText = await ocrCopie(signedUrls)

    await admin
      .from('correction_jobs')
      .update({ ocr_text: ocrText, progress: 60 })
      .eq('id', jobId)

    // 3. Correction adaptative (Mistral)
    const profil: LearnedPatterns = correctionProfile?.learned_patterns ?? {}
    const fewShot: FewShotExample[] = correctionProfile?.few_shot_examples ?? []
    const bareme: Bareme = session.bareme ?? { questions: [] }

    const result: CorrectionResult = await corrigerCopie({
      profil_correcteur: profil,
      few_shot_examples: fewShot,
      bareme,
      corrige_reference: session.corrige_reference ?? undefined,
      ocr_copie: ocrText,
      eleve: {
        nom: job.eleve_nom ?? '',
        prenom: job.eleve_prenom ?? '',
      },
      matiere: session.matiere ?? '',
      niveau: session.niveau ?? '',
    })

    // 4. Sauvegarder le résultat
    await admin
      .from('correction_jobs')
      .update({
        status: 'done',
        progress: 100,
        result_json: result,
        note_finale: result.note_obtenue,
      })
      .eq('id', jobId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    await admin
      .from('correction_jobs')
      .update({ status: 'error', error_message: message })
      .eq('id', jobId)
    console.error(`[worker:correction] Job ${jobId} échoué:`, message)
  }
}

/**
 * Traite tous les jobs en attente d'une session, séquentiellement
 * (évite de saturer l'API Mistral).
 */
export async function runCorrectionSession(sessionId: string): Promise<void> {
  const admin = createAdminClient()
  const { data: jobs } = await admin
    .from('correction_jobs')
    .select('id')
    .eq('session_id', sessionId)
    .eq('status', 'pending')

  if (!jobs) return

  for (const job of jobs) {
    await runCorrectionJob(job.id)
  }

  await admin
    .from('correction_sessions')
    .update({ status: 'done' })
    .eq('id', sessionId)
}
