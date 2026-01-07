import { Quiz } from '@/types/quiz'

export const mockQuiz: Quiz = {
  id: 'assess-demo',
  title: 'Évaluation des Compétences Professionnelles',
  description: 'Ce test évalue vos aptitudes dans trois domaines clés : Compétences Techniques, Communication et Résolution de Problèmes.',
  durationMinutes: 15,
  questions: [
    {
      id: 1,
      text: 'Quelle est la meilleure approche pour gérer un conflit avec un collègue ?',
      category: 'Communication',
      options: [
        { id: 'a', text: 'L\'ignorer jusqu\'à ce qu\'il passe', isCorrect: false },
        { id: 'b', text: 'En parler immédiatement avec son superviseur', isCorrect: false },
        { id: 'c', text: 'Proposer une discussion privée pour comprendre son point de vue', isCorrect: true },
        { id: 'd', text: 'Se plaindre aux autres collègues', isCorrect: false },
      ],
    },
    {
      id: 2,
      text: 'Face à un problème complexe, quelle est la première étape ?',
      category: 'Résolution de Problèmes',
      options: [
        { id: 'a', text: 'Essayer la première solution qui vient à l\'esprit', isCorrect: false },
        { id: 'b', text: 'Analyser le problème pour en identifier la cause racine', isCorrect: true },
        { id: 'c', text: 'Demander à quelqu\'un d\'autre de le résoudre', isCorrect: false },
        { id: 'd', text: 'Reporter le problème à plus tard', isCorrect: false },
      ],
    },
    {
      id: 3,
      text: 'Quel outil est le plus approprié pour la gestion de projet agile ?',
      category: 'Technique',
      options: [
        { id: 'a', text: 'Microsoft Word', isCorrect: false },
        { id: 'b', text: 'Jira ou Trello', isCorrect: true },
        { id: 'c', text: 'Paint', isCorrect: false },
        { id: 'd', text: 'Bloc-notes', isCorrect: false },
      ],
    },
    {
      id: 4,
      text: 'Comment assurez-vous une communication efficace par email ?',
      category: 'Communication',
      options: [
        { id: 'a', text: 'Écrire de longs paragraphes sans structure', isCorrect: false },
        { id: 'b', text: 'Utiliser un objet clair et être concis', isCorrect: true },
        { id: 'c', text: 'Ne pas mettre d\'objet', isCorrect: false },
        { id: 'd', text: 'Utiliser beaucoup de majuscules pour insister', isCorrect: false },
      ],
    },
    {
      id: 5,
      text: 'Vous découvrez une erreur dans un rapport envoyé au client. Que faites-vous ?',
      category: 'Résolution de Problèmes',
      options: [
        { id: 'a', text: 'Espérer que le client ne la remarque pas', isCorrect: false },
        { id: 'b', text: 'Blâmer un collègue', isCorrect: false },
        { id: 'c', text: 'Informer votre responsable et préparer une correction', isCorrect: true },
        { id: 'd', text: 'Démissionner', isCorrect: false },
      ],
    },
  ],
}
