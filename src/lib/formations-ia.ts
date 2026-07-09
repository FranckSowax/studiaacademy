// ============================================================
// Formations IA (F1-F4) — contenu éditorial + fallbacks
// Les sessions/prix vivent dans Supabase (tables fia_*) ;
// ce fichier porte le contenu de vente et sert de secours
// si la base est indisponible.
// ============================================================

export interface TimelineStep {
  heure: string
  titre: string
  description?: string
  pause?: boolean
  phare?: boolean
}

export interface SessionIA {
  id: string
  date: string // ISO yyyy-mm-dd
  lieu: string
  placesRestantes: number | null
}

export interface FormationIA {
  slug: string
  code: 'F1' | 'F2' | 'F3' | 'F4'
  tag: string
  titre: string
  sousTitre: string
  promesse: string
  publicCible: string
  effectif: string
  prixFcfa: number | null // null = sur devis (F4)
  prixGroupeFcfa: number | null
  from: string
  to: string
  executive?: boolean
  douleurs: { titre: string; texte: string }[]
  timeline: TimelineStep[]
  kit: { titre: string; texte: string }[]
  outils: string[]
  temoignages: { citation: string; auteur: string; fonction: string }[]
  faq: { q: string; r: string }[]
}

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '24100000000'

export const AIRTEL_MONEY_NUMBER =
  process.env.NEXT_PUBLIC_AIRTEL_MONEY ?? '+241 0X XX XX XX'
export const MOOV_MONEY_NUMBER =
  process.env.NEXT_PUBLIC_MOOV_MONEY ?? '+241 0X XX XX XX'

export const fcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

// FAQ communes injectées dans chaque formation
const faqCommunes: { q: string; r: string }[] = [
  {
    q: 'Comment se passe le paiement ?',
    r: "Par Mobile Money (Airtel Money ou Moov Money). L'inscription en ligne crée votre dossier ; vous recevez un code de référence et les numéros de paiement. Notre équipe confirme la réception sous 24 h ouvrées via WhatsApp.",
  },
  {
    q: 'Que dois-je apporter ?',
    r: 'Votre ordinateur portable (un smartphone peut dépanner) et une adresse e-mail valide. Le Wi-Fi, les supports et les kits sont fournis.',
  },
  {
    q: 'Y a-t-il une réduction de groupe ?',
    r: 'Oui : −15 % à partir de 3 participants de la même structure. Pour former une équipe entière dans vos locaux (intra), demandez un devis sur la page Entreprises.',
  },
  {
    q: 'Vais-je recevoir une attestation ?',
    r: 'Oui, une attestation de formation Studia Academy est remise à chaque participant en fin de journée, après le quiz de validation des acquis.',
  },
  {
    q: 'Et après la formation ?',
    r: 'Un suivi à J+30 est inclus : sondage d’usage et session collective de questions/réponses en visio pour ancrer les acquis.',
  },
]

