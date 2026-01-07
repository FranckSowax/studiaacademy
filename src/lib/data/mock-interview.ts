import { Message } from '@/types/interview'

export const mockInterviewMessages: Message[] = [
  {
    id: '1',
    content: 'Bonjour ! Je suis votre recruteur virtuel. Je vais vous faire passer un entretien pour le poste de Chef de Projet. Êtes-vous prêt à commencer ?',
    sender: 'ai',
    timestamp: new Date().toISOString(),
  },
]
