// ============================================
// Types — Kahoot live multijoueur
// ============================================

import type { LessonQuizQuestion } from '@/types/formation'

export type LiveStatus = 'lobby' | 'question' | 'reveal' | 'ended'

export interface LiveGame {
  id: string
  formation_id: string | null
  host_id: string | null
  titre: string | null
  code: string
  questions: LessonQuizQuestion[]
  status: LiveStatus
  current_index: number
  question_started_at: string | null
  created_at: string
  updated_at: string
}

export interface LivePlayer {
  id: string
  game_id: string
  pseudo: string
  score: number
  user_id: string | null
  created_at: string
}

export interface LiveAnswer {
  id: string
  game_id: string
  player_id: string
  question_index: number
  choice: number | null
  is_correct: boolean
  points: number
  created_at: string
}
