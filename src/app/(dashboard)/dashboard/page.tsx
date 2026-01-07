'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  Clock,
  Calendar,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Flame,
  Bot,
  Send,
  BookOpen,
  Trophy,
  BarChart3,
  Award,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Données de démonstration
const userStats = {
  name: 'Utilisateur',
  level: 'Intermédiaire',
  totalActivity: 78,
  activityBreakdown: [42, 15, 56],
  inProgress: 9,
  upcoming: 4,
  completed: 15,
  streak: 7,
  points: 7890,
}

const userCourses = [
  {
    id: 1,
    title: 'Design thinking',
    level: 'Avancé',
    progress: 46,
    totalClasses: 12,
    completedClasses: 4,
    mentor: 'Tomas Luis',
    mentorAvatar: '👨‍🏫',
  },
  {
    id: 2,
    title: 'Leadership',
    level: 'Débutant',
    progress: 72,
    totalClasses: 14,
    completedClasses: 8,
    mentor: 'Nelly Roven',
    mentorAvatar: '👩‍💼',
  },
  {
    id: 3,
    title: 'IT English',
    level: 'Avancé',
    progress: 56,
    totalClasses: 10,
    completedClasses: 6,
    mentor: 'Stefan Colman',
    mentorAvatar: '👨‍💻',
  },
]

const studyProgress = [
  { name: 'Engage', value: 66, color: '#9CA3AF' },
  { name: 'Grow', value: 40, color: '#9CA3AF' },
  { name: 'Skills', value: 87, color: '#e97e42' },
  { name: 'Rate', value: 56, color: '#9CA3AF' },
]

