/**
 * Accès aux formations gratuites, restreint à une liste de comptes.
 *
 * Tant que le catalogue gratuit n'est pas ouvert au public, seuls les
 * comptes listés peuvent s'y inscrire et les suivre. Les formations
 * payantes ne sont pas concernées : leur accès reste accordé par l'équipe.
 *
 * Réglage par la variable d'environnement FREE_FORMATIONS_ALLOWED_EMAILS :
 *  - absente ou vide : le compte de démonstration et le compte administrateur ;
 *  - liste d'adresses séparées par des virgules : ces comptes uniquement ;
 *  - `*` : ouvert à tous les comptes (fin de la restriction).
 *
 * À n'utiliser que côté serveur : la règle doit être appliquée là où
 * l'accès est réellement donné, pas seulement dans l'affichage.
 */

// Compte de démonstration + compte administrateur de Studia.
const COMPTES_PAR_DEFAUT = ['demo@studia-academy.com', 'studiagabon@gmail.com']

const normaliser = (email: string) => email.trim().toLowerCase()

/** Comptes autorisés aux formations gratuites, ou null si elles sont ouvertes à tous. */
export function comptesFormationsGratuites(): ReadonlySet<string> | null {
  const brut = process.env.FREE_FORMATIONS_ALLOWED_EMAILS?.trim()
  if (brut === '*') return null
  const liste = (brut ?? '').split(',').map(normaliser).filter(Boolean)
  // WHY: une variable mal remplie (vide, virgules seules) ne doit jamais ouvrir l'accès à tous.
  return new Set(liste.length > 0 ? liste : COMPTES_PAR_DEFAUT)
}

/** Une formation sans prix, ou à 0 FCFA, est gratuite. */
export function estFormationGratuite(formation: { prix_fcfa?: number | null }): boolean {
  return (formation.prix_fcfa ?? 0) <= 0
}

/**
 * Ce compte peut-il s'inscrire à cette formation et la suivre ?
 * Toujours vrai pour une formation payante ; pour une formation gratuite,
 * seulement si l'adresse du compte fait partie des comptes autorisés.
 *
 * @example
 * if (!accesFormationAutorise(formation, user.email)) redirect(`/formations/en-ligne/${slug}`)
 */
export function accesFormationAutorise(
  formation: { prix_fcfa?: number | null },
  email: string | null | undefined
): boolean {
  if (!estFormationGratuite(formation)) return true
  const comptes = comptesFormationsGratuites()
  if (!comptes) return true
  return !!email && comptes.has(normaliser(email))
}