export const formationsIA: FormationIA[] = [
  // ────────────────────────────────────────────── F1
  {
    slug: 'ia-les-bases',
    code: 'F1',
    tag: 'Fondamentaux',
    titre: 'IA : Les Bases',
    sousTitre: 'prompts, ChatGPT & Claude au quotidien',
    promesse: "Maîtrisez l'IA en 1 journée, même sans être technicien",
    publicCible:
      'Tous collaborateurs, managers, patrons de PME — aucun profil technique requis',
    effectif: '8 à 15 participants',
    prixFcfa: 95000,
    prixGroupeFcfa: 80750,
    from: '#4338ca',
    to: '#6d28d9',
    douleurs: [
      {
        titre: 'Les e-mails difficiles vous prennent 20 minutes chacun',
        texte:
          'Trouver le bon ton, relancer sans froisser, répondre à une réclamation : des heures perdues chaque semaine sur des messages sensibles.',
      },
      {
        titre: 'Les documents longs vous engloutissent',
        texte:
          "Lire un rapport de 20 pages pour en extraire 3 décisions : une heure par document, que l'IA fait en 2 minutes.",
      },
      {
        titre: "Vos équipes utilisent déjà ChatGPT — sans cadre",
        texte:
          'Parfois avec vos données confidentielles. Mieux vaut former que subir : la journée inclut un module éthique complet.',
      },
    ],
    timeline: [
      { heure: '8h30', titre: 'Accueil & icebreaker « L\'IA et moi »', description: 'Chacun nomme la tâche qui mange sa semaine — elle devient le fil rouge de SA journée.' },
      { heure: '9h00', titre: "Comprendre l'IA générative, sans jargon", description: "Ce que l'IA fait bien / fait mal, démonstration d'une hallucination en direct, panorama des outils." },
      { heure: '9h45', titre: 'Prise en main : mon compte, mes premiers prompts', description: 'Création des comptes ChatGPT et Claude, procédure testée avec numéros gabonais.' },
      { heure: '10h30', titre: 'Pause café', pause: true },
      { heure: '10h45', titre: 'Le cœur de la journée : la méthode R.C.T.F.', description: 'Rôle · Contexte · Tâche · Format — chacun repart avec 2 prompts personnels testés et validés.', phare: true },
      { heure: '12h00', titre: 'Déjeuner', pause: true },
      { heure: '13h00', titre: 'Quiz Kahoot de réveil', description: '10 questions sur la matinée, sur smartphone.' },
      { heure: '13h15', titre: 'Atelier : les 5 usages universels', description: 'E-mails · résumés · réunions · traduction · brainstorming — démo, pratique, partage.' },
      { heure: '14h45', titre: 'Pause café', pause: true },
      { heure: '15h00', titre: 'Éthique & bon usage', description: 'Hallucinations, confidentialité, anonymisation, loi gabonaise n°001/2011.' },
      { heure: '16h00', titre: 'Mon plan d\'action personnel', description: 'Fiche « Mes 3 premières victoires » : 3 tâches automatisées dès demain.' },
      { heure: '16h20', titre: 'Clôture : quiz, attestations, kits', description: '' },
    ],
    kit: [
      { titre: 'Mémo R.C.T.F.', texte: 'Carte plastifiée format poche — la méthode toujours sous la main.' },
      { titre: '30 prompts prêts à l\'emploi', texte: 'Classés par usage : e-mails, résumés, réunions, traduction, idées.' },
      { titre: 'Charte éthique', texte: '10 « à faire » / 10 « à ne pas faire » + les 6 catégories d\'infos interdites.' },
      { titre: 'Fiche « 3 premières victoires »', texte: 'Votre plan d\'action personnel, rempli et validé pendant la formation.' },
      { titre: 'Attestation Studia Academy', texte: 'Remise en clôture après le quiz d\'acquis.' },
    ],
    outils: ['ChatGPT', 'Claude', 'Gemini', 'Microsoft Copilot'],
    temoignages: [
      // Témoignages de sessions pilotes — à remplacer par de vrais verbatims clients
      { citation: "Je pensais que l'IA n'était pas pour moi. À 16h30, j'avais automatisé mes trois tâches les plus pénibles de la semaine.", auteur: 'Marie-Claire N.', fonction: 'Assistante de direction, Libreville' },
      { citation: 'La méthode R.C.T.F. a changé ma façon de travailler. Mes e-mails sensibles me prennent 5 minutes au lieu de 30.', auteur: 'Serge M.', fonction: 'Manager commercial' },
    ],
    faq: [
      { q: 'Faut-il des connaissances techniques ?', r: 'Aucune. Si vous savez utiliser un navigateur web et une adresse e-mail, vous avez le niveau requis. Les comptes ChatGPT et Claude sont créés ensemble pendant la formation.' },
      ...faqCommunes,
    ],
  },

  // ────────────────────────────────────────────── F2
  {
    slug: 'ia-communication',
    code: 'F2',
    tag: 'Communication',
    titre: 'IA & Communication',
    sousTitre: 'création de contenu & gestion des réseaux',
    promesse: '1 mois de contenu produit en 1 journée',
    publicCible:
      'Chargés de communication, community managers, commerçants, entrepreneurs',
    effectif: '8 à 12 participants',
    prixFcfa: 145000,
    prixGroupeFcfa: 123250,
    from: '#db2777',
    to: '#f97316',
    douleurs: [
      {
        titre: '« Je n\'ai pas le temps »',
        texte:
          'Chaque événement exige affiche, posts, stories et relances. Entre deux, la page retombe dans le silence — et le public décroche.',
      },
      {
        titre: '« Je ne sais pas quoi poster »',
        texte:
          "Entre deux annonces, c'est la page blanche : on informe un public au lieu d'animer une communauté.",
      },
      {
        titre: '« Mes visuels font amateur »',
        texte:
          "Pas de graphiste disponible pour chaque post. Des visuels inégaux d'une publication à l'autre — l'image de la marque en souffre.",
      },
    ],
    timeline: [
      { heure: '8h30', titre: 'Accueil & « Mon audit express »', description: 'Chacun présente sa marque, montre sa page et nomme ses 2 blocages n°1.' },
      { heure: '9h00', titre: 'Le méga-prompt « profil de marque »', description: 'Votre prompt de contexte réutilisable : activité, cible, ton, valeurs, offre.', phare: true },
      { heure: '9h30', titre: 'La stratégie de contenu en 1 heure', description: 'Piliers de contenu + calendrier éditorial de 4 semaines, calé sur les dates locales.' },
      { heure: '10h45', titre: 'Pause café', pause: true },
      { heure: '11h00', titre: "L'usine à posts : rédiger 1 mois de textes", description: 'Technique du lot, 1 message → 4 réseaux, sprint de production : 8 à 12 posts rédigés.' },
      { heure: '12h30', titre: 'Déjeuner', pause: true },
      { heure: '13h30', titre: 'Visuels : créer sans graphiste', description: 'Canva Magic Studio + génération d\'images IA (DALL·E, Ideogram) aux couleurs de votre marque.' },
      { heure: '14h45', titre: 'Pause café', pause: true },
      { heure: '15h00', titre: 'Vidéo courte & planification', description: 'Script Reel/TikTok 30 s, sous-titres CapCut, programmation réelle dans Meta Business Suite.' },
      { heure: '15h45', titre: 'Éthique du contenu IA', description: 'Droits, transparence, désinformation — règle 80/20 : l\'IA produit le volume, vous apportez le vrai.' },
      { heure: '16h15', titre: 'Clôture : « Mon mois est prêt »', description: 'Checklist de la promesse vérifiée + routine mensuelle « Mon mois en 3 h ».' },
    ],
    kit: [
      { titre: '25 prompts communication', texte: 'Profil de marque, piliers, posts par réseau, accroches, scripts vidéo.' },
      { titre: 'Routine « Mon mois en 3 h »', texte: 'La procédure pas-à-pas pour reproduire seul, chaque mois.' },
      { titre: 'Calendrier éditorial 4 semaines', texte: '12 à 20 publications planifiées — construit pendant la journée, modèle réutilisable.' },
      { titre: '8-12 posts + 4-6 visuels', texte: 'Votre contenu réel, finalisé sur place, prêt à publier.' },
      { titre: 'Charte éthique du contenu', texte: 'Droits, transparence, désinformation.' },
      { titre: 'Attestation Studia Academy', texte: 'Remise en clôture.' },
    ],
    outils: ['ChatGPT', 'Claude', 'Canva Magic Studio', 'Ideogram', 'CapCut', 'Meta Business Suite'],
    temoignages: [
      { citation: "Je suis repartie avec mon mois de publications entièrement rédigé et mes deux premiers posts déjà programmés. Rien à refaire chez moi.", auteur: 'Aïcha B.', fonction: 'Community manager' },
      { citation: 'La technique « 1 message → 4 réseaux » a triplé ma présence en ligne sans tripler mon temps.', auteur: 'Rodrigue O.', fonction: 'Commerçant, Libreville' },
    ],
    faq: [
      { q: 'Dois-je venir avec ma marque ?', r: "Oui, c'est la force de cette journée : un questionnaire pré-formation recueille votre marque, vos réseaux et vos objectifs. Vous produisez VOTRE contenu réel, pas des exemples." },
      ...faqCommunes,
    ],
  },

  // ────────────────────────────────────────────── F3
  {
    slug: 'ia-administratif',
    code: 'F3',
    tag: 'Administratif',
    titre: 'IA & Administratif',
    sousTitre: 'courriers, rapports, Excel & procédures',
    promesse: 'Divisez par 2 le temps de vos tâches administratives',
    publicCible:
      'Assistants de direction, RH, comptables, agents administratifs',
    effectif: '8 à 15 participants',
    prixFcfa: 145000,
    prixGroupeFcfa: 123250,
    from: '#0d9488',
    to: '#059669',
    douleurs: [
      {
        titre: 'Courriers & e-mails : ~5 h par semaine',
        texte:
          'Le formalisme administratif à la française : chaque courrier officiel demande 20 à 40 minutes de rédaction soignée.',
      },
      {
        titre: 'Excel : des heures de tâtonnement',
        texte:
          "Chercher la bonne formule, déboguer un #N/A, comprendre le classeur d'un collègue parti : l'IA écrit, corrige et explique vos formules.",
      },
      {
        titre: 'Comptes-rendus & rapports : la corvée universelle',
        texte:
          'Transformer des notes en vrac en CR propre, rédiger le rapport mensuel : les tâches que tout le monde repousse.',
      },
    ],
    timeline: [
      { heure: '8h30', titre: 'Accueil & « Ma journée type »', description: 'Chacun liste ses 5 tâches les plus chronophages avec leur temps actuel — on recalcule à 16h.' },
      { heure: '9h00', titre: "Confidentialité d'abord — le réflexe avant l'outil", description: 'Les 6 catégories interdites, exercice d\'anonymisation fondateur, loi n°001/2011. Règle d\'or : « J\'anonymise, je génère, je réinsère. »', phare: true },
      { heure: '9h45', titre: 'Courriers & e-mails administratifs', description: 'Réclamation, relance en 3 tons, note de service — sprint : 3 courriers de VOTRE quotidien.' },
      { heure: '10h45', titre: 'Pause café', pause: true },
      { heure: '11h00', titre: 'Rapports, comptes-rendus & synthèses', description: 'Notes en vrac → CR structuré · rapport de 20 pages → synthèse 1 page · trame mensuelle réutilisable.' },
      { heure: '12h30', titre: 'Déjeuner', pause: true },
      { heure: '13h30', titre: 'Quiz Kahoot', description: 'Matinée + confidentialité : les réflexes doivent être automatiques.' },
      { heure: '13h45', titre: 'Excel & données — le module « effet waouh »', description: "L'IA écrit, corrige et explique vos formules ; analyse de fichiers entiers téléversés." },
      { heure: '15h15', titre: 'Pause café', pause: true },
      { heure: '15h30', titre: 'Procédures, checklists & présentations', description: 'De l\'oral en vrac → procédure numérotée. Démo Gamma : une présentation en 2 minutes.' },
      { heure: '16h00', titre: 'Le calcul du gain : votre temps ÷ 2', description: 'Retour au tableau du matin : gain hebdomadaire chiffré par participant (30 à 50 %).' },
      { heure: '16h20', titre: 'Clôture : quiz, attestations, kits', description: '' },
    ],
    kit: [
      { titre: '30 prompts administratifs', texte: 'Courriers, comptes-rendus, synthèses, Excel, procédures.' },
      { titre: 'Mémo règle d\'or', texte: '« J\'anonymise, je génère, je réinsère » — fiche plastifiée.' },
      { titre: 'Charte confidentialité renforcée', texte: 'Version RH / comptabilité, prête à afficher en poste.' },
      { titre: 'Modèles de la journée', texte: 'Courriers types, trames de rapport et de compte-rendu créés en formation.' },
      { titre: 'Fiche « 3 automatisations »', texte: 'Le plan d\'action de la semaine, prompts prêts.' },
      { titre: 'Attestation Studia Academy', texte: 'Remise en clôture.' },
    ],
    outils: ['ChatGPT', 'Claude', 'Microsoft Copilot', 'Word Dictée', 'Gamma'],
    temoignages: [
      { citation: "Le module Excel m'a bluffée : je décris ce que je veux en français, l'IA me donne la formule exacte. Mon tableau de gain affiche −57 %.", auteur: 'Prisca L.', fonction: 'Comptable' },
      { citation: 'La règle « j\'anonymise, je génère, je réinsère » a rassuré ma direction : on utilise l\'IA sans exposer nos dossiers.', auteur: 'Jean-Bosco E.', fonction: 'Responsable RH' },
    ],
    faq: [
      { q: 'Je manipule des données sensibles (RH, paie). Est-ce un problème ?', r: "C'est précisément pour vous que le module confidentialité OUVRE la journée : anonymisation systématique, catégories interdites, conformité à la loi gabonaise n°001/2011. Vous apprenez à gagner du temps sans jamais exposer un dossier." },
      ...faqCommunes,
    ],
  },

  // ────────────────────────────────────────────── F4
  {
    slug: 'ia-direction',
    code: 'F4',
    tag: 'Executive',
    titre: 'IA & Direction',
    sousTitre: 'décider, piloter, transformer',
    promesse: 'Des dossiers de 50 pages aux décisions en 30 minutes',
    publicCible:
      'DG, directeurs, secrétaires généraux, cadres dirigeants — privé et administration',
    effectif: '6 à 10 dirigeants maximum',
    prixFcfa: null,
    prixGroupeFcfa: null,
    from: '#141828',
    to: '#f5b301',
    executive: true,
    douleurs: [
      {
        titre: 'Décider seul, sans contradiction',
        texte:
          "Le danger n'est pas que l'IA décide à votre place — c'est de décider sans contradicteur. L'IA devient votre comité des risques.",
      },
      {
        titre: 'Des dossiers de 50 pages, trop tard, trop denses',
        texte:
          "Résumé exécutif, points de vigilance, questions à poser aux équipes — en 10 minutes au lieu de 3 heures.",
      },
      {
        titre: 'Une organisation qui improvise ses usages IA',
        texte:
          'Sans cadre, chaque service bricole — parfois avec vos données. Vous repartez avec la feuille de route et la charte de toute votre organisation.',
      },
    ],
    timeline: [
      { heure: '8h30', titre: 'Accueil « Chatham House »', description: 'Tour de table confidentiel : la décision la plus difficile de votre trimestre devient un cas de travail.' },
      { heure: '9h00', titre: "L'état de l'art pour décideurs", description: 'Mature vs marketing · cas concrets par secteur · les 3 questions à trancher · souveraineté des données.' },
      { heure: '10h00', titre: 'Le dirigeant augmenté I — digérer et décider', description: 'Le dossier de 50 pages → note de décision. L\'IA contradicteur : avocat du diable, 3 scénarios.', phare: true },
      { heure: '11h00', titre: 'Pause', pause: true },
      { heure: '11h15', titre: 'Le dirigeant augmenté II — la parole et la plume', description: 'Notes stratégiques, discours avec VOTRE voix, préparation de comité, négociation : l\'IA joue la partie adverse.' },
      { heure: '12h30', titre: "Déjeuner d'échange entre pairs", pause: true },
      { heure: '13h30', titre: 'Données & pilotage', description: 'Analyser un export en langage naturel, construire ses KPI, lire un audit plus vite.' },
      { heure: '14h30', titre: 'Votre assistant IA personnel', description: 'Claude Project / GPT personnalisé configuré sur place — on ne quitte pas la salle sans.' },
      { heure: '15h30', titre: 'Pause', pause: true },
      { heure: '15h45', titre: 'La feuille de route IA de votre organisation', description: 'Cartographie des cas d\'usage, gouvernance, charte interne, plan 90 jours engagé entre pairs.' },
    ],
    kit: [
      { titre: 'Playbook du dirigeant augmenté', texte: '25 prompts de direction : analyse, décision, contradicteur, discours, négociation, KPI.' },
      { titre: "Charte IA d'organisation", texte: 'Modèle prêt à adapter et à faire signer dans votre structure.' },
      { titre: 'Assistant IA configuré', texte: 'Claude Project ou GPT personnalisé, opérationnel en sortant.' },
      { titre: 'Plan 90 jours', texte: '3 décisions IA engagées : usage personnel, pilote d\'équipe, règle de gouvernance.' },
      { titre: 'Entretien individuel J+45', texte: '30 minutes en visio avec chaque dirigeant : revue du plan 90 jours. Inclus.' },
    ],
    outils: ['Claude Projects', 'ChatGPT / GPTs', 'NotebookLM', 'Perplexity', 'Gamma'],
    temoignages: [
      { citation: "L'IA contradicteur a attaqué mon projet d'investissement mieux que mon conseil d'administration. J'ai revu deux hypothèses avant de présenter.", auteur: 'Direction générale', fonction: 'Secteur bancaire' },
      { citation: 'Je suis reparti avec mon assistant configuré et un plan 90 jours réaliste. Mes équipes passent en F1 le mois prochain.', auteur: 'Directeur', fonction: 'Institution publique' },
    ],
    faq: [
      { q: 'Pourquoi le tarif n\'est-il pas affiché ?', r: 'Le format executive est sur devis : effectif réduit (6-10), cas préparés sur mesure via questionnaire confidentiel, entretien individuel de suivi à J+45. Demandez un entretien, nous répondons sous 48 h.' },
      { q: 'Quelle différence avec la F3 ?', r: 'F3 forme ceux qui produisent les documents ; F4 forme ceux qui décident. On ne parle pas de courriers — on parle de décision, de pilotage par la donnée et de la feuille de route IA de toute l\'organisation.' },
      { q: 'La confidentialité des échanges est-elle garantie ?', r: 'Oui : règle de Chatham House annoncée en ouverture, rien ne sort de la salle. Le questionnaire préalable est traité confidentiellement.' },
      { q: 'Comment se passe le règlement ?', r: 'Sur devis et facturation à votre organisation. Le paiement Mobile Money reste possible pour les indépendants.' },
      { q: 'Que se passe-t-il après la journée ?', r: 'Un entretien individuel de 30 minutes à J+45 est inclus : revue de votre plan 90 jours. Un accompagnement trimestriel de la feuille de route peut être proposé ensuite.' },
      { q: 'Peut-on organiser une session dédiée à notre comité de direction ?', r: 'Oui, c\'est même le format le plus efficace. Demandez un entretien : nous construisons la session sur vos enjeux réels.' },
    ],
  },
]

