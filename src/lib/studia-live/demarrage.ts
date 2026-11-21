/**
 * Avertissement au démarrage si le lancement vers Studia Live n'est pas
 * configuré. WHY: fichier sans dépendance (pas de node:crypto) : il est
 * chargé par src/instrumentation.ts, compilé aussi pour le runtime edge.
 * Mêmes règles que urlStudiaLive() et secretLiaison().
 */
export function avertirSiNonConfigure(): void {
  const url = process.env.STUDIA_LIVE_URL?.trim()
  const secret = process.env.STUDIA_LINK_SECRET
  const manquantes = [
    url && /^https?:\/\/\S+$/.test(url) ? null : 'STUDIA_LIVE_URL',
    secret && secret.length >= 32 ? null : 'STUDIA_LINK_SECRET',
  ].filter(Boolean)
  if (manquantes.length > 0) {
    console.warn(
      `[studia-live] ${manquantes.join(' et ')} absente(s) ou invalide(s) : ` +
        'toutes les formations gardent le lecteur Academy.'
    )
  }
}
