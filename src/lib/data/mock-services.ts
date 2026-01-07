import { Service } from '@/types/service'

export const mockServices: Service[] = [
  {
    id: 1,
    name: 'Test de Compétences',
    slug: 'assess',
    description: 'Évaluez vos compétences techniques et comportementales avec nos tests adaptatifs. Obtenez une certification reconnue et identifiez vos axes d\'amélioration.',
    shortDescription: 'Évaluez vos compétences techniques et comportementales avec nos tests adaptatifs.',
    price: 0,
    free_limit: 1,
    created_at: new Date().toISOString(),
    category: 'assess',
    href: '/services/assess',
    features: [
      'Tests adaptatifs intelligents',
      'Analyse détaillée des résultats',
      'Comparaison avec le marché',
      'Certificat de réussite',
      'Suggestions de formation personnalisées'
    ],
    benefits: [
      { title: 'Validez vos acquis', description: 'Prouvez vos compétences auprès des recruteurs avec des tests standardisés.' },
      { title: 'Progressez rapidement', description: 'Identifiez précisément vos lacunes pour mieux cibler votre apprentissage.' },
      { title: 'Gagnez en crédibilité', description: 'Ajoutez des certifications vérifiées à votre CV et profil LinkedIn.' }
    ],
    faqs: [
      { question: 'Combien de temps durent les tests ?', answer: 'La durée varie selon le test, généralement entre 15 et 45 minutes.' },
      { question: 'Puis-je repasser un test ?', answer: 'Oui, après une période de carence de 30 jours pour permettre la progression.' }
    ]
  },
  {
    id: 2,
    name: 'Générateur de CV',
    slug: 'create',
    description: 'Créez un CV professionnel en quelques minutes grâce à nos modèles optimisés pour les ATS (Applicant Tracking Systems). Mettez toutes les chances de votre côté.',
    shortDescription: 'Créez un CV professionnel en quelques minutes grâce à nos modèles optimisés.',
    price: 2000,
    free_limit: 1,
    created_at: new Date().toISOString(),
    category: 'create',
    href: '/services/create',
    features: [
        'Modèles professionnels et modernes',
        'Optimisation pour les ATS',
        'Suggestions de contenu par IA',
        'Export PDF illimité',
        'Gestion de plusieurs versions'
    ],
    benefits: [
        { title: 'Gagnez du temps', description: 'Ne perdez plus des heures sur la mise en page. Concentrez-vous sur le contenu.' },
        { title: 'Passez les filtres', description: 'Nos modèles sont conçus pour être lus parfaitement par les logiciels de recrutement.' },
        { title: 'Démarquez-vous', description: 'Des designs élégants qui captent l\'attention des recruteurs.' }
    ]
  },
  {
    id: 3,
    name: 'Analyse CV par IA',
    slug: 'analyze',
    description: 'Obtenez un feedback instantané sur votre CV et des suggestions d\'amélioration basées sur l\'intelligence artificielle et les meilleures pratiques RH.',
    shortDescription: 'Obtenez un feedback instantané sur votre CV et des suggestions d\'amélioration.',
    price: 1500,
    free_limit: 0,
    created_at: new Date().toISOString(),
    category: 'create',
    href: '/services/analyze',
    features: [
        'Score global de qualité',
        'Analyse des mots-clés',
        'Détection des erreurs courantes',
        'Conseils de reformulation',
        'Comparaison avec les offres d\'emploi'
    ]
  },
  {
    id: 4,
    name: 'Simulateur d\'Entretien',
    slug: 'interview',
    description: 'Entraînez-vous avec notre IA pour réussir vos entretiens d\'embauche. Simulez des conditions réelles et recevez un feedback constructif sur vos réponses.',
    shortDescription: 'Entraînez-vous avec notre IA pour réussir vos entretiens d\'embauche.',
    price: 3000,
    free_limit: 1,
    created_at: new Date().toISOString(),
    category: 'ai-tools',
    href: '/services/interview',
    features: [
        'Simulation réaliste par chat vocal ou texte',
        'Questions adaptées au poste visé',
        'Analyse du langage et du ton',
        'Conseils pour améliorer vos réponses',
        'Enregistrement et réécoute'
    ]
  },
  {
    id: 5,
    name: 'Micro-Cours : Leadership',
    slug: 'learn-leadership',
    description: 'Développez votre leadership avec ce module court et impactant. Apprenez les fondamentaux du management et de l\'influence positive.',
    shortDescription: 'Développez votre leadership avec ce module court et impactant.',
    price: 5000,
    free_limit: 0,
    created_at: new Date().toISOString(),
    category: 'learn',
    href: '/services/learn/leadership',
  },
  {
    id: 6,
    name: 'Assistant Carrière IA',
    slug: 'assistant',
    description: 'Un coach virtuel disponible 24/7 pour répondre à vos questions professionnelles, vous orienter et vous motiver dans votre parcours.',
    shortDescription: 'Un coach virtuel disponible 24/7 pour répondre à vos questions professionnelles.',
    price: 0,
    free_limit: 10,
    created_at: new Date().toISOString(),
    category: 'ai-tools',
    href: '/services/assistant',
  },
  {
    id: 7,
    name: 'Recrutement Entreprise',
    slug: 'business',
    description: 'Accédez à notre vivier de talents certifiés pour vos besoins en recrutement. Simplifiez vos processus et trouvez les meilleurs profils.',
    shortDescription: 'Accédez à notre vivier de talents certifiés pour vos besoins en recrutement.',
    price: 0, 
    free_limit: 0,
    created_at: new Date().toISOString(),
    category: 'business',
    href: '/services/business',
  },
  {
    id: 8,
    name: 'Forum Communautaire',
    slug: 'community',
    description: 'Échangez avec d\'autres professionnels et partagez vos expériences. Construisez votre réseau et apprenez des autres.',
    shortDescription: 'Échangez avec d\'autres professionnels et partagez vos expériences.',
    price: 0,
    free_limit: 0,
    created_at: new Date().toISOString(),
    category: 'community',
    href: '/community',
  },
]
