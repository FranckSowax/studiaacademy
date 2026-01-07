import { notFound } from 'next/navigation'
import { mockServices } from '@/lib/data/mock-services'
import { mockQuiz } from '@/lib/data/mock-quiz'
import { mockCourses } from '@/lib/data/mock-courses'
import { QuizView } from '@/components/tools/quiz-view'
import { CVBuilder } from '@/components/tools/cv-builder/cv-builder'
import { InterviewSimulator } from '@/components/tools/interview/interview-simulator'
import { CareerAssistant } from '@/components/tools/assistant/career-assistant'
import { CourseView } from '@/components/tools/courses/course-view'
import { CVAnalysis } from '@/components/tools/analysis/cv-analysis'
import { ServiceGate } from '@/components/tools/service-gate'

interface ServiceStartPageProps {
  params: Promise<{ slug: string }>
}

export default async function ServiceStartPage({ params }: ServiceStartPageProps) {
  const { slug } = await params
  
  // Check if it's a course first (since course IDs might not match service slugs exactly in real app, but here we treat them distinct)
  // Actually, checking services first is better as they define the "product"
  let service = mockServices.find((s) => s.slug === slug)
  
  // Special handling for courses which might be accessed via a specific slug pattern or just ID
  // For this mock, if it's a course, we might need a "service" wrapper for it to have price info
  const course = mockCourses.find(c => c.id === slug)
  
  if (!service && course) {
    // Create a temporary service object for the course if not explicitly defined in services
    service = {
        id: 999,
        name: course.title,
        slug: course.id,
        description: course.description,
        price: 5000, // Default course price if not in services
        free_limit: 0,
        created_at: new Date().toISOString(),
        category: 'learn',
        href: `/services/${course.id}`,
        features: ['Accès illimité', 'Certificat inclus', 'Support instructeur']
    }
  }

  if (!service) {
    notFound()
  }

  // Route based on service type/slug
  if (slug === 'assess') {
    return (
        <ServiceGate service={service}>
            <QuizView quiz={mockQuiz} />
        </ServiceGate>
    )
  }

  if (slug === 'create') {
    return (
        <ServiceGate service={service}>
            <CVBuilder />
        </ServiceGate>
    )
  }

  if (slug === 'interview') {
    return (
        <ServiceGate service={service}>
            <InterviewSimulator />
        </ServiceGate>
    )
  }

  if (slug === 'assistant') {
    return (
        <ServiceGate service={service}>
            <CareerAssistant />
        </ServiceGate>
    )
  }

  if (slug === 'analyze') {
    return (
        <ServiceGate service={service}>
            <CVAnalysis />
        </ServiceGate>
    )
  }

  if (course) {
    return (
        <ServiceGate service={service}>
            <CourseView course={course} />
        </ServiceGate>
    )
  }

  // Placeholder for other tools
  return (
    <ServiceGate service={service}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold">Outil: {service.name}</h1>
        <p className="text-muted-foreground">
            L'interface de cet outil est en cours de développement.
        </p>
        </div>
    </ServiceGate>
  )
}
