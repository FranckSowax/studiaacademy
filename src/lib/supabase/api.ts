// ============================================
// FONCTIONS API SUPABASE
// ============================================

import { createClient } from './client'
import type {
  Profile,
  ProfileUpdate,
  Wallet,
  Transaction,
  TransactionInsert,
  Service,
  ServiceUsage,
  ServiceUsageInsert,
  Course,
  Enrollment,
  EnrollmentInsert,
  EnrollmentUpdate,
  CV,
  CVInsert,
  CVUpdate,
  CvAnalysis,
  CvAnalysisInsert,
  CompetencyTest,
  TestResult,
  TestResultInsert,
  InterviewSession,
  InterviewSessionInsert,
  InterviewSessionUpdate,
  ChatSession,
  ChatSessionInsert,
  ChatSessionUpdate,
  Notification,
  UserSettings,
  UserSettingsUpdate,
  CreditPack,
  ReportInsert,
} from '@/types/database'

// ============================================
// PROFILES
// ============================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  return data
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return getProfile(user.id)
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }
  return data
}

// ============================================
// WALLETS
// ============================================

export async function getWallet(userId: string): Promise<Wallet | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching wallet:', error)
    return null
  }
  return data
}

export async function getCurrentWallet(): Promise<Wallet | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return getWallet(user.id)
}

// ============================================
// TRANSACTIONS
// ============================================

export async function getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
  return data || []
}

export async function createTransaction(transaction: TransactionInsert): Promise<Transaction | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single()

  if (error) {
    console.error('Error creating transaction:', error)
    return null
  }
  return data
}

// ============================================
// SERVICES
// ============================================

export async function getServices(): Promise<Service[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }
  return data || []
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching service:', error)
    return null
  }
  return data
}

export async function recordServiceUsage(usage: ServiceUsageInsert): Promise<ServiceUsage | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('service_usage')
    .insert(usage)
    .select()
    .single()

  if (error) {
    console.error('Error recording service usage:', error)
    return null
  }
  return data
}

// ============================================
// COURSES
// ============================================

export async function getCourses(category?: string): Promise<Course[]> {
  const supabase = createClient()
  let query = supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }
  return data || []
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching course:', error)
    return null
  }
  return data
}

// ============================================
// ENROLLMENTS
// ============================================

export async function getEnrollments(userId: string): Promise<Enrollment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false })

  if (error) {
    console.error('Error fetching enrollments:', error)
    return []
  }
  return data || []
}

export async function getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching enrollment:', error)
  }
  return data || null
}

export async function createEnrollment(enrollment: EnrollmentInsert): Promise<Enrollment | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .insert(enrollment)
    .select()
    .single()

  if (error) {
    console.error('Error creating enrollment:', error)
    return null
  }
  return data
}

export async function updateEnrollment(
  enrollmentId: string,
  updates: EnrollmentUpdate
): Promise<Enrollment | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating enrollment:', error)
    return null
  }
  return data
}

// ============================================
// CVS
// ============================================

export async function getCVs(userId: string): Promise<CV[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching CVs:', error)
    return []
  }
  return data || []
}

export async function getCV(cvId: string): Promise<CV | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('id', cvId)
    .single()

  if (error) {
    console.error('Error fetching CV:', error)
    return null
  }
  return data
}

export async function createCV(cv: CVInsert): Promise<CV | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cvs')
    .insert(cv)
    .select()
    .single()

  if (error) {
    console.error('Error creating CV:', error)
    return null
  }
  return data
}

export async function updateCV(cvId: string, updates: CVUpdate): Promise<CV | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cvs')
    .update(updates)
    .eq('id', cvId)
    .select()
    .single()

  if (error) {
    console.error('Error updating CV:', error)
    return null
  }
  return data
}

export async function deleteCV(cvId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('cvs')
    .delete()
    .eq('id', cvId)

  if (error) {
    console.error('Error deleting CV:', error)
    return false
  }
  return true
}

// ============================================
// CV ANALYSES
// ============================================

export async function getCVAnalyses(userId: string): Promise<CvAnalysis[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cv_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching CV analyses:', error)
    return []
  }
  return data || []
}

export async function createCVAnalysis(analysis: CvAnalysisInsert): Promise<CvAnalysis | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cv_analyses')
    .insert(analysis)
    .select()
    .single()

  if (error) {
    console.error('Error creating CV analysis:', error)
    return null
  }
  return data
}

