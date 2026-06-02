// ============================================
// Types — Espace Professeur Studia Academy
// ============================================

export type JobStatus = 'pending' | 'processing' | 'done' | 'error'
export type DevoirStatus = 'draft' | 'active' | 'closed'
export type QcmSessionStatus = 'in_progress' | 'submitted' | 'corrected'
export type QuestionType = 'qcm' | 'texte_court' | 'texte_long'

// ── Profil professeur ───────────────────────
export interface TeacherProfile {
  id: string
  user_id: string
  matiere: string | null
  niveau_enseignement: string | null
  etablissement: string | null
  ville: string | null
  created_at: string
}

// ── Profil de correction IA ─────────────────
export interface WizardConfig {
  severite: 'strict' | 'standard' | 'bienveillant'
  points_partiels: 'tout_ou_rien' | 'demi_points' | 'fraction_libre'
  tolerance_ortho: 'aucune' | 'mineure' | 'moderee'
  valorise_demarche: boolean
}

export interface FewShotExample {
  question_type: string
  reponse_partielle: string
  points_accordes: string
  commentaire_prof: string
}

export interface LearnedPatterns {
  severite?: string
  points_partiels?: {
    style: string
    seuil_minimum: number
    description: string
  }
  tolerance_ortho?: string
  valorise_demarche?: boolean
  penalise_propagation?: boolean
  ton?: string
  formulations_types?: string[]
  score_confiance?: number
  nb_exemples_analyses?: number
  recommandation?: string
}

export interface CorrectionProfile {
  id: string
  teacher_id: string
  wizard_config: WizardConfig
  learned_patterns: LearnedPatterns
  few_shot_examples: FewShotExample[]
  version: number
  updated_at: string
}

// ── Classes ─────────────────────────────────
export interface Classe {
  id: string
  teacher_id: string
  nom: string
  niveau: string | null
  annee_scolaire: string
  nb_eleves: number
  created_at: string
}

// ── Élève d'une classe (registre nominatif) ─
export interface ClassStudent {
  id: string
  class_id: string
  prenom: string
  nom: string
  eleve_phone: string | null
  parent_phone: string | null
  created_at: string
}

// ── Barème de correction ────────────────────
export interface BaremeQuestion {
  numero: number
  enonce: string
  reponse_attendue: string
  points_max: number
  criteres?: string
}

export interface Bareme {
  questions: BaremeQuestion[]
}

// ── Session de correction ───────────────────
export interface CorrectionSession {
  id: string
  teacher_id: string
  class_id: string | null
  titre: string
  matiere: string | null
  niveau: string | null
  bareme: Bareme
  corrige_reference: string | null
  corrige_files: string[]
  corrige_type: 'manuel' | 'upload' | 'mixte'
  nb_copies: number
  is_bootstrap: boolean
  status: DevoirStatus
  created_at: string
}

// ── Résultat de correction (sortie Mistral) ─
export interface CorrectionQuestionResult {
  numero: number
  points_obtenus: number
  points_max: number
  statut: 'correct' | 'partiel' | 'incorrect' | 'non_repondu'
  reponse_eleve: string
  commentaire: string
  lecture_incertaine: boolean
  erreurs: string[]
}

export interface CorrectionResult {
  eleve: { nom: string; prenom: string }
  note_obtenue: number
  note_sur: number
  pourcentage: number
  mention: string
  appreciation_generale: string
  questions: CorrectionQuestionResult[]
  points_forts: string[]
  axes_amelioration: string[]
  necessite_validation_manuelle: boolean
  questions_a_verifier: number[]
}

// ── Job de correction ───────────────────────
export interface CorrectionJob {
  id: string
  session_id: string
  class_student_id: string | null
  eleve_nom: string | null
  eleve_prenom: string | null
  eleve_phone: string | null
  parent_phone: string | null
  input_files: string[]
  ocr_text: string | null
  status: JobStatus
  progress: number
  result_json: CorrectionResult | Record<string, never>
  note_finale: number | null
  validated: boolean
  sent_at: string | null
  report_token: string
  error_message: string | null
  created_at: string
  updated_at: string
}

// ── Questions QCM (sortie Mistral) ──────────
export interface QcmOption {
  lettre: string
  texte: string
}

export interface QcmCritere {
  description: string
  points: number
}

export interface Question {
  id: number
  type: QuestionType
  enonce: string
  points: number
  concept_cle?: string
  // QCM
  options?: QcmOption[]
  reponse_correcte?: string
  explication?: string
  niveau_bloom?: string
  difficulte?: string
  // Texte
  reponse_modele?: string
  mots_cles_requis?: string[]
  criteres?: QcmCritere[]
  longueur_attendue?: string
}

export interface DevoirMeta {
  titre: string
  matiere: string
  niveau: string
  duree_minutes: number
  consignes: string
  note_totale: number
}

// ── Devoir QCM ──────────────────────────────
export interface QcmDevoir {
  id: string
  teacher_id: string
  class_id: string | null
  titre: string
  matiere: string | null
  niveau: string | null
  source_content: string | null
  nb_questions_qcm: number
  nb_questions_ouvertes: number
  duree_minutes: number
  difficulte: string
  questions: Question[]
  bareme_json: Record<string, unknown>
  note_totale: number
  access_code: string | null
  link_token: string
  is_locked: boolean
  locked_at: string | null
  unlocked_at: string | null
  generation_status: JobStatus
  status: DevoirStatus
  created_at: string
}

// ── Session élève QCM ───────────────────────
export interface QcmSession {
  id: string
  devoir_id: string
  eleve_nom: string
  eleve_prenom: string
  eleve_email: string | null
  parent_phone: string | null
  started_at: string
  submitted_at: string | null
  duree_reelle_secondes: number | null
  score: number | null
  score_sur: number | null
  mention: string | null
  status: QcmSessionStatus
  report_token: string
  created_at: string
}

// ── Réponse QCM ─────────────────────────────
export interface QcmReponse {
  id: string
  session_id: string
  question_id: number
  type_question: QuestionType
  reponse_donnee: string | null
  est_correcte: boolean | null
  points_obtenus: number
  points_max: number
  commentaire_ia: string | null
  analysed_at: string | null
  created_at: string
}

// ── Analyse réponse texte (sortie Mistral) ──
export interface AnalyseReponse {
  points_obtenus: number
  points_max: number
  mots_cles_trouves: string[]
  mots_cles_manquants: string[]
  commentaire: string
  justification: string
  niveau_comprehension:
    | 'excellent'
    | 'satisfaisant'
    | 'partiel'
    | 'insuffisant'
    | 'hors_sujet'
}
