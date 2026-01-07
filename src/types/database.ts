// ============================================
// TYPES GÉNÉRÉS POUR LA BASE DE DONNÉES SUPABASE
// ============================================

// Enums
export type UserRole = 'user' | 'admin' | 'super_admin'
export type AccountStatus = 'active' | 'suspended' | 'pending' | 'deleted'
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'cancelled'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type TransactionType = 'credit_purchase' | 'service_payment' | 'refund' | 'bonus'
export type PaymentMethod = 'airtel_money' | 'moov_money' | 'stripe' | 'wallet' | 'free'
export type CvStatus = 'draft' | 'published' | 'archived'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

// ============================================
// PROFILES
// ============================================
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  date_of_birth: string | null
  country: string
  city: string | null
  address: string | null
  bio: string | null
  role: UserRole
  status: AccountStatus
  email_verified: boolean
  phone_verified: boolean
  onboarding_completed: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  date_of_birth?: string | null
  country?: string
  city?: string | null
  address?: string | null
  bio?: string | null
  role?: UserRole
  status?: AccountStatus
}

export interface ProfileUpdate {
  full_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  date_of_birth?: string | null
  country?: string
  city?: string | null
  address?: string | null
  bio?: string | null
  onboarding_completed?: boolean
}

// ============================================
// WALLETS
// ============================================
export interface Wallet {
  id: string
  user_id: string
  balance: number
  total_earned: number
  total_spent: number
  currency: string
  created_at: string
  updated_at: string
}

// ============================================
// TRANSACTIONS
// ============================================
export interface Transaction {
  id: string
  user_id: string
  wallet_id: string
  type: TransactionType
  status: TransactionStatus
  amount: number
  credits: number | null
  payment_method: PaymentMethod | null
  description: string | null
  reference: string | null
  metadata: Record<string, unknown>
  created_at: string
  completed_at: string | null
}

export interface TransactionInsert {
  user_id: string
  wallet_id: string
  type: TransactionType
  amount: number
  credits?: number | null
  payment_method?: PaymentMethod | null
  description?: string | null
  reference?: string | null
  metadata?: Record<string, unknown>
}

// ============================================
// SERVICES
// ============================================
export interface Service {
  id: string
  slug: string
  name: string
  name_fr: string
  description: string | null
  description_fr: string | null
  icon: string | null
  category: string
  price_credits: number
  is_active: boolean
  is_featured: boolean
  features: string[]
  benefits: string[]
  faqs: { question: string; answer: string }[]
  usage_count: number
  rating_avg: number
  rating_count: number
  created_at: string
  updated_at: string
}

// ============================================
// SERVICE USAGE
// ============================================
export interface ServiceUsage {
  id: string
  user_id: string
  service_id: string
  transaction_id: string | null
  credits_used: number
  started_at: string
  completed_at: string | null
  result_data: Record<string, unknown>
  rating: number | null
  feedback: string | null
}

export interface ServiceUsageInsert {
  user_id: string
  service_id: string
  transaction_id?: string | null
  credits_used?: number
  result_data?: Record<string, unknown>
}

// ============================================
// COURSES
// ============================================
export interface CourseModule {
  id: string
  title: string
  description?: string
  duration_minutes: number
  video_url?: string
  resources?: { title: string; url: string }[]
}

export interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnail_url: string | null
  instructor_name: string | null
  instructor_avatar: string | null
  category: string
  level: SkillLevel
  duration_minutes: number
  price_credits: number
  is_active: boolean
  is_featured: boolean
  modules: CourseModule[]
  requirements: string[]
  objectives: string[]
  enrollment_count: number
  completion_count: number
  rating_avg: number
  rating_count: number
  created_at: string
  updated_at: string
}

// ============================================
// ENROLLMENTS
// ============================================
export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: EnrollmentStatus
  progress: number
  current_module: number
  completed_modules: string[]
  started_at: string
  completed_at: string | null
  last_accessed_at: string
  certificate_url: string | null
  rating: number | null
  review: string | null
  // Relations
  course?: Course
}

export interface EnrollmentInsert {
  user_id: string
  course_id: string
  status?: EnrollmentStatus
}

