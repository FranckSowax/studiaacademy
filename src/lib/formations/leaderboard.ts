// ============================================
// Classement par formation — « Score Studia »
// (serveur uniquement, lecture globale via admin client)
// ============================================

import { createAdminClient } from '@/lib/supabase/admin'

const PTS_LESSON = 100
const PTS_COMPLETION = 500

export interface LeaderRow {
  user_id: string
  nom: string
  avatar_url: string | null
  lessons_done: number
  lessons_total: number
  completed: boolean
  best_quiz: number
  points: number
  rank: number
  weekly_points: number
  rank_change: number | null // + monte, - descend, null inconnu
  is_current: boolean
}

export interface FormationLeaderboard {
  formation: { id: string; titre: string; slug: string }
  lessons_total: number
  rows: LeaderRow[]
  me: LeaderRow | null
}

/** Numéro de semaine ISO « 2026-W23 ». */
function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export async function getFormationLeaderboard(
  formationId: string,
  currentUserId: string
): Promise<FormationLeaderboard | null> {
  const admin = createAdminClient()

  const { data: formation } = await admin
    .from('formations')
    .select('id, titre, slug')
    .eq('id', formationId)
    .maybeSingle()
  if (!formation) return null

  const { count: lessonsTotal } = await admin
    .from('formation_lessons')
    .select('*', { count: 'exact', head: true })
    .eq('formation_id', formationId)
  const total = lessonsTotal ?? 0

  // Inscrits (avec accès)
  const { data: enrollments } = await admin
    .from('formation_enrollments')
    .select('user_id, progress, status')
    .eq('formation_id', formationId)
    .in('status', ['active', 'completed'])
  const enrs = enrollments ?? []
  if (enrs.length === 0) {
    return { formation, lessons_total: total, rows: [], me: null }
  }
  const userIds = enrs.map((e) => e.user_id as string)

  // Profils + meilleurs scores quiz + activité récente (7 j)
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const [{ data: profiles }, { data: quizzes }, { data: recentLessons }] = await Promise.all([
    admin.from('profiles').select('id, full_name, email, avatar_url').in('id', userIds),
    admin.from('formation_quiz_results').select('user_id, score, created_at').eq('formation_id', formationId).in('user_id', userIds),
    admin.from('lesson_completions').select('user_id, completed_at').eq('formation_id', formationId).in('user_id', userIds).gte('completed_at', since),
  ])

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || (p.email as string)?.split('@')[0] || 'Élève']))
  const avatarById = new Map((profiles ?? []).map((p) => [p.id, (p.avatar_url as string) ?? null]))

  // Meilleur score quiz par user + points quiz récents (7 j)
  const bestQuiz = new Map<string, number>()
  const weeklyQuiz = new Map<string, number>()
  for (const q of quizzes ?? []) {
    const uid = q.user_id as string
    const sc = (q.score as number) ?? 0
    bestQuiz.set(uid, Math.max(bestQuiz.get(uid) ?? 0, sc))
    if ((q.created_at as string) >= since) weeklyQuiz.set(uid, (weeklyQuiz.get(uid) ?? 0) + sc)
  }
  // Leçons complétées cette semaine
  const weeklyLessons = new Map<string, number>()
  for (const l of recentLessons ?? []) {
    const uid = l.user_id as string
    weeklyLessons.set(uid, (weeklyLessons.get(uid) ?? 0) + 1)
  }

  // Construit les lignes (points)
  let rows: LeaderRow[] = enrs.map((e) => {
    const uid = e.user_id as string
    const done = ((e.progress as string[]) ?? []).length
    const completed = total > 0 && done >= total
    const best = bestQuiz.get(uid) ?? 0
    const points = done * PTS_LESSON + (completed ? PTS_COMPLETION : 0) + best
    const weekly = (weeklyLessons.get(uid) ?? 0) * PTS_LESSON + (weeklyQuiz.get(uid) ?? 0)
    return {
      user_id: uid,
      nom: nameById.get(uid) ?? 'Élève',
      avatar_url: avatarById.get(uid) ?? null,
      lessons_done: done,
      lessons_total: total,
      completed,
      best_quiz: best,
      points,
      rank: 0,
      weekly_points: weekly,
      rank_change: null,
      is_current: uid === currentUserId,
    }
  })

  rows.sort((a, b) => b.points - a.points || b.lessons_done - a.lessons_done)
  rows.forEach((r, i) => { r.rank = i + 1 })

  // Tendance de rang : compare au snapshot d'une semaine antérieure
  const week = isoWeek(new Date())
  const { data: snaps } = await admin
    .from('formation_leaderboard_snapshots')
    .select('user_id, points, iso_week')
    .eq('formation_id', formationId)
    .neq('iso_week', week)
    .order('created_at', { ascending: false })
  // Dernier snapshot connu par user (semaine antérieure)
  const prevPoints = new Map<string, number>()
  for (const s of snaps ?? []) {
    if (!prevPoints.has(s.user_id as string)) prevPoints.set(s.user_id as string, s.points as number)
  }
  if (prevPoints.size > 0) {
    // Rang précédent dérivé des points snapshot
    const prevSorted = [...prevPoints.entries()].sort((a, b) => b[1] - a[1])
    const prevRank = new Map(prevSorted.map(([uid], i) => [uid, i + 1]))
    rows = rows.map((r) => {
      const pr = prevRank.get(r.user_id)
      return { ...r, rank_change: pr ? pr - r.rank : null }
    })
  }

  // Upsert snapshot de la semaine courante (idempotent)
  await admin.from('formation_leaderboard_snapshots').upsert(
    rows.map((r) => ({ formation_id: formationId, user_id: r.user_id, iso_week: week, points: r.points })),
    { onConflict: 'formation_id,user_id,iso_week' }
  )

  return { formation, lessons_total: total, rows, me: rows.find((r) => r.is_current) ?? null }
}
