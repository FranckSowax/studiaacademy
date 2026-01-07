'use client'

import Link from 'next/link'
import { ChevronRight, Play, Star } from 'lucide-react'
import type { Course } from '@/types/database'

interface RecommendedCoursesProps {
  courses?: Course[]
  isLoading?: boolean
}

// Données de démonstration
const demoCourses = [
  {
    id: '1',
    slug: 'canva-design',
    title: 'Canva Pro : Design Graphique pour Tous',
    instructor: 'Marie Nguema',
    rating: 4.8,
    reviews: 156,
    price: '25 000 FCFA',
    image: '🎨',
    isNew: true,
    duration: '9:32',
  },
  {
    id: '2',
    slug: 'wordpress-web',
    title: 'WordPress & Création de Sites Web',
    instructor: 'Patrick Mba',
    rating: 4.7,
    reviews: 89,
    price: '35 000 FCFA',
    image: '🌐',
    isNew: false,
    duration: '12:45',
  },
  {
    id: '3',
    slug: 'automatisation-make',
    title: 'Automatisation avec Make & Zapier',
    instructor: 'Franck Obame',
    rating: 4.9,
    reviews: 234,
    price: '40 000 FCFA',
    image: '⚡',
    isNew: true,
    duration: '8:20',
  },
  {
    id: '4',
    slug: 'photoshop-expert',
    title: 'Photoshop : De Zéro à Expert',
    instructor: 'Claire Ndong',
    rating: 4.6,
    reviews: 312,
    price: '30 000 FCFA',
    image: '📸',
    isNew: false,
    duration: '15:00',
  },
]

export function RecommendedCourses({ courses, isLoading }: RecommendedCoursesProps) {
  // Utiliser les données de démo si pas de données réelles
  const displayCourses = courses?.length
    ? courses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        instructor: c.instructor_name || 'Formateur',
        rating: c.rating_avg,
        reviews: c.rating_count,
        price: c.price_credits === 0 ? 'Gratuit' : `${c.price_credits} Crédits`,
        image: c.thumbnail_url || '📚',
        isNew: new Date(c.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
        duration: `${Math.floor(c.duration_minutes / 60)}:${String(c.duration_minutes % 60).padStart(2, '0')}`,
      }))
    : demoCourses

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 italic">Formations Recommandées</h2>
          <Link
            href="/services"
            className="text-orange-500 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden border border-orange-100 animate-pulse"
            >
              <div className="h-40 bg-gray-200" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 italic">Formations Recommandées</h2>
        <Link
          href="/services"
          className="text-orange-500 font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          Voir tout <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayCourses.map((course) => (
          <Link
            key={course.id}
            href={`/services/micro-courses/${course.slug}`}
            className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden border border-orange-100 hover:shadow-lg hover:shadow-orange-100 transition-all group"
          >
            {/* Video Thumbnail */}
            <div className="relative h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-6xl">{course.image}</span>
              {course.isNew && (
                <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Nouveau
                </span>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-sm bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Play className="w-4 h-4" fill="white" />
                <span>{course.duration}</span>
              </div>
              {/* Play overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" fill="white" />
                </div>
              </div>
            </div>

            {/* Course Info */}
            <div className="p-4">
              <h4 className="font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">
                {course.title}
              </h4>
              <p className="text-sm text-gray-500 mb-3">{course.instructor}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-orange-400" fill="#FB923C" />
                  <span className="font-semibold text-gray-800">{course.rating}</span>
                  <span className="text-gray-400 text-sm">({course.reviews})</span>
                </div>
                <span className="font-bold text-orange-600">{course.price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
