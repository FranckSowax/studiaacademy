export interface Service {
  id: number
  name: string
  slug: string
  description: string | null
  shortDescription?: string
  price: number
  free_limit: number
  created_at: string
  category?: 'assess' | 'create' | 'learn' | 'ai-tools' | 'business' | 'community'
  icon?: string
  href: string
  features?: string[]
  benefits?: { title: string; description: string }[]
  faqs?: { question: string; answer: string }[]
  testimonials?: { name: string; role: string; content: string; avatar?: string }[]
}
