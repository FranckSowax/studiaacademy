import { canAccessAdmin, type StaffRole } from '@/lib/collaborators/roles'
import { signer } from './signature'
import type { ConfigLancement } from './lancement'

/**
 * Entrée des formateurs sur Studia Live : Academy demande, de serveur à
 * serveur, un ticket à usage unique pour le compte connecté, puis le
 * navigateur y est redirigé.
 *
 * WHY: quiconque obtient un ticket pour un e-mail devient ce formateur
 * dans Studia Live. L'e-mail vient donc toujours du compte connecté,
 * jamais du navigateur, et seul un rôle attribué par un administrateur
 * ouvre ce droit.
 */

const DELAI_MAX_MS = 10_000

/**
 * Qui peut ouvrir Studia Live comme formateur.
 * WHY: le « mode professeur » d'Academy (table teacher_profiles) est en
 * libre-service — tout compte, élève compris, peut l'activer lui-même.
 * Il ne prouve donc rien et n'ouvre PAS ce droit. Seul le rôle d'équipe
 * effectif (public.current_staff_role : admin ou super admin, fiche
 * collaborateur désactivée = accès coupé) est accepté.
 */
export function peutEntrerCommeFormateur(role: StaffRole | null): boolean {
  return canAccessAdmin(role)
}

export type EchecTicketFormateur =
  | 'signature' // 401 : secret différent ou horloge décalée
  | 'corps' // 400 : e-mail ou prénom refusé
  | 'indisponible' // 503, autre statut, réseau
  | 'delai' // pas de réponse en 10 s
  | 'reponse' // 200 sans adresse d'entrée valide

export type ResultatTicketFormateur = { ok: true; url: string } | { ok: false; echec: EchecTicketFormateur }

/** Messages affichés au formateur : jamais l'erreur brute de Studia Live. */
export const MESSAGES_ECHEC: Record<EchecTicketFormateur, string> = {
  signature:
    "La liaison avec Studia Live est mal configurée. Prévenez un administrateur : ce n'est pas un problème de votre compte.",
  corps:
    "Studia Live n'a pas accepté les informations de votre compte (adresse e-mail ou prénom). Vérifiez votre profil, puis réessayez.",
  indisponible: 'Studia Live est momentanément indisponible. Réessayez dans quelques instants.',
  delai: "Studia Live n'a pas répondu à temps. Réessayez dans quelques instants.",
  reponse: 'Studia Live a renvoyé une réponse inattendue. Réessayez, puis prévenez un administrateur si cela persiste.',
}

/**
 * POST {STUDIA_LIVE_URL}/api/integrations/studia-academy/formateur/ticket,
 * signé comme la demande de ticket des élèves : HMAC-SHA256 de
 * `${timestamp}.${corps}` sur le corps exact envoyé (sérialisé une fois).
 * L'adresse reçue n'est ni journalisée ni stockée.
 */
export async function demanderTicketFormateur(
  config: ConfigLancement,
  formateur: { email: string; prenom: string }
): Promise<ResultatTicketFormateur> {
  const corps = JSON.stringify({ email: formateur.email.trim().toLowerCase(), prenom: formateur.prenom })
  const timestamp = String(Math.floor(Date.now() / 1000))

  try {
    const reponse = await fetch(`${config.url}/api/integrations/studia-academy/formateur/ticket`, {
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
      // Statut seul : ni corps, ni adresse, ni identité.
      console.error(`[studia-live] ticket formateur refusé (HTTP ${reponse.status})`)
      return { ok: false, echec: reponse.status === 401 ? 'signature' : reponse.status === 400 ? 'corps' : 'indisponible' }
    }
    const donnees = (await reponse.json().catch(() => null)) as { url?: unknown } | null
    const url = donnees?.url
    // L'adresse d'entrée doit être chez Studia Live : jamais de redirection ailleurs.
    if (typeof url === 'string' && url.length <= 2000 && memeOrigine(url, config.url)) {
      return { ok: true, url }
    }
    console.error('[studia-live] ticket formateur : réponse sans adresse d’entrée valide')
    return { ok: false, echec: 'reponse' }
  } catch (e) {
    const delai = e instanceof Error && e.name === 'TimeoutError'
    console.error(`[studia-live] ticket formateur : ${delai ? 'délai de 10 s dépassé' : 'appel impossible'}`)
    return { ok: false, echec: delai ? 'delai' : 'indisponible' }
  }
}

function memeOrigine(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin
  } catch {
    return false
  }
}
