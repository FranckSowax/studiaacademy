import { avertirSiNonConfigure } from '@/lib/studia-live/demarrage'

/** Exécuté une fois au démarrage du serveur Next.js. */
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') avertirSiNonConfigure()
}
