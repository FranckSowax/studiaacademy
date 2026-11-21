import { secretLiaison, signer } from './signature'

/**
 * Lancement d'une formation sur Studia Live : Academy demande, de
 * serveur à serveur, un ticket d'entrée à usage unique pour l'élève,
 * puis le redirige vers l'adresse reçue.
 *
 * Le ticket expire vite et ne sert qu'une fois : il n'est jamais mis en
 * cache, journalisé ni stocké. L'e-mail et le prénom ne voyagent que
 * dans le corps de l'appel signé, jamais dans une adresse.
 */

export const LIVE_CODE_FORMAT = /^[a-z0-9-]{2,60}$/

const DELAI_MAX_MS = 10_000

export interface ConfigLancement {
  url: string
  secret: string
}

/** Adresse de Studia Live (STUDIA_LIVE_URL, sans « / » final) ou null. */
export function urlStudiaLive(): string | null {
  const brut = process.env.STUDIA_LIVE_URL?.trim().replace(/\/+$/, '')
  if (!brut) return null
  try {
    const u = new URL(brut)
    return u.protocol === 'https:' || u.protocol === 'http:' ? brut : null
  } catch {
    return null
  }
}

/** Configuration complète, ou null : sans STUDIA_LIVE_URL ou sans
 * STUDIA_LINK_SECRET, toutes les formations gardent le lecteur Academy. */
export function configLancement(): ConfigLancement | null {
  const url = urlStudiaLive()
  const secret = secretLiaison()
  return url && secret ? { url, secret } : null
}

/** Code Studia Live d'une formation, seulement si le lancement est
 * configuré ; null → lecteur Academy. */
export function codeLiveActif(formation: { live_code?: string | null }): string | null {
  const code = formation.live_code
  if (!code || !LIVE_CODE_FORMAT.test(code)) return null
  return configLancement() ? code : null
}

export interface DemandeTicket {
  email: string
  prenom: string
  academyUserId: string
  formationCode: string
}

/** L'adresse d'entrée renvoyée doit être chez Studia Live (même origine
 * que STUDIA_LIVE_URL) : on ne redirige jamais l'élève ailleurs. */
function adresseEntree(config: ConfigLancement, valeur: unknown): string | null {
  if (typeof valeur !== 'string' || valeur.length > 2000) return null
  try {
    return new URL(valeur).origin === new URL(config.url).origin ? valeur : null
  } catch {
    return null
  }
}

/**
 * POST {STUDIA_LIVE_URL}/api/integrations/studia-academy/ticket, signé
 * HMAC comme les appels entrants (/link, /progression) : signature de
 * `${timestamp}.${corps}` sur le corps exact envoyé. Renvoie l'adresse
 * d'entrée, ou null si Studia Live ne répond pas 200 en 10 secondes.
 */
export async function demanderTicket(
  config: ConfigLancement,
  demande: DemandeTicket
): Promise<string | null> {
  const corps = JSON.stringify({
    email: demande.email.trim().toLowerCase(),
    prenom: demande.prenom,
    academy_user_id: demande.academyUserId,
    formation_code: demande.formationCode,
  })
  const timestamp = String(Math.floor(Date.now() / 1000))

  try {
    const reponse = await fetch(`${config.url}/api/integrations/studia-academy/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Studia-Timestamp': timestamp,
        'X-Studia-Signature': signer(config.secret, `${timestamp}.${corps}`),
      },
      body: corps,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(DELAI_MAX_MS),
    })
    if (reponse.status !== 200) {
      // Statut seul : ni corps, ni adresse, ni identité de l'élève.
      console.error(`[studia-live] ticket refusé (HTTP ${reponse.status})`)
      return null
    }
    const donnees = (await reponse.json()) as { url?: unknown }
    const entree = adresseEntree(config, donnees?.url)
    if (!entree) console.error('[studia-live] ticket : réponse sans adresse d’entrée valide')
    return entree
  } catch (e) {
    const delai = e instanceof Error && e.name === 'TimeoutError'
    console.error(`[studia-live] ticket : ${delai ? 'délai de 10 s dépassé' : 'appel impossible'}`)
    return null
  }
}
