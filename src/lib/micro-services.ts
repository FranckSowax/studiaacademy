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

export const microServices: MicroService[] = [
  {
    slug: 'create',
    titre: 'Générateur de CV',
    sousTitre: 'CV professionnel en minutes',
    description:
      'Créez un CV moderne optimisé pour les recruteurs et les filtres ATS, avec des suggestions de contenu par IA.',
    couleur: '#e97e42',
    iconName: 'FileText',
    href: '/services/create',
    coverImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=400&fit=crop&q=80',
    badge: 'Populaire',
    features: ['Modèles ATS-friendly', 'Suggestions IA', 'Export PDF illimité'],
  },
  {
    slug: 'analyze',
    titre: 'Analyse de CV par IA',
    sousTitre: 'Feedback instantané',
    description:
      "Obtenez un score détaillé et des recommandations concrètes pour améliorer votre CV et décrocher plus d'entretiens.",
    couleur: '#3B82F6',
    iconName: 'ScanLine',
    href: '/services/analyze',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80',
    features: ['Score de qualité', 'Mots-clés manquants', 'Conseils de reformulation'],
  },
  {
    slug: 'interview',
    titre: "Simulateur d'Entretien",
    sousTitre: 'Entraînement réaliste',
    description:
      "Préparez vos entretiens avec une IA qui simule des conditions réelles et analyse vos réponses.",
    couleur: '#8B5CF6',
    iconName: 'Mic',
    href: '/services/interview',
    coverImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop&q=80',
    features: ['Questions adaptées', 'Feedback sur le ton', 'Réécoute des sessions'],
  },
  {
    slug: 'assess',
    titre: 'Tests de Compétences',
    sousTitre: 'Évaluation certifiante',
    description:
      'Évaluez vos compétences avec des tests adaptatifs et obtenez une certification numérique vérifiable.',
    couleur: '#10B981',
    iconName: 'BarChart2',
    href: '/services/assess',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop&q=80',
    features: ['Tests adaptatifs', 'Radar de compétences', 'Certificat vérifiable'],
  },
  {
    slug: 'assistant',
    titre: 'Assistant Carrière 24/7',
    sousTitre: 'Coach virtuel',
    description:
      "Un coach IA disponible à tout moment pour répondre à vos questions et vous orienter dans votre parcours.",
    couleur: '#D946EF',
    iconName: 'Bot',
    href: '/services/assistant',
    coverImage: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&h=400&fit=crop&q=80',
    badge: 'Gratuit',
    features: ['Réponses instantanées', 'Conseils personnalisés', 'Disponible 24/7'],
  },
  {
    slug: 'business',
    titre: 'Recrutement Entreprise',
    sousTitre: 'Vivier de talents',
    description:
      'Accédez à notre vivier de talents certifiés et simplifiez vos processus de recrutement.',
    couleur: '#F59E0B',
    iconName: 'Building2',
    href: '/services/business',
    coverImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=400&fit=crop&q=80',
    features: ['Profils certifiés', 'Recherche ciblée', 'Tableau de bord RH'],
  },
]
