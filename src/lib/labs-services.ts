// ============================================
// Prestations IT de Studia Labs (contenu éditorial)
// ============================================

export interface LabsService {
  iconName: string
  titre: string
  description: string
  couleur: string
  exemples: string[]
}

export const labsServices: LabsService[] = [
  {
    iconName: 'Brain',
    titre: 'Expertise Intelligence Artificielle',
    description:
      "Intégration de LLM, agents autonomes, automatisation par IA et solutions sur mesure. Nous transformons vos processus avec l'IA générative.",
    couleur: '#7C3AED',
    exemples: ['Agents IA & chatbots', 'Intégration LLM (Mistral, Claude…)', 'OCR & traitement documentaire', 'Automatisation intelligente'],
  },
  {
    iconName: 'Code2',
    titre: 'Développement Web & Mobile',
    description:
      "Applications web, sites vitrines, plateformes SaaS et apps mobiles performantes. Du prototype au produit en production.",
    couleur: '#3B82F6',
    exemples: ['Sites & plateformes web', 'Applications mobiles', 'SaaS sur mesure', 'API & back-ends'],
  },
  {
    iconName: 'Workflow',
    titre: 'Automatisation & Intégrations',
    description:
      "Connectez vos outils, automatisez vos tâches répétitives et fluidifiez vos opérations grâce à des workflows intelligents.",
    couleur: '#10B981',
    exemples: ['Workflows automatisés', 'Intégrations API', 'Scraping & collecte de données', 'Notifications (WhatsApp, email)'],
  },
  {
    iconName: 'BarChart3',
    titre: 'Data & Analytics',
    description:
      "Tableaux de bord, business intelligence et exploitation de vos données pour des décisions éclairées.",
    couleur: '#F59E0B',
    exemples: ['Dashboards temps réel', 'Business Intelligence', 'Reporting automatisé', 'Visualisation de données'],
  },
  {
    iconName: 'Cloud',
    titre: 'Cloud & Déploiement',
    description:
      "Hébergement, déploiement continu et infrastructure scalable. Vos applications disponibles et fiables, partout.",
    couleur: '#06B6D4',
    exemples: ['Déploiement (Railway, Vercel…)', 'Bases de données (Supabase)', 'CI/CD', 'Maintenance & supervision'],
  },
  {
    iconName: 'MessageCircle',
    titre: 'Prospection & Campagnes WhatsApp',
    description:
      "Outils de prospection et de diffusion WhatsApp pour promouvoir vos événements, programmes et offres. Idéal pour animer une communauté — par exemple les événements de l'Institut Français.",
    couleur: '#22C55E',
    exemples: [
      "Campagnes d'invitation aux événements",
      'Prospection & qualification de contacts',
      'Messages personnalisés en masse',
      'Relances & rappels automatisés',
    ],
  },
  {
    iconName: 'Lightbulb',
    titre: 'Conseil & Transformation Digitale',
    description:
      "Audit, stratégie et accompagnement pour digitaliser votre organisation et adopter les bons outils.",
    couleur: '#F43F5E',
    exemples: ['Audit digital', 'Stratégie produit', 'Formation des équipes', 'Accompagnement projet'],
  },
]
