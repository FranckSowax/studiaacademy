import type { AIServiceDef } from '@/types/ai-service'

const CONTEXTE_GABON =
  "Contexte : Gabon / Afrique Centrale, public francophone. Adapte les exemples, références et le ton au contexte gabonais quand c'est pertinent."

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
]

export function getServiceBySlug(slug: string): AIServiceDef | undefined {
  return aiServices.find((s) => s.slug === slug)
}
