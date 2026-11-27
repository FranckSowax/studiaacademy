// ============================================
// Secteurs d'activité — une formation « métier + outils IA » par secteur
// ============================================

/** Outil utilisé dans une formation. Les gratuits sont listés en premier. */
export interface OutilIA {
  nom: string
  acces: 'gratuit' | 'payant'
}

/** Leçon bâtie sur une situation réelle du métier. */
export interface CasMetier {
  titre: string
  /** Outil principal de la leçon (tel qu'affiché). */
  outil: string
}

export interface FormationMetier {
  titre: string
  promesse: string
  outils: OutilIA[]
  cas: CasMetier[]
  /** Règle de prudence propre au métier, affichée sur la fiche. */
  garde_fou?: string
}

export interface Secteur {
  slug: string
  label: string
  iconName: string
  couleur: string
  cover: string
  accroche: string
  description: string
  formation: FormationMetier
}

export const SECTEURS: Secteur[] = [
  {
    slug: 'ressources-humaines',
    label: 'Ressources Humaines',
    iconName: 'Users',
    couleur: '#7C3AED',
    cover: '/secteurs/ressources-humaines.png',
    accroche: "Recrutez, formez et fidélisez plus vite grâce à l'IA",
    description: "De l'offre d'emploi à l'accueil du nouvel employé : les gestes RH du quotidien, faits plus vite et mieux avec des outils IA gratuits.",
    formation: {
      titre: "Recruter et gérer son équipe avec l'IA",
      promesse: "Offres d'emploi, tri de CV, entretiens et documents RH : gagnez des heures chaque semaine sans perdre la main sur les décisions.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'Google Forms', acces: 'gratuit' },
        { nom: 'NotebookLM', acces: 'gratuit' },
      ],
      cas: [
        { titre: "Rédiger une offre d'emploi et la décliner pour Facebook et LinkedIn", outil: 'ChatGPT' },
        { titre: 'Trier 30 CV avec une grille de critères, la décision restant humaine', outil: 'ChatGPT' },
        { titre: "Préparer une trame d'entretien et les questions clés du poste", outil: 'ChatGPT' },
        { titre: 'Rédiger une attestation, un avertissement, une note de service', outil: 'ChatGPT' },
        { titre: "Construire le parcours d'accueil d'un nouvel employé sur 30 jours", outil: 'Google Forms' },
      ],
      garde_fou: "L'IA prépare et classe ; le choix d'un candidat reste une décision humaine. Retirez les données personnelles avant de coller un CV.",
    },
  },
  {
    slug: 'administration',
    label: 'Administration & Fonction publique',
    iconName: 'Landmark',
    couleur: '#2563EB',
    cover: '/secteurs/administration.png',
    accroche: 'Courriers, notes et dossiers traités plus vite',
    description: "Répondre aux usagers, synthétiser un dossier, rédiger une note : le travail administratif allégé, dans le respect du ton officiel.",
    formation: {
      titre: 'Courriers, notes et dossiers en deux fois moins de temps',
      promesse: "Rédigez dans le ton administratif, résumez de longs dossiers et suivez vos instances sans y passer la journée.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'Gemini', acces: 'gratuit' },
        { nom: 'NotebookLM', acces: 'gratuit' },
      ],
      cas: [
        { titre: "Répondre à un courrier d'usager dans le ton administratif", outil: 'ChatGPT' },
        { titre: "Résumer un dossier de 40 pages en une note d'une page", outil: 'NotebookLM' },
        { titre: 'Rédiger une note de service et un compte rendu de réunion', outil: 'Gemini' },
        { titre: 'Transformer un texte réglementaire en fiche pratique pour le public', outil: 'NotebookLM' },
        { titre: 'Créer un tableau de suivi des dossiers en instance', outil: 'ChatGPT' },
      ],
      garde_fou: "Aucun document classé ou nominatif dans un outil IA : on travaille sur des versions anonymisées.",
    },
  },
  {
    slug: 'secretariat',
    label: 'Secrétariat & Assistanat',
    iconName: 'ClipboardList',
    couleur: '#DB2777',
    cover: '/secteurs/secretariat.png',
    accroche: "E-mails, comptes rendus et agenda : l'assistanat augmenté",
    description: "Traiter sa boîte de réception, produire un compte rendu, préparer un déplacement : les réflexes IA de l'assistant(e) d'aujourd'hui.",
    formation: {
      titre: "L'assistant(e) augmenté(e) : e-mails, comptes rendus, agenda",
      promesse: "Répondez aux e-mails difficiles en deux minutes et sortez un compte rendu propre avant la fin de la réunion.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'Gemini dans Gmail', acces: 'gratuit' },
        { nom: 'Extension Claude pour Chrome', acces: 'payant' },
      ],
      cas: [
        { titre: 'Traiter un e-mail difficile avec la méthode Contexte, Objectif, Ton, Format', outil: 'ChatGPT' },
        { titre: 'Trier et résumer sa boîte de réception directement dans le navigateur', outil: 'Gemini dans Gmail' },
        { titre: 'Transformer une note vocale de réunion en compte rendu propre', outil: 'ChatGPT' },
        { titre: 'Préparer un déplacement : programme, courriers, liste de contrôle', outil: 'ChatGPT' },
        { titre: "Mettre en forme une présentation à partir d'un brouillon", outil: 'Gemini' },
      ],
    },
  },
  {
    slug: 'comptabilite-finance',
    label: 'Comptabilité & Finance',
    iconName: 'Calculator',
    couleur: '#059669',
    cover: '/secteurs/comptabilite.png',
    accroche: 'Excel, factures et relances sans y passer ses soirées',
    description: "Formules, exports bancaires, relances d'impayés, trésorerie : les tâches chiffrées accélérées par l'IA, toujours vérifiées par vous.",
    formation: {
      titre: 'Excel, factures et relances sans y passer ses soirées',
      promesse: "Décrivez ce que vous voulez en français : l'IA écrit la formule, nettoie le fichier et prépare la relance.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'Google Sheets', acces: 'gratuit' },
        { nom: 'Copilot', acces: 'gratuit' },
      ],
      cas: [
        { titre: 'Faire écrire une formule Excel en la décrivant en français', outil: 'ChatGPT' },
        { titre: 'Nettoyer un export bancaire et catégoriser les dépenses', outil: 'Google Sheets' },
        { titre: 'Rédiger trois niveaux de relance pour une facture impayée', outil: 'ChatGPT' },
        { titre: 'Monter un tableau de trésorerie mensuel simple', outil: 'Google Sheets' },
        { titre: 'Expliquer un bilan à un dirigeant non comptable', outil: 'Copilot' },
      ],
      garde_fou: "L'IA se trompe parfois dans les calculs : chaque chiffre se recontrôle dans le tableur.",
    },
  },
  {
    slug: 'commerce-vente',
    label: 'Commerce & Vente',
    iconName: 'ShoppingBag',
    couleur: '#EA580C',
    cover: '/secteurs/commerce.png',
    accroche: 'Prospectez et relancez sur WhatsApp avec méthode',
    description: "Messages de prospection, réponses aux objections, fiches produit, relances : vendez plus avec les outils que vos clients utilisent déjà.",
    formation: {
      titre: "Prospecter et relancer sur WhatsApp avec l'IA",
      promesse: "Des messages qui obtiennent une réponse, des objections préparées et des relances qui ne se perdent plus.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'WhatsApp Business', acces: 'gratuit' },
        { nom: 'Canva', acces: 'gratuit' },
      ],
      cas: [
        { titre: 'Écrire un message de prospection WhatsApp qui obtient une réponse', outil: 'ChatGPT' },
        { titre: 'Préparer les réponses aux cinq objections les plus fréquentes', outil: 'ChatGPT' },
        { titre: 'Créer une fiche produit et son visuel', outil: 'Canva' },
        { titre: 'Relancer un devis resté sans réponse', outil: 'WhatsApp Business' },
        { titre: 'Analyser ses ventes du mois et choisir trois actions', outil: 'ChatGPT' },
      ],
    },
  },
  {
    slug: 'communication-marketing',
    label: 'Communication & Marketing',
    iconName: 'Megaphone',
    couleur: '#E11D48',
    cover: '/secteurs/communication.png',
    accroche: 'Un mois de contenus en une après-midi',
    description: "Calendrier éditorial, posts, visuels, vidéos courtes : produisez régulièrement sans équipe ni budget d'agence.",
    formation: {
      titre: 'Un mois de contenus en une après-midi',
      promesse: "Planifiez, rédigez et illustrez vos publications du mois, puis ajustez à partir de vos statistiques.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'Canva', acces: 'gratuit' },
        { nom: 'CapCut', acces: 'gratuit' },
      ],
      cas: [
        { titre: "Bâtir un calendrier éditorial d'un mois", outil: 'ChatGPT' },
        { titre: 'Décliner une idée en post, story et script de vidéo courte', outil: 'ChatGPT' },
        { titre: "Créer les visuels à partir d'un modèle", outil: 'Canva' },
        { titre: 'Monter une vidéo courte sous-titrée', outil: 'CapCut' },
        { titre: 'Répondre aux commentaires et aux avis négatifs', outil: 'ChatGPT' },
      ],
    },
  },
  {
    slug: 'education',
    label: 'Éducation & Enseignement',
    iconName: 'GraduationCap',
    couleur: '#0891B2',
    cover: '/secteurs/education.png',
    accroche: 'Préparez, animez et corrigez vos cours plus vite',
    description: "Fiches de préparation, exercices par niveau, quiz, correction : plus de temps pour les élèves, moins pour la préparation.",
    formation: {
      titre: "Préparer, animer et corriger ses cours avec l'IA",
      promesse: "Une séance prête en vingt minutes, des exercices sur trois niveaux et des copies commentées sans y laisser son week-end.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'NotebookLM', acces: 'gratuit' },
        { nom: 'Kahoot', acces: 'gratuit' },
      ],
      cas: [
        { titre: 'Créer une fiche de préparation conforme au programme', outil: 'ChatGPT' },
        { titre: 'Générer des exercices sur trois niveaux de difficulté', outil: 'ChatGPT' },
        { titre: "Fabriquer un quiz interactif à partir d'une leçon", outil: 'Kahoot' },
        { titre: 'Corriger des copies avec une grille et un commentaire personnalisé', outil: 'ChatGPT' },
        { titre: 'Résumer un manuel et en tirer une fiche de révision', outil: 'NotebookLM' },
      ],
    },
  },
  {
    slug: 'sante',
    label: 'Santé & Médical',
    iconName: 'HeartPulse',
    couleur: '#DC2626',
    cover: '/secteurs/sante.png',
    accroche: 'Moins de paperasse, plus de temps pour les patients',
    description: "Fiches de conseils, affiches de sensibilisation, plannings, courriers : l'IA au service de l'organisation, jamais du diagnostic.",
    formation: {
      titre: 'Moins de paperasse, plus de temps pour les patients',
      promesse: "Allégez l'administratif de votre structure et expliquez mieux, avec des supports clairs pour vos patients.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'Canva', acces: 'gratuit' },
        { nom: 'Google Sheets', acces: 'gratuit' },
      ],
      cas: [
        { titre: 'Rédiger une fiche de conseils patient en langage simple', outil: 'ChatGPT' },
        { titre: "Créer une affiche de sensibilisation pour la salle d'attente", outil: 'Canva' },
        { titre: 'Organiser le planning des gardes et des rendez-vous', outil: 'Google Sheets' },
        { titre: "Rédiger un courrier de liaison ou un rapport d'activité", outil: 'ChatGPT' },
        { titre: 'Résumer un article médical pour la formation continue', outil: 'ChatGPT' },
      ],
      garde_fou: "Aucune donnée nominative de patient dans un outil IA, et aucun diagnostic confié à l'IA.",
    },
  },
  {
    slug: 'agriculture',
    label: 'Agriculture & Agro-business',
    iconName: 'Sprout',
    couleur: '#65A30D',
    cover: '/secteurs/agriculture.png',
    accroche: 'Gérez et vendez votre production avec votre téléphone',
    description: "Reconnaître une maladie, tenir ses comptes à la voix, fixer son prix, vendre sur WhatsApp : tout se fait depuis un simple téléphone.",
    formation: {
      titre: 'Gérer et vendre sa production avec son téléphone',
      promesse: "Un téléphone suffit : photo, voix et WhatsApp pour mieux suivre ses cultures, ses comptes et ses ventes.",
      outils: [
        { nom: 'ChatGPT (mode vocal)', acces: 'gratuit' },
        { nom: 'Google Lens', acces: 'gratuit' },
        { nom: 'WhatsApp Business', acces: 'gratuit' },
      ],
      cas: [
        { titre: "Identifier une maladie de plante à partir d'une photo, puis vérifier auprès d'un technicien", outil: 'Google Lens' },
        { titre: 'Tenir son cahier de charges et recettes en dictant à la voix', outil: 'ChatGPT (mode vocal)' },
        { titre: 'Calculer son coût de revient et son prix de vente', outil: 'ChatGPT' },
        { titre: 'Rédiger une annonce de vente et un catalogue', outil: 'WhatsApp Business' },
        { titre: 'Préparer un dossier de demande de financement', outil: 'ChatGPT' },
      ],
      garde_fou: "Un diagnostic par photo est une piste, pas une certitude : confirmez avant de traiter.",
    },
  },
  {
    slug: 'entrepreneuriat',
    label: 'Entrepreneuriat & Startups',
    iconName: 'Rocket',
    couleur: '#D97706',
    cover: '/secteurs/entrepreneuriat.png',
    accroche: "De l'idée au premier client",
    description: "Tester son idée, chiffrer son projet, pitcher et lancer sa première offre : l'IA comme associé de démarrage.",
    formation: {
      titre: "De l'idée au premier client avec l'IA",
      promesse: "Validez votre idée auprès de vrais clients, posez vos chiffres et lancez une première offre en quelques semaines.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'Gemini', acces: 'gratuit' },
        { nom: 'Gamma (crédits offerts)', acces: 'gratuit' },
        { nom: 'Canva', acces: 'gratuit' },
      ],
      cas: [
        { titre: 'Tester une idée avec dix questions à poser à de vrais clients', outil: 'ChatGPT' },
        { titre: "Rédiger un business plan d'une page", outil: 'Gemini' },
        { titre: 'Calculer son seuil de rentabilité', outil: 'ChatGPT' },
        { titre: 'Créer un pitch de trois minutes et ses diapositives', outil: 'Gamma' },
        { titre: 'Lancer sa première offre sur WhatsApp et Facebook', outil: 'Canva' },
      ],
    },
  },
  {
    slug: 'services',
    label: 'Services & Artisanat',
    iconName: 'Wrench',
    couleur: '#0EA5E9',
    cover: '/secteurs/services.png',
    accroche: 'Devis, clients et visibilité depuis son téléphone',
    description: "Prestataires, artisans, indépendants : des devis propres, des clients mieux suivis et une présence en ligne qui ramène du travail.",
    formation: {
      titre: 'Devis, clients et visibilité depuis son téléphone',
      promesse: "Un devis propre dicté à la voix, des réponses automatiques aux clients et des avis qui font venir les suivants.",
      outils: [
        { nom: 'ChatGPT', acces: 'gratuit' },
        { nom: 'WhatsApp Business', acces: 'gratuit' },
        { nom: 'Fiche Google', acces: 'gratuit' },
        { nom: 'Canva', acces: 'gratuit' },
      ],
      cas: [
        { titre: "Faire un devis propre à partir d'une note vocale", outil: 'ChatGPT' },
        { titre: 'Programmer des réponses automatiques et un catalogue', outil: 'WhatsApp Business' },
        { titre: 'Créer sa fiche Google et demander des avis', outil: 'Fiche Google' },
        { titre: 'Publier des photos avant/après avec une légende qui vend', outil: 'Canva' },
        { titre: 'Relancer un client et obtenir une recommandation', outil: 'ChatGPT' },
      ],
    },
  },
]

export function getSecteur(slug: string): Secteur | undefined {
  return SECTEURS.find((s) => s.slug === slug)
}
