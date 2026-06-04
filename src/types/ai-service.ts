// ============================================
// Types — Micro-services IA Studia
// ============================================

export type FieldType = 'text' | 'textarea' | 'select'
export type OutputType = 'markdown' | 'html'
export type ServiceCategory = 'emploi' | 'entrepreneuriat' | 'education' | 'admin' | 'entreprise'

export interface ServiceField {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  options?: string[]
  rows?: number
}

export interface AIServiceDef {
  slug: string
  titre: string
  sousTitre: string
  description: string
  iconName: string
  couleur: string
  coverImage?: string
  category: ServiceCategory
  badge?: string
  prixCredits: number
  ctaLabel: string
  outputType: OutputType
  fields: ServiceField[]
  /** Construit le prompt système + message utilisateur à partir des champs saisis. */
  buildPrompt: (inputs: Record<string, string>) => { system: string; user: string }
  /** Texte du bouton de génération. */
  generateLabel?: string
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  emploi: 'Emploi & Carrière',
  entrepreneuriat: 'Entrepreneuriat',
  education: 'Éducation',
  admin: 'Administratif',
  entreprise: 'Entreprise & RH',
}