export interface EnrollmentUpdate {
  status?: EnrollmentStatus
  progress?: number
  current_module?: number
  completed_modules?: string[]
  last_accessed_at?: string
  rating?: number | null
  review?: string | null
}

// ============================================
// CVS
// ============================================
export interface CvPersonalInfo {
  fullName: string
  email: string
  phone: string
  address: string
  linkedin: string
  website: string
  summary: string
}

export interface CvExperience {
  id: string
  company: string
  position: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  achievements?: string[]
}

export interface CvEducation {
  id: string
  institution: string
  degree: string
  field: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
}

export interface CvSkill {
  id: string
  name: string
  level: SkillLevel
  category?: string
}

export interface CvLanguage {
  id: string
  name: string
  level: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'beginner'
}

export interface CvCertification {
  id: string
  name: string
  issuer: string
  date: string
  url?: string
}

export interface CvProject {
  id: string
  name: string
  description: string
  url?: string
  technologies?: string[]
}

export interface CV {
  id: string
  user_id: string
  title: string
  status: CvStatus
  template: string
  personal_info: CvPersonalInfo
  experiences: CvExperience[]
  education: CvEducation[]
  skills: CvSkill[]
  languages: CvLanguage[]
  certifications: CvCertification[]
  projects: CvProject[]
  interests: string[]
  pdf_url: string | null
  last_exported_at: string | null
  view_count: number
  download_count: number
  created_at: string
  updated_at: string
}

export interface CVInsert {
  user_id: string
  title?: string
  template?: string
  personal_info?: Partial<CvPersonalInfo>
}

export interface CVUpdate {
  title?: string
  status?: CvStatus
  template?: string
  personal_info?: CvPersonalInfo
  experiences?: CvExperience[]
  education?: CvEducation[]
  skills?: CvSkill[]
  languages?: CvLanguage[]
  certifications?: CvCertification[]
  projects?: CvProject[]
  interests?: string[]
  pdf_url?: string | null
  last_exported_at?: string | null
}

// ============================================
// CV ANALYSES
// ============================================
export interface CvAnalysisScores {
  format: number
  content: number
  keywords: number
  experience: number
  education: number
  skills: number
}

export interface CvAnalysis {
  id: string
  user_id: string
  cv_id: string | null
  file_name: string | null
  file_url: string | null
  file_type: string | null
  overall_score: number | null
  scores: CvAnalysisScores
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  keywords_found: string[]
  keywords_missing: string[]
  extracted_data: Record<string, unknown>
  job_title_target: string | null
  industry_target: string | null
  created_at: string
}

export interface CvAnalysisInsert {
  user_id: string
  cv_id?: string | null
  file_name?: string | null
  file_url?: string | null
  file_type?: string | null
  job_title_target?: string | null
  industry_target?: string | null
}

// ============================================
// COMPETENCY TESTS
// ============================================
export interface TestQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  category: string
  explanation?: string
}

export interface CompetencyTest {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  difficulty: SkillLevel
  duration_minutes: number
  question_count: number
  passing_score: number
  is_active: boolean
  questions: TestQuestion[]
  created_at: string
  updated_at: string
}

// ============================================
// TEST RESULTS
// ============================================
export interface TestAnswer {
  question_id: string
  selected_answer: number
  is_correct: boolean
}

export interface TestResult {
  id: string
  user_id: string
  test_id: string
  score: number
  passed: boolean
  time_taken_seconds: number | null
  category_scores: Record<string, number>
  answers: TestAnswer[]
  recommendations: string[]
  certificate_url: string | null
  created_at: string
  // Relations
  test?: CompetencyTest
}

export interface TestResultInsert {
  user_id: string
  test_id: string
  score: number
  passed: boolean
  time_taken_seconds?: number | null
  category_scores?: Record<string, number>
  answers?: TestAnswer[]
  recommendations?: string[]
}

// ============================================
// INTERVIEW SESSIONS
// ============================================
export interface InterviewMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface InterviewFeedback {
  strengths: string[]
  improvements: string[]
  tips: string[]
}

export interface InterviewSession {
  id: string
  user_id: string
  job_title: string
  company_type: string | null
  interview_type: 'behavioral' | 'technical' | 'hr'
  difficulty: SkillLevel
  language: string
  status: 'in_progress' | 'completed' | 'abandoned'
  messages: InterviewMessage[]
  questions_asked: number
  overall_score: number | null
  feedback: InterviewFeedback
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
}