// ============================================
// COMPETENCY TESTS
// ============================================

export async function getCompetencyTests(category?: string): Promise<CompetencyTest[]> {
  const supabase = createClient()
  let query = supabase
    .from('competency_tests')
    .select('*')
    .eq('is_active', true)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching competency tests:', error)
    return []
  }
  return data || []
}

export async function getCompetencyTest(testId: string): Promise<CompetencyTest | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('competency_tests')
    .select('*')
    .eq('id', testId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching competency test:', error)
    return null
  }
  return data
}

// ============================================
// TEST RESULTS
// ============================================

export async function getTestResults(userId: string): Promise<TestResult[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('test_results')
    .select(`
      *,
      test:competency_tests(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching test results:', error)
    return []
  }
  return data || []
}

export async function createTestResult(result: TestResultInsert): Promise<TestResult | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('test_results')
    .insert(result)
    .select()
    .single()

  if (error) {
    console.error('Error creating test result:', error)
    return null
  }
  return data
}

// ============================================
// INTERVIEW SESSIONS
// ============================================

export async function getInterviewSessions(userId: string): Promise<InterviewSession[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching interview sessions:', error)
    return []
  }
  return data || []
}

export async function getInterviewSession(sessionId: string): Promise<InterviewSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Error fetching interview session:', error)
    return null
  }
  return data
}

export async function createInterviewSession(session: InterviewSessionInsert): Promise<InterviewSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interview_sessions')
    .insert(session)
    .select()
    .single()

  if (error) {
    console.error('Error creating interview session:', error)
    return null
  }
  return data
}

export async function updateInterviewSession(
  sessionId: string,
  updates: InterviewSessionUpdate
): Promise<InterviewSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interview_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating interview session:', error)
    return null
  }
  return data
}

// ============================================
// CHAT SESSIONS
// ============================================

export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching chat sessions:', error)
    return []
  }
  return data || []
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Error fetching chat session:', error)
    return null
  }
  return data
}

export async function createChatSession(session: ChatSessionInsert): Promise<ChatSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert(session)
    .select()
    .single()

  if (error) {
    console.error('Error creating chat session:', error)
    return null
  }
  return data
}

export async function updateChatSession(
  sessionId: string,
  updates: ChatSessionUpdate
): Promise<ChatSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating chat session:', error)
    return null
  }
  return data
}

export async function deleteChatSession(sessionId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error deleting chat session:', error)
    return false
  }
  return true
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function getNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
  const supabase = createClient()
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  return data || []
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
  return true
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
  return true
}

// ============================================
// USER SETTINGS
// ============================================

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user settings:', error)
    return null
  }
  return data
}

export async function updateUserSettings(
  userId: string,
  updates: UserSettingsUpdate
): Promise<UserSettings | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user settings:', error)
    return null
  }
  return data
}

// ============================================
// CREDIT PACKS
// ============================================

export async function getCreditPacks(): Promise<CreditPack[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('is_active', true)
    .order('credits', { ascending: true })

  if (error) {
    console.error('Error fetching credit packs:', error)
    return []
  }
  return data || []
}

// ============================================
// REPORTS
// ============================================

export async function createReport(report: ReportInsert): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('reports')
    .insert(report)

  if (error) {
    console.error('Error creating report:', error)
    return false
  }
  return true
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function checkCredits(userId: string, requiredCredits: number): Promise<boolean> {
  const wallet = await getWallet(userId)
  if (!wallet) return false
  return wallet.balance >= requiredCredits
}

export async function deductCredits(
  userId: string,
  credits: number,
  description: string,
  serviceId?: string
): Promise<boolean> {
  const wallet = await getWallet(userId)
  if (!wallet || wallet.balance < credits) return false

  const transaction = await createTransaction({
    user_id: userId,
    wallet_id: wallet.id,
    type: 'service_payment',
    amount: credits,
    credits: credits,
    payment_method: 'wallet',
    description,
  })

  if (!transaction) return false

  // Complete the transaction (this will trigger the wallet balance update)
  const supabase = createClient()
  const { error } = await supabase
    .from('transactions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', transaction.id)

  if (error) {
    console.error('Error completing transaction:', error)
    return false
  }

  // Record service usage if serviceId provided
  if (serviceId) {
    await recordServiceUsage({
      user_id: userId,
      service_id: serviceId,
      transaction_id: transaction.id,
      credits_used: credits,
    })
  }

  return true
}
