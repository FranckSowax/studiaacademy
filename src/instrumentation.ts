/** Exécuté une fois au démarrage du serveur Next.js. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { avertirSiNonConfigure } = await import('@/lib/studia-live/lancement')
  avertirSiNonConfigure()
}