const quickLinks = [
  { id: 'courses', label: 'Mes Formations', icon: BookOpen, href: '/dashboard/courses', color: '#e97e42' },
  { id: 'leaderboard', label: 'Classement', icon: Trophy, href: '/dashboard/leaderboard', color: '#8B5CF6' },
  { id: 'skills', label: 'Compétences', icon: BarChart3, href: '/dashboard/skills', color: '#10B981' },
  { id: 'certificates', label: 'Certificats', icon: Award, href: '/dashboard/certificates', color: '#F59E0B' },
  { id: 'services', label: 'Micro-Services', icon: Zap, href: '/services', color: '#EC4899' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading, isAuthenticated } = useAuthContext()
  const [courseSlide, setCourseSlide] = useState(0)
  const [aiQuestion, setAiQuestion] = useState('')

  // Redirect si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Afficher un loader pendant la vérification d'authentification
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e97e42]"></div>
      </div>
    )
  }

  // Ne pas afficher le contenu si non authentifié
  if (!isAuthenticated) {
    return null
  }

  const userName = profile?.full_name || user?.email?.split('@')[0] || userStats.name

  const nextSlide = () => {
    setCourseSlide((prev) => (prev + 1) % Math.max(1, userCourses.length - 2))
  }

  const prevSlide = () => {
    setCourseSlide((prev) => (prev - 1 + Math.max(1, userCourses.length - 2)) % Math.max(1, userCourses.length - 2))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Links - Horizontal scroll on mobile */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.id}
              href={link.href}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#fbf8f3] rounded-xl border border-[#f0ebe3] hover:shadow-md hover:shadow-[#e97e42]/10 transition-all whitespace-nowrap group flex-shrink-0"
            >
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${link.color}15` }}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: link.color }} />
              </div>
              <span className="font-medium text-sm sm:text-base text-gray-700 group-hover:text-[#e97e42] transition-colors">
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Statistiques Panel - Reorder on mobile: appears after courses */}
        <div className="bg-[#fbf8f3] rounded-2xl sm:rounded-3xl border border-[#f0ebe3] p-4 sm:p-6 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">Statistique</h2>
            <Link href="/dashboard/skills" className="text-xs sm:text-sm text-gray-500 hover:text-[#e97e42] transition-colors">
              Voir tout
            </Link>
          </div>

          {/* User Profile */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <div className="relative mb-3 sm:mb-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#e97e42]/20 to-[#d56a2e]/20 flex items-center justify-center text-3xl sm:text-4xl border-4 border-white shadow-lg">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={userName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                {userStats.level}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 text-center">
              Bienvenue, {userName} 👋
            </h3>
          </div>

          {/* Total Activity */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-bold text-gray-800">{userStats.totalActivity}%</span>
              <span className="text-gray-500 text-xs sm:text-sm">Activité mensuelle</span>
            </div>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              <div className="bg-[#e97e42]/30" style={{ width: `${userStats.activityBreakdown[0]}%` }} />
              <div className="bg-[#F59E0B]" style={{ width: `${userStats.activityBreakdown[1]}%` }} />
              <div className="bg-[#e97e42]" style={{ width: `${userStats.activityBreakdown[2]}%` }} />
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mt-1">
              <span>{userStats.activityBreakdown[0]}%</span>
              <span>{userStats.activityBreakdown[1]}%</span>
              <span>{userStats.activityBreakdown[2]}%</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Link href="/dashboard/courses" className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center hover:shadow-md transition-shadow group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2 rounded-lg sm:rounded-xl bg-pink-50 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">{userStats.inProgress}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">En cours</p>
            </Link>
            <Link href="/dashboard/courses" className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center hover:shadow-md transition-shadow group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2 rounded-lg sm:rounded-xl bg-yellow-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">{userStats.upcoming}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">À venir</p>
            </Link>
            <Link href="/dashboard/certificates" className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center hover:shadow-md transition-shadow group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2 rounded-lg sm:rounded-xl bg-[#fff7ed] flex items-center justify-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#e97e42]" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">{userStats.completed}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Terminés</p>
            </Link>
          </div>
        </div>

        {/* Center Column - Courses & Study Progress */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Your Courses */}
          <div className="bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Vos formations</h2>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={prevSlide}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <Link
                  href="/dashboard/courses"
                  className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 bg-white text-[#e97e42] rounded-full text-xs sm:text-sm font-medium hover:bg-[#fbf8f3] transition-colors"
                >
                  Voir tout
                </Link>
              </div>
            </div>

            {/* Course Cards - Horizontal scroll on mobile, grid on larger screens */}
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:overflow-visible scrollbar-hide">
              {userCourses.slice(courseSlide, courseSlide + 3).map((course) => (
                <Link
                  key={course.id}
                  href="/dashboard/courses"
                  className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-xl transition-all text-gray-800 flex-shrink-0 w-[260px] sm:w-auto"
                >
                  <h3 className="font-bold mb-2 text-sm sm:text-base">{course.title}</h3>
                  <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                    <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">{course.level}</span>
                    <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      {course.completedClasses}/{course.totalClasses} classes
                    </span>
                  </div>
                  <div className="mb-2 sm:mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-bold text-xl sm:text-2xl text-gray-800">{course.progress}%</span>
                      <span className="text-gray-500 text-xs sm:text-sm">complété</span>
                    </div>
                    <div className="h-1 sm:h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#e97e42] rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl">{course.mentorAvatar}</span>
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Formateur</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">{course.mentor}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom Row - Study Progress & AI Assistant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Study Progress */}
            <div className="bg-[#fbf8f3] rounded-2xl sm:rounded-3xl border border-[#f0ebe3] p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">Progression études</h2>
                <select className="text-xs sm:text-sm text-gray-500 bg-transparent border border-[#f0ebe3] rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1">
                  <option>Semaine</option>
                  <option>Mois</option>
                  <option>Année</option>
                </select>
              </div>

              <div className="flex items-end justify-between h-32 sm:h-40 gap-2 sm:gap-3">
                {studyProgress.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full bg-gray-200 rounded-t-lg" style={{ height: '100%' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${item.value}%`,
                          backgroundColor: item.color,
                        }}
                      >
                        <span className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-semibold text-gray-600">
                          {item.value}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-32 sm:w-40 h-32 sm:h-40 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full opacity-50" />
              <div className="absolute -right-5 -top-5 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full opacity-30" />

              <div className="relative">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-[#e97e42]" />
                    <span className="text-xs sm:text-sm text-gray-500">Model</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 text-sm">•••</button>
                </div>

                <div className="mb-12 sm:mb-20">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">Assistant IA</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Posez vos questions sur vos formations</p>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Demandez quelque chose..."
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    className="flex-1 bg-white border-0 shadow-sm text-sm"
                  />
                  <Button className="bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl px-3 sm:px-4">
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/dashboard/leaderboard"
          className="bg-[#fbf8f3] rounded-xl sm:rounded-2xl border border-[#f0ebe3] p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:shadow-md hover:shadow-[#e97e42]/10 transition-all group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#fff7ed] flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#e97e42]" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-gray-800 group-hover:text-[#e97e42] truncate">{userStats.points.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-500">Points totaux</p>
          </div>
        </Link>

        <Link
          href="/dashboard/leaderboard"
          className="bg-[#fbf8f3] rounded-xl sm:rounded-2xl border border-[#f0ebe3] p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:shadow-md hover:shadow-[#e97e42]/10 transition-all group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">{userStats.streak} <span className="text-sm sm:text-base font-normal">jours</span></p>
            <p className="text-xs sm:text-sm text-gray-500">Série active</p>
          </div>
        </Link>

        <Link
          href="/dashboard/skills"
          className="bg-[#fbf8f3] rounded-xl sm:rounded-2xl border border-[#f0ebe3] p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:shadow-md hover:shadow-[#e97e42]/10 transition-all group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">+12%</p>
            <p className="text-xs sm:text-sm text-gray-500">Progression</p>
          </div>
        </Link>

        <Link
          href="/dashboard/certificates"
          className="bg-[#fbf8f3] rounded-xl sm:rounded-2xl border border-[#f0ebe3] p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:shadow-md hover:shadow-[#e97e42]/10 transition-all group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">2</p>
            <p className="text-xs sm:text-sm text-gray-500">Certificats</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
