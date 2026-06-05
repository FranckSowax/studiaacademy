// ============================================
// Secteurs d'activité — formations IA & outils adaptés (Gabon / Afrique)
// ============================================

export interface SecteurFormation {
  slug: string
  titre: string
  pitch: string
  arguments: string[]
  format: 'En ligne' | 'Présentiel' | 'Hybride'
  niveau: string
  prix_fcfa: number
  cover: string // /public/secteurs/<file>.png
}

export interface Secteur {
  slug: string
  label: string
  iconName: string
  couleur: string
  cover: string
  accroche: string
  description: string
  /** Slugs de micro-services (src/lib/ai-services/definitions.ts) pertinents. */
  outils: string[]
  formations: SecteurFormation[]
}

export const SECTEURS: Secteur[] = [
  {
    slug: 'ressources-humaines',
    label: 'Ressources Humaines',
    iconName: 'Users',
    couleur: '#7C3AED',
    cover: '/secteurs/ressources-humaines.png',
    accroche: "Recrutez, formez et fidélisez plus vite grâce à l'IA",
    description: "Automatisez vos tâches RH, évaluez les compétences de vos équipes et construisez des parcours de formation sur mesure.",
    outils: ['annonce-emploi', 'fiche-de-poste', 'scoring-cv', 'grille-entretien', 'plan-onboarding'],
    formations: [
      { slug: 'rh-ia-recrutement', titre: "L'IA pour recruter plus vite et mieux", pitch: "Réduisez vos délais de recrutement et fiabilisez vos choix grâce à l'IA.", arguments: ["Triez 10× plus vite les CV sans biais", "Rédigez annonces et grilles d'entretien en minutes", "Améliorez la qualité de vos embauches"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 90000, cover: '/secteurs/rh-recrutement.png' },
      { slug: 'rh-onboarding-digital', titre: "Onboarding & fidélisation augmentés par l'IA", pitch: "Intégrez vos nouveaux talents et réduisez le turnover.", arguments: ["Parcours d'intégration générés automatiquement", "Suivi structuré 30-60-90 jours", "Moins de départs précoces"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 70000, cover: '/secteurs/rh-onboarding.png' },
      { slug: 'rh-gestion-competences', titre: "Cartographier et développer les compétences", pitch: "Diagnostiquez le niveau de vos effectifs et pilotez la montée en compétences.", arguments: ["Diagnostic des compétences objectif", "Plans de formation ciblés", "ROI mesurable sur la productivité"], format: 'Hybride', niveau: 'Intermédiaire', prix_fcfa: 110000, cover: '/secteurs/rh-competences.png' },
      { slug: 'rh-droit-social-ia', titre: "Documents RH conformes assistés par l'IA", pitch: "Produisez contrats, règlements et courriers RH fiables, plus vite.", arguments: ["Modèles adaptés au contexte local", "Gain de temps sur l'administratif", "Réduction des risques d'erreur"], format: 'En ligne', niveau: 'Intermédiaire', prix_fcfa: 80000, cover: '/secteurs/rh-droit-social.png' },
    ],
  },
  {
    slug: 'administration',
    label: 'Administration & Fonction publique',
    iconName: 'Landmark',
    couleur: '#e97e42',
    cover: '/secteurs/administration.png',
    accroche: "Traitez vos dossiers et courriers administratifs en un éclair",
    description: "Rédaction de courriers, synthèse de dossiers, notes de service : l'IA accélère le quotidien des agents administratifs.",
    outils: ['courrier-admin', 'resume-document', 'communication-rh', 'reglement-interieur'],
    formations: [
      { slug: 'admin-courriers-ia', titre: "Rédiger ses courriers administratifs avec l'IA", pitch: "Produisez des courriers et notes impeccables en quelques minutes.", arguments: ["Courriers officiels prêts à signer", "Ton et format administratifs respectés", "Moins de relectures, plus de dossiers traités"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 55000, cover: '/secteurs/admin-courriers.png' },
      { slug: 'admin-synthese-dossiers', titre: "Synthétiser et instruire les dossiers plus vite", pitch: "Résumez de longs documents et préparez vos décisions.", arguments: ["Synthèses claires en un clic", "Points clés et actions identifiés", "Décisions plus rapides"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 55000, cover: '/secteurs/admin-synthese.png' },
      { slug: 'admin-digitalisation-service', titre: "Digitaliser son service administratif", pitch: "Passez du papier au numérique sans complexité.", arguments: ["Process simplifiés et traçables", "Outils accessibles sur mobile", "Service plus réactif aux usagers"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 95000, cover: '/secteurs/admin-digitalisation.png' },
      { slug: 'admin-prepa-concours-ia', titre: "Préparer un concours administratif avec l'IA", pitch: "Révisez efficacement et entraînez-vous aux épreuves.", arguments: ["Plan de révision personnalisé", "QCM et corrigés illimités", "Méthodologie des épreuves"], format: 'En ligne', niveau: 'Tous niveaux', prix_fcfa: 60000, cover: '/secteurs/admin-concours.png' },
    ],
  },
  {
    slug: 'secretariat',
    label: 'Secrétariat & Assistanat',
    iconName: 'ClipboardList',
    couleur: '#EC4899',
    cover: '/secteurs/secretariat.png',
    accroche: "Devenez l'assistant·e augmenté·e par l'IA",
    description: "Comptes-rendus, e-mails, agendas, présentations : déléguez les tâches chronophages à l'IA et gagnez en valeur.",
    outils: ['courrier-admin', 'resume-document', 'communication-rh', 'posts-reseaux'],
    formations: [
      { slug: 'secretariat-comptes-rendus', titre: "Comptes-rendus de réunion en 5 minutes", pitch: "Transformez vos notes en comptes-rendus structurés instantanément.", arguments: ["CR clairs et professionnels", "Actions et décisions mises en avant", "Des heures gagnées chaque semaine"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 50000, cover: '/secteurs/secretariat-cr.png' },
      { slug: 'secretariat-emails-pro', titre: "E-mails et communication pro avec l'IA", pitch: "Rédigez des e-mails irréprochables, dans le bon ton, plus vite.", arguments: ["Réponses professionnelles instantanées", "Zéro faute, ton maîtrisé", "Image de marque renforcée"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 45000, cover: '/secteurs/secretariat-emails.png' },
      { slug: 'secretariat-presentations', titre: "Créer des présentations percutantes", pitch: "Produisez des supports clairs et convaincants sans designer.", arguments: ["Structure et contenu générés", "Mise en valeur des messages clés", "Gain de temps considérable"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 60000, cover: '/secteurs/secretariat-presentations.png' },
      { slug: 'secretariat-organisation-ia', titre: "S'organiser et gérer son temps avec l'IA", pitch: "Priorisez, planifiez et automatisez les tâches répétitives.", arguments: ["Agenda et priorités optimisés", "Modèles et automatisations simples", "Moins de stress, plus d'efficacité"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 50000, cover: '/secteurs/secretariat-organisation.png' },
    ],
  },
  {
    slug: 'comptabilite-finance',
    label: 'Comptabilité & Finance',
    iconName: 'Calculator',
    couleur: '#16A34A',
    cover: '/secteurs/comptabilite.png',
    accroche: "Pilotez vos chiffres et vos clients avec l'IA",
    description: "Devis, factures, tableaux de bord, prévisions : l'IA fiabilise et accélère la gestion comptable et financière.",
    outils: ['devis-facture', 'business-plan', 'etude-marche', 'resume-document'],
    formations: [
      { slug: 'compta-devis-factures', titre: "Devis & factures professionnels avec l'IA", pitch: "Générez des documents commerciaux soignés en quelques clics.", arguments: ["Devis et factures prêts à envoyer", "Moins d'erreurs de saisie", "Image professionnelle renforcée"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 55000, cover: '/secteurs/compta-devis.png' },
      { slug: 'compta-tableaux-bord', titre: "Tableaux de bord financiers & pilotage", pitch: "Suivez votre trésorerie et vos indicateurs pour mieux décider.", arguments: ["Indicateurs clés visualisés", "Anticipation des risques de trésorerie", "Décisions appuyées sur les chiffres"], format: 'Hybride', niveau: 'Intermédiaire', prix_fcfa: 110000, cover: '/secteurs/compta-tableaux.png' },
      { slug: 'compta-previsionnel-ia', titre: "Construire un prévisionnel et un business plan", pitch: "Bâtissez des prévisions crédibles pour convaincre banques et partenaires.", arguments: ["Business plan structuré et chiffré", "Hypothèses réalistes", "Dossiers de financement plus solides"], format: 'En ligne', niveau: 'Intermédiaire', prix_fcfa: 95000, cover: '/secteurs/compta-previsionnel.png' },
      { slug: 'compta-automatisation', titre: "Automatiser la saisie et le suivi comptable", pitch: "Réduisez les tâches manuelles et fiabilisez vos données.", arguments: ["Moins de saisie répétitive", "Données plus fiables", "Clôtures plus rapides"], format: 'Hybride', niveau: 'Intermédiaire', prix_fcfa: 100000, cover: '/secteurs/compta-automatisation.png' },
    ],
  },
  {
    slug: 'commerce-vente',
    label: 'Commerce & Vente',
    iconName: 'ShoppingBag',
    couleur: '#F59E0B',
    cover: '/secteurs/commerce.png',
    accroche: "Vendez plus grâce à l'IA, en ligne comme en boutique",
    description: "Argumentaires, prospection, présentations clients, réseaux : l'IA booste votre force de vente.",
    outils: ['pitch-html', 'posts-reseaux', 'devis-facture', 'etude-marche'],
    formations: [
      { slug: 'vente-prospection-ia', titre: "Prospecter et convaincre avec l'IA", pitch: "Trouvez les bons arguments et personnalisez vos approches.", arguments: ["Argumentaires de vente percutants", "Messages personnalisés à grande échelle", "Taux de transformation amélioré"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 75000, cover: '/secteurs/vente-prospection.png' },
      { slug: 'vente-presentation-projet', titre: "Présenter un produit ou un projet (HTML/pitch)", pitch: "Créez des présentations commerciales modernes et convaincantes.", arguments: ["Pitchs professionnels en minutes", "Présentation web partageable", "Plus d'impact face aux clients"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 70000, cover: '/secteurs/vente-pitch.png' },
      { slug: 'vente-reseaux-sociaux', titre: "Vendre sur les réseaux sociaux avec l'IA", pitch: "Produisez du contenu qui attire et convertit, régulièrement.", arguments: ["Posts et visuels générés", "Calendrier de contenu tenu", "Plus de clients via le digital"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 65000, cover: '/secteurs/vente-reseaux.png' },
      { slug: 'vente-etude-marche', titre: "Étudier son marché et ses clients", pitch: "Comprenez votre marché pour mieux cibler et vendre.", arguments: ["Analyse de marché structurée", "Cibles et positionnement clarifiés", "Décisions commerciales éclairées"], format: 'En ligne', niveau: 'Intermédiaire', prix_fcfa: 80000, cover: '/secteurs/vente-marche.png' },
    ],
  },
  {
    slug: 'communication-marketing',
    label: 'Communication & Marketing',
    iconName: 'Megaphone',
    couleur: '#0EA5E9',
    cover: '/secteurs/communication.png',
    accroche: "Créez du contenu et une marque qui marquent",
    description: "Contenus, identité de marque, sites vitrines, campagnes : l'IA démultiplie votre communication.",
    outils: ['posts-reseaux', 'identite-marque', 'site-vitrine', 'pitch-html'],
    formations: [
      { slug: 'com-contenu-ia', titre: "Produire du contenu pro avec l'IA", pitch: "Alimentez vos canaux en contenus de qualité, sans y passer vos journées.", arguments: ["Articles, posts et visuels générés", "Ligne éditoriale tenue", "Présence en ligne renforcée"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 70000, cover: '/secteurs/com-contenu.png' },
      { slug: 'com-identite-marque', titre: "Construire son identité de marque", pitch: "Définissez une marque cohérente et mémorable.", arguments: ["Plateforme de marque claire", "Ton et messages alignés", "Image professionnelle"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 80000, cover: '/secteurs/com-marque.png' },
      { slug: 'com-site-vitrine', titre: "Créer un site vitrine sans coder", pitch: "Mettez votre activité en ligne rapidement, à moindre coût.", arguments: ["Site vitrine généré", "Présence web professionnelle", "Plus de visibilité et de leads"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 85000, cover: '/secteurs/com-site.png' },
      { slug: 'com-campagnes-ia', titre: "Campagnes marketing pilotées par l'IA", pitch: "Concevez et mesurez des campagnes plus efficaces.", arguments: ["Messages et ciblage optimisés", "Suivi des performances", "Meilleur retour sur investissement"], format: 'Hybride', niveau: 'Intermédiaire', prix_fcfa: 100000, cover: '/secteurs/com-campagnes.png' },
    ],
  },
  {
    slug: 'education',
    label: 'Éducation & Enseignement',
    iconName: 'GraduationCap',
    couleur: '#2563EB',
    cover: '/secteurs/education.png',
    accroche: "Enseignez et accompagnez mieux avec l'IA",
    description: "Préparation de cours, exercices, correction, fiches : l'IA fait gagner du temps aux enseignants et formateurs.",
    outils: ['fiches-revision', 'explique-cours', 'correcteur-dissertation', 'plan-memoire'],
    formations: [
      { slug: 'edu-preparer-cours', titre: "Préparer ses cours et supports avec l'IA", pitch: "Concevez cours, exercices et évaluations en un temps record.", arguments: ["Supports pédagogiques générés", "Différenciation facilitée", "Plus de temps pour les élèves"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 60000, cover: '/secteurs/edu-cours.png' },
      { slug: 'edu-correction-ia', titre: "Corriger et évaluer plus vite", pitch: "Accélérez la correction tout en restant juste et précis.", arguments: ["Correction assistée et homogène", "Feedback détaillé aux élèves", "Charge de travail allégée"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 55000, cover: '/secteurs/edu-correction.png' },
      { slug: 'edu-engager-eleves', titre: "Rendre ses cours vivants (quiz, Kahoot)", pitch: "Engagez vos apprenants avec des activités ludiques générées par l'IA.", arguments: ["Quiz et jeux en classe", "Plus de participation", "Meilleure mémorisation"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 65000, cover: '/secteurs/edu-engagement.png' },
      { slug: 'edu-accompagner-memoire', titre: "Accompagner mémoires et projets", pitch: "Aidez vos étudiants à structurer et réussir leurs travaux.", arguments: ["Plans de mémoire structurés", "Méthodologie de recherche", "Meilleurs taux de réussite"], format: 'En ligne', niveau: 'Intermédiaire', prix_fcfa: 70000, cover: '/secteurs/edu-memoire.png' },
    ],
  },
  {
    slug: 'sante',
    label: 'Santé & Médical',
    iconName: 'HeartPulse',
    couleur: '#DC2626',
    cover: '/secteurs/sante.png',
    accroche: "Gagnez du temps administratif pour vos patients",
    description: "Comptes-rendus, courriers, vulgarisation, organisation : l'IA réduit la charge administrative du personnel de santé.",
    outils: ['resume-document', 'courrier-admin', 'communication-rh', 'explique-cours'],
    formations: [
      { slug: 'sante-admin-ia', titre: "Réduire la charge administrative avec l'IA", pitch: "Déléguez courriers et comptes-rendus pour vous recentrer sur le soin.", arguments: ["Comptes-rendus plus rapides", "Courriers de liaison facilités", "Plus de temps patient"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 65000, cover: '/secteurs/sante-admin.png' },
      { slug: 'sante-vulgarisation', titre: "Expliquer et éduquer les patients", pitch: "Produisez des supports d'information clairs et accessibles.", arguments: ["Explications simples et fiables", "Supports d'éducation patient", "Meilleure observance"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 60000, cover: '/secteurs/sante-vulgarisation.png' },
      { slug: 'sante-organisation-cabinet', titre: "Digitaliser et organiser son cabinet/structure", pitch: "Simplifiez la gestion de votre activité de santé.", arguments: ["Process et rappels simplifiés", "Communication patients fluidifiée", "Activité mieux organisée"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 90000, cover: '/secteurs/sante-organisation.png' },
      { slug: 'sante-veille-formation', titre: "Se former en continu avec l'IA", pitch: "Restez à jour et synthétisez l'information médicale utile.", arguments: ["Synthèses de documents", "Veille facilitée", "Montée en compétence continue"], format: 'En ligne', niveau: 'Intermédiaire', prix_fcfa: 70000, cover: '/secteurs/sante-veille.png' },
    ],
  },
  {
    slug: 'agriculture',
    label: 'Agriculture & Agro-business',
    iconName: 'Sprout',
    couleur: '#16A34A',
    cover: '/secteurs/agriculture.png',
    accroche: "Modernisez votre exploitation et vendez mieux avec l'IA",
    description: "Gestion d'exploitation, financement, commercialisation : l'IA aide les agriculteurs et agripreneurs à produire et vendre plus efficacement.",
    outils: ['business-plan', 'etude-marche', 'devis-facture', 'posts-reseaux'],
    formations: [
      { slug: 'agri-gestion-exploitation', titre: "Piloter son exploitation avec l'IA", pitch: "Suivez vos cultures, votre élevage et vos coûts pour mieux décider.", arguments: ["Suivi simple des récoltes et dépenses", "Décisions appuyées sur les données", "Meilleure rentabilité"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 70000, cover: '/secteurs/agri-gestion.png' },
      { slug: 'agri-vendre-produits', titre: "Vendre ses produits agricoles avec l'IA", pitch: "Trouvez des acheteurs et valorisez vos produits, en ligne et sur les marchés.", arguments: ["Annonces et visuels attractifs", "Nouveaux canaux de vente", "Meilleurs prix de vente"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 60000, cover: '/secteurs/agri-vente.png' },
      { slug: 'agri-financement-projet', titre: "Monter un projet agricole finançable", pitch: "Construisez un dossier solide pour obtenir un financement.", arguments: ["Business plan agricole structuré", "Prévisions crédibles", "Dossier prêt pour banque/bailleur"], format: 'En ligne', niveau: 'Intermédiaire', prix_fcfa: 85000, cover: '/secteurs/agri-financement.png' },
      { slug: 'agri-decider-ia', titre: "S'informer et décider avec l'IA", pitch: "Accédez à des conseils et synthèses utiles pour votre activité.", arguments: ["Informations vulgarisées", "Réponses à vos questions techniques", "Gain de temps"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 50000, cover: '/secteurs/agri-decider.png' },
    ],
  },
  {
    slug: 'entrepreneuriat',
    label: 'Entrepreneuriat & Startups',
    iconName: 'Rocket',
    couleur: '#e97e42',
    cover: '/secteurs/entrepreneuriat.png',
    accroche: "Lancez et développez votre activité avec l'IA",
    description: "De l'idée au premier client : l'IA accompagne les porteurs de projet à chaque étape de la création d'entreprise.",
    outils: ['business-plan', 'creation-entreprise', 'pitch-html', 'etude-marche', 'identite-marque'],
    formations: [
      { slug: 'entr-idee-business-plan', titre: "De l'idée au business plan avec l'IA", pitch: "Transformez votre idée en projet structuré et chiffré.", arguments: ["Business plan complet généré", "Modèle économique clarifié", "Vision claire pour avancer"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 80000, cover: '/secteurs/entr-business-plan.png' },
      { slug: 'entr-creer-entreprise', titre: "Créer et structurer son entreprise", pitch: "Maîtrisez les démarches et posez des bases solides.", arguments: ["Étapes de création clarifiées", "Documents et statuts facilités", "Démarrage serein"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 70000, cover: '/secteurs/entr-creation.png' },
      { slug: 'entr-pitch-financement', titre: "Pitcher et convaincre les investisseurs", pitch: "Créez un pitch percutant pour lever des fonds ou des partenaires.", arguments: ["Pitch deck professionnel", "Arguments financiers solides", "Plus de crédibilité"], format: 'En ligne', niveau: 'Intermédiaire', prix_fcfa: 75000, cover: '/secteurs/entr-pitch.png' },
      { slug: 'entr-premiers-clients', titre: "Trouver ses premiers clients avec l'IA", pitch: "Lancez votre marketing et décrochez vos premières ventes.", arguments: ["Contenu et offres générés", "Canaux d'acquisition activés", "Premiers revenus plus vite"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 70000, cover: '/secteurs/entr-clients.png' },
    ],
  },
  {
    slug: 'dirigeant',
    label: "Gérant & Dirigeant d'entreprise",
    iconName: 'Briefcase',
    couleur: '#4F46E5',
    cover: '/secteurs/dirigeant.png',
    accroche: "Pilotez et développez votre entreprise avec l'IA",
    description: "Décisions, productivité, stratégie, management : l'IA donne aux dirigeants les moyens de piloter et faire croître leur entreprise.",
    outils: ['business-plan', 'etude-marche', 'devis-facture', 'resume-document', 'pitch-html'],
    formations: [
      { slug: 'dir-piloter-entreprise', titre: "Piloter son entreprise avec l'IA", pitch: "Suivez vos indicateurs et prenez de meilleures décisions, plus vite.", arguments: ["Tableaux de bord clairs", "Décisions appuyées sur les chiffres", "Vision d'ensemble en temps réel"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 95000, cover: '/secteurs/dir-piloter.png' },
      { slug: 'dir-productivite', titre: "Gagner en productivité avec l'IA", pitch: "Automatisez les tâches à faible valeur et concentrez-vous sur l'essentiel.", arguments: ["Tâches répétitives automatisées", "Temps libéré pour la stratégie", "Équipe plus efficace"], format: 'Hybride', niveau: 'Intermédiaire', prix_fcfa: 100000, cover: '/secteurs/dir-productivite.png' },
      { slug: 'dir-strategie-croissance', titre: "Stratégie & croissance de l'entreprise", pitch: "Analysez votre marché et bâtissez votre plan de développement.", arguments: ["Étude de marché structurée", "Plan de croissance chiffré", "Opportunités identifiées"], format: 'En ligne', niveau: 'Intermédiaire', prix_fcfa: 90000, cover: '/secteurs/dir-strategie.png' },
      { slug: 'dir-manager-equipes', titre: "Manager et fédérer ses équipes", pitch: "Communiquez, organisez et motivez vos équipes plus efficacement.", arguments: ["Communication interne claire", "Organisation optimisée", "Équipes engagées"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 80000, cover: '/secteurs/dir-manager.png' },
    ],
  },
  {
    slug: 'services',
    label: 'Services & Artisanat',
    iconName: 'Wrench',
    couleur: '#0EA5E9',
    cover: '/secteurs/services.png',
    accroche: "Développez votre activité de services grâce à l'IA",
    description: "Prestataires, artisans, indépendants : devis, visibilité en ligne, organisation et prospection assistés par l'IA.",
    outils: ['devis-facture', 'site-vitrine', 'posts-reseaux', 'courrier-admin'],
    formations: [
      { slug: 'serv-devis-clients', titre: "Devis, factures et relances clients", pitch: "Gérez vos documents commerciaux et encaissez plus vite.", arguments: ["Devis et factures pro en minutes", "Relances automatisées", "Moins d'impayés"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 50000, cover: '/secteurs/serv-devis.png' },
      { slug: 'serv-presence-ligne', titre: "Être visible en ligne (site, réseaux, avis)", pitch: "Attirez des clients grâce à une présence digitale soignée.", arguments: ["Site vitrine et fiche en ligne", "Contenu pour les réseaux", "Plus de demandes de devis"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 75000, cover: '/secteurs/serv-presence.png' },
      { slug: 'serv-organisation', titre: "Organiser son activité et ses rendez-vous", pitch: "Gagnez du temps sur l'administratif et la planification.", arguments: ["Agenda et rappels optimisés", "Process simplifiés", "Plus de temps facturable"], format: 'En ligne', niveau: 'Initiation', prix_fcfa: 55000, cover: '/secteurs/serv-organisation.png' },
      { slug: 'serv-prospection', titre: "Trouver et fidéliser des clients", pitch: "Développez votre clientèle et faites revenir vos clients.", arguments: ["Messages de prospection efficaces", "Suivi et fidélisation", "Bouche-à-oreille amplifié"], format: 'Hybride', niveau: 'Initiation', prix_fcfa: 65000, cover: '/secteurs/serv-prospection.png' },
    ],
  },
]

export function getSecteur(slug: string): Secteur | undefined {
  return SECTEURS.find((s) => s.slug === slug)
}
