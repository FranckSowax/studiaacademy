// ============================================
// Banque de compétences — diagnostic entreprise
// 6 domaines, QCM par compétence. Snapshot copié dans l'assessment à la création.
// ============================================

import type { AssessmentQuestion } from '@/types/entreprise'

export interface CompetenceDomain {
  slug: string
  libelle: string
  description: string
}

export const DOMAINES: CompetenceDomain[] = [
  { slug: 'bureautique', libelle: 'Bureautique & outils collaboratifs', description: 'Word, Excel, e-mail, agenda, outils partagés' },
  { slug: 'ia_generative', libelle: 'IA générative au travail', description: 'ChatGPT et assistants IA, prompts, usages pro' },
  { slug: 'data', libelle: 'Data & tableaux de bord', description: 'Lecture de données, indicateurs, tableurs' },
  { slug: 'communication_digitale', libelle: 'Communication digitale', description: 'Réseaux sociaux, contenus, présence en ligne' },
  { slug: 'gestion_projet', libelle: 'Gestion de projet & organisation', description: 'Planification, outils, collaboration' },
  { slug: 'securite', libelle: 'Cybersécurité & hygiène numérique', description: 'Mots de passe, phishing, données sensibles' },
]

// Banque de questions. id stable, points = poids.
export const BANQUE_QUESTIONS: AssessmentQuestion[] = [
  // ── Bureautique ──
  { id: 'bur1', domaine: 'bureautique', competence: 'Tableur', enonce: 'Dans un tableur, quelle formule additionne les cellules A1 à A10 ?', options: ['=ADD(A1:A10)', '=SOMME(A1:A10)', '=A1+A10', '=TOTAL(A1-A10)'], reponse_correcte: 1, points: 10 },
  { id: 'bur2', domaine: 'bureautique', competence: 'Collaboration', enonce: 'Quel outil permet à plusieurs personnes de modifier un même document en même temps ?', options: ['Un document partagé en ligne (cloud)', 'Un fichier envoyé par clé USB', 'Un PDF imprimé', 'Un e-mail'], reponse_correcte: 0, points: 10 },
  { id: 'bur3', domaine: 'bureautique', competence: 'E-mail', enonce: 'Que signifie mettre une personne en « Cci » dans un e-mail ?', options: ['Elle reçoit en priorité', 'Sa copie est cachée aux autres destinataires', 'Elle doit répondre', 'Elle ne reçoit rien'], reponse_correcte: 1, points: 10 },
  { id: 'bur4', domaine: 'bureautique', competence: 'Fichiers', enonce: 'Quel format conserve la mise en page pour partager un document non modifiable ?', options: ['.txt', '.pdf', '.csv', '.zip'], reponse_correcte: 1, points: 10 },
  { id: 'bur5', domaine: 'bureautique', competence: 'Tableur', enonce: 'À quoi sert un « filtre » dans un tableur ?', options: ['Supprimer des lignes', 'N\'afficher que les lignes répondant à un critère', 'Changer la couleur', 'Protéger le fichier'], reponse_correcte: 1, points: 10 },

  // ── IA générative ──
  { id: 'ia1', domaine: 'ia_generative', competence: 'Notions', enonce: 'Qu\'est-ce qu\'un outil d\'IA générative comme ChatGPT ?', options: ['Un moteur de recherche', 'Un programme qui génère du texte/des contenus à partir d\'une consigne', 'Un antivirus', 'Un tableur'], reponse_correcte: 1, points: 10 },
  { id: 'ia2', domaine: 'ia_generative', competence: 'Prompt', enonce: 'Pour obtenir une bonne réponse d\'une IA, il vaut mieux…', options: ['Donner une consigne précise et du contexte', 'Écrire un seul mot', 'Tout écrire en majuscules', 'Ne rien préciser'], reponse_correcte: 0, points: 10 },
  { id: 'ia3', domaine: 'ia_generative', competence: 'Esprit critique', enonce: 'Une réponse d\'IA doit être…', options: ['Toujours publiée telle quelle', 'Vérifiée car elle peut contenir des erreurs', 'Ignorée', 'Imprimée'], reponse_correcte: 1, points: 10 },
  { id: 'ia4', domaine: 'ia_generative', competence: 'Usages', enonce: 'Lequel est un bon usage professionnel de l\'IA ?', options: ['Rédiger un premier brouillon d\'e-mail', 'Saisir des mots de passe clients', 'Remplacer toute vérification humaine', 'Partager des données confidentielles'], reponse_correcte: 0, points: 10 },
  { id: 'ia5', domaine: 'ia_generative', competence: 'Confidentialité', enonce: 'Que faut-il éviter de mettre dans une IA publique ?', options: ['Une question générale', 'Des données sensibles ou personnelles de clients', 'Un texte à reformuler', 'Une idée d\'article'], reponse_correcte: 1, points: 10 },

  // ── Data ──
  { id: 'dat1', domaine: 'data', competence: 'Indicateurs', enonce: 'Qu\'est-ce qu\'un KPI ?', options: ['Un type de fichier', 'Un indicateur clé de performance', 'Un logiciel', 'Une réunion'], reponse_correcte: 1, points: 10 },
  { id: 'dat2', domaine: 'data', competence: 'Lecture', enonce: 'Pour comparer l\'évolution des ventes sur 12 mois, quel graphique est le plus adapté ?', options: ['Camembert', 'Courbe / histogramme dans le temps', 'Tableau brut', 'Nuage de mots'], reponse_correcte: 1, points: 10 },
  { id: 'dat3', domaine: 'data', competence: 'Tableur', enonce: 'Que calcule une moyenne ?', options: ['La valeur la plus fréquente', 'La somme divisée par le nombre de valeurs', 'La plus grande valeur', 'Le total'], reponse_correcte: 1, points: 10 },
  { id: 'dat4', domaine: 'data', competence: 'Qualité', enonce: 'Pourquoi nettoyer des données avant analyse ?', options: ['Pour les rendre jolies', 'Pour éviter des erreurs dues aux doublons/valeurs manquantes', 'Ce n\'est pas utile', 'Pour réduire la taille'], reponse_correcte: 1, points: 10 },
  { id: 'dat5', domaine: 'data', competence: 'Décision', enonce: 'Un tableau de bord sert principalement à…', options: ['Stocker des photos', 'Suivre des indicateurs pour décider', 'Envoyer des e-mails', 'Sécuriser le réseau'], reponse_correcte: 1, points: 10 },

  // ── Communication digitale ──
  { id: 'com1', domaine: 'communication_digitale', competence: 'Réseaux', enonce: 'Quel réseau est le plus adapté à une communication professionnelle B2B ?', options: ['LinkedIn', 'TikTok', 'Aucun', 'Snapchat'], reponse_correcte: 0, points: 10 },
  { id: 'com2', domaine: 'communication_digitale', competence: 'Contenu', enonce: 'Qu\'est-ce qu\'un bon post sur les réseaux ?', options: ['Très long sans visuel', 'Clair, avec un visuel et un appel à l\'action', 'Uniquement des hashtags', 'Une capture floue'], reponse_correcte: 1, points: 10 },
  { id: 'com3', domaine: 'communication_digitale', competence: 'Audience', enonce: 'Que signifie « cibler une audience » ?', options: ['Parler à tout le monde', 'Adapter le message à un public précis', 'Bloquer des gens', 'Payer plus cher'], reponse_correcte: 1, points: 10 },
  { id: 'com4', domaine: 'communication_digitale', competence: 'Mesure', enonce: 'Le « taux d\'engagement » mesure…', options: ['Le nombre d\'abonnés', 'Les interactions (likes, commentaires, partages)', 'La vitesse du site', 'Le budget'], reponse_correcte: 1, points: 10 },
  { id: 'com5', domaine: 'communication_digitale', competence: 'E-réputation', enonce: 'Face à un commentaire négatif d\'un client en ligne, mieux vaut…', options: ['Le supprimer et ignorer', 'Répondre poliment et proposer une solution', 'Insulter', 'Ne jamais répondre'], reponse_correcte: 1, points: 10 },

  // ── Gestion de projet ──
  { id: 'pro1', domaine: 'gestion_projet', competence: 'Planification', enonce: 'À quoi sert un rétroplanning ?', options: ['À organiser les tâches à partir de la date de fin', 'À ranger des fichiers', 'À calculer un salaire', 'À envoyer des e-mails'], reponse_correcte: 0, points: 10 },
  { id: 'pro2', domaine: 'gestion_projet', competence: 'Outils', enonce: 'Quel type d\'outil aide à suivre l\'avancement des tâches d\'une équipe ?', options: ['Un tableau de tâches (kanban)', 'Un antivirus', 'Un navigateur', 'Une imprimante'], reponse_correcte: 0, points: 10 },
  { id: 'pro3', domaine: 'gestion_projet', competence: 'Priorisation', enonce: 'Prioriser, c\'est…', options: ['Tout faire en même temps', 'Traiter d\'abord ce qui est important et urgent', 'Faire le plus facile', 'Déléguer tout'], reponse_correcte: 1, points: 10 },
  { id: 'pro4', domaine: 'gestion_projet', competence: 'Rôles', enonce: 'Que définit un « livrable » ?', options: ['Un résultat concret attendu', 'Un congé', 'Un logiciel', 'Une réunion'], reponse_correcte: 0, points: 10 },
  { id: 'pro5', domaine: 'gestion_projet', competence: 'Suivi', enonce: 'Un point d\'avancement régulier permet de…', options: ['Perdre du temps', 'Détecter les blocages tôt et ajuster', 'Augmenter le budget', 'Éviter de communiquer'], reponse_correcte: 1, points: 10 },

  // ── Cybersécurité ──
  { id: 'sec1', domaine: 'securite', competence: 'Mots de passe', enonce: 'Un bon mot de passe est…', options: ['« 123456 »', 'Long, unique et complexe', 'Votre date de naissance', 'Le même partout'], reponse_correcte: 1, points: 10 },
  { id: 'sec2', domaine: 'securite', competence: 'Phishing', enonce: 'Vous recevez un e-mail urgent demandant vos identifiants. Que faire ?', options: ['Cliquer vite', 'Ne pas cliquer et vérifier l\'expéditeur', 'Répondre avec le mot de passe', 'Transférer à tous'], reponse_correcte: 1, points: 10 },
  { id: 'sec3', domaine: 'securite', competence: 'Données', enonce: 'Comment protéger des données sensibles ?', options: ['Les laisser sur le bureau', 'Limiter l\'accès et faire des sauvegardes', 'Les publier', 'Les envoyer à tous'], reponse_correcte: 1, points: 10 },
  { id: 'sec4', domaine: 'securite', competence: 'Authentification', enonce: 'Qu\'apporte la double authentification (2FA) ?', options: ['Rien', 'Une sécurité supplémentaire au-delà du mot de passe', 'Plus de pubs', 'Un mot de passe plus court'], reponse_correcte: 1, points: 10 },
  { id: 'sec5', domaine: 'securite', competence: 'Mises à jour', enonce: 'Pourquoi installer les mises à jour logicielles ?', options: ['Pour corriger des failles de sécurité', 'Pour ralentir l\'ordinateur', 'C\'est inutile', 'Pour changer la couleur'], reponse_correcte: 0, points: 10 },
]

/** Sélectionne les questions des domaines demandés (snapshot pour un assessment). */
export function buildQuestionSet(domaines: string[]): AssessmentQuestion[] {
  const set = BANQUE_QUESTIONS.filter((q) => domaines.includes(q.domaine))
  return set
}
