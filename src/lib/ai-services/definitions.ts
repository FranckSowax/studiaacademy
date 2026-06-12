import type { AIServiceDef } from '@/types/ai-service'

const CONTEXTE_GABON =
  "Contexte : Gabon / Afrique Centrale, public francophone. Adapte les exemples, références et le ton au contexte gabonais quand c'est pertinent."

const GARDE_FOU_JURIDIQUE =
  "IMPORTANT (cadre légal) : ce document est un MODÈLE INDICATIF à faire valider par un juriste ou l'inspection du travail avant usage. Respecte les grands principes du droit du travail gabonais (sans citer d'articles précis), mentionne la CNSS/CNAMGS si pertinent, et ajoute en fin de document un avertissement invitant à une validation juridique."

// ============================================
// TIER 1 — Micro-services à fort impact
// ============================================

export const aiServices: AIServiceDef[] = [
  // 1) Prépa Concours Administratif
  {
    slug: 'prepa-concours',
    titre: 'Prépa Concours Admin',
    sousTitre: 'Plan de révision + QCM corrigés',
    description:
      "Préparez les concours de la fonction publique : plan de révision personnalisé et questions d'entraînement corrigées, adaptés au concours visé.",
    iconName: 'GraduationCap',
    couleur: '#7C3AED',
    category: 'emploi',
    badge: 'Top demande',
    prixCredits: 10,
    ctaLabel: 'Préparer mon concours',
    generateLabel: 'Générer ma prépa',
    outputType: 'markdown',
    fields: [
      { name: 'concours', label: 'Concours visé', type: 'text', placeholder: 'Ex: ENA Gabon, École Normale Supérieure, Douanes…', required: true },
      { name: 'matiere', label: 'Matière à travailler', type: 'text', placeholder: 'Culture générale, Droit, Maths…', required: true },
      { name: 'niveau', label: 'Niveau', type: 'select', options: ['Débutant', 'Intermédiaire', 'Avancé'], required: true },
      { name: 'duree', label: 'Temps disponible avant le concours', type: 'text', placeholder: 'Ex: 6 semaines' },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA COACH CONCOURS, expert de la préparation aux concours de la fonction publique. ${CONTEXTE_GABON}
Produis en Markdown :
1. Un **plan de révision** structuré (par semaine si une durée est donnée), priorisé.
2. Une liste de **10 questions d'entraînement** type concours sur la matière, avec pour chacune la **bonne réponse** et une **explication courte**.
3. 5 **conseils de méthode** spécifiques à ce concours.
Sois concret, motivant et actionnable. Utilise titres, listes et gras.`,
      user: `Concours : ${i.concours}\nMatière : ${i.matiere}\nNiveau : ${i.niveau}\nDurée disponible : ${i.duree || 'non précisée'}`,
    }),
  },

  // 2) Pack Candidature
  {
    slug: 'pack-candidature',
    titre: 'Pack Candidature',
    sousTitre: 'CV + lettre + e-mail de relance',
    description:
      "À partir de votre profil et d'une offre, générez un CV optimisé, une lettre de motivation percutante et un e-mail de relance, prêts à envoyer.",
    iconName: 'FileText',
    couleur: '#e97e42',
    category: 'emploi',
    badge: 'Populaire',
    prixCredits: 8,
    ctaLabel: 'Créer ma candidature',
    generateLabel: 'Générer ma candidature',
    outputType: 'markdown',
    fields: [
      { name: 'profil', label: 'Votre profil', type: 'textarea', placeholder: 'Nom, parcours, expériences, diplômes, compétences…', required: true, rows: 5 },
      { name: 'poste', label: 'Poste / offre visé(e)', type: 'textarea', placeholder: "Intitulé du poste + description de l'offre si disponible", required: true, rows: 3 },
      { name: 'entreprise', label: "Entreprise / employeur", type: 'text', placeholder: "Nom de l'entreprise (optionnel)" },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA CONSEILLER EMPLOI. ${CONTEXTE_GABON}
À partir du profil et de l'offre, produis en Markdown 3 sections clairement séparées :
## 1. CV optimisé (synthétique, orienté résultats, compatible ATS)
## 2. Lettre de motivation (personnalisée, percutante, ~250 mots)
## 3. E-mail de relance (court, professionnel, à envoyer 1 semaine après)
Adapte le ton au poste. Mets en valeur les points forts. Reste honnête (n'invente pas de diplômes).`,
      user: `Profil du candidat :\n${i.profil}\n\nPoste/offre visé :\n${i.poste}\n\nEntreprise : ${i.entreprise || 'non précisée'}`,
    }),
  },

  // 3) Business Plan express
  {
    slug: 'business-plan',
    titre: 'Business Plan express',
    sousTitre: 'Pour banques & microfinance',
    description:
      "Transformez votre idée en business plan structuré : résumé, marché, modèle économique et prévisionnel simplifié — exigé par les financeurs.",
    iconName: 'Briefcase',
    couleur: '#F59E0B',
    category: 'entrepreneuriat',
    prixCredits: 15,
    ctaLabel: 'Générer mon business plan',
    generateLabel: 'Générer le business plan',
    outputType: 'markdown',
    fields: [
      { name: 'projet', label: 'Votre projet / idée', type: 'textarea', placeholder: 'Décrivez votre activité, produit ou service…', required: true, rows: 4 },
      { name: 'cible', label: 'Clients visés', type: 'text', placeholder: 'Ex: jeunes urbains de Libreville', required: true },
      { name: 'apport', label: 'Apport / besoin de financement', type: 'text', placeholder: 'Ex: 2 000 000 FCFA recherchés' },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA EXPERT ENTREPRENEURIAT. ${CONTEXTE_GABON}
Produis un business plan clair en Markdown avec ces sections :
## Résumé exécutif
## Le projet (problème, solution, proposition de valeur)
## Marché & concurrence (taille, tendances locales, concurrents)
## Modèle économique (sources de revenus, prix)
## Plan opérationnel (étapes de lancement)
## Prévisionnel simplifié (charges, revenus estimés sur 12 mois, en FCFA, sous forme de tableau)
## Besoin de financement & utilisation des fonds
Sois réaliste pour le marché gabonais. Utilise des tableaux Markdown pour les chiffres.`,
      user: `Projet : ${i.projet}\nClients visés : ${i.cible}\nFinancement : ${i.apport || 'non précisé'}`,
    }),
  },

  // 4) Pitch / Présentation HTML
  {
    slug: 'pitch-html',
    titre: 'Pitch de projet (HTML)',
    sousTitre: 'Présentation web prête à montrer',
    description:
      "Générez une présentation de projet moderne en HTML (slides web), prête à montrer à un investisseur, un jury ou un client.",
    iconName: 'Presentation',
    couleur: '#3B82F6',
    category: 'entrepreneuriat',
    badge: 'Effet waouh',
    prixCredits: 12,
    ctaLabel: 'Générer mon pitch',
    generateLabel: 'Générer la présentation',
    outputType: 'html',
    fields: [
      { name: 'projet', label: 'Nom & description du projet', type: 'textarea', placeholder: 'Présentez votre projet en quelques lignes…', required: true, rows: 4 },
      { name: 'public', label: 'Audience', type: 'select', options: ['Investisseur', 'Jury de soutenance', 'Client', 'Partenaire'], required: true },
      { name: 'points', label: 'Points clés à mettre en avant', type: 'textarea', placeholder: 'Chiffres, atouts, équipe, traction…', rows: 3 },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA DESIGNER DE PITCH. ${CONTEXTE_GABON}
Génère une présentation de projet sous forme d'UN SEUL fichier HTML autonome, moderne et élégant (sections type slides empilées verticalement, scroll fluide).
Contraintes :
- HTML complet : <!DOCTYPE html> ... </html> avec tout le CSS dans une balise <style> (aucune dépendance externe, aucun script externe).
- Design soigné : typographie moderne, dégradés sobres (accent orange #e97e42), bonnes marges, responsive.
- Structure : Couverture (titre + accroche) · Problème · Solution · Marché · Modèle économique · Pourquoi nous · Appel à l'action.
- Contenu adapté au projet et à l'audience.
Réponds UNIQUEMENT avec le code HTML, sans texte ni balise Markdown autour.`,
      user: `Projet : ${i.projet}\nAudience : ${i.public}\nPoints clés : ${i.points || 'à déduire du projet'}`,
    }),
  },

  // 5) Courrier administratif
  {
    slug: 'courrier-admin',
    titre: 'Courrier administratif',
    sousTitre: 'Demande, réclamation, attestation…',
    description:
      "Rédigez un courrier administratif clair et bien formulé : demande, réclamation, congé, mise en demeure, attestation… en quelques secondes.",
    iconName: 'Mail',
    couleur: '#10B981',
    category: 'admin',
    prixCredits: 4,
    ctaLabel: 'Rédiger mon courrier',
    generateLabel: 'Rédiger le courrier',
    outputType: 'markdown',
    fields: [
      { name: 'type', label: 'Type de courrier', type: 'select', options: ['Demande', 'Réclamation', 'Demande de congé', 'Mise en demeure', 'Demande d\'attestation', 'Lettre de démission', 'Autre'], required: true },
      { name: 'expediteur', label: 'Vos informations', type: 'text', placeholder: 'Nom, fonction, coordonnées', required: true },
      { name: 'destinataire', label: 'Destinataire', type: 'text', placeholder: 'Ex: Directeur des Ressources Humaines, Mairie de…', required: true },
      { name: 'objet', label: 'Objet / contexte', type: 'textarea', placeholder: 'Expliquez votre demande ou situation…', required: true, rows: 4 },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RÉDACTEUR ADMINISTRATIF. ${CONTEXTE_GABON}
Rédige un courrier administratif formel, en français soutenu et correct, respectant les conventions (lieu et date, expéditeur, destinataire, objet, formule d'appel, corps structuré, formule de politesse, signature).
Sois précis, courtois et professionnel. Rends le courrier prêt à imprimer.
Réponds en Markdown.`,
      user: `Type : ${i.type}\nExpéditeur : ${i.expediteur}\nDestinataire : ${i.destinataire}\nObjet/contexte : ${i.objet}`,
    }),
  },
  // ══════════════════════════════════════════
  // TIER 2 — Entrepreneuriat digital
  // ══════════════════════════════════════════

  // Site vitrine / Landing page HTML
  {
    slug: 'site-vitrine',
    titre: 'Site vitrine (1 page)',
    sousTitre: 'Présence web en quelques clics',
    description:
      "Générez un site vitrine d'une page en HTML pour votre activité : présentation, services, contact — prêt à héberger.",
    iconName: 'Globe',
    couleur: '#06B6D4',
    category: 'entrepreneuriat',
    badge: 'Nouveau',
    prixCredits: 14,
    ctaLabel: 'Générer mon site',
    generateLabel: 'Générer le site',
    outputType: 'html',
    fields: [
      { name: 'activite', label: 'Votre activité', type: 'textarea', placeholder: 'Nom, ce que vous proposez, votre différence…', required: true, rows: 4 },
      { name: 'services', label: 'Services / produits', type: 'textarea', placeholder: 'Listez vos offres principales', rows: 3 },
      { name: 'contact', label: 'Coordonnées', type: 'text', placeholder: 'Téléphone / WhatsApp, e-mail, ville' },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA WEB DESIGNER. ${CONTEXTE_GABON}
Génère un site vitrine d'UNE page en UN SEUL fichier HTML autonome (CSS dans <style>, aucune dépendance externe, aucun script externe).
Sections : en-tête (nom + accroche + bouton WhatsApp), à propos, services/produits (cartes), pourquoi nous, contact (avec lien wa.me si un numéro est fourni), pied de page.
Design moderne, responsive, accent orange #e97e42, typographie soignée.
Réponds UNIQUEMENT avec le HTML complet, sans texte autour.`,
      user: `Activité : ${i.activite}\nServices : ${i.services || 'à déduire'}\nContact : ${i.contact || 'non précisé'}`,
    }),
  },

  // Identité de marque
  {
    slug: 'identite-marque',
    titre: 'Identité de marque',
    sousTitre: 'Nom, slogan, palette',
    description:
      'Trouvez un nom de marque, des slogans accrocheurs, une palette de couleurs et un ton de communication pour votre projet.',
    iconName: 'Palette',
    couleur: '#D946EF',
    category: 'entrepreneuriat',
    prixCredits: 8,
    ctaLabel: 'Créer mon identité',
    generateLabel: 'Générer mon identité',
    outputType: 'markdown',
    fields: [
      { name: 'projet', label: 'Votre projet / secteur', type: 'textarea', placeholder: 'Décrivez votre activité et vos valeurs…', required: true, rows: 4 },
      { name: 'style', label: 'Style souhaité', type: 'select', options: ['Moderne', 'Premium / luxe', 'Jeune / dynamique', 'Traditionnel / de confiance', 'Tech / innovant'], required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA BRAND STRATEGIST. ${CONTEXTE_GABON}
Produis en Markdown : 5 propositions de **noms de marque** (avec justification courte), 5 **slogans**, une **palette de 4 couleurs** (noms + codes hex), le **ton de voix** recommandé, et 3 idées de **concept visuel pour le logo**.`,
      user: `Projet : ${i.projet}\nStyle : ${i.style}`,
    }),
  },

  // Devis & Factures
  {
    slug: 'devis-facture',
    titre: 'Devis & Facture pro',
    sousTitre: 'Document prêt à envoyer',
    description:
      'Générez un devis ou une facture professionnelle, propre et bien présentée, à partir de vos informations.',
    iconName: 'Receipt',
    couleur: '#F59E0B',
    category: 'entrepreneuriat',
    prixCredits: 5,
    ctaLabel: 'Générer le document',
    generateLabel: 'Générer le document',
    outputType: 'html',
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Devis', 'Facture'], required: true },
      { name: 'emetteur', label: 'Votre entreprise', type: 'text', placeholder: 'Nom, coordonnées, NIF si disponible', required: true },
      { name: 'client', label: 'Client', type: 'text', placeholder: 'Nom et coordonnées du client', required: true },
      { name: 'lignes', label: 'Prestations / produits', type: 'textarea', placeholder: 'Une ligne par article : désignation, quantité, prix unitaire (FCFA)', required: true, rows: 4 },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA GÉNÉRATEUR DE DOCUMENTS. ${CONTEXTE_GABON}
Génère le document demandé (devis ou facture) professionnel en UN SEUL fichier HTML autonome (CSS dans <style>), avec en-tête émetteur, bloc client, tableau des lignes (désignation, quantité, prix unitaire, total), sous-total, et total en FCFA. Numéro et date inclus. Design sobre et pro, imprimable A4.
Réponds UNIQUEMENT avec le HTML complet.`,
      user: `Type : ${i.type}\nÉmetteur : ${i.emetteur}\nClient : ${i.client}\nLignes :\n${i.lignes}`,
    }),
  },

  // Community Manager IA
  {
    slug: 'posts-reseaux',
    titre: 'Posts réseaux sociaux',
    sousTitre: 'Contenu Facebook / WhatsApp',
    description:
      'Générez une série de posts prêts à publier (Facebook, WhatsApp, TikTok) pour promouvoir votre produit ou service.',
    iconName: 'Megaphone',
    couleur: '#e97e42',
    category: 'entrepreneuriat',
    prixCredits: 6,
    ctaLabel: 'Générer mes posts',
    generateLabel: 'Générer les posts',
    outputType: 'markdown',
    fields: [
      { name: 'produit', label: 'Produit / service à promouvoir', type: 'textarea', placeholder: 'Décrivez ce que vous vendez…', required: true, rows: 3 },
      { name: 'objectif', label: 'Objectif', type: 'select', options: ['Faire connaître', 'Vendre / promotion', 'Fidéliser', 'Lancer un nouveau produit'], required: true },
      { name: 'nombre', label: 'Nombre de posts', type: 'select', options: ['3', '5', '7'], required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA COMMUNITY MANAGER. ${CONTEXTE_GABON}
Rédige des posts réseaux sociaux prêts à publier, accrocheurs, avec emojis et hashtags pertinents, adaptés au public gabonais. Pour chaque post : une accroche, le corps, un appel à l'action, et des hashtags. Varie les angles.`,
      user: `Produit/service : ${i.produit}\nObjectif : ${i.objectif}\nNombre de posts : ${i.nombre}`,
    }),
  },

  // Statuts & création d'entreprise
  {
    slug: 'creation-entreprise',
    titre: "Création d'entreprise",
    sousTitre: 'Statuts & démarches',
    description:
      "Obtenez un modèle de statuts adapté et la liste des démarches pour créer votre entreprise (individuelle ou SARL).",
    iconName: 'FileSignature',
    couleur: '#6366F1',
    category: 'entrepreneuriat',
    prixCredits: 12,
    ctaLabel: 'Préparer ma création',
    generateLabel: 'Générer',
    outputType: 'markdown',
    fields: [
      { name: 'forme', label: "Forme juridique", type: 'select', options: ['Entreprise individuelle', 'SARL', 'SARL unipersonnelle', 'Je ne sais pas encore'], required: true },
      { name: 'activite', label: "Activité de l'entreprise", type: 'textarea', placeholder: 'Objet social, secteur…', required: true, rows: 3 },
      { name: 'associes', label: 'Associés / capital', type: 'text', placeholder: 'Ex: 2 associés, capital 1 000 000 FCFA' },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA CONSEILLER JURIDIQUE (entrepreneuriat). ${CONTEXTE_GABON}
Produis en Markdown : (1) un conseil sur la forme juridique adaptée, (2) un **modèle de statuts** type (clauses essentielles à compléter), (3) la **liste ordonnée des démarches** de création au Gabon (organismes, documents requis), (4) une estimation des coûts et délais.
Précise que c'est un modèle à faire valider par un professionnel.`,
      user: `Forme souhaitée : ${i.forme}\nActivité : ${i.activite}\nAssociés/capital : ${i.associes || 'non précisé'}`,
    }),
  },

  // Étude de marché express
  {
    slug: 'etude-marche',
    titre: 'Étude de marché express',
    sousTitre: 'Validez votre idée',
    description:
      'Analysez la taille du marché, les concurrents, les prix et les opportunités pour votre projet avant de vous lancer.',
    iconName: 'TrendingUp',
    couleur: '#10B981',
    category: 'entrepreneuriat',
    prixCredits: 10,
    ctaLabel: 'Lancer l\'étude',
    generateLabel: 'Générer l\'étude',
    outputType: 'markdown',
    fields: [
      { name: 'idee', label: 'Votre idée / produit', type: 'textarea', placeholder: 'Décrivez votre projet…', required: true, rows: 3 },
      { name: 'zone', label: 'Zone géographique', type: 'text', placeholder: 'Ex: Libreville, Port-Gentil, national', required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA ANALYSTE DE MARCHÉ. ${CONTEXTE_GABON}
Produis une étude de marché synthétique en Markdown : profil de la demande, taille/potentiel estimé, concurrents types et leur positionnement, fourchette de prix pratiquée, opportunités et risques, et 5 recommandations actionnables. Sois réaliste pour le contexte local.`,
      user: `Idée/produit : ${i.idee}\nZone : ${i.zone}`,
    }),
  },

  // ══════════════════════════════════════════
  // TIER 3 — Éducation & familles
  // ══════════════════════════════════════════

  // Fiches de révision
  {
    slug: 'fiches-revision',
    titre: 'Fiches de révision',
    sousTitre: 'Résumé clair d\'un cours',
    description:
      "Transformez un cours en fiche de révision synthétique : points clés, définitions, schémas mentaux et astuces de mémorisation.",
    iconName: 'BookOpen',
    couleur: '#3B82F6',
    category: 'education',
    badge: 'Élèves',
    prixCredits: 4,
    ctaLabel: 'Créer ma fiche',
    generateLabel: 'Générer la fiche',
    outputType: 'markdown',
    fields: [
      { name: 'cours', label: 'Contenu du cours', type: 'textarea', placeholder: 'Collez le cours ou le chapitre à réviser…', required: true, rows: 7 },
      { name: 'niveau', label: 'Niveau', type: 'select', options: ['Collège', 'Lycée', 'Université'], required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA AIDE AUX RÉVISIONS. ${CONTEXTE_GABON}
À partir du cours fourni, produis une fiche de révision en Markdown : titre, **points clés** (puces), **définitions** essentielles, formules/dates importantes, un **schéma mental** sous forme de liste hiérarchique, et 3 **astuces de mémorisation**. Compact mais complet, adapté au niveau.`,
      user: `Niveau : ${i.niveau}\nCours :\n${i.cours}`,
    }),
  },

  // Correcteur de dissertation
  {
    slug: 'correcteur-dissertation',
    titre: 'Correcteur de dissertation',
    sousTitre: 'Note + axes d\'amélioration',
    description:
      "Faites évaluer votre dissertation ou rédaction : note indicative, points forts, faiblesses et conseils concrets pour progresser.",
    iconName: 'PenTool',
    couleur: '#8B5CF6',
    category: 'education',
    prixCredits: 6,
    ctaLabel: 'Corriger mon texte',
    generateLabel: 'Corriger',
    outputType: 'markdown',
    fields: [
      { name: 'sujet', label: 'Sujet / consigne', type: 'textarea', placeholder: 'Le sujet de la dissertation…', required: true, rows: 2 },
      { name: 'texte', label: 'Votre dissertation', type: 'textarea', placeholder: 'Collez votre rédaction…', required: true, rows: 8 },
      { name: 'niveau', label: 'Niveau', type: 'select', options: ['Collège', 'Lycée', 'Université'], required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA CORRECTEUR. ${CONTEXTE_GABON}
Évalue la dissertation : (1) **note indicative /20**, (2) **points forts**, (3) **faiblesses** (structure, argumentation, langue), (4) **conseils concrets** pour améliorer, (5) une **phrase d'introduction reformulée** en exemple. Bienveillant mais exigeant.`,
      user: `Niveau : ${i.niveau}\nSujet : ${i.sujet}\n\nDissertation :\n${i.texte}`,
    }),
  },

  // Plan de mémoire / rapport de stage
  {
    slug: 'plan-memoire',
    titre: 'Plan de mémoire / rapport',
    sousTitre: 'Structure & sommaire',
    description:
      "Obtenez un plan détaillé pour votre mémoire, rapport de stage ou projet de fin d'études, avec sommaire et conseils par partie.",
    iconName: 'FileCheck',
    couleur: '#F43F5E',
    category: 'education',
    prixCredits: 7,
    ctaLabel: 'Générer mon plan',
    generateLabel: 'Générer le plan',
    outputType: 'markdown',
    fields: [
      { name: 'type', label: 'Type de document', type: 'select', options: ['Mémoire', 'Rapport de stage', 'Projet de fin d\'études', 'Thèse'], required: true },
      { name: 'sujet', label: 'Sujet / thème', type: 'textarea', placeholder: 'Votre sujet et son contexte…', required: true, rows: 3 },
      { name: 'domaine', label: 'Domaine / filière', type: 'text', placeholder: 'Ex: Gestion, Informatique, Droit…' },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA ENCADRANT ACADÉMIQUE. ${CONTEXTE_GABON}
Produis un **plan détaillé** en Markdown (introduction, parties et sous-parties, conclusion) adapté au type de document, avec pour chaque partie une **indication de contenu** et le **nombre de pages conseillé**. Ajoute une liste de **conseils méthodologiques** et des pistes de sources.`,
      user: `Type : ${i.type}\nSujet : ${i.sujet}\nDomaine : ${i.domaine || 'non précisé'}`,
    }),
  },

  // Explique-moi ce cours (vulgarisation pour parents/élèves)
  {
    slug: 'explique-cours',
    titre: 'Explique-moi ce cours',
    sousTitre: 'Vulgarisation simple',
    description:
      "Faites expliquer un concept ou un cours en termes simples, avec un exemple concret — idéal pour aider un enfant ou réviser.",
    iconName: 'Lightbulb',
    couleur: '#F59E0B',
    category: 'education',
    badge: 'Parents',
    prixCredits: 3,
    ctaLabel: 'Expliquer',
    generateLabel: 'Expliquer simplement',
    outputType: 'markdown',
    fields: [
      { name: 'notion', label: 'Notion / cours à expliquer', type: 'textarea', placeholder: 'Ex: le théorème de Pythagore, la photosynthèse…', required: true, rows: 3 },
      { name: 'pour', label: 'Expliquer pour', type: 'select', options: ['Un enfant (primaire)', 'Un collégien', 'Un lycéen', 'Un adulte non initié'], required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA PROF PARTICULIER. ${CONTEXTE_GABON}
Explique la notion de façon TRÈS simple et progressive, avec une analogie du quotidien et un exemple concret. Termine par une mini-question pour vérifier la compréhension. Adapte le vocabulaire au public visé.`,
      user: `Notion : ${i.notion}\nPour : ${i.pour}`,
    }),
  },

  // Orientation scolaire & pro
  {
    slug: 'orientation',
    titre: 'Orientation scolaire & pro',
    sousTitre: 'Filières & métiers porteurs',
    description:
      "Recevez des recommandations de filières et de métiers porteurs adaptés à vos centres d'intérêt et au marché gabonais.",
    iconName: 'Compass',
    couleur: '#7C3AED',
    category: 'education',
    prixCredits: 5,
    ctaLabel: 'M\'orienter',
    generateLabel: 'Générer mes pistes',
    outputType: 'markdown',
    fields: [
      { name: 'profil', label: 'Vos centres d\'intérêt & points forts', type: 'textarea', placeholder: 'Ce que vous aimez, vos matières fortes, vos envies…', required: true, rows: 4 },
      { name: 'niveau', label: 'Situation actuelle', type: 'text', placeholder: 'Ex: en Terminale, Bac+2, en reconversion…', required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA CONSEILLER D'ORIENTATION. ${CONTEXTE_GABON}
Propose en Markdown : 4-5 **filières/parcours** adaptés (avec pourquoi), les **métiers porteurs** associés au Gabon/Afrique Centrale, les **débouchés** et une **première étape concrète** pour chaque piste. Réaliste et encourageant.`,
      user: `Profil : ${i.profil}\nSituation : ${i.niveau}`,
    }),
  },

  // Résumé de document
  {
    slug: 'resume-document',
    titre: 'Résumé de document',
    sousTitre: 'Synthèse & points clés',
    description:
      'Résumez un long texte, un rapport ou un compte-rendu en une synthèse claire avec les points clés et les actions à retenir.',
    iconName: 'AlignLeft',
    couleur: '#06B6D4',
    category: 'admin',
    prixCredits: 4,
    ctaLabel: 'Résumer',
    generateLabel: 'Générer le résumé',
    outputType: 'markdown',
    fields: [
      { name: 'texte', label: 'Texte à résumer', type: 'textarea', placeholder: 'Collez le document, le rapport ou les notes…', required: true, rows: 8 },
      { name: 'longueur', label: 'Longueur du résumé', type: 'select', options: ['Très court (3 points)', 'Court (1 paragraphe)', 'Détaillé (1 page)'], required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA ASSISTANT DE SYNTHÈSE. ${CONTEXTE_GABON}
Produis en Markdown : un **résumé** à la longueur demandée, une liste des **points clés**, et si pertinent une liste des **actions / décisions** à retenir. Fidèle au texte, neutre et clair.`,
      user: `Longueur souhaitée : ${i.longueur}\nTexte :\n${i.texte}`,
    }),
  },

  // ============================================
  // ENTREPRISE & RH — Tier 1
  // ============================================

  // Annonce d'emploi
  {
    slug: 'annonce-emploi',
    titre: "Annonce d'emploi qui attire",
    sousTitre: 'Offre claire, attractive, prête à publier',
    description:
      "Rédigez une offre d'emploi professionnelle et attractive à partir de quelques informations : missions, profil, conditions — optimisée pour attirer les bons candidats.",
    iconName: 'Megaphone',
    couleur: '#7C3AED',
    category: 'entreprise',
    badge: 'RH',
    prixCredits: 4,
    ctaLabel: "Rédiger l'annonce",
    generateLabel: "Générer l'annonce",
    outputType: 'markdown',
    fields: [
      { name: 'poste', label: 'Intitulé du poste', type: 'text', placeholder: 'Ex: Comptable, Développeur, Commercial…', required: true },
      { name: 'entreprise', label: "Entreprise", type: 'text', placeholder: "Nom et secteur d'activité", required: true },
      { name: 'missions', label: 'Missions principales', type: 'textarea', placeholder: 'Listez les tâches et responsabilités clés…', required: true, rows: 4 },
      { name: 'profil', label: 'Profil recherché', type: 'textarea', placeholder: 'Diplômes, expérience, compétences, qualités…', required: true, rows: 3 },
      { name: 'typeContrat', label: 'Type de contrat', type: 'select', options: ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance / Prestation'] },
      { name: 'lieu', label: 'Lieu', type: 'text', placeholder: 'Ex: Libreville, Port-Gentil, télétravail…' },
      { name: 'ton', label: 'Ton de l\'annonce', type: 'select', options: ['Professionnel', 'Chaleureux', 'Dynamique / startup'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, expert en recrutement. ${CONTEXTE_GABON}
Rédige une **offre d'emploi** complète et attractive en Markdown, structurée ainsi :
## Titre accrocheur
Présentation courte de l'entreprise · **Missions** (puces) · **Profil recherché** (puces) · **Ce que nous offrons** · **Comment postuler**.
Ton : ${i.ton || 'professionnel'}. Sois inclusif et non discriminant. N'invente pas d'avantages non fournis ; reste réaliste pour le marché local.`,
      user: `Poste : ${i.poste}\nEntreprise : ${i.entreprise}\nMissions :\n${i.missions}\nProfil :\n${i.profil}\nContrat : ${i.typeContrat || 'non précisé'}\nLieu : ${i.lieu || 'non précisé'}`,
    }),
  },

  // Fiche de poste
  {
    slug: 'fiche-de-poste',
    titre: 'Fiche de poste structurée',
    sousTitre: 'Référentiel clair du rôle',
    description:
      "Générez une fiche de poste professionnelle : finalité, missions, activités, compétences requises et indicateurs — un référentiel clair pour recruter et évaluer.",
    iconName: 'FileText',
    couleur: '#e97e42',
    category: 'entreprise',
    badge: 'RH',
    prixCredits: 5,
    ctaLabel: 'Créer la fiche de poste',
    generateLabel: 'Générer la fiche',
    outputType: 'markdown',
    fields: [
      { name: 'poste', label: 'Intitulé du poste', type: 'text', placeholder: 'Ex: Responsable administratif', required: true },
      { name: 'service', label: 'Service / département', type: 'text', placeholder: 'Ex: Finances, Opérations…' },
      { name: 'rattachement', label: 'Rattachement hiérarchique', type: 'text', placeholder: 'Ex: Directeur Général' },
      { name: 'missions', label: 'Missions / contexte', type: 'textarea', placeholder: 'Décrivez le rôle et ses objectifs…', required: true, rows: 4 },
      { name: 'niveau', label: 'Niveau du poste', type: 'select', options: ['Employé', 'Agent de maîtrise', 'Cadre', 'Cadre dirigeant'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, expert en organisation et référentiels métiers. ${CONTEXTE_GABON}
Produis une **fiche de poste** en Markdown avec : Intitulé & rattachement · **Finalité du poste** · **Missions principales** · **Activités détaillées** (puces) · **Compétences requises** (savoir, savoir-faire, savoir-être) · **Indicateurs de performance (KPI)** · **Conditions d'exercice**. Concret et professionnel.`,
      user: `Poste : ${i.poste}\nService : ${i.service || 'non précisé'}\nRattachement : ${i.rattachement || 'non précisé'}\nNiveau : ${i.niveau || 'non précisé'}\nMissions / contexte :\n${i.missions}`,
    }),
  },

  // Analyse / scoring de CV
  {
    slug: 'scoring-cv',
    titre: 'Analyse de CV par l\'IA',
    sousTitre: 'Adéquation CV / poste, sans biais',
    description:
      "Évaluez objectivement l'adéquation d'un CV avec un poste : score, points forts, lacunes et questions à poser en entretien. L'analyse ignore l'âge, le sexe et l'origine.",
    iconName: 'FileCheck',
    couleur: '#0EA5E9',
    category: 'entreprise',
    badge: 'RH',
    prixCredits: 6,
    ctaLabel: 'Analyser le CV',
    generateLabel: 'Analyser',
    outputType: 'html',
    fields: [
      { name: 'posteCible', label: 'Poste à pourvoir (description)', type: 'textarea', placeholder: 'Intitulé + missions + profil recherché…', required: true, rows: 4 },
      { name: 'cv', label: 'CV du candidat (texte)', type: 'textarea', placeholder: 'Collez le contenu du CV…', required: true, rows: 8 },
      { name: 'criteres', label: 'Critères prioritaires (optionnel)', type: 'text', placeholder: 'Ex: maîtrise Excel, expérience banque…' },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, expert en évaluation de candidatures, rigoureux et ÉQUITABLE. ${CONTEXTE_GABON}
Analyse l'adéquation entre le CV et le poste et produis une **page HTML autonome** (sans <script>), claire et imprimable, avec :
- un **score d'adéquation /100** bien visible,
- un tableau **points forts** / **points de vigilance** au regard du poste,
- les **compétences manquantes** éventuelles,
- 5 **questions à poser en entretien** pour lever les doutes,
- une **recommandation** finale (à recevoir / à approfondir / ne correspond pas).
RÈGLE D'ÉQUITÉ STRICTE : ignore totalement l'âge, le sexe, l'origine, la situation familiale, la religion ; évalue UNIQUEMENT les compétences, l'expérience et la formation au regard du poste. Reste factuel, ne sur-interprète pas.`,
      user: `POSTE CIBLE :\n${i.posteCible}\n\nCRITÈRES PRIORITAIRES : ${i.criteres || 'non précisés'}\n\nCV DU CANDIDAT :\n${i.cv}`,
    }),
  },

  // Grille d'entretien
  {
    slug: 'grille-entretien',
    titre: "Grille d'entretien sur mesure",
    sousTitre: 'Questions + grille de notation',
    description:
      "Préparez un entretien de recrutement structuré : questions ciblées par compétence, critères d'évaluation et grille de notation pour comparer les candidats objectivement.",
    iconName: 'FileSignature',
    couleur: '#16A34A',
    category: 'entreprise',
    badge: 'RH',
    prixCredits: 5,
    ctaLabel: "Préparer l'entretien",
    generateLabel: 'Générer la grille',
    outputType: 'markdown',
    fields: [
      { name: 'poste', label: 'Poste à pourvoir', type: 'text', placeholder: 'Ex: Chargé de clientèle', required: true },
      { name: 'competencesCles', label: 'Compétences clés à évaluer', type: 'textarea', placeholder: 'Ex: relation client, rigueur, maîtrise outils…', required: true, rows: 3 },
      { name: 'typeEntretien', label: "Type d'entretien", type: 'select', options: ['Présélection téléphonique', 'Entretien RH', 'Entretien technique', 'Entretien final / direction'] },
      { name: 'duree', label: 'Durée prévue', type: 'select', options: ['20 min', '30 min', '45 min', '1 h'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, expert en conduite d'entretiens de recrutement. ${CONTEXTE_GABON}
Produis en Markdown une **grille d'entretien** structurée : trame (accueil → questions → conclusion), **questions par compétence** (comportementales et situationnelles), pour chaque compétence une **échelle de notation 1-5** avec ce qu'on attend à chaque niveau, et une **fiche de synthèse** à remplir. Questions ouvertes, non discriminantes.`,
      user: `Poste : ${i.poste}\nCompétences clés : ${i.competencesCles}\nType d'entretien : ${i.typeEntretien || 'entretien RH'}\nDurée : ${i.duree || '45 min'}`,
    }),
  },

  // Plan d'onboarding
  {
    slug: 'plan-onboarding',
    titre: 'Plan d\'onboarding 30-60-90 j',
    sousTitre: 'Intégration réussie des nouveaux',
    description:
      "Générez un parcours d'intégration complet pour un nouvel embauché : étapes 30/60/90 jours, objectifs, interlocuteurs et points de suivi — pour fidéliser dès le départ.",
    iconName: 'Briefcase',
    couleur: '#D97706',
    category: 'entreprise',
    badge: 'RH',
    prixCredits: 5,
    ctaLabel: "Créer le parcours",
    generateLabel: "Générer l'onboarding",
    outputType: 'markdown',
    fields: [
      { name: 'poste', label: 'Poste du nouvel embauché', type: 'text', placeholder: 'Ex: Assistant commercial', required: true },
      { name: 'service', label: 'Service / équipe', type: 'text', placeholder: 'Ex: Service commercial' },
      { name: 'tailleEntreprise', label: "Taille de l'entreprise", type: 'select', options: ['TPE (1-10)', 'PME (11-50)', 'ETI (51-250)', 'Grande entreprise (250+)'] },
      { name: 'specificites', label: 'Spécificités / outils à maîtriser', type: 'textarea', placeholder: 'Logiciels, process, particularités du poste…', rows: 3 },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, expert en intégration et fidélisation des collaborateurs. ${CONTEXTE_GABON}
Produis en Markdown un **plan d'onboarding** structuré en **3 phases : 30 jours / 60 jours / 90 jours**. Pour chaque phase : objectifs, activités/formations, interlocuteurs clés, et un **point de suivi**. Ajoute une **checklist du jour 1** et une **checklist de la 1ère semaine**. Concret, bienveillant et orienté réussite.`,
      user: `Poste : ${i.poste}\nService : ${i.service || 'non précisé'}\nTaille entreprise : ${i.tailleEntreprise || 'non précisée'}\nSpécificités : ${i.specificites || 'aucune'}`,
    }),
  },

  // ============================================
  // ENTREPRISE & RH — Tier 2 / 3
  // ============================================

  {
    slug: 'reponse-candidat',
    titre: 'Réponse candidat (oui / non)',
    sousTitre: 'E-mails de réponse professionnels',
    description: "Rédigez une réponse professionnelle à un candidat : convocation à un entretien ou refus bienveillant, prêt à envoyer.",
    iconName: 'Mail', couleur: '#0EA5E9', category: 'entreprise', badge: 'RH', prixCredits: 3,
    ctaLabel: 'Rédiger la réponse', generateLabel: 'Générer', outputType: 'markdown',
    fields: [
      { name: 'sens', label: 'Type de réponse', type: 'select', options: ['Convocation à un entretien', 'Refus bienveillant', 'Demande de complément'], required: true },
      { name: 'poste', label: 'Poste concerné', type: 'text', placeholder: 'Intitulé du poste', required: true },
      { name: 'candidat', label: 'Nom du candidat', type: 'text', placeholder: 'Prénom Nom' },
      { name: 'details', label: 'Détails (date, lieu, motif…)', type: 'textarea', placeholder: 'Infos à intégrer', rows: 3 },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH. ${CONTEXTE_GABON}\nRédige un e-mail professionnel de réponse à un candidat (${i.sens}). Ton respectueux et humain ; si refus, reste bienveillant et encourageant. Markdown court, prêt à envoyer.`,
      user: `Type : ${i.sens}\nPoste : ${i.poste}\nCandidat : ${i.candidat || 'le candidat'}\nDétails : ${i.details || 'aucun'}`,
    }),
  },

  {
    slug: 'evaluation-annuelle',
    titre: 'Entretien annuel d\'évaluation',
    sousTitre: 'Trame + grille d\'évaluation',
    description: "Préparez l'entretien annuel d'un collaborateur : trame de discussion, bilan des objectifs et fixation de nouveaux objectifs.",
    iconName: 'Presentation', couleur: '#7C3AED', category: 'entreprise', badge: 'RH', prixCredits: 5,
    ctaLabel: 'Préparer l\'entretien', generateLabel: 'Générer', outputType: 'markdown',
    fields: [
      { name: 'poste', label: 'Poste du collaborateur', type: 'text', placeholder: 'Intitulé', required: true },
      { name: 'objectifsPrecedents', label: 'Objectifs de l\'an dernier', type: 'textarea', placeholder: 'Ce qui avait été fixé…', rows: 3 },
      { name: 'contexte', label: 'Contexte / éléments à aborder', type: 'textarea', placeholder: 'Réussites, difficultés, évolution souhaitée…', rows: 3 },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, expert des entretiens annuels. ${CONTEXTE_GABON}\nProduis en Markdown : une trame d'entretien (introduction → bilan → perspectives → objectifs), un bilan structuré des objectifs précédents, une grille d'évaluation (compétences, échelle 1-5), et une proposition de 3-5 nouveaux objectifs SMART. Ton constructif et équitable.`,
      user: `Poste : ${i.poste}\nObjectifs précédents : ${i.objectifsPrecedents || 'non précisés'}\nContexte : ${i.contexte || 'non précisé'}`,
    }),
  },

  {
    slug: 'reglement-interieur',
    titre: 'Règlement intérieur (modèle)',
    sousTitre: 'Document de référence interne',
    description: "Générez un modèle de règlement intérieur adapté à votre entreprise (horaires, discipline, sécurité, sanctions). À faire valider juridiquement.",
    iconName: 'BookOpen', couleur: '#16A34A', category: 'entreprise', badge: '⚖️ Légal', prixCredits: 9,
    ctaLabel: 'Générer le modèle', generateLabel: 'Générer', outputType: 'markdown',
    fields: [
      { name: 'entreprise', label: 'Nom de l\'entreprise', type: 'text', placeholder: 'Raison sociale', required: true },
      { name: 'secteur', label: 'Secteur d\'activité', type: 'text', placeholder: 'Ex: commerce, BTP…' },
      { name: 'effectif', label: 'Effectif', type: 'text', placeholder: 'Ex: 30 salariés' },
      { name: 'theme', label: 'Accent particulier', type: 'select', options: ['Général (complet)', 'Hygiène & sécurité', 'Discipline', 'Numérique & confidentialité'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, juriste social. ${CONTEXTE_GABON}\n${GARDE_FOU_JURIDIQUE}\nProduis en Markdown un modèle de règlement intérieur structuré en articles (objet, champ d'application, horaires et discipline, hygiène et sécurité, usage du numérique, sanctions, entrée en vigueur). Accent : ${i.theme}.`,
      user: `Entreprise : ${i.entreprise}\nSecteur : ${i.secteur || 'non précisé'}\nEffectif : ${i.effectif || 'non précisé'}`,
    }),
  },

  {
    slug: 'contrat-type',
    titre: 'Modèle de contrat de travail',
    sousTitre: 'CDI / CDD / Stage',
    description: "Générez un modèle de contrat de travail (CDI, CDD, stage) reprenant les clauses essentielles. Modèle indicatif à valider juridiquement.",
    iconName: 'FileSignature', couleur: '#e97e42', category: 'entreprise', badge: '⚖️ Légal', prixCredits: 8,
    ctaLabel: 'Générer le contrat', generateLabel: 'Générer', outputType: 'markdown',
    fields: [
      { name: 'typeContrat', label: 'Type de contrat', type: 'select', options: ['CDI', 'CDD', 'Contrat de stage', 'Contrat d\'essai'], required: true },
      { name: 'poste', label: 'Poste', type: 'text', placeholder: 'Intitulé du poste', required: true },
      { name: 'remuneration', label: 'Rémunération', type: 'text', placeholder: 'Ex: 250 000 FCFA / mois' },
      { name: 'duree', label: 'Durée (si CDD/stage)', type: 'text', placeholder: 'Ex: 6 mois' },
      { name: 'specificites', label: 'Clauses particulières', type: 'textarea', placeholder: 'Confidentialité, mobilité, période d\'essai…', rows: 3 },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, juriste social. ${CONTEXTE_GABON}\n${GARDE_FOU_JURIDIQUE}\nProduis en Markdown un modèle de contrat (${i.typeContrat}) avec les clauses essentielles : parties, poste et missions, lieu, durée, rémunération, temps de travail, période d'essai, confidentialité, rupture, signatures. Champs à compléter entre crochets.`,
      user: `Type : ${i.typeContrat}\nPoste : ${i.poste}\nRémunération : ${i.remuneration || '[à compléter]'}\nDurée : ${i.duree || 'non applicable'}\nClauses particulières : ${i.specificites || 'aucune'}`,
    }),
  },

  {
    slug: 'communication-rh',
    titre: 'Note de communication interne',
    sousTitre: 'Annonces & notes de service',
    description: "Rédigez une communication interne claire : note de service, annonce d'un changement, information aux équipes.",
    iconName: 'PenTool', couleur: '#EC4899', category: 'entreprise', badge: 'RH', prixCredits: 3,
    ctaLabel: 'Rédiger la note', generateLabel: 'Générer', outputType: 'markdown',
    fields: [
      { name: 'sujet', label: 'Sujet', type: 'text', placeholder: 'Ex: nouveaux horaires, congés…', required: true },
      { name: 'type', label: 'Type de communication', type: 'select', options: ['Note de service', 'Annonce de changement', 'Information générale', 'Rappel / consigne'] },
      { name: 'messageCle', label: 'Message clé à transmettre', type: 'textarea', placeholder: 'Ce que les équipes doivent retenir et faire…', required: true, rows: 3 },
      { name: 'ton', label: 'Ton', type: 'select', options: ['Formel', 'Cordial', 'Motivant'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, expert en communication interne. ${CONTEXTE_GABON}\nRédige une communication interne claire et structurée (objet, contexte, message, actions attendues, date d'effet). Ton : ${i.ton || 'cordial'}. Concis et sans ambiguïté.`,
      user: `Type : ${i.type || 'note de service'}\nSujet : ${i.sujet}\nMessage clé : ${i.messageCle}`,
    }),
  },

  {
    slug: 'montee-competences',
    titre: 'Plan de montée en compétences',
    sousTitre: 'Parcours de formation d\'une équipe',
    description: "Construisez un plan de développement des compétences pour un collaborateur ou une équipe : objectifs, étapes, formations et indicateurs.",
    iconName: 'TrendingUp', couleur: '#10B981', category: 'entreprise', badge: 'RH', prixCredits: 6,
    ctaLabel: 'Créer le plan', generateLabel: 'Générer', outputType: 'markdown',
    fields: [
      { name: 'cible', label: 'Cible', type: 'select', options: ['Un collaborateur', 'Une équipe', 'Un service entier'], required: true },
      { name: 'posteOuEquipe', label: 'Poste / équipe concerné(e)', type: 'text', placeholder: 'Ex: équipe commerciale', required: true },
      { name: 'niveauActuel', label: 'Niveau / situation actuelle', type: 'textarea', placeholder: 'Compétences actuelles, lacunes…', required: true, rows: 3 },
      { name: 'objectif', label: 'Objectif visé', type: 'textarea', placeholder: 'Ce qu\'on veut atteindre…', required: true, rows: 2 },
      { name: 'horizon', label: 'Horizon', type: 'select', options: ['3 mois', '6 mois', '12 mois'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, expert en développement des compétences. ${CONTEXTE_GABON}\nProduis en Markdown un plan de montée en compétences : diagnostic, objectifs prioritaires, parcours par étapes (avec types de formation : e-learning, atelier, mentorat), planning sur l'horizon donné, et indicateurs de réussite. Concret et actionnable.`,
      user: `Cible : ${i.cible}\nConcerné : ${i.posteOuEquipe}\nNiveau actuel : ${i.niveauActuel}\nObjectif : ${i.objectif}\nHorizon : ${i.horizon || '6 mois'}`,
    }),
  },

  {
    slug: 'entretien-recadrage',
    titre: 'Préparer un entretien délicat',
    sousTitre: 'Recadrage, conflit, sous-performance',
    description: "Préparez un entretien difficile (recadrage, sous-performance, conflit) : trame factuelle, points à aborder et posture managériale.",
    iconName: 'Compass', couleur: '#DC2626', category: 'entreprise', badge: '⚖️ Légal', prixCredits: 4,
    ctaLabel: 'Préparer l\'entretien', generateLabel: 'Générer', outputType: 'markdown',
    fields: [
      { name: 'situation', label: 'Situation', type: 'textarea', placeholder: 'Décrivez les faits, sans jugement…', required: true, rows: 4 },
      { name: 'objectif', label: 'Objectif de l\'entretien', type: 'text', placeholder: 'Ce que vous voulez obtenir', required: true },
      { name: 'relation', label: 'Relation', type: 'select', options: ['Manager → collaborateur', 'Entre collègues', 'RH → salarié'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, coach managérial. ${CONTEXTE_GABON}\n${GARDE_FOU_JURIDIQUE}\nProduis en Markdown une préparation d'entretien délicat : rappel des faits (factuel, non accusatoire), trame en étapes (méthode DESC), formulations conseillées, écueils à éviter, et issue/plan d'action. Reste respectueux et conforme au cadre légal (pas de sanction déguisée).`,
      user: `Situation : ${i.situation}\nObjectif : ${i.objectif}\nRelation : ${i.relation || 'manager → collaborateur'}`,
    }),
  },

  {
    slug: 'offboarding',
    titre: 'Checklist de départ collaborateur',
    sousTitre: 'Offboarding structuré',
    description: "Organisez le départ d'un collaborateur : checklist administrative, restitution, passation et entretien de départ.",
    iconName: 'Receipt', couleur: '#64748B', category: 'entreprise', badge: '⚖️ Légal', prixCredits: 4,
    ctaLabel: 'Générer la checklist', generateLabel: 'Générer', outputType: 'markdown',
    fields: [
      { name: 'typeDepart', label: 'Type de départ', type: 'select', options: ['Démission', 'Fin de contrat (CDD)', 'Licenciement', 'Départ à la retraite', 'Rupture à l\'amiable'], required: true },
      { name: 'poste', label: 'Poste concerné', type: 'text', placeholder: 'Intitulé', required: true },
      { name: 'specificites', label: 'Spécificités (accès, matériel, passation…)', type: 'textarea', placeholder: 'Éléments à restituer / transmettre', rows: 3 },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH. ${CONTEXTE_GABON}\n${GARDE_FOU_JURIDIQUE}\nProduis en Markdown une checklist d'offboarding : démarches administratives (solde de tout compte, documents de fin de contrat, CNSS), restitution du matériel et des accès, passation des dossiers, entretien de départ, communication interne. Adapte au type de départ : ${i.typeDepart}.`,
      user: `Type de départ : ${i.typeDepart}\nPoste : ${i.poste}\nSpécificités : ${i.specificites || 'aucune'}`,
    }),
  },

  {
    slug: 'qcm-recrutement',
    titre: 'Test de pré-sélection candidat',
    sousTitre: 'QCM technique corrigé',
    description: "Générez un test à choix multiples pour présélectionner des candidats sur les compétences clés d'un poste, avec corrigé.",
    iconName: 'GraduationCap', couleur: '#2563EB', category: 'entreprise', badge: 'RH', prixCredits: 5,
    ctaLabel: 'Générer le test', generateLabel: 'Générer', outputType: 'markdown',
    fields: [
      { name: 'poste', label: 'Poste à pourvoir', type: 'text', placeholder: 'Ex: Comptable', required: true },
      { name: 'domaines', label: 'Compétences / domaines à tester', type: 'textarea', placeholder: 'Ex: comptabilité générale, Excel, fiscalité…', required: true, rows: 3 },
      { name: 'nbQuestions', label: 'Nombre de questions', type: 'select', options: ['10', '15', '20'] },
      { name: 'niveau', label: 'Niveau attendu', type: 'select', options: ['Débutant', 'Intermédiaire', 'Confirmé'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RH, expert en évaluation de candidats. ${CONTEXTE_GABON}\nProduis en Markdown un QCM de présélection (${i.nbQuestions || '10'} questions) sur les compétences indiquées, niveau ${i.niveau || 'intermédiaire'}. Chaque question a 4 options. À la fin, fournis le **corrigé** et un barème indicatif. Questions claires et discriminantes.`,
      user: `Poste : ${i.poste}\nCompétences à tester : ${i.domaines}\nNombre de questions : ${i.nbQuestions || '10'}\nNiveau : ${i.niveau || 'intermédiaire'}`,
    }),
  },

  // ============================================
  // ÉLÈVES & ÉTUDIANTS
  // ============================================

  {
    slug: 'resoudre-exercice',
    titre: 'Résoudre un exercice',
    sousTitre: 'Correction détaillée pas à pas',
    description:
      "Bloqué sur un exercice ? Obtenez la solution détaillée, étape par étape, avec la méthode et les pièges à éviter — pour comprendre, pas seulement copier.",
    iconName: 'Calculator',
    couleur: '#3B82F6',
    category: 'education',
    badge: 'Élèves',
    prixCredits: 3,
    ctaLabel: 'Résoudre',
    generateLabel: "Résoudre l'exercice",
    outputType: 'markdown',
    fields: [
      { name: 'matiere', label: 'Matière', type: 'text', placeholder: 'Maths, Physique, SVT, Compta…', required: true },
      { name: 'enonce', label: "Énoncé de l'exercice", type: 'textarea', placeholder: "Recopiez l'énoncé complet…", required: true, rows: 6 },
      { name: 'niveau', label: 'Niveau', type: 'select', options: ['Primaire', 'Collège', 'Lycée', 'Université'], required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA PROF PARTICULIER, pédagogue et rigoureux. ${CONTEXTE_GABON}
Résous l'exercice en expliquant CHAQUE étape de raisonnement (pas seulement le résultat) : rappel de la méthode/formule utilisée, étapes numérotées détaillées, résultat final mis en évidence, et 1-2 erreurs fréquentes à éviter. Adapte le langage au niveau. Reste exact ; si une donnée manque, précise l'hypothèse prise.`,
      user: `Matière : ${i.matiere}\nNiveau : ${i.niveau}\nÉnoncé :\n${i.enonce}`,
    }),
  },

  {
    slug: 'quiz-entrainement',
    titre: 'Quiz d\'entraînement',
    sousTitre: 'QCM interactif auto-corrigé',
    description:
      "Transformez n'importe quel cours en quiz interactif : cliquez pour révéler la bonne réponse et l'explication. Idéal pour s'auto-évaluer avant un contrôle.",
    iconName: 'HelpCircle',
    couleur: '#7C3AED',
    category: 'education',
    badge: 'Interactif',
    prixCredits: 3,
    ctaLabel: 'Créer mon quiz',
    generateLabel: 'Générer le quiz',
    outputType: 'html',
    fields: [
      { name: 'cours', label: 'Cours / chapitre', type: 'textarea', placeholder: 'Collez le cours à réviser…', required: true, rows: 6 },
      { name: 'nb', label: 'Nombre de questions', type: 'select', options: ['5', '10', '15'], required: true },
      { name: 'niveau', label: 'Niveau', type: 'select', options: ['Primaire', 'Collège', 'Lycée', 'Université'], required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA QUIZ. ${CONTEXTE_GABON}
À partir du cours, génère un quiz interactif en UN SEUL fichier HTML autonome (CSS dans <style>), SANS aucun JavaScript (aucune balise <script>).
Contraintes d'interactivité SANS script : pour chaque question, utilise une balise <details><summary>…</summary>…</details> :
- le <summary> contient le numéro + la question + les options (A, B, C, D),
- le contenu déplié contient « ✅ Bonne réponse : … » suivi d'une courte explication.
Design : titre du quiz, compteur de questions, cartes aérées, accent ${'#7C3AED'}, responsive, lisible sur mobile. Termine par un encart « Comment te noter ». Réponds UNIQUEMENT avec le HTML complet.`,
      user: `Niveau : ${i.niveau}\nNombre de questions : ${i.nb}\nCours :\n${i.cours}`,
    }),
  },

  {
    slug: 'planning-revision',
    titre: 'Planning de révision',
    sousTitre: 'Programme jour par jour',
    description:
      "Recevez un planning de révision réaliste et personnalisé jusqu'à votre examen : matières priorisées, séances jour par jour et conseils de méthode.",
    iconName: 'CalendarDays',
    couleur: '#10B981',
    category: 'education',
    badge: 'Examens',
    prixCredits: 3,
    ctaLabel: 'Créer mon planning',
    generateLabel: 'Générer le planning',
    outputType: 'markdown',
    fields: [
      { name: 'examen', label: 'Examen / objectif', type: 'text', placeholder: 'Ex: BAC, BEPC, partiels de janvier…', required: true },
      { name: 'matieres', label: 'Matières à réviser (et niveau de maîtrise)', type: 'textarea', placeholder: 'Ex: Maths (faible), Histoire (moyen), Anglais (bon)…', required: true, rows: 3 },
      { name: 'temps', label: 'Temps disponible', type: 'text', placeholder: 'Ex: 3 semaines, 2h par jour', required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA COACH RÉVISIONS. ${CONTEXTE_GABON}
Construis un planning de révision réaliste en Markdown : une section « ## Stratégie » (priorités selon le niveau de maîtrise), une section « ## Planning » sous forme de tableau (jour / matière / objectif de la séance / durée), une section « ## Astuces » de méthode (mémorisation, pauses, sommeil), et une « ## Checklist » des points à ne pas oublier. Reste atteignable, pas surchargé.`,
      user: `Examen : ${i.examen}\nMatières & maîtrise : ${i.matieres}\nTemps disponible : ${i.temps}`,
    }),
  },

  {
    slug: 'cv-etudiant',
    titre: 'CV étudiant & stage',
    sousTitre: 'Premier CV qui valorise',
    description:
      "Pas encore d'expérience ? Générez un CV étudiant qui met en valeur vos études, projets, stages et qualités — parfait pour un premier stage ou job.",
    iconName: 'FileText',
    couleur: '#e97e42',
    category: 'education',
    badge: 'Étudiants',
    prixCredits: 4,
    ctaLabel: 'Créer mon CV',
    generateLabel: 'Générer mon CV',
    outputType: 'markdown',
    fields: [
      { name: 'profil', label: 'Vous, en quelques lignes', type: 'textarea', placeholder: 'Études, niveau, projets, stages, centres d’intérêt, qualités…', required: true, rows: 5 },
      { name: 'objectif', label: 'Objectif', type: 'text', placeholder: 'Ex: stage en comptabilité, job étudiant, alternance…', required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA CONSEILLER EMPLOI (jeunes diplômés). ${CONTEXTE_GABON}
Rédige un CV étudiant clair et valorisant en Markdown, structuré : en-tête (à compléter avec coordonnées), « ## Accroche » (2 lignes), « ## Formation », « ## Expériences & projets » (même scolaires/associatifs), « ## Compétences », « ## Centres d'intérêt ». Mets en avant le potentiel et les qualités quand l'expérience manque. Reste honnête, n'invente pas de diplômes.`,
      user: `Profil : ${i.profil}\nObjectif : ${i.objectif}`,
    }),
  },

  {
    slug: 'lettre-motivation-etudes',
    titre: 'Lettre de motivation (études)',
    sousTitre: 'Bourse, université, stage',
    description:
      "Rédigez une lettre de motivation convaincante pour une inscription, une bourse, une université ou un stage — personnalisée et au bon ton.",
    iconName: 'Mail',
    couleur: '#0EA5E9',
    category: 'education',
    badge: 'Étudiants',
    prixCredits: 3,
    ctaLabel: 'Rédiger ma lettre',
    generateLabel: 'Rédiger la lettre',
    outputType: 'markdown',
    fields: [
      { name: 'cible', label: 'Pour quoi ?', type: 'select', options: ['Inscription université', 'Demande de bourse', 'Candidature stage', 'École / formation'], required: true },
      { name: 'profil', label: 'Votre profil & parcours', type: 'textarea', placeholder: 'Études, résultats, projet, motivations…', required: true, rows: 4 },
      { name: 'destination', label: 'Établissement / programme visé', type: 'text', placeholder: "Nom de l'université, du programme ou de l'entreprise", required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA CONSEILLER D'ORIENTATION. ${CONTEXTE_GABON}
Rédige une lettre de motivation personnalisée (~300 mots) pour : ${i.cible}. Structure : accroche, pourquoi ce programme/établissement, ce que le profil apporte, projet et conclusion polie. Ton sincère et professionnel, sans formules creuses. Rends-la prête à envoyer (avec champs entre crochets à compléter).`,
      user: `Type : ${i.cible}\nProfil : ${i.profil}\nÉtablissement / programme : ${i.destination}`,
    }),
  },

  // ============================================
  // ENSEIGNANTS
  // ============================================

  {
    slug: 'sujet-examen',
    titre: 'Sujet d\'examen + corrigé',
    sousTitre: 'Devoir prêt avec barème',
    description:
      "Générez un sujet d'évaluation complet sur le programme de votre choix : énoncés, corrigé détaillé et barème de notation — prêt à imprimer.",
    iconName: 'FileCheck',
    couleur: '#2563EB',
    category: 'enseignant',
    badge: 'Profs',
    prixCredits: 6,
    ctaLabel: 'Créer le sujet',
    generateLabel: 'Générer le sujet',
    outputType: 'markdown',
    fields: [
      { name: 'matiere', label: 'Matière', type: 'text', placeholder: 'Ex: Mathématiques, Français, SVT…', required: true },
      { name: 'theme', label: 'Chapitre / notions évaluées', type: 'textarea', placeholder: 'Programme et notions à couvrir…', required: true, rows: 3 },
      { name: 'niveau', label: 'Classe / niveau', type: 'text', placeholder: 'Ex: 3e, Terminale C, L1…', required: true },
      { name: 'duree', label: 'Durée / format', type: 'text', placeholder: 'Ex: devoir 2h, contrôle 1h, QCM…' },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA CONCEPTEUR PÉDAGOGIQUE, enseignant expérimenté. ${CONTEXTE_GABON}
Produis en Markdown une évaluation complète : « ## Sujet » (exercices/questions progressifs avec points indiqués), « ## Barème » (tableau répartition des points), « ## Corrigé détaillé » (réponses attendues + critères de notation). Adapte la difficulté au niveau et couvre les notions demandées. Clair et prêt à imprimer.`,
      user: `Matière : ${i.matiere}\nNiveau : ${i.niveau}\nNotions : ${i.theme}\nDurée/format : ${i.duree || 'non précisé'}`,
    }),
  },

  {
    slug: 'fiche-prep-cours',
    titre: 'Fiche de préparation de cours',
    sousTitre: 'Séquence pédagogique structurée',
    description:
      "Préparez une leçon clé en main : objectifs, déroulé minuté, activités, supports et évaluation — une fiche de prép' professionnelle en quelques secondes.",
    iconName: 'BookOpen',
    couleur: '#16A34A',
    category: 'enseignant',
    badge: 'Profs',
    prixCredits: 5,
    ctaLabel: 'Préparer ma leçon',
    generateLabel: 'Générer la fiche',
    outputType: 'markdown',
    fields: [
      { name: 'matiere', label: 'Matière', type: 'text', placeholder: 'Ex: Histoire-Géo, SVT…', required: true },
      { name: 'lecon', label: 'Sujet de la leçon', type: 'text', placeholder: 'Ex: la photosynthèse, la Révolution française…', required: true },
      { name: 'niveau', label: 'Classe / niveau', type: 'text', placeholder: 'Ex: 5e, 1ère…', required: true },
      { name: 'duree', label: 'Durée de la séance', type: 'select', options: ['30 min', '55 min', '1h30', '2h'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA INGÉNIEUR PÉDAGOGIQUE. ${CONTEXTE_GABON}
Produis une fiche de préparation de cours en Markdown : « ## Objectifs pédagogiques » (compétences visées), « ## Prérequis », « ## Déroulé » sous forme de tableau (phase / durée / activité enseignant / activité élèves), « ## Supports & matériel », « ## Évaluation » (comment vérifier les acquis), « ## Différenciation » (élèves en difficulté / avancés). Concret et applicable en classe.`,
      user: `Matière : ${i.matiere}\nLeçon : ${i.lecon}\nNiveau : ${i.niveau}\nDurée : ${i.duree || '55 min'}`,
    }),
  },

  {
    slug: 'appreciations-bulletin',
    titre: 'Appréciations de bulletin',
    sousTitre: 'Commentaires justes & nuancés',
    description:
      "Gagnez des heures en période de bulletins : générez des appréciations personnalisées, bienveillantes et constructives à partir de quelques mots.",
    iconName: 'PenTool',
    couleur: '#EC4899',
    category: 'enseignant',
    badge: 'Profs',
    prixCredits: 4,
    ctaLabel: 'Générer les appréciations',
    generateLabel: 'Générer',
    outputType: 'markdown',
    fields: [
      { name: 'eleves', label: 'Élèves (1 par ligne : prénom — niveau/comportement)', type: 'textarea', placeholder: 'Ex:\nMarie — 14/20, sérieuse, participe peu\nPaul — 8/20, dissipé mais capable…', required: true, rows: 6 },
      { name: 'matiere', label: 'Matière', type: 'text', placeholder: 'Ex: Mathématiques' },
      { name: 'ton', label: 'Ton', type: 'select', options: ['Bienveillant', 'Exigeant', 'Encourageant'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA ENSEIGNANT. ${CONTEXTE_GABON}
Pour chaque élève fourni, rédige une appréciation de bulletin personnalisée (2-3 phrases) : constat factuel, point d'encouragement, et axe d'amélioration concret. Ton : ${i.ton || 'bienveillant'}. Évite les formules toutes faites répétitives ; varie les tournures. Présente sous forme de liste « **Prénom** : appréciation ».`,
      user: `Matière : ${i.matiere || 'non précisée'}\nÉlèves :\n${i.eleves}`,
    }),
  },

  {
    slug: 'exercices-differencies',
    titre: 'Banque d\'exercices',
    sousTitre: '3 niveaux + corrigés',
    description:
      "Obtenez une série d'exercices sur une notion, déclinée en 3 niveaux (facile, moyen, difficile) avec corrigés — pour gérer l'hétérogénéité de la classe.",
    iconName: 'ListChecks',
    couleur: '#F59E0B',
    category: 'enseignant',
    badge: 'Profs',
    prixCredits: 5,
    ctaLabel: 'Générer les exercices',
    generateLabel: 'Générer',
    outputType: 'markdown',
    fields: [
      { name: 'matiere', label: 'Matière', type: 'text', placeholder: 'Ex: Mathématiques', required: true },
      { name: 'notion', label: 'Notion à travailler', type: 'text', placeholder: 'Ex: les fractions, l’accord du participe passé…', required: true },
      { name: 'niveau', label: 'Classe / niveau', type: 'text', placeholder: 'Ex: 6e, 2nde…', required: true },
      { name: 'nb', label: 'Exercices par niveau', type: 'select', options: ['2', '3', '5'] },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA CONCEPTEUR D'EXERCICES. ${CONTEXTE_GABON}
Produis en Markdown des exercices sur la notion, en 3 sections : « ## Niveau facile », « ## Niveau moyen », « ## Niveau difficile ». ${i.nb || '3'} exercices par niveau, énoncés clairs et progressifs. Termine par une section « ## Corrigés » regroupant les réponses détaillées. Adapté au niveau de classe indiqué.`,
      user: `Matière : ${i.matiere}\nNotion : ${i.notion}\nNiveau : ${i.niveau}\nExercices par niveau : ${i.nb || '3'}`,
    }),
  },

  // ============================================
  // PARENTS
  // ============================================

  {
    slug: 'aide-aux-devoirs',
    titre: 'Aider mon enfant aux devoirs',
    sousTitre: 'La méthode, pas juste la réponse',
    description:
      "Accompagnez votre enfant sans être expert : on vous explique la notion simplement et on vous guide, étape par étape, pour l'aider à trouver lui-même.",
    iconName: 'Lightbulb',
    couleur: '#F59E0B',
    category: 'parent',
    badge: 'Parents',
    prixCredits: 2,
    ctaLabel: 'M\'aider à expliquer',
    generateLabel: 'Générer le guide',
    outputType: 'markdown',
    fields: [
      { name: 'devoir', label: "Le devoir / la notion", type: 'textarea', placeholder: "Décrivez l'exercice ou la leçon où votre enfant bloque…", required: true, rows: 4 },
      { name: 'classe', label: "Classe de l'enfant", type: 'text', placeholder: 'Ex: CE2, 6e, 3e…', required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA, allié des parents. ${CONTEXTE_GABON}
Le parent n'est pas forcément expert de la matière. Fournis en Markdown : « ## La notion en simple » (explication très accessible pour le parent), « ## Comment guider votre enfant » (questions à poser, étapes pour qu'il trouve LUI-MÊME, sans donner directement la réponse), « ## Exemple corrigé » (un exemple proche, résolu), et « ## Astuces » pour l'encourager. Bienveillant et rassurant.`,
      user: `Classe : ${i.classe}\nDevoir / notion : ${i.devoir}`,
    }),
  },

  {
    slug: 'comprendre-bulletin',
    titre: 'Comprendre le bulletin',
    sousTitre: "Décrypter les notes de mon enfant",
    description:
      "Le bulletin de votre enfant vous laisse perplexe ? On vous l'explique clairement : points forts, difficultés réelles et un plan d'action concret pour l'aider.",
    iconName: 'TrendingUp',
    couleur: '#10B981',
    category: 'parent',
    badge: 'Parents',
    prixCredits: 3,
    ctaLabel: 'Analyser le bulletin',
    generateLabel: 'Analyser',
    outputType: 'markdown',
    fields: [
      { name: 'bulletin', label: 'Notes & appréciations', type: 'textarea', placeholder: 'Recopiez les matières, notes et remarques des professeurs…', required: true, rows: 6 },
      { name: 'classe', label: "Classe de l'enfant", type: 'text', placeholder: 'Ex: 5e, 1ère…', required: true },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA CONSEILLER PÉDAGOGIQUE pour les familles. ${CONTEXTE_GABON}
Analyse le bulletin et produis en Markdown : « ## Vue d'ensemble » (interprétation globale, sans dramatiser), « ## Points forts », « ## Points de vigilance » (matières/compétences à travailler), « ## Plan d'action » (3-5 actions concrètes et réalistes pour la maison), et « ## Comment en parler » avec votre enfant de façon positive. Factuel, encourageant, jamais culpabilisant.`,
      user: `Classe : ${i.classe}\nBulletin :\n${i.bulletin}`,
    }),
  },

  {
    slug: 'courrier-ecole',
    titre: "Courrier à l'école",
    sousTitre: 'Mot d\'absence, RDV, demande',
    description:
      "Rédigez en un clic un courrier correct à l'établissement de votre enfant : justificatif d'absence, demande de rendez-vous, réclamation ou autorisation.",
    iconName: 'Mail',
    couleur: '#0EA5E9',
    category: 'parent',
    badge: 'Parents',
    prixCredits: 2,
    ctaLabel: 'Rédiger le mot',
    generateLabel: 'Rédiger',
    outputType: 'markdown',
    fields: [
      { name: 'motif', label: 'Type de courrier', type: 'select', options: ['Justificatif d\'absence', 'Demande de rendez-vous', 'Autorisation de sortie', 'Réclamation', 'Demande d\'information', 'Autre'], required: true },
      { name: 'details', label: 'Détails', type: 'textarea', placeholder: "Nom de l'enfant, classe, dates, raison…", required: true, rows: 3 },
      { name: 'destinataire', label: 'Destinataire', type: 'text', placeholder: 'Ex: M. le Directeur, le professeur principal…' },
    ],
    buildPrompt: (i) => ({
      system: `Tu es STUDIA RÉDACTEUR. ${CONTEXTE_GABON}
Rédige un courrier court, poli et correct adressé à l'établissement scolaire (${i.motif}), respectant les conventions (lieu et date, formule d'appel, corps clair, formule de politesse, signature). Champs à compléter entre crochets si besoin. Prêt à recopier ou imprimer. Réponds en Markdown.`,
      user: `Type : ${i.motif}\nDestinataire : ${i.destinataire || "l'établissement"}\nDétails : ${i.details}`,
    }),
  },
]

export function getServiceBySlug(slug: string): AIServiceDef | undefined {
  return aiServices.find((s) => s.slug === slug)
}

/** Slugs disposant d'une image de couverture dans /public (évite les 400 next/image). */
export const COVER_SLUGS = new Set<string>([
  'prepa-concours', 'pack-candidature', 'business-plan', 'pitch-html', 'courrier-admin',
  'site-vitrine', 'identite-marque', 'devis-facture', 'posts-reseaux', 'creation-entreprise',
  'etude-marche', 'fiches-revision', 'correcteur-dissertation', 'plan-memoire', 'explique-cours',
  'orientation', 'resume-document',
])

/** Chemin de cover si l'image existe, sinon undefined (fallback dégradé côté UI). */
export function coverFor(s: AIServiceDef): string | undefined {
  return s.coverImage ?? (COVER_SLUGS.has(s.slug) ? `/${s.slug}.png` : undefined)
}
