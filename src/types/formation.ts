// ============================================
// Types — Formations (en ligne + présentiel)
// ============================================

export type LessonType = 'video' | 'pdf' | 'texte' | 'quiz'
export type EnrollmentStatus = 'pending' | 'active' | 'rejected' | 'completed'
export type ReservationStatus = 'reserved' | 'confirmed' | 'cancelled'

export interface Formation {
  id: string
  slug: string
  titre: string
  sous_titre: string | null
  description: string | null
  cover_image: string | null
  categorie: string | null
  niveau: string
  duree_estimee: string | null
  prix_fcfa: number
  objectifs: string[]
  prerequis: string[]
  formateur_nom: string | null
  formateur_bio: string | null
  formateur_avatar: string | null
  is_published: boolean
  ordre: number
  final_quiz: LessonQuizQuestion[]
  final_quiz_generated_at: string | null
  created_at: string
  updated_at: string
}

export interface LessonQuizQuestion {
  question: string
  options: string[]
  reponse_correcte: number
  explication: string
}

// ── Blocs interactifs d'une leçon (cours « vivant ») ──
export type LessonBlock =
  | { type: 'accroche'; texte: string }
  | { type: 'section'; titre: string; resume: string; details: string }
  | { type: 'concepts'; items: { terme: string; definition: string }[] }
  | { type: 'a_retenir'; points: string[] }
  | { type: 'exemple'; titre?: string; texte: string }
  | { type: 'le_saviez_vous'; texte: string }
  | { type: 'question_flash'; question: string; options: string[]; reponse_correcte: number; explication: string }

export interface FormationLesson {
  id: string
  formation_id: string
  ordre: number
  titre: string
  type: LessonType
  video_url: string | null
  contenu: string | null
  document_url: string | null
  quiz: LessonQuizQuestion[]
  blocks: LessonBlock[]
  duree_minutes: number
  is_preview: boolean
  created_at: string
}

export interface FormationEnrollment {
  id: string
  formation_id: string
  user_id: string
  status: EnrollmentStatus
  message: string | null
  phone: string | null
  progress: string[] // ids des leçons complétées
  requested_at: string
  granted_at: string | null
  granted_by: string | null
  completed_at: string | null
}

export interface PresentielSession {
  id: string
  titre: string
  description: string | null
  cover_image: string | null
  categorie: string | null
  date_debut: string
  date_fin: string | null
  lieu: string | null
  ville: string
  places_total: number
  places_reservees: number
  prix_fcfa: number
  formateur_nom: string | null
  is_published: boolean
  created_at: string
}

export interface PresentielReservation {
  id: string
  session_id: string
  user_id: string | null
  prenom: string
  nom: string
  email: string | null
  phone: string
  status: ReservationStatus
  created_at: string
}
