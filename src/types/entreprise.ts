// ============================================
// Types — Espace Entreprise (diagnostic des compétences)
// ============================================

export type AssessmentStatus = 'draft' | 'open' | 'closed' | 'analyzing' | 'analyzed'
export type SubmissionStatus = 'in_progress' | 'submitted' | 'scored'
export type ProposalStatus = 'draft' | 'generating' | 'ready' | 'sent' | 'accepted' | 'declined'
export type NiveauCompetence = 'debutant' | 'intermediaire' | 'avance' | 'expert'

export interface CompanyProfile {
  id: string
  user_id: string
  nom_entreprise: string
  secteur: string | null
  effectif_estime: string | null
  ville: string | null
  contact_nom: string | null
  contact_phone: string | null
  contact_email: string | null
  logo_url: string | null
  created_at: string
}

export interface AssessmentQuestion {
  id: string
  domaine: string
  competence: string
  enonce: string
  options: string[]
  reponse_correcte: number
  points: number
}

/** Question envoyée au salarié (sans la bonne réponse). */
export type PublicQuestion = Omit<AssessmentQuestion, 'reponse_correcte'>

export interface CompanyAssessment {
  id: string
  company_id: string
  created_by: string
  titre: string
  description: string | null
  domaines: string[]
  niveau_cible: string | null
  duree_minutes: number
  questions: AssessmentQuestion[]
  total_points: number
  access_code: string | null
  link_token: string
  seuil_analyse: number
  nb_submissions: number
  status: AssessmentStatus
  deadline: string | null
  created_at: string
}

export interface DomainScore {
  obtenu: number
  max: number
  pct: number
  niveau: NiveauCompetence
}

export interface AssessmentSubmission {
  id: string
  assessment_id: string
  respondent_token: string
  prenom: string | null
  nom: string | null
  departement: string | null
  poste: string | null
  email: string | null
  score_global: number
  score_sur: number
  scores_domaines: Record<string, DomainScore>
  status: SubmissionStatus
  created_at: string
}
