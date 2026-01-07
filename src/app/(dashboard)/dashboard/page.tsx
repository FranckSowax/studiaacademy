'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  StudiaHeader,
  ProfilePanel,
  OngoingCourses,
  MicroServicesGrid,
  RecommendedCourses,
} from '@/components/dashboard'
import { getEnrollments, getServices, getCourses } from '@/lib/supabase/api'
import type { Enrollment, Service, Course } from '@/types/database'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext()
  const [showProfile, setShowProfile] = useState(true)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Charger les données
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        const [enrollmentsData, servicesData, coursesData] = await Promise.all([
          getEnrollments(user.id),
          getServices(),
          getCourses(),
        ])

        setEnrollments(enrollmentsData)
        setServices(servicesData)
        setCourses(coursesData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user])

  // Afficher un loader pendant la vérification d'authentification
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  // Ne pas afficher le contenu si non authentifié (en attendant la redirection)
  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {/* Header */}
      <StudiaHeader onProfileToggle={() => setShowProfile(!showProfile)} />

      <div className="flex gap-8">
        {/* Left Column - Main Content */}
        <div className="flex-1 space-y-8">
          {/* Formations en cours */}
          <OngoingCourses
            enrollments={enrollments.filter((e) => e.status === 'in_progress' || e.status === 'enrolled')}
            isLoading={isLoading}
          />

          {/* Micro-Services */}
          <MicroServicesGrid services={services.slice(0, 6)} isLoading={isLoading} />

          {/* Formations recommandées */}
          <RecommendedCourses courses={courses.slice(0, 4)} isLoading={isLoading} />
        </div>

        {/* Right Column - Profile Panel */}
        {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
      </div>
    </>
  )
}
