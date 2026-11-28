import { createHash, randomBytes } from 'node:crypto'

/**
 * Jeton du lien de bilan (serveur uniquement).
 *
 * Le jeton en clair n'existe que dans le lien envoyé à la direction :
 * seule son empreinte SHA-256 est conservée en base. Une fuite de la
 * table ne permet donc pas de reconstruire un lien valide.
 */

/** 32 octets aléatoires en base64url : 43 caractères, non devinable. */
const FORMAT = /^[A-Za-z0-9_-]{43}$/

export function genererJeton(): string {
  return randomBytes(32).toString('base64url')
}

/** Empreinte conservée en base, ou null si le jeton n'a pas la forme attendue. */
export function empreinteJeton(jeton: unknown): string | null {
  if (typeof jeton !== 'string' || !FORMAT.test(jeton)) return null
  return createHash('sha256').update(jeton).digest('hex')
}
