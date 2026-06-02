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
    sousTitre: 'Études & Bourses en Chine',
    slogan: 'Ouvrez les portes du monde',
    description:
      "Accédez aux meilleures universités chinoises grâce à notre réseau de partenariats. Accompagnement visa, orientation académique, cours de mandarin et bourses partielles disponibles.",
    couleur: '#7C3AED',
    gradient: 'from-violet-600 to-purple-700',
    gradientBg: 'from-violet-50 to-purple-50',
    badge: 'Flagship',
    features: [
      'Partenariats avec +20 universités chinoises',
      'Accompagnement visa étudiant complet',
      'Cours de mandarin inclus',
      'Bourses partielles disponibles',
    ],
    iconName: 'GraduationCap',
    cta: 'Découvrir les universités',
    coverImage: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&h=800&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=600&h=800&fit=crop&q=80',
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
    coverImage: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&h=800&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=800&fit=crop&q=80',
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
    coverImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=800&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop&q=80',
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
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=800&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=800&fit=crop&q=80',
  },
  {
    slug: 'audit-ia-entreprises',
    titre: 'Audit IA Entreprises',
    sousTitre: 'Transformation Digitale',
    slogan: 'Transformez votre organisation',
    description:
      "Audit complet de votre organisation et plan de transformation vers l'IA. Identifiez les processus automatisables et gagnez en efficacité opérationnelle.",
    couleur: '#F59E0B',
    gradient: 'from-amber-500 to-amber-600',
    gradientBg: 'from-amber-50 to-yellow-50',
    badge: 'Entreprises',
    features: [
      'Diagnostic organisationnel 360°',
      'Cartographie des processus automatisables',
      'Plan de déploiement IA personnalisé',
      'Support post-implémentation inclus',
    ],
    iconName: 'Building2',
    cta: 'Demander un audit',
    serviceSlug: 'business',
    coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=800&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=800&fit=crop&q=80',
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
    coverImage: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&h=800&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&h=800&fit=crop&q=80',
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
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=800&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=800&fit=crop&q=80',
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
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=800&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1491308056676-205b7c9a7dc1?w=600&h=800&fit=crop&q=80',
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
    coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=800&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=800&fit=crop&q=80',
  },
]

export function getModuleBySlug(slug: string): Module | undefined {
  return modules.find((m) => m.slug === slug)
}
