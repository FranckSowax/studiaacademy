/** Slide du hero de la page d'accueil (table `home_slides`). */
export interface HomeSlide {
  id: string
  ordre: number
  titre: string
  sous_titre: string | null
  texte: string | null
  cta_label: string | null
  cta_href: string | null
  image_url: string | null
  is_active: boolean
}

export const MAX_HOME_SLIDES = 5
