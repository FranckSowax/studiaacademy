'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LessonQuizQuestion } from '@/types/formation'
import { answerAt, splitLiveQuestions } from './questions'

const TIME_PER_Q = 20 // secondes
const BASE_POINTS = 1000

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = ''
  for (let i = 0; i < 6; i++) c += chars[Math.floor((globalThis.crypto?.getRandomValues?.(new Uint32Array(1))?.[0] ?? 0) % chars.length)]
  return c
}

/**
 * L'hôte (connecté) crée une partie live à partir du quiz final d'une formation.
 */
export async function createLiveGame(formationId: string): Promise<{ success: boolean; code?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connexion requise pour héberger' }

  const admin = createAdminClient()
  const { data: formation } = await admin
    .from('formations')
    .select('titre, final_quiz')
    .eq('id', formationId)
    .single()
  if (!formation) return { success: false, error: 'Formation introuvable' }

  const questions = (formation.final_quiz as LessonQuizQuestion[]) ?? []
  if (questions.length === 0) return { success: false, error: 'Pas de quiz final pour cette formation' }

  return insertLiveGame({ formationId, hostId: user.id, titre: formation.titre, questions })
}

/**
 * Crée la partie avec des questions SANS réponses (table lisible publiquement
 * pour le realtime des joueurs) et range les réponses dans live_game_answers.
 */
async function insertLiveGame(input: {
  formationId: string | null
  hostId: string
  titre: string | null
  questions: LessonQuizQuestion[]
}): Promise<{ success: boolean; code?: string; error?: string }> {
  const admin = createAdminClient()

  // Code unique
  let code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: exist } = await admin.from('live_games').select('id').eq('code', code).maybeSingle()
    if (!exist) break
    code = genCode()
  }

  const { publicQuestions, answers } = splitLiveQuestions(input.questions)
  const { data: game, error } = await admin
    .from('live_games')
    .insert({
      formation_id: input.formationId,
      host_id: input.hostId,
      titre: input.titre,
      code,
      questions: publicQuestions,
      status: 'lobby',
      current_index: 0,
    })
    .select('id')
    .single()
  if (error || !game) return { success: false, error: 'Impossible de créer la partie' }

  const { error: answersError } = await admin
    .from('live_game_answers')
    .insert({ game_id: game.id, answers })
  if (answersError) {
    await admin.from('live_games').delete().eq('id', game.id)
    return { success: false, error: 'Impossible de créer la partie' }
  }
  return { success: true, code }
}

/** Vérifie que l'utilisateur connecté est l'hôte de la partie. */
async function assertHost(gameId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const admin = createAdminClient()
  const { data: game } = await admin.from('live_games').select('host_id').eq('id', gameId).maybeSingle()
  return !!game && game.host_id === user.id
}

async function loadAnswers(gameId: string): Promise<unknown> {
  const admin = createAdminClient()
  const { data } = await admin.from('live_game_answers').select('answers').eq('game_id', gameId).maybeSingle()
  return data?.answers ?? null
}

/**
 * Crée une partie live à partir d'un jeu de questions (sans formation).
 * Utilisé par l'espace professeur (Kahoot autonome).
 */
export async function createLiveGameFromQuestions(input: {
  titre: string
  questions: LessonQuizQuestion[]
}): Promise<{ success: boolean; code?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connexion requise pour héberger' }

  const questions = input.questions ?? []
  if (questions.length === 0) return { success: false, error: 'Aucune question à jouer' }
  if (questions.length > 100) return { success: false, error: 'Trop de questions (100 max)' }

  return insertLiveGame({ formationId: null, hostId: user.id, titre: input.titre, questions })
}

/**
 * L'hôte relance une nouvelle partie avec les mêmes questions (et réponses).
 */
export async function relaunchLiveGame(gameId: string): Promise<{ success: boolean; code?: string; error?: string }> {
  if (!(await assertHost(gameId))) return { success: false, error: 'Réservé à l’hôte' }
  const admin = createAdminClient()
  const { data: game } = await admin
    .from('live_games')
    .select('formation_id, host_id, titre, questions')
    .eq('id', gameId)
    .single()
  if (!game) return { success: false, error: 'Partie introuvable' }

  const secret = await loadAnswers(gameId)
  const publicQuestions = (game.questions as LessonQuizQuestion[]) ?? []
  const full: LessonQuizQuestion[] = []
  for (let i = 0; i < publicQuestions.length; i++) {
    const answer = answerAt(i, secret, publicQuestions)
    if (answer === null) return { success: false, error: 'Réponses introuvables' }
    full.push({ question: publicQuestions[i].question, options: publicQuestions[i].options, reponse_correcte: answer, explication: '' })
  }
  return insertLiveGame({ formationId: game.formation_id, hostId: game.host_id, titre: game.titre, questions: full })
}

