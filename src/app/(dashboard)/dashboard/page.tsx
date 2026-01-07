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
    <div className="space-y-6">
      {/* Quick Links */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.id}
              href={link.href}
              className="flex items-center gap-2 px-4 py-2 bg-[#fbf8f3] rounded-xl border border-[#f0ebe3] hover:shadow-md hover:shadow-[#e97e42]/10 transition-all whitespace-nowrap group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${link.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: link.color }} />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-[#e97e42] transition-colors">
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistiques Panel - Left */}
        <div className="bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Statistique</h2>
            <Link href="/dashboard/skills" className="text-sm text-gray-500 hover:text-[#e97e42] transition-colors">
              Voir tout
            </Link>
          </div>

          {/* User Profile */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#e97e42]/20 to-[#d56a2e]/20 flex items-center justify-center text-4xl border-4 border-white shadow-lg">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={userName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white text-xs px-3 py-1 rounded-full">
                {userStats.level}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Bienvenue, {userName} 👋
            </h3>
          </div>

          {/* Total Activity */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-800">{userStats.totalActivity}%</span>
              <span className="text-gray-500 text-sm">Activité mensuelle</span>
            </div>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              <div className="bg-[#e97e42]/30" style={{ width: `${userStats.activityBreakdown[0]}%` }} />
              <div className="bg-[#F59E0B]" style={{ width: `${userStats.activityBreakdown[1]}%` }} />
              <div className="bg-[#e97e42]" style={{ width: `${userStats.activityBreakdown[2]}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{userStats.activityBreakdown[0]}%</span>
              <span>{userStats.activityBreakdown[1]}%</span>
              <span>{userStats.activityBreakdown[2]}%</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/dashboard/courses" className="bg-white rounded-2xl p-4 text-center hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-pink-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-pink-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">{userStats.inProgress}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </Link>
            <Link href="/dashboard/courses" className="bg-white rounded-2xl p-4 text-center hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">{userStats.upcoming}</p>
              <p className="text-xs text-gray-500">À venir</p>
            </Link>
            <Link href="/dashboard/certificates" className="bg-white rounded-2xl p-4 text-center hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[#fff7ed] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#e97e42]" />
              </div>
              <p className="text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">{userStats.completed}</p>
              <p className="text-xs text-gray-500">Terminés</p>
            </Link>
          </div>
        </div>

        {/* Center Column - Courses & Study Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Courses */}
          <div className="bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-3xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Vos formations</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <Link
                  href="/dashboard/courses"
                  className="ml-2 px-3 py-1 bg-white text-[#e97e42] rounded-full text-sm font-medium hover:bg-[#fbf8f3] transition-colors"
                >
                  Voir tout
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userCourses.slice(courseSlide, courseSlide + 3).map((course) => (
                <Link
                  key={course.id}
                  href="/dashboard/courses"
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-colors"
                >
                  <h3 className="font-bold mb-2">{course.title}</h3>
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{course.level}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {course.completedClasses}/{course.totalClasses} classes
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-bold text-2xl">{course.progress}%</span>
                      <span className="text-white/70">complété</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{course.mentorAvatar}</span>
                    <div>
                      <p className="text-xs text-white/70">Formateur</p>
                      <p className="text-sm font-medium">{course.mentor}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom Row - Study Progress & AI Assistant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Study Progress */}
            <div className="bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Progression études</h2>
                <select className="text-sm text-gray-500 bg-transparent border border-[#f0ebe3] rounded-lg px-2 py-1">
                  <option>Semaine</option>
                  <option>Mois</option>
                  <option>Année</option>
                </select>
              </div>

              <div className="flex items-end justify-between h-40 gap-3">
                {studyProgress.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full bg-gray-200 rounded-t-lg" style={{ height: '120px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${item.value}%`,
                          backgroundColor: item.color,
                        }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-600">
                          {item.value}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full opacity-50" />
              <div className="absolute -right-5 -top-5 w-20 h-20 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full opacity-30" />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#e97e42]" />
                    <span className="text-sm text-gray-500">Model</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">•••</button>
                </div>

                <div className="mb-20">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Assistant IA</h3>
                  <p className="text-sm text-gray-500">Posez vos questions sur vos formations</p>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Demandez quelque chose..."
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    className="flex-1 bg-white border-0 shadow-sm"
                  />
                  <Button className="bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/dashboard/leaderboard"
          className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4 flex items-center gap-3 hover:shadow-md hover:shadow-[#e97e42]/10 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#fff7ed] flex items-center justify-center">
            <Trophy className="w-6 h-6 text-[#e97e42]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">{userStats.points.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Points totaux</p>
          </div>
        </Link>

        <Link
          href="/dashboard/leaderboard"
          className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4 flex items-center gap-3 hover:shadow-md hover:shadow-[#e97e42]/10 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">{userStats.streak} jours</p>
            <p className="text-sm text-gray-500">Série active</p>
          </div>
        </Link>

        <Link
          href="/dashboard/skills"
          className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4 flex items-center gap-3 hover:shadow-md hover:shadow-[#e97e42]/10 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">+12%</p>
            <p className="text-sm text-gray-500">Progression</p>
          </div>
        </Link>

        <Link
          href="/dashboard/certificates"
          className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4 flex items-center gap-3 hover:shadow-md hover:shadow-[#e97e42]/10 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <Award className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800 group-hover:text-[#e97e42]">2</p>
            <p className="text-sm text-gray-500">Certificats</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
