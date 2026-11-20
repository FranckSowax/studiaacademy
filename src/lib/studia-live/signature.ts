import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Signatures HMAC-SHA256 des échanges avec Studia Live (autre projet).
 * Secret partagé STUDIA_LINK_SECRET, identique des deux côtés, ≥ 32 car.
 * Aucune clé de service n'est échangée entre les projets.
 */

const DERIVE_MAX_S = 300

export function secretLiaison(): string | null {
  const s = process.env.STUDIA_LINK_SECRET
  return s && s.length >= 32 ? s : null
}

export function signer(secret: string, message: string): string {
  return createHmac('sha256', secret).update(message).digest('hex')
}

function egal(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Appel serveur → serveur : signature de `${timestamp}.${corps}`,
 * horodatage à ± 5 minutes (anti-rejeu). */
export function verifierAppel(
  secret: string,
  corps: string,
  timestamp: string | null,
  signature: string | null
): boolean {
  if (!timestamp || !signature || !/^\d{9,11}$/.test(timestamp)) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > DERIVE_MAX_S) return false
  return egal(signer(secret, `${timestamp}.${corps}`), signature)
}

/** Lien d'accès envoyé par e-mail : signature de `acces.${e}.${x}`,
 * x = expiration (secondes epoch). Renvoie l'e-mail ou null. */
export function verifierLienAcces(
  secret: string,
  e: string | null,
  x: string | null,
  s: string | null
): string | null {
  if (!e || !x || !s || !/^\d{9,11}$/.test(x)) return null
  if (Number(x) < Date.now() / 1000) return null
  if (!egal(signer(secret, `acces.${e}.${x}`), s)) return null
  const email = Buffer.from(e, 'base64url').toString('utf8').trim().toLowerCase()
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 254 ? email : null
}
