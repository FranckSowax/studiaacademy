import { Course } from '@/types/course'

export const mockCourses: Course[] = [
  {
    id: 'learn-leadership',
    title: 'Leadership Fondamental',
    description: 'Découvrez les bases du leadership et apprenez à inspirer votre équipe. Ce cours couvre les styles de leadership, la communication efficace et la gestion des conflits.',
    instructor: 'Marie Dubois',
    duration: '45 min',
    level: 'beginner',
    chapters: [
      {
        id: 'chap-1',
        title: 'Introduction au Leadership',
        modules: [
          {
            id: 'mod-1-1',
            title: 'Qu\'est-ce qu\'un leader ?',
            type: 'video',
            duration: '5:00',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
          },
          {
            id: 'mod-1-2',
            title: 'Les différents styles de leadership',
            type: 'text',
            duration: '10:00',
            content: `
              # Les Styles de Leadership
              
              Il existe plusieurs styles de leadership, chacun adapté à des situations différentes :
              
              1. **Autoritaire** : Décisions prises par le chef seul. Utile en situation de crise.
              2. **Démocratique** : Participation de l'équipe à la décision. Favorise l'engagement.
              3. **Laisser-faire** : Grande liberté laissée à l'équipe. Fonctionne avec des experts autonomes.
              
              Choisissez votre style en fonction de votre équipe et du contexte.
            `
          }
        ]
      },
      {
        id: 'chap-2',
        title: 'Communication et Influence',
        modules: [
          {
            id: 'mod-2-1',
            title: 'Écoute active',
            type: 'video',
            duration: '8:30',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
          },
          {
            id: 'mod-2-2',
            title: 'Quiz : Styles de communication',
            type: 'quiz',
            duration: '5:00',
            quizId: 'quiz-comm-styles' // Link to a quiz definition if needed
          }
        ]
      }
    ]
  }
]
