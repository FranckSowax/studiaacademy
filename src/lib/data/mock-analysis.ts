import { AnalysisResult } from '@/types/analysis'

export const mockAnalysisResult: AnalysisResult = {
  id: 'ana-123',
  fileName: 'mon-cv-2024.pdf',
  overallScore: 72,
  analyzedAt: new Date().toISOString(),
  summary: "Votre CV est globalement bien structuré et met en avant vos compétences techniques. Cependant, certaines sections manquent de détails quantitatifs et la mise en forme pourrait être plus aérée pour faciliter la lecture des recruteurs.",
  scores: [
    {
      category: 'Structure & Mise en page',
      score: 8,
      maxScore: 10,
      feedback: 'Bonne organisation, mais attention aux marges trop étroites.'
    },
    {
      category: 'Contenu & Pertinence',
      score: 7,
      maxScore: 10,
      feedback: 'Les expériences sont pertinentes mais manquent de résultats chiffrés.'
    },
    {
      category: 'Mots-clés & ATS',
      score: 6,
      maxScore: 10,
      feedback: 'Il manque certains mots-clés techniques liés à votre poste cible.'
    },
    {
      category: 'Orthographe & Grammaire',
      score: 10,
      maxScore: 10,
      feedback: 'Aucune faute détectée. Bravo !'
    }
  ],
  suggestions: [
    {
      type: 'critical',
      title: 'Ajoutez des résultats quantifiables',
      description: 'Pour chaque expérience, essayez d\'inclure des chiffres (ex: "Augmentation du CA de 15%", "Gestion d\'une équipe de 5 personnes").'
    },
    {
      type: 'improvement',
      title: 'Optimisez pour les ATS',
      description: 'Utilisez des titres de sections standard (Expérience, Formation, Compétences) pour aider les robots à lire votre CV.'
    },
    {
      type: 'improvement',
      title: 'Résumé professionnel',
      description: 'Ajoutez un court paragraphe en haut du CV résumant votre profil et vos objectifs.'
    },
    {
      type: 'strength',
      title: 'Compétences techniques claires',
      description: 'La liste de vos compétences est bien visible et pertinente.'
    }
  ]
}
