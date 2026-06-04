'use client'

import { useRouter } from 'next/navigation'
import {
  Trophy, Medal, Crown, Flame, Star, ChevronUp, ChevronDown, BookOpen, Zap, CheckCircle,
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { FormationLeaderboard, LeaderRow } from '@/lib/formations/leaderboard'

const initial = (n: string) => n.charAt(0).toUpperCase()

function Avatar({ row, size = 'md' }: { row: LeaderRow; size?: 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-11 h-11 text-base'
  if (row.avatar_url) return <img src={row.avatar_url} alt={row.nom} className={`${cls} rounded-2xl object-cover`} />
  return <div className={`${cls} rounded-2xl bg-gradient-to-br from-[#e97e42]/25 to-[#7C3AED]/20 flex items-center justify-center font-extrabold text-[#a84d16]`}>{initial(row.nom)}</div>
}

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-gray-500 font-semibold text-sm">#{rank}</span>
}

function Change({ c }: { c: number | null }) {
  if (c === null) return <span className="text-gray-300 text-xs">•</span>
  if (c > 0) return <span className="flex items-center text-green-600 text-sm"><ChevronUp className="w-4 h-4" />{c}</span>
  if (c < 0) return <span className="flex items-center text-red-500 text-sm"><ChevronDown className="w-4 h-4" />{Math.abs(c)}</span>
  return <span className="text-gray-400 text-sm">—</span>
}

export function LeaderboardView({
  formations, selectedId, board,
}: {
  formations: { id: string; titre: string; slug: string }[]
  selectedId: string
  board: FormationLeaderboard | null
}) {
  const router = useRouter()
  const rows = board?.rows ?? []
  const me = board?.me ?? null
  const podium = rows.slice(0, 3)

  return (
    <div>
      {/* En-tête + sélecteur de formation */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">Classement</h1>
          <p className="text-gray-500">Votre progression face aux autres apprenants de la formation</p>
        </div>
        {formations.length > 1 && (
          <select
            value={selectedId}
            onChange={(e) => router.push(`/dashboard/leaderboard?formation=${e.target.value}`)}
            className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-medium max-w-xs"
          >
            {formations.map((f) => <option key={f.id} value={f.id}>{f.titre}</option>)}
          </select>
        )}
      </div>

      {/* Ta carte */}
      {me && (
        <div className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-2xl p-6 text-white mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
              <Avatar row={me} size="lg" />
              <div><p className="text-white/80 text-sm">Votre position</p><p className="text-3xl font-bold">#{me.rank}</p></div>
            </div>
            <div><p className="text-white/80 text-sm">Points</p><p className="text-2xl font-bold">{formatNumber(me.points)}</p></div>
            <div><p className="text-white/80 text-sm flex items-center gap-1"><BookOpen className="w-4 h-4" />Leçons</p><p className="text-2xl font-bold">{me.lessons_done}/{me.lessons_total}</p></div>
            <div><p className="text-white/80 text-sm flex items-center gap-1"><Star className="w-4 h-4" />Cette semaine</p><p className="text-2xl font-bold">+{formatNumber(me.weekly_points)}</p></div>
          </div>
        </div>
      )}

      {/* Podium */}
      {podium.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 0, 2].map((pos) => {
            const r = podium[pos]
            if (!r) return <div key={pos} />
            const heights = ['mt-4', '', 'mt-8']
            const ring = pos === 0 ? 'ring-yellow-300' : pos === 1 ? 'ring-gray-300' : 'ring-amber-500'
            return (
              <div key={r.user_id} className={`bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4 text-center ${heights[pos]}`}>
                <div className="flex justify-center mb-2">{rankIcon(r.rank)}</div>
                <div className={`mx-auto mb-2 ring-4 ${ring} rounded-2xl w-fit`}><Avatar row={r} /></div>
                <p className="font-semibold text-sm text-gray-800 truncate">{r.is_current ? 'Vous' : r.nom}</p>
                <p className="text-xs text-gray-400">{formatNumber(r.points)} pts</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Liste complète */}
      <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] overflow-hidden">
        <div className="p-4 border-b border-[#f0ebe3] flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Classement · {rows.length} apprenant{rows.length > 1 ? 's' : ''}</h2>
          <span className="text-xs text-gray-400">Mis à jour en direct</span>
        </div>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">Aucun apprenant classé pour cette formation.</p>
        ) : (
          <div className="divide-y divide-[#f0ebe3]">
            {rows.map((r) => (
              <div key={r.user_id} className={`p-4 flex items-center gap-3 sm:gap-4 ${r.is_current ? 'bg-[#fff7ed]' : 'hover:bg-white'} transition-colors`}>
                <div className="w-8 flex justify-center flex-shrink-0">{rankIcon(r.rank)}</div>
                <Avatar row={r} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold truncate ${r.is_current ? 'text-[#e97e42]' : 'text-gray-800'}`}>{r.is_current ? 'Vous' : r.nom}</h4>
                    {r.completed && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><BookOpen className="w-3 h-3" />{r.lessons_done}/{r.lessons_total}</span>
                    {r.best_quiz > 0 && <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />{formatNumber(r.best_quiz)}</span>}
                    {r.weekly_points > 0 && <span className="inline-flex items-center gap-1 text-green-600"><Flame className="w-3 h-3" />+{formatNumber(r.weekly_points)}/sem</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-800">{formatNumber(r.points)}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
                <div className="w-10 flex justify-center flex-shrink-0"><Change c={r.rank_change} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">Score = leçons terminées ×100 + bonus formation complétée + meilleur score au quiz final. La tendance compare votre rang à la semaine précédente.</p>
    </div>
  )
}