export function getFormation(slug: string): FormationIA | undefined {
  return formationsIA.find((f) => f.slug === slug)
}

// Sessions de secours (miroir du seed) si Supabase est indisponible
export const fallbackSessions: Record<string, SessionIA[]> = {
  'ia-les-bases': [
    { id: 'fallback-f1-1', date: '2026-08-27', lieu: 'Libreville — Institut Français', placesRestantes: null },
    { id: 'fallback-f1-2', date: '2026-09-24', lieu: 'Libreville — Institut Français', placesRestantes: null },
  ],
  'ia-communication': [
    { id: 'fallback-f2-1', date: '2026-09-03', lieu: 'Libreville — Institut Français', placesRestantes: null },
    { id: 'fallback-f2-2', date: '2026-10-01', lieu: 'Libreville — Institut Français', placesRestantes: null },
  ],
  'ia-administratif': [
    { id: 'fallback-f3-1', date: '2026-09-10', lieu: 'Libreville — Institut Français', placesRestantes: null },
    { id: 'fallback-f3-2', date: '2026-10-08', lieu: 'Libreville — Institut Français', placesRestantes: null },
  ],
  'ia-direction': [
    { id: 'fallback-f4-1', date: '2026-09-17', lieu: 'Libreville — lieu communiqué aux inscrits', placesRestantes: null },
    { id: 'fallback-f4-2', date: '2026-10-15', lieu: 'Libreville — lieu communiqué aux inscrits', placesRestantes: null },
  ],
}

export function formatDateFr(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso + 'T00:00:00'))
}

export const PHONE_REGEX = /^\+241\d{8,9}$/

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s.-]/g, '')
}
