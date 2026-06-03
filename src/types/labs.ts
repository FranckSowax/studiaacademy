// ============================================
// Types — Studia Labs
// ============================================

export interface KeyFigure {
  label: string
  value: string
}

export interface LabsSolution {
  id: string
  slug: string
  nom: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  cover_image: string | null
  video_url: string | null
  app_url: string | null
  categorie: string | null
  badge: string | null
  has_detail_page: boolean
  key_figures: KeyFigure[]
  features: string[]
  is_published: boolean
  ordre: number
  created_at: string
  updated_at: string
}