/**
 * Un joueur rejoint une partie (sans compte).
 */
export async function joinLiveGame(code: string, pseudo: string): Promise<{ success: boolean; playerId?: string; gameId?: string; error?: string }> {
  const admin = createAdminClient()
  const { data: game } = await admin
    .from('live_games')
    .select('id, status')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle()
  if (!game) return { success: false, error: 'Code de partie invalide' }
  if (game.status === 'ended') return { success: false, error: 'Cette partie est terminée' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: player, error } = await admin
    .from('live_players')
    .insert({ game_id: game.id, pseudo: pseudo.slice(0, 24), user_id: user?.id ?? null })
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }
  return { success: true, playerId: player.id, gameId: game.id }
}

/**
 * L'hôte passe à l'état « question » (démarre / question suivante).
 */
export async function hostNextQuestion(gameId: string): Promise<{ success: boolean; ended?: boolean }> {
  if (!(await assertHost(gameId))) return { success: false }
  const admin = createAdminClient()
  const { data: game } = await admin.from('live_games').select('status, current_index, questions').eq('id', gameId).single()
  if (!game) return { success: false }

  const questions = (game.questions as LessonQuizQuestion[]) ?? []
  // Si on était en lobby → première question (index 0). Sinon index+1.
  const nextIndex = game.status === 'lobby' ? 0 : game.current_index + 1

  if (nextIndex >= questions.length) {
    await admin.from('live_games').update({ status: 'ended' }).eq('id', gameId)
    return { success: true, ended: true }
  }

  await admin.from('live_games').update({
    status: 'question',
    current_index: nextIndex,
    question_started_at: new Date().toISOString(),
    revealed_answer: null,
  }).eq('id', gameId)
  return { success: true }
}

/**
 * L'hôte révèle la bonne réponse (fin du temps de réponse).
 * La réponse n'est publiée dans live_games qu'à ce moment-là.
 */
export async function hostReveal(gameId: string): Promise<{ success: boolean }> {
  if (!(await assertHost(gameId))) return { success: false }
  const admin = createAdminClient()
  const { data: game } = await admin
    .from('live_games')
    .select('current_index, questions')
    .eq('id', gameId)
    .single()
  if (!game) return { success: false }
  const answer = answerAt(game.current_index, await loadAnswers(gameId), game.questions)
  await admin.from('live_games').update({ status: 'reveal', revealed_answer: answer }).eq('id', gameId)
  return { success: true }
}

/**
 * L'hôte termine la partie.
 */
export async function hostEndGame(gameId: string): Promise<{ success: boolean }> {
  if (!(await assertHost(gameId))) return { success: false }
  const admin = createAdminClient()
  await admin.from('live_games').update({ status: 'ended' }).eq('id', gameId)
  return { success: true }
}

/**
 * Un joueur soumet sa réponse à la question courante.
 */
export async function submitLiveAnswer(input: {
  gameId: string
  playerId: string
  questionIndex: number
  choice: number
}): Promise<{ success: boolean; points?: number; correct?: boolean }> {
  const admin = createAdminClient()
  const { data: game } = await admin
    .from('live_games')
    .select('status, current_index, question_started_at, questions')
    .eq('id', input.gameId)
    .single()
  if (!game || game.status !== 'question' || game.current_index !== input.questionIndex) {
    return { success: false }
  }

  // Le joueur doit appartenir à cette partie (sinon on répondrait à sa place).
  const { data: member } = await admin
    .from('live_players')
    .select('id')
    .eq('id', input.playerId)
    .eq('game_id', input.gameId)
    .maybeSingle()
  if (!member) return { success: false }

  const answer = answerAt(input.questionIndex, await loadAnswers(input.gameId), game.questions)
  if (answer === null || !Number.isInteger(input.choice)) return { success: false }

  const correct = input.choice === answer
  let points = 0
  if (correct) {
    const started = game.question_started_at ? new Date(game.question_started_at).getTime() : Date.now()
    const elapsed = (Date.now() - started) / 1000
    const speed = Math.max(0, 1 - elapsed / TIME_PER_Q)
    points = Math.round(BASE_POINTS / 2 + (BASE_POINTS / 2) * speed)
  }

  // Insérer la réponse (unique par joueur/question)
  const { error } = await admin.from('live_answers').insert({
    game_id: input.gameId,
    player_id: input.playerId,
    question_index: input.questionIndex,
    choice: input.choice,
    is_correct: correct,
    points,
  })
  if (error) return { success: false } // déjà répondu

  if (points > 0) {
    // Incrément atomique (plus de lecture puis écriture concurrente).
    await admin.rpc('increment_live_score', { p_player_id: input.playerId, p_points: points })
  }

  return { success: true, points, correct }
}
