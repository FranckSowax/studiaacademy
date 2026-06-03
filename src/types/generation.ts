// ============================================
// Types — Génération de formation par IA
// ============================================

export type GenerationStatus =
  | 'extracting'
  | 'outline_ready'
  | 'outline_validated'
  | 'generating'
  | 'done'
  | 'published'

export type SectionStatus = 'pending' | 'generating' | 'generated' | 'validated' | 'error'

export type SourceType = 'texte' | 'url' | 'pdf' | 'docx' | 'audio'

// Question de quiz (5 par paragraphe)
export interface QuizQuestion {
  question: string
  options: string[] // 4 options
  reponse_correcte: number // index 0-3
  explication: string
}

// Section du sommaire (avant génération)
export interface OutlineSection {
  titre: string
  description: string
  points_cles: string[]
}

export interface FormationGeneration {
  id: string
  created_by: string | null
  titre: string
  niveau: string
  objectif: string | null
  matiere: string | null
  source_type: SourceType | null
  source_content: string | null
  outline: OutlineSection[]
  status: GenerationStatus
  formation_id: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface GenerationSection {
  id: string
  generation_id: string
  ordre: number
  titre: string
  outline_description: string | null
  points_cles: string[]
  content: string | null
  quiz: QuizQuestion[]
  duree_minutes: number
  status: SectionStatus
  error_message: string | null
  created_at: string
  updated_at: string
}
