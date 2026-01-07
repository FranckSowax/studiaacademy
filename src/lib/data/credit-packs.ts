export interface CreditPack {
  id: string
  name: string
  credits: number
  price: number
  popular?: boolean
  description: string
}

export const creditPacks: CreditPack[] = [
  {
    id: 'pack-starter',
    name: 'Pack Découverte',
    credits: 5000,
    price: 5000,
    description: 'Idéal pour tester nos services.',
  },
  {
    id: 'pack-standard',
    name: 'Pack Standard',
    credits: 12000,
    price: 10000,
    popular: true,
    description: 'Le choix préféré de nos utilisateurs. +20% de bonus.',
  },
  {
    id: 'pack-pro',
    name: 'Pack Pro',
    credits: 30000,
    price: 20000,
    description: 'Pour une utilisation intensive. +50% de bonus.',
  },
]
