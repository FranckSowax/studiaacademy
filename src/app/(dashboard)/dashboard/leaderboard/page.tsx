'use client'

import { Trophy, Medal, Crown, TrendingUp, Flame, Star, ChevronUp, ChevronDown } from 'lucide-react'

const leaderboard = [
  { id: 1, rank: 1, name: 'Marie Nguema', points: 12450, streak: 45, change: 0, avatar: '👩‍🎓' },
  { id: 2, rank: 2, name: 'Patrick Mba', points: 11280, streak: 32, change: 1, avatar: '👨‍💼' },
  { id: 3, rank: 3, name: 'Claire Ndong', points: 10950, streak: 28, change: -1, avatar: '👩‍💻' },
  { id: 4, rank: 4, name: 'Jean Obiang', points: 9870, streak: 21, change: 2, avatar: '👨‍🎓' },
  { id: 5, rank: 5, name: 'Sophie Ella', points: 9540, streak: 19, change: 0, avatar: '👩‍🔬' },
  { id: 6, rank: 6, name: 'Marc Essono', points: 8920, streak: 15, change: -2, avatar: '👨‍🏫' },
  { id: 7, rank: 7, name: 'Léa Mbou', points: 8450, streak: 12, change: 1, avatar: '👩‍🎨' },
  { id: 8, rank: 8, name: 'Vous', points: 7890, streak: 7, change: 3, avatar: '🌟', isCurrentUser: true },
  { id: 9, rank: 9, name: 'Paul Nzeng', points: 7650, streak: 10, change: -1, avatar: '👨‍💻' },
  { id: 10, rank: 10, name: 'Emma Biyogo', points: 7320, streak: 8, change: 0, avatar: '👩‍🏫' },
]

const weeklyStats = {
  pointsEarned: 1250,
  testsCompleted: 5,
  lessonsFinished: 8,
  rankChange: 3,
}

export default function LeaderboardPage() {
  const currentUser = leaderboard.find((u) => u.isCurrentUser)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="text-gray-500 font-semibold">#{rank}</span>
  }

  const getChangeIndicator = (change: number) => {
    if (change > 0)
      return (
        <span className="flex items-center text-green-600 text-sm">
          <ChevronUp className="w-4 h-4" />
          {change}
        </span>
      )
    if (change < 0)
      return (
        <span className="flex items-center text-red-500 text-sm">
          <ChevronDown className="w-4 h-4" />
          {Math.abs(change)}
        </span>
      )
    return <span className="text-gray-400 text-sm">-</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Classement</h1>
          <p className="text-gray-500">Comparez-vous aux autres apprenants</p>
        </div>
      </div>

      {/* Stats hebdomadaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-[#e97e42]" />
            <span className="text-sm text-gray-500">Points gagnés</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">+{weeklyStats.pointsEarned}</p>
        </div>
        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-[#e97e42]" />
            <span className="text-sm text-gray-500">Tests complétés</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{weeklyStats.testsCompleted}</p>
        </div>
        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-[#e97e42]" />
            <span className="text-sm text-gray-500">Leçons terminées</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{weeklyStats.lessonsFinished}</p>
        </div>
        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">Progression</span>
          </div>
          <p className="text-2xl font-bold text-green-600">+{weeklyStats.rankChange} places</p>
        </div>
      </div>

      {/* Votre position */}
      {currentUser && (
        <div className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                {currentUser.avatar}
              </div>
              <div>
                <p className="text-white/80 text-sm">Votre position</p>
                <p className="text-3xl font-bold">#{currentUser.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Points totaux</p>
              <p className="text-3xl font-bold">{currentUser.points.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm flex items-center gap-1 justify-end">
                <Flame className="w-4 h-4" /> Série
              </p>
              <p className="text-3xl font-bold">{currentUser.streak} jours</p>
            </div>
          </div>
        </div>
      )}

      {/* Tableau de classement */}
      <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] overflow-hidden">
        <div className="p-4 border-b border-[#f0ebe3]">
          <h2 className="font-bold text-gray-800">Top 10 de la semaine</h2>
        </div>
        <div className="divide-y divide-[#f0ebe3]">
          {leaderboard.map((user) => (
            <div
              key={user.id}
              className={`p-4 flex items-center gap-4 transition-colors ${
                user.isCurrentUser ? 'bg-[#fff7ed]' : 'hover:bg-white'
              }`}
            >
              <div className="w-8 flex justify-center">{getRankIcon(user.rank)}</div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl border border-[#f0ebe3]">
                {user.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${user.isCurrentUser ? 'text-[#e97e42]' : 'text-gray-800'}`}>
                    {user.name}
                  </h4>
                  {user.isCurrentUser && (
                    <span className="text-xs bg-[#e97e42] text-white px-2 py-0.5 rounded-full">
                      Vous
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {user.streak} jours
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">{user.points.toLocaleString()}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>
              <div className="w-12 flex justify-center">{getChangeIndicator(user.change)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
