'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LessonQuizQuestion } from '@/types/formation'

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

  // Code unique
  let code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: exist } = await admin.from('live_games').select('id').eq('code', code).maybeSingle()
    if (!exist) break
    code = genCode()
  }

  const { error } = await admin.from('live_games').insert({
    formation_id: formationId,
    host_id: user.id,
    titre: formation.titre,
    code,
    questions,
    status: 'lobby',
    current_index: 0,
  })
  if (error) return { success: false, error: error.message }
  return { success: true, code }
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
  }).eq('id', gameId)
  return { success: true }
}

/**
 * L'hôte révèle la bonne réponse (fin du temps de réponse).
 */
export async function hostReveal(gameId: string): Promise<{ success: boolean }> {
  const admin = createAdminClient()
  await admin.from('live_games').update({ status: 'reveal' }).eq('id', gameId)
  return { success: true }
}

/**
 * L'hôte termine la partie.
 */
export async function hostEndGame(gameId: string): Promise<{ success: boolean }> {
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

  const questions = (game.questions as LessonQuizQuestion[]) ?? []
  const q = questions[input.questionIndex]
  if (!q) return { success: false }

  const correct = input.choice === q.reponse_correcte
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
    const { data: player } = await admin.from('live_players').select('score').eq('id', input.playerId).single()
    await admin.from('live_players').update({ score: (player?.score ?? 0) + points }).eq('id', input.playerId)
  }

  return { success: true, points, correct }
}
