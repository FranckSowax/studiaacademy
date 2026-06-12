// ============================================
// Types — Micro-services IA Studia
// ============================================

export type FieldType = 'text' | 'textarea' | 'select'
export type OutputType = 'markdown' | 'html'
export type ServiceCategory = 'education' | 'enseignant' | 'parent' | 'emploi' | 'entrepreneuriat' | 'admin' | 'entreprise'

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

/** Ligne de la table `outil_generations` (résultats sauvegardés). */
export interface OutilGeneration {
  id: string
  user_id: string
  tool_slug: string
  title: string
  inputs: Record<string, string>
  output: string
  output_type: OutputType
  credits_used: number
  created_at: string
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  education: 'Élèves & Étudiants',
  enseignant: 'Enseignants',
  parent: 'Parents',
  emploi: 'Emploi & Carrière',
  entrepreneuriat: 'Entrepreneuriat',
  admin: 'Administratif',
  entreprise: 'Entreprise & RH',
}
