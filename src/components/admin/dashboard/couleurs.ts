/**
 * Palette catégorielle des graphiques de l'admin, validée (daltonisme et
 * contraste) sur fond blanc : orange → bleu pour les demandes, vert d'eau →
 * violet pour les revenus. Une couleur désigne toujours la même série.
 *
 * WHY: fichier sans 'use client' — ces valeurs sont lues aussi par des
 * composants serveur, qui ne peuvent pas lire les constantes d'un module client.
 */
export const COULEURS = {
  orange: '#eb6834',
  bleu: '#2a78d6',
  vertEau: '#1baf7a',
  violet: '#6250d6',
} as const
