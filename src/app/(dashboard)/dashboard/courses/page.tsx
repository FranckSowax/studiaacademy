'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Play, Clock, Trophy, ChevronRight, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const enrolledCourses = [
  {
    id: 1,
    slug: 'canva-design',
    title: 'Canva Pro : Design Graphique pour Tous',
    instructor: 'Marie Nguema',
    progress: 85,
    totalLessons: 24,
    completedLessons: 20,
    duration: '9h 32min',
    image: '🎨',
    lastAccessed: 'Aujourd\'hui',
    nextLesson: 'Créer des animations avec Canva',
  },
  {
    id: 2,
    slug: 'wordpress-web',
    title: 'WordPress & Création de Sites Web',
    instructor: 'Patrick Mba',
    progress: 45,
    totalLessons: 32,
    completedLessons: 14,
    duration: '12h 45min',
    image: '🌐',
    lastAccessed: 'Hier',
    nextLesson: 'Configurer les plugins essentiels',
  },
  {
    id: 3,
    slug: 'automatisation-make',
    title: 'Automatisation avec Make & Zapier',
    instructor: 'Franck Obame',
    progress: 25,
    totalLessons: 18,
    completedLessons: 4,
    duration: '8h 20min',
    image: '⚡',
    lastAccessed: 'Il y a 3 jours',
    nextLesson: 'Créer votre premier scénario',
  },
]

const recommendedCourses = [
  {
    id: 4,
    slug: 'photoshop-expert',
    title: 'Photoshop : De Zéro à Expert',
    instructor: 'Claire Ndong',
    price: '30 000 FCFA',
    rating: 4.6,
    students: 312,
    image: '📸',
  },
  {
    id: 5,
    slug: 'excel-avance',
    title: 'Excel Avancé : Tableaux Croisés',
    instructor: 'Jean Obiang',
    price: '25 000 FCFA',
    rating: 4.8,
    students: 456,
    image: '📊',
  },
]

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCourses = enrolledCourses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes Formations</h1>
          <p className="text-gray-500">Continuez votre apprentissage</p>
        </div>
        <Link href="/services">
          <Button className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            Explorer le catalogue
          </Button>
        </Link>
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher une formation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42]"
          />
        </div>
        <Button variant="outline" className="border-[#e97e42] text-[#e97e42] hover:bg-[#fff7ed]">
          <Filter className="w-4 h-4 mr-2" />
          Filtrer
        </Button>
      </div>

      {/* Cours en cours */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-[#e97e42]" />
          En cours ({filteredCourses.length})
        </h2>
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-lg hover:shadow-[#e97e42]/10 transition-all"
            >
              <div className="flex gap-5">
                {/* Thumbnail */}
                <div className="w-32 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                  {course.image}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-500">{course.instructor}</p>
                    </div>
                    <span className="text-xs text-gray-400">{course.lastAccessed}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.completedLessons}/{course.totalLessons} leçons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Progression</span>
                        <span className="font-semibold text-[#e97e42]">{course.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                    <Link href={`/services/micro-courses/${course.slug}`}>
                      <Button className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white">
                        <Play className="w-4 h-4 mr-2" />
                        Continuer
                      </Button>
                    </Link>
                  </div>

                  {course.nextLesson && (
                    <p className="text-sm text-gray-500 mt-2">
                      Prochaine leçon : <span className="text-[#e97e42]">{course.nextLesson}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cours terminés */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#e97e42]" />
          Terminés (2)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">
              ✅
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">Introduction au Marketing Digital</h4>
              <p className="text-sm text-gray-500">Complété le 10 Nov 2024</p>
            </div>
            <Link
              href="/dashboard/certificates"
              className="text-[#e97e42] hover:text-[#d56a2e] text-sm font-medium"
            >
              Voir certificat
            </Link>
          </div>
          <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">
              ✅
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">Bases de la Comptabilité</h4>
              <p className="text-sm text-gray-500">Complété le 25 Oct 2024</p>
            </div>
            <Link
              href="/dashboard/certificates"
              className="text-[#e97e42] hover:text-[#d56a2e] text-sm font-medium"
            >
              Voir certificat
            </Link>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Recommandés pour vous</h2>
          <Link
            href="/services"
            className="text-[#e97e42] font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedCourses.map((course) => (
            <Link
              key={course.id}
              href={`/services/micro-courses/${course.slug}`}
              className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4 flex items-center gap-4 hover:shadow-lg hover:shadow-[#e97e42]/10 transition-all group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center text-2xl">
                {course.image}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 group-hover:text-[#e97e42] transition-colors">
                  {course.title}
                </h4>
                <p className="text-sm text-gray-500">{course.instructor}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#e97e42] font-bold">{course.price}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{course.students} étudiants</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#e97e42] transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
