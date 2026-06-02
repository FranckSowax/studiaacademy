// ============================================
// Workers — QCM (génération + correction)
// ============================================

import { createAdminClient } from '@/lib/supabase/admin'
import { genererQCM, analyserReponseTexte } from '@/lib/mistral'
import type { Question, QcmDevoir } from '@/types/teacher'

/**
 * Génère un code d'accès lisible : MATIERE-XXX (ex: MATHS-7A3).
 */
function genererAccessCode(matiere: string): string {
  const prefix = (matiere || 'DEV')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 5)
    .toUpperCase()
  const suffix = Array.from({ length: 3 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('')
  return `${prefix}-${suffix}`
}

/**
 * Génère le QCM d'un devoir (statut generation_status).
 */
export async function runQcmGeneration(devoirId: string): Promise<void> {
  const admin = createAdminClient()

  try {
    await admin
      .from('qcm_devoirs')
      .update({ generation_status: 'processing' })
      .eq('id', devoirId)

    const { data: devoir } = await admin
      .from('qcm_devoirs')
      .select('*')
      .eq('id', devoirId)
      .single()

    if (!devoir) throw new Error('Devoir introuvable')

    // Garde-fou : borner le contenu source pour ne pas saturer le contexte
    // (un PDF volumineux peut produire beaucoup de texte). 60k caractères
    // couvrent largement un cours tout en restant économes en tokens.
    const MAX_SOURCE_CHARS = 60000
    let source = devoir.source_content ?? ''
    if (source.length > MAX_SOURCE_CHARS) {
      source = source.slice(0, MAX_SOURCE_CHARS) + '\n\n[…contenu tronqué pour la génération…]'
    }

    const result = await genererQCM({
      source_content: source,
      matiere: devoir.matiere ?? '',
      niveau: devoir.niveau ?? '',
      nb_qcm: devoir.nb_questions_qcm,
      nb_texte_court: Math.ceil(devoir.nb_questions_ouvertes / 2),
      nb_texte_long: Math.floor(devoir.nb_questions_ouvertes / 2),
      duree_minutes: devoir.duree_minutes,
      difficulte: devoir.difficulte,
    })

    const accessCode = genererAccessCode(devoir.matiere ?? '')

    await admin
      .from('qcm_devoirs')
      .update({
        questions: result.questions,
        bareme_json: result.bareme,
        note_totale: result.devoir.note_totale ?? 20,
        access_code: accessCode,
        generation_status: 'done',
        status: 'draft',
      })
      .eq('id', devoirId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    await admin
      .from('qcm_devoirs')
      .update({ generation_status: 'error' })
      .eq('id', devoirId)
    console.error(`[worker:qcm-gen] ${devoirId}:`, message)
  }
}

/**
 * Corrige une session élève soumise : QCM (auto) + textes (Mistral).
 */
export async function runQcmCorrection(sessionId: string): Promise<void> {
  const admin = createAdminClient()

  try {
    const { data: session } = await admin
      .from('qcm_sessions')
      .select('*, qcm_devoirs(*)')
      .eq('id', sessionId)
      .single()

    if (!session) throw new Error('Session introuvable')

    const devoir = session.qcm_devoirs as QcmDevoir
    const questions = devoir.questions as Question[]

    const { data: reponses } = await admin
      .from('qcm_reponses')
      .select('*')
      .eq('session_id', sessionId)

    if (!reponses) throw new Error('Aucune réponse')

    let scoreTotal = 0
    const noteTotal = Number(devoir.note_totale) || 20

    for (const rep of reponses) {
      const question = questions.find((q) => q.id === rep.question_id)
      if (!question) continue

      if (question.type === 'qcm') {
        // Correction instantanée
        const correct = rep.reponse_donnee === question.reponse_correcte
        const points = correct ? question.points : 0
        scoreTotal += points
        await admin
          .from('qcm_reponses')
          .update({
            est_correcte: correct,
            points_obtenus: points,
            points_max: question.points,
            analysed_at: new Date().toISOString(),
          })
          .eq('id', rep.id)
      } else {
        // Analyse Mistral des réponses texte
        const analyse = await analyserReponseTexte({
          question: {
            enonce: question.enonce,
            reponse_modele: question.reponse_modele,
            mots_cles_requis: question.mots_cles_requis,
            criteres: question.criteres,
            points_max: question.points,
            longueur_attendue: question.longueur_attendue,
          },
          reponse_eleve: rep.reponse_donnee ?? '',
          niveau: devoir.niveau ?? '',
        })
        scoreTotal += analyse.points_obtenus
        await admin
          .from('qcm_reponses')
          .update({
            points_obtenus: analyse.points_obtenus,
            points_max: question.points,
            commentaire_ia: analyse.commentaire,
            est_correcte: analyse.points_obtenus >= question.points * 0.5,
            analysed_at: new Date().toISOString(),
          })
          .eq('id', rep.id)
      }
    }

    // Mention
    const pct = (scoreTotal / noteTotal) * 100
    const mention =
      pct >= 90 ? 'Excellent' :
      pct >= 75 ? 'Très bien' :
      pct >= 60 ? 'Bien' :
      pct >= 50 ? 'Assez bien' :
      pct >= 35 ? 'Passable' : 'Insuffisant'

    await admin
      .from('qcm_sessions')
      .update({
        score: Math.round(scoreTotal * 100) / 100,
        score_sur: noteTotal,
        mention,
        status: 'corrected',
      })
      .eq('id', sessionId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error(`[worker:qcm-correct] ${sessionId}:`, message)
  }
}
