'use client'

import Link from 'next/link'
import { BookOpen, Clock, ChevronRight, BrainCircuit, BarChart3, Code, Palette } from 'lucide-react'
import type { Enrollment } from '@/types/database'

// Icônes par catégorie
const categoryIcons: Record<string, React.ElementType> = {
  'intelligence-artificielle': BrainCircuit,
  'bureautique': BarChart3,
  'developpement': Code,
  'design': Palette,
  'default': BookOpen,
}

// Couleurs par catégorie
const categoryColors: Record<string, string> = {
  'intelligence-artificielle': '#8B5CF6',
  'bureautique': '#10B981',
  'developpement': '#3B82F6',
  'design': '#EC4899',
  'default': '#F97316',
}

interface OngoingCoursesProps {
  enrollments?: Enrollment[]
  isLoading?: boolean
}

// Données de démonstration
const demoEnrollments = [
  {
    id: '1',
    title: "Maîtriser ChatGPT & l'IA",
    category: 'intelligence-artificielle',
    progress: 65,
    lessons: { current: 13, total: 20 },
    timeLeft: '3h restantes',
  },
  {
    id: '2',
    title: 'Excel Avancé & Power BI',
    category: 'bureautique',
    progress: 45,
    lessons: { current: 9, total: 20 },
    timeLeft: '5h restantes',
  },
]

export function OngoingCourses({ enrollments, isLoading }: OngoingCoursesProps) {
  // Utiliser les données de démo si pas de données réelles
  const courses = enrollments?.length
    ? enrollments.map((e) => ({
        id: e.id,
        title: e.course?.title || 'Formation',
        category: e.course?.category || 'default',
        progress: e.progress,
        lessons: {
          current: e.current_module,
          total: e.course?.modules?.length || 10,
        },
        timeLeft: `${Math.round((e.course?.duration_minutes || 60) * (1 - e.progress / 100) / 60)}h restantes`,
      }))
    : demoEnrollments

  if (isLoading) {
    return (
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 italic">Continuer l&apos;apprentissage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-orange-100 animate-pulse"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full mb-3" />
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-800 mb-4 italic">Continuer l&apos;apprentissage</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => {
          const Icon = categoryIcons[course.category] || categoryIcons.default
          const color = categoryColors[course.category] || categoryColors.default

          return (
            <div
              key={course.id}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-orange-100 hover:shadow-lg hover:shadow-orange-100 transition-all group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    {course.category.replace('-', ' ')}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${course.progress}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}99)`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {course.lessons.current}/{course.lessons.total} Leçons
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{course.timeLeft}</span>
                </div>
              </div>

              <Link
                href={`/dashboard/courses/${course.id}`}
                className="mt-4 text-orange-500 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
              >
                Reprendre <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
