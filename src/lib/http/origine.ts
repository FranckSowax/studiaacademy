/**
 * Adresse publique du site, pour bâtir une redirection depuis une route
 * serveur (Route Handler).
 *
 * Derrière le proxy de Railway, `new URL(request.url).origin` vaut
 * l'adresse interne du conteneur (https://localhost:8080) : une
 * redirection bâtie dessus envoie le visiteur sur sa propre machine
 * (« localhost a refusé de se connecter »). On prend donc, dans l'ordre :
 *   1. NEXT_PUBLIC_SITE_URL si elle est configurée ;
 *   2. l'hôte public annoncé par le proxy (x-forwarded-host / -proto) ;
 *   3. l'origine brute de la requête (développement local).
 */
export function originePublique(request: Request): string {
  const configuree = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
  if (configuree && /^https?:\/\/[^/\s]+$/.test(configuree)) return configuree

  const hote = request.headers.get('x-forwarded-host')?.split(',')[0].trim()
  if (hote && /^[a-z0-9.-]+(:\d+)?$/i.test(hote)) {
    const proto =
      request.headers.get('x-forwarded-proto')?.split(',')[0].trim() === 'http' ? 'http' : 'https'
    return `${proto}://${hote}`
  }

  return new URL(request.url).origin
}

/** Chemin de retour sûr : relatif au site, jamais une autre origine. */
export function cheminInterne(brut: string | null | undefined, defaut = '/'): string {
  return brut && brut.startsWith('/') && !brut.startsWith('//') ? brut : defaut
}
