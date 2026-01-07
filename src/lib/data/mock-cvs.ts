import { CVData } from '@/types/cv'

export const mockCVs: (CVData & { id: string, title: string, updatedAt: string, previewImage?: string })[] = [
  {
    id: 'cv-1',
    title: 'CV Développeur Fullstack',
    updatedAt: new Date().toISOString(),
    profile: {
      fullName: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      phone: '+241 07 00 00 00',
      address: 'Libreville, Gabon',
      summary: 'Développeur passionné avec 5 ans d\'expérience...',
      jobTitle: 'Développeur Fullstack',
    },
    experience: [
      {
        id: 'exp-1',
        jobTitle: 'Développeur Senior',
        company: 'Tech Gabon',
        location: 'Libreville',
        startDate: '2020-01',
        current: true,
        description: 'Développement d\'applications web...',
      }
    ],
    education: [],
    skills: [],
    languages: [],
  },
  {
    id: 'cv-2',
    title: 'CV Chef de Projet',
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    profile: {
      fullName: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      phone: '+241 07 00 00 00',
      address: 'Libreville, Gabon',
      summary: 'Gestionnaire de projet certifié PMP...',
      jobTitle: 'Chef de Projet IT',
    },
    experience: [],
    education: [],
    skills: [],
    languages: [],
  }
]
