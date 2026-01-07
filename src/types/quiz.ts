export interface Option {
  id: string
  text: string
  isCorrect?: boolean // Only for server/checking side, maybe hidden in client
}

export interface Question {
  id: number
  text: string
  options: Option[]
  category: string // e.g., 'technical', 'communication', 'problem-solving'
}

export interface Quiz {
  id: string
  title: string
  description: string
  durationMinutes: number
  questions: Question[]
}

export interface QuizResult {
  quizId: string
  score: number
  totalQuestions: number
  categoryScores: Record<string, number>
  completedAt: string
}
