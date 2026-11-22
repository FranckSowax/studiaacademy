/**
 * Adresse https absolue et durable de la couverture, ou null.
 * WHY: Studia Live garde l'adresse une heure. Une adresse signée de
 * Supabase Storage (/object/sign/…?token=…) expirerait entre-temps :
 * elle est ramenée à son adresse publique (/object/public/…), sans jeton.
 */
export function couverturePublique(valeur: string | null): string | null {
  if (!valeur) return null
  let url: URL
  try {
    url = new URL(valeur.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  const signe = '/storage/v1/object/sign/'
  if (url.pathname.startsWith(signe)) {
    url.pathname = `/storage/v1/object/public/${url.pathname.slice(signe.length)}`
    url.search = ''
  }
  url.hash = ''
  return url.toString()
}
