'use server'

import { createClient } from '@/lib/supabase/server'

const PTS_LESSON = 100
const PTS_COMPLETION = 500

export interface UserStudiaStats {
  totalPoints: number
  weeklyPoints: number
  lessonsCompleted: number
  inProgress: number   // formations commencées non terminées
  notStarted: number   // inscrites, pas encore commencées
  completed: number    // formations terminées (= certificats)
  streakDays: number
}

/** Stats réelles de l'élève connecté, agrégées sur toutes ses formations. */
export async function getUserStudiaStats(): Promise<UserStudiaStats | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: enrollments } = await supabase
    .from('formation_enrollments')
    .select('formation_id, progress, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
  const enrs = enrollments ?? []
  if (enrs.length === 0) {
    return { totalPoints: 0, weeklyPoints: 0, lessonsCompleted: 0, inProgress: 0, notStarted: 0, completed: 0, streakDays: 0 }
  }
  const formationIds = enrs.map((e) => e.formation_id as string)

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const [{ data: lessonCounts }, { data: quizzes }, { data: recent }] = await Promise.all([
    supabase.from('formation_lessons').select('formation_id').in('formation_id', formationIds),
    supabase.from('formation_quiz_results').select('formation_id, score, created_at').eq('user_id', user.id).in('formation_id', formationIds),
    supabase.from('lesson_completions').select('completed_at').eq('user_id', user.id),
  ])

  // Nb de leçons par formation
  const totalByFormation = new Map<string, number>()
  for (const l of lessonCounts ?? []) {
    const fid = l.formation_id as string
    totalByFormation.set(fid, (totalByFormation.get(fid) ?? 0) + 1)
  }
  // Meilleur quiz + quiz récents par formation
  const bestQuiz = new Map<string, number>()
  let weeklyQuiz = 0
  for (const q of quizzes ?? []) {
    const fid = q.formation_id as string
    const sc = (q.score as number) ?? 0
    bestQuiz.set(fid, Math.max(bestQuiz.get(fid) ?? 0, sc))
    if ((q.created_at as string) >= since) weeklyQuiz += sc
  }

  let totalPoints = 0
  let lessonsCompleted = 0
  let inProgress = 0, notStarted = 0, completed = 0
  for (const e of enrs) {
    const fid = e.formation_id as string
    const done = ((e.progress as string[]) ?? []).length
    const total = totalByFormation.get(fid) ?? 0
    const isComplete = total > 0 && done >= total
    lessonsCompleted += done
    totalPoints += done * PTS_LESSON + (isComplete ? PTS_COMPLETION : 0) + (bestQuiz.get(fid) ?? 0)
    if (isComplete) completed++
    else if (done > 0) inProgress++
    else notStarted++
  }

  // Activité récente (7 j) + série de jours
  const days = new Set<string>()
  let weeklyLessons = 0
  for (const r of recent ?? []) {
    const d = (r.completed_at as string).slice(0, 10)
    days.add(d)
    if ((r.completed_at as string) >= since) weeklyLessons++
  }
  const weeklyPoints = weeklyLessons * PTS_LESSON + weeklyQuiz

  // Série : jours consécutifs avec activité jusqu'à aujourd'hui/hier
  let streakDays = 0
  const probe = new Date()
  // tolérance : si pas d'activité aujourd'hui mais hier, on continue depuis hier
  const todayStr = probe.toISOString().slice(0, 10)
  if (!days.has(todayStr)) probe.setDate(probe.getDate() - 1)
  for (;;) {
    const ds = probe.toISOString().slice(0, 10)
    if (days.has(ds)) { streakDays++; probe.setDate(probe.getDate() - 1) }
    else break
  }

  return { totalPoints, weeklyPoints, lessonsCompleted, inProgress, notStarted, completed, streakDays }
}
