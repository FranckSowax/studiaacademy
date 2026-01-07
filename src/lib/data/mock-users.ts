export interface User {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'moderator' | 'editor' | 'user' | 'student' | 'company'
  status: 'active' | 'suspended' | 'pending'
  joinedAt: string
  lastLogin?: string
}

export const mockUsers: User[] = [
  {
    id: 'usr-1',
    email: 'admin@studia.ga',
    fullName: 'Admin Principal',
    role: 'admin',
    status: 'active',
    joinedAt: '2023-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    email: 'jean.dupont@example.com',
    fullName: 'Jean Dupont',
    role: 'student',
    status: 'active',
    joinedAt: '2023-06-15T10:00:00Z',
    lastLogin: '2024-01-20T14:30:00Z',
  },
  {
    id: 'usr-3',
    email: 'marie.curie@science.org',
    fullName: 'Marie Curie',
    role: 'user',
    status: 'active',
    joinedAt: '2023-09-10T09:15:00Z',
    lastLogin: '2024-01-18T11:20:00Z',
  },
  {
    id: 'usr-4',
    email: 'contact@techgabon.ga',
    fullName: 'Tech Gabon',
    role: 'company',
    status: 'pending',
    joinedAt: '2024-01-21T08:00:00Z',
  },
  {
    id: 'usr-5',
    email: 'moderator@studia.ga',
    fullName: 'Modérateur Contenu',
    role: 'moderator',
    status: 'active',
    joinedAt: '2023-03-12T14:00:00Z',
    lastLogin: '2024-01-21T09:00:00Z',
  },
]