export interface InterviewSessionInsert {
  user_id: string
  job_title: string
  company_type?: string | null
  interview_type?: 'behavioral' | 'technical' | 'hr'
  difficulty?: SkillLevel
  language?: string
}

export interface InterviewSessionUpdate {
  status?: 'in_progress' | 'completed' | 'abandoned'
  messages?: InterviewMessage[]
  questions_asked?: number
  overall_score?: number | null
  feedback?: InterviewFeedback
  completed_at?: string | null
  duration_seconds?: number | null
}

// ============================================
// CHAT SESSIONS
// ============================================
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  messages: ChatMessage[]
  context: Record<string, unknown>
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface ChatSessionInsert {
  user_id: string
  title?: string
  context?: Record<string, unknown>
}

export interface ChatSessionUpdate {
  title?: string
  messages?: ChatMessage[]
  context?: Record<string, unknown>
  is_archived?: boolean
}

// ============================================
// NOTIFICATIONS
// ============================================
export interface Notification {
  id: string
  user_id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationInsert {
  user_id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string | null
  link?: string | null
}

// ============================================
// USER SETTINGS
// ============================================
export interface UserSettings {
  id: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  marketing_emails: boolean
  language: string
  timezone: string
  theme: 'light' | 'dark' | 'system'
  profile_public: boolean
  show_activity: boolean
  created_at: string
  updated_at: string
}

export interface UserSettingsUpdate {
  email_notifications?: boolean
  push_notifications?: boolean
  sms_notifications?: boolean
  marketing_emails?: boolean
  language?: string
  timezone?: string
  theme?: 'light' | 'dark' | 'system'
  profile_public?: boolean
  show_activity?: boolean
}

// ============================================
// REPORTS
// ============================================
export interface Report {
  id: string
  reporter_id: string | null
  reported_user_id: string
  type: 'spam' | 'abuse' | 'inappropriate' | 'other'
  reason: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  admin_notes: string | null
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
}

export interface ReportInsert {
  reporter_id: string
  reported_user_id: string
  type: 'spam' | 'abuse' | 'inappropriate' | 'other'
  reason: string
}

// ============================================
// CREDIT PACKS
// ============================================
export interface CreditPack {
  id: string
  name: string
  credits: number
  price_xof: number
  bonus_credits: number
  is_popular: boolean
  is_active: boolean
  discount_percent: number
  created_at: string
}

// ============================================
// DATABASE SCHEMA TYPE
// ============================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      wallets: {
        Row: Wallet
        Insert: never
        Update: never
      }
      transactions: {
        Row: Transaction
        Insert: TransactionInsert
        Update: never
      }
      services: {
        Row: Service
        Insert: never
        Update: never
      }
      service_usage: {
        Row: ServiceUsage
        Insert: ServiceUsageInsert
        Update: never
      }
      courses: {
        Row: Course
        Insert: never
        Update: never
      }
      enrollments: {
        Row: Enrollment
        Insert: EnrollmentInsert
        Update: EnrollmentUpdate
      }
      cvs: {
        Row: CV
        Insert: CVInsert
        Update: CVUpdate
      }
      cv_analyses: {
        Row: CvAnalysis
        Insert: CvAnalysisInsert
        Update: never
      }
      competency_tests: {
        Row: CompetencyTest
        Insert: never
        Update: never
      }
      test_results: {
        Row: TestResult
        Insert: TestResultInsert
        Update: never
      }
      interview_sessions: {
        Row: InterviewSession
        Insert: InterviewSessionInsert
        Update: InterviewSessionUpdate
      }
      chat_sessions: {
        Row: ChatSession
        Insert: ChatSessionInsert
        Update: ChatSessionUpdate
      }
      notifications: {
        Row: Notification
        Insert: NotificationInsert
        Update: { is_read?: boolean }
      }
      user_settings: {
        Row: UserSettings
        Insert: never
        Update: UserSettingsUpdate
      }
      reports: {
        Row: Report
        Insert: ReportInsert
        Update: never
      }
      credit_packs: {
        Row: CreditPack
        Insert: never
        Update: never
      }
    }
  }
}
