/**
 * Prénom d'un élève envoyé à Studia Live (demande de ticket). Studia
 * Live l'affiche tel quel et refuse un prénom vide ou de plus de 60
 * caractères.
 *
 * Ordre de recherche :
 *  1. prénom du profil ;
 *  2. prénom des métadonnées du compte d'authentification ;
 *  3. premier mot du nom complet (profil, puis métadonnées) ;
 *  4. partie de l'e-mail avant le @, première lettre en majuscule.
 *
 * WHY: une valeur générique (« Utilisateur », « User »…) n'est pas un
 * prénom. Le compte de démonstration s'appelait « Utilisateur Démo » : le
 * premier mot de son nom complet arrivait tel quel chez Studia Live. Un
 * tel candidat est ignoré et la recherche continue.
 */

export const PRENOM_MAX = 60

const GENERIQUES = ['utilisateur', 'utilisatrice', 'user', 'eleve', 'apprenant', 'anonyme', 'anonymous']

/** Caractères invisibles (espace de largeur nulle, marque d'ordre…) qui
 * feraient passer « Utilisateur » pour un autre mot ou un prénom pour non vide. */
const INVISIBLES = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g

export interface SourcesPrenom {
  /** Ligne `profiles` de l'élève (ou null). */
  profil?: Record<string, unknown> | null
  /** `user_metadata` du compte d'authentification (ou null). */
  metadonnees?: Record<string, unknown> | null
  email?: string | null
}

function texte(valeur: unknown): string {
  return typeof valeur === 'string' ? valeur.trim() : ''
}

/**
 * Valeur générique, comparée sans tenir compte de la casse, des accents,
 * des espaces ni d'un suffixe de chiffres ou de ponctuation :
 * « Utilisateur », « UTILISATEUR », « user_42 », « Élève. »…
 */
function generique(valeur: string): boolean {
  // Premier mot seul : « Utilisateur Démo » saisi dans un champ prénom est générique aussi.
  const mot = valeur.trim().split(/\s+/)[0] ?? ''
  const simple = mot
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // \p{L} : toute lettre, pour ne pas vider un prénom en alphabet non latin
    .replace(/[^\p{L}]+$/u, '')
    .replace(/^[^\p{L}]+/u, '')
  return simple === '' || GENERIQUES.includes(simple)
}

/** Espaces retirés, 60 caractères au plus (sans couper un caractère). */
function nettoyer(valeur: string): string {
  return Array.from(valeur.replace(INVISIBLES, '').trim().replace(/\s+/g, ' '))
    .slice(0, PRENOM_MAX)
    .join('')
    .trim()
}

function premier(source: Record<string, unknown> | null | undefined, cles: string[]): string {
  for (const cle of cles) {
    const v = nettoyer(texte(source?.[cle]))
    if (v && !generique(v)) return v
  }
  return ''
}

function premierMot(source: Record<string, unknown> | null | undefined, cles: string[]): string {
  for (const cle of cles) {
    const mot = nettoyer(texte(source?.[cle]).split(/\s+/)[0] ?? '')
    if (mot && !generique(mot)) return mot
  }
  return ''
}

function depuisEmail(email: string | null | undefined): string {
  const local = nettoyer(texte(email).split('@')[0] ?? '')
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : ''
}

const CLES_PRENOM = ['prenom', 'first_name', 'given_name']
const CLES_NOM_COMPLET = ['full_name', 'name']

export function prenomEleve({ profil, metadonnees, email }: SourcesPrenom): string {
  return (
    premier(profil, CLES_PRENOM) ||
    premier(metadonnees, CLES_PRENOM) ||
    premierMot(profil, CLES_NOM_COMPLET) ||
    premierMot(metadonnees, CLES_NOM_COMPLET) ||
    depuisEmail(email) ||
    // Jamais vide : sans e-mail exploitable non plus (cas théorique).
    'Apprenant'
  )
}
