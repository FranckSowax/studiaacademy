export interface Module {
  slug: string
  titre: string
  sousTitre: string
  description: string
  slogan: string
  couleur: string
  gradient: string
  gradientBg: string
  badge?: string
  features: string[]
  iconName: string
  cta: string
  serviceSlug?: string
  coverImage?: string
  backImage?: string
}

export const modules: Module[] = [
  {
    slug: 'universites-chinoises',
    titre: 'Universités Chinoises',
    sousTitre: 'Studia China Pass · Études & Bourses en Chine',
    slogan: 'De Libreville aux meilleures universités chinoises',
    description:
      "Studia China Pass, c'est un programme intégré : 6 à 9 mois de préparation Mandarin + Anglais à Libreville, l'inscription dans une université chinoise, l'accompagnement aux bourses et un suivi 360° de l'étudiant et de sa famille — du premier entretien jusqu'au diplôme.",
    couleur: '#7C3AED',
    gradient: 'from-violet-600 to-purple-700',
    gradientBg: 'from-violet-50 to-purple-50',
    badge: 'Programme phare',
    features: [
      'Préparation Mandarin (HSK) + Anglais (IELTS) à Libreville',
      'Accès à +280 universités chinoises agréées',
      'Accompagnement aux bourses : CSC, universitaires, provinciales',
      'Suivi 360° de l’étudiant et de la famille jusqu’au diplôme',
      'Accompagnement visa & installation en Chine',
      'Certification Studia vérifiable',
    ],
    iconName: 'GraduationCap',
    cta: 'Découvrir les universités',
    coverImage: '/universites-chinoises.png',
    backImage: '/universites-chinoises.png',
  },
  {
    slug: 'tests-competences',
    titre: 'Tests de Compétences',
    sousTitre: 'Évaluation & Certification',
    slogan: 'Mesurez-vous à l\'excellence',
    description:
      "Évaluez vos compétences professionnelles avec des tests adaptatifs par IA et obtenez des certifications reconnues par les recruteurs.",
    couleur: '#e97e42',
    gradient: 'from-orange-500 to-orange-600',
    gradientBg: 'from-orange-50 to-amber-50',
    features: [
      'Tests adaptatifs intelligents par IA',
      'Analyse radar des compétences',
      'Certification numérique vérifiable',
      'Recommandations personnalisées',
    ],
    iconName: 'BarChart2',
    cta: 'Passer un test',
    serviceSlug: 'assess',
    coverImage: '/tests-competences.png',
    backImage: '/tests-competences.png',
  },
  {
    slug: 'preparation-soutenance',
    titre: 'Préparation Soutenance',
    sousTitre: 'Coaching & Simulation',
    slogan: 'Défendez avec confiance',
    description:
      "Préparez vos soutenances de mémoire, thèse ou présentations professionnelles avec notre simulateur IA et nos coaches certifiés.",
    couleur: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600',
    gradientBg: 'from-blue-50 to-sky-50',
    features: [
      'Simulation de soutenance par IA',
      'Feedback sur langage et ton',
      'Questions jury types par domaine',
      'Sessions avec coach humain disponibles',
    ],
    iconName: 'Mic',
    cta: 'Préparer ma soutenance',
    serviceSlug: 'interview',
    coverImage: '/preparation-soutenance.png',
    backImage: '/preparation-soutenance.png',
  },
  {
    slug: 'training-sessions',
    titre: 'Training Sessions',
    sousTitre: 'Micro-formations intensives',
    slogan: 'Apprenez en intensif',
    description:
      "Des sessions de formation intensives en petits groupes sur des compétences clés : leadership, management, digital et communication.",
    couleur: '#10B981',
    gradient: 'from-emerald-500 to-emerald-600',
    gradientBg: 'from-emerald-50 to-teal-50',
    features: [
      'Sessions de 2 à 8 heures',
      'Groupes de 5 à 15 personnes max',
      'Formateurs certifiés et expérimentés',
      'Certificat de participation officiel',
    ],
    iconName: 'BookOpen',
    cta: 'Voir les sessions',
    serviceSlug: 'learn',
    coverImage: '/training-sessions.png',
    backImage: '/training-sessions.png',
  },
  {
    slug: 'audit-ia-entreprises',
    titre: 'Audit IA Entreprises',
    sousTitre: 'Diagnostic & Transformation IA',
    slogan: "Faites de l'IA un avantage concret",
    description:
      "Un audit complet de votre organisation pour identifier où l'intelligence artificielle vous fera gagner du temps et de l'argent. Diagnostic 360°, cas d'usage priorisés, feuille de route concrète et accompagnement des équipes — adapté aux réalités des entreprises et administrations gabonaises.",
    couleur: '#F59E0B',
    gradient: 'from-amber-500 to-amber-600',
    gradientBg: 'from-amber-50 to-yellow-50',
    badge: 'Entreprises',
    features: [
      'Diagnostic organisationnel 360° (processus, données, outils, équipes)',
      'Cartographie des cas d’usage IA priorisés par ROI',
      'Feuille de route concrète sur 6 à 12 mois',
      'Formation et montée en compétence des équipes',
      'Accompagnement au déploiement, pas juste un rapport',
      'Confidentialité des données garantie',
    ],
    iconName: 'Building2',
    cta: 'Demander un audit',
    serviceSlug: 'business',
    coverImage: '/audit-ia-entreprises.png',
    backImage: '/audit-ia-entreprises.png',
  },
  {
    slug: 'formations-presentiel',
    titre: 'Formations Présentiel',
    sousTitre: 'Centre de formation Libreville',
    slogan: 'L\'excellence en salle',
    description:
      "Des formations en salle à Libreville animées par des experts locaux et internationaux. Networking, pratique intensive et immersion complète.",
    couleur: '#F43F5E',
    gradient: 'from-rose-500 to-rose-600',
    gradientBg: 'from-rose-50 to-pink-50',
    features: [
      'Formations de 1 à 5 jours',
      'Salle équipée au centre de Libreville',
      'Intervenants locaux & internationaux',
      'Attestation officielle délivrée',
    ],
    iconName: 'Users',
    cta: 'Voir le calendrier',
    coverImage: '/formations-presentiel.png',
    backImage: '/formations-presentiel.png',
  },
  {
    slug: 'digitalisation',
    titre: 'Digitalisation',
    sousTitre: 'Accompagnement numérique',
    slogan: 'Le numérique au service de votre croissance',
    description:
      "Accompagnez votre entreprise ou administration dans sa transition numérique : outils cloud, processus optimisés, formation des équipes et support continu.",
    couleur: '#06B6D4',
    gradient: 'from-cyan-500 to-cyan-600',
    gradientBg: 'from-cyan-50 to-sky-50',
    features: [
      'Audit des outils et processus existants',
      'Déploiement solutions cloud adaptées',
      'Formation des équipes sur site',
      'Support et maintenance post-déploiement',
    ],
    iconName: 'Laptop',
    cta: 'Digitaliser mon organisation',
    coverImage: '/digitalisation.png',
    backImage: '/digitalisation.png',
  },
  {
    slug: 'accompagnement-pedagogique',
    titre: 'Accompagnement Pédagogique',
    sousTitre: 'Coaching personnalisé',
    slogan: 'Un expert, rien que pour vous',
    description:
      "Accompagnement individuel par des pédagogues certifiés pour les étudiants, enseignants et institutions souhaitant améliorer leurs résultats.",
    couleur: '#6366F1',
    gradient: 'from-indigo-500 to-indigo-600',
    gradientBg: 'from-indigo-50 to-violet-50',
    features: [
      'Coach dédié assigné en 24h',
      'Suivi hebdomadaire des progrès',
      "Plan d'apprentissage sur mesure",
      'Disponible en ligne et présentiel',
    ],
    iconName: 'Heart',
    cta: 'Trouver mon coach',
    serviceSlug: 'assistant',
    coverImage: '/accompagnement-pedagogique.png',
    backImage: '/accompagnement-pedagogique.png',
  },
  {
    slug: 'experience-interactive',
    titre: 'Expérience Interactive',
    sousTitre: 'Communauté & Innovation',
    slogan: 'Apprenez ensemble, grandissez ensemble',
    description:
      "Rejoignez notre écosystème d'apprenants et de professionnels. Hackathons, challenges, événements live et projets collaboratifs.",
    couleur: '#D946EF',
    gradient: 'from-fuchsia-500 to-fuchsia-600',
    gradientBg: 'from-fuchsia-50 to-pink-50',
    features: [
      'Communauté active +2000 membres',
      'Hackathons et challenges trimestriels',
      'Événements networking réguliers',
      'Projets collaboratifs inter-membres',
    ],
    iconName: 'Sparkles',
    cta: 'Rejoindre la communauté',
    serviceSlug: 'community',
    coverImage: '/experience-interactive.png',
    backImage: '/experience-interactive.png',
  },
]

export function getModuleBySlug(slug: string): Module | undefined {
  return modules.find((m) => m.slug === slug)
}
