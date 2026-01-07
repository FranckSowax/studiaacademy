'use client'

import { X, Flame, Target, Trophy, Medal, Calendar, BookOpen, CheckCircle2 } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'

interface ProfilePanelProps {
  onClose: () => void
}

// Weekly streak data
const weekDays = [
  { day: 'Lun', date: 6, active: true },
  { day: 'Mar', date: 7, active: true },
  { day: 'Mer', date: 8, active: true },
  { day: 'Jeu', date: 9, active: false },
  { day: 'Ven', date: 10, active: false },
  { day: 'Sam', date: 11, active: false },
  { day: 'Dim', date: 12, active: false },
]

// Watch time data (heures d'apprentissage)
const watchTimeData = [
  { day: 'Sam', hours: 1.5 },
  { day: 'Dim', hours: 2 },
  { day: 'Lun', hours: 4.4 },
  { day: 'Mar', hours: 3 },
  { day: 'Mer', hours: 2.5 },
  { day: 'Jeu', hours: 1 },
  { day: 'Ven', hours: 0 },
]

export function ProfilePanel({ onClose }: ProfilePanelProps) {
  const { profile, wallet, isLoading } = useAuthContext()

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const maxHours = Math.max(...watchTimeData.map((d) => d.hours))

  // Stats utilisateur (à remplacer par des vraies données plus tard)
  const userStats = {
    streak: 12,
    goalsThisMonth: 4,
    rank: 5,
    coursesInProgress: 3,
    coursesCompleted: 8,
  }

  if (isLoading) {
    return (
      <div className="w-80 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-orange-500 flex items-center gap-2 text-sm font-medium hover:text-orange-600 transition-colors"
          >
            <X className="w-4 h-4" /> Fermer
          </button>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-orange-100 animate-pulse">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2" />
          <div className="h-3 bg-gray-200 rounded w-24 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 space-y-6">
      {/* Close button */}
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="text-orange-500 flex items-center gap-2 text-sm font-medium hover:text-orange-600 transition-colors"
        >
          <X className="w-4 h-4" /> Fermer
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-orange-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {getInitials(profile?.full_name)}
            </div>
            {/* Progress ring */}
            <svg className="absolute -inset-1 w-[72px] h-[72px] -rotate-90">
              <circle cx="36" cy="36" r="32" fill="none" stroke="#FED7AA" strokeWidth="3" />
              <circle
                cx="36"
                cy="36"
                r="32"
                fill="none"
                stroke="#F97316"
                strokeWidth="3"
                strokeDasharray="200"
                strokeDashoffset="50"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{profile?.full_name || 'Utilisateur'}</h3>
            <p className="text-sm text-gray-500">
              {profile?.role === 'admin' ? 'Administrateur' : 'Apprenant Pro'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Medal className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600">
                {wallet?.balance || 0} Crédits
              </span>
            </div>
          </div>
        </div>

        {/* Gamification Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-orange-50 rounded-2xl">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold text-gray-800">{userStats.streak}</span>
            </div>
            <p className="text-xs text-gray-500">Jours consécutifs</p>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-2xl">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-5 h-5 text-pink-500" />
              <span className="text-2xl font-bold text-gray-800">{userStats.goalsThisMonth}</span>
            </div>
            <p className="text-xs text-gray-500">Objectifs</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-2xl">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-gray-800">{userStats.rank}e</span>
            </div>
            <p className="text-xs text-gray-500">Place</p>
          </div>
        </div>
      </div>

      {/* Weekly Streak Calendar */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-orange-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-800">Série Hebdomadaire</h4>
            <button className="text-gray-400 hover:text-gray-600">
              <span className="w-4 h-4 border border-current rounded-full text-xs flex items-center justify-center">
                ?
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
            <Calendar className="w-4 h-4" />
            <span>Jan 2026</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-3">3/7 Jours</p>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center">
              <p className="text-xs text-gray-400 mb-2">{day.day}</p>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all ${
                  day.active
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {day.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Courses Progress Stats */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-orange-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-orange-50 rounded-2xl">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{userStats.coursesInProgress}</p>
            <p className="text-xs text-gray-500">En cours</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-2xl">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{userStats.coursesCompleted}</p>
            <p className="text-xs text-gray-500">Terminées</p>
          </div>
        </div>
      </div>

      {/* Weekly Watch Time Chart */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-orange-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-800">Temps d&apos;étude</h4>
            <button className="text-gray-400 hover:text-gray-600">
              <span className="w-4 h-4 border border-current rounded-full text-xs flex items-center justify-center">
                ?
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
            <Calendar className="w-4 h-4" />
            <span>Jan 2026</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">Cette semaine</p>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-32">
          {watchTimeData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex justify-center">
                {data.hours === maxHours && (
                  <div className="absolute -top-6 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg">
                    {data.hours}h
                  </div>
                )}
                <div
                  className={`w-8 rounded-t-lg transition-all ${
                    data.hours === maxHours
                      ? 'bg-gradient-to-t from-orange-500 to-orange-400'
                      : 'bg-orange-200'
                  }`}
                  style={{ height: `${(data.hours / maxHours) * 100}px` }}
                />
              </div>
              <span className="text-xs text-gray-400">{data.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
