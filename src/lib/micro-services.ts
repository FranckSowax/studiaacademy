export interface MicroService {
  slug: string
  titre: string
  sousTitre: string
  description: string
  couleur: string
  iconName: string
  href: string
  coverImage: string
  badge?: string
  features: string[]
}

// Vitrine home — pointe vers les outils IA (/outils/[slug])
export const microServices: MicroService[] = [
  {
    slug: 'pack-candidature',
    titre: 'Pack Candidature',
    sousTitre: 'CV + lettre + relance',
    description:
      "Générez un CV optimisé, une lettre de motivation et un e-mail de relance adaptés à une offre, prêts à envoyer.",
    couleur: '#e97e42',
    iconName: 'FileText',
    href: '/outils/pack-candidature',
    coverImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=400&fit=crop&q=80',
    badge: 'Populaire',
    features: ['CV optimisé ATS', 'Lettre personnalisée', 'E-mail de relance'],
  },
  {
    slug: 'prepa-concours',
    titre: 'Prépa Concours Admin',
    sousTitre: 'Plan + QCM corrigés',
    description:
      "Préparez les concours de la fonction publique : plan de révision et questions d'entraînement corrigées.",
    couleur: '#7C3AED',
    iconName: 'GraduationCap',
    href: '/outils/prepa-concours',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop&q=80',
    badge: 'Top demande',
    features: ['Plan de révision', 'QCM type concours', 'Conseils de méthode'],
  },
  {
    slug: 'business-plan',
    titre: 'Business Plan express',
    sousTitre: 'Pour les financeurs',
    description:
      'Transformez votre idée en business plan structuré avec prévisionnel — exigé par banques et microfinance.',
    couleur: '#F59E0B',
    iconName: 'Briefcase',
    href: '/outils/business-plan',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
    features: ['Marché & concurrence', 'Modèle économique', 'Prévisionnel FCFA'],
  },
  {
    slug: 'pitch-html',
    titre: 'Pitch de projet (HTML)',
    sousTitre: 'Présentation web',
    description:
      'Générez une présentation moderne en HTML, prête à montrer à un investisseur, un jury ou un client.',
    couleur: '#3B82F6',
    iconName: 'Presentation',
    href: '/outils/pitch-html',
    coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop&q=80',
    badge: 'Effet waouh',
    features: ['Slides web élégantes', "Adapté à l'audience", 'Téléchargeable'],
  },
  {
    slug: 'courrier-admin',
    titre: 'Courrier administratif',
    sousTitre: 'Demande, réclamation…',
    description:
      'Rédigez un courrier administratif clair et bien formulé en quelques secondes, prêt à imprimer.',
    couleur: '#10B981',
    iconName: 'Mail',
    href: '/outils/courrier-admin',
    coverImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop&q=80',
    features: ['Tous types de courriers', 'Français soutenu', 'Prêt à imprimer'],
  },
]
