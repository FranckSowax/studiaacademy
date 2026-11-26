/**
 * Vidéo de présentation d'une formation (colonne `formations.intro_video_url`),
 * affichée sur sa fiche publique au-dessus de « À propos de cette formation ».
 *
 * Seules trois sources sont acceptées : YouTube, Vimeo, ou un fichier vidéo
 * direct en https (.mp4 / .webm). Toute autre adresse est refusée : la fiche
 * n'intègre jamais une page tierce arbitraire dans un cadre.
 */

export type VideoIntro =
  /** Lecteur intégré (YouTube, Vimeo) : `src` va dans un <iframe>. */
  | { kind: 'embed'; src: string }
  /** Fichier vidéo direct : `src` va dans un <video>. */
  | { kind: 'fichier'; src: string }

export const INTRO_VIDEO_MAX = 1000

const YOUTUBE_ID = /^[\w-]{6,20}$/
const VIMEO_ID = /^\d{6,12}$/

/**
 * Transforme l'adresse saisie dans l'admin en source lisible, ou null si
 * elle n'est pas prise en charge.
 *
 * @example
 * resoudreVideoIntro('https://youtu.be/abc123XYZ_-')
 * // → { kind: 'embed', src: 'https://www.youtube-nocookie.com/embed/abc123XYZ_-' }
 */
export function resoudreVideoIntro(valeur: string | null | undefined): VideoIntro | null {
  const brut = valeur?.trim()
  if (!brut || brut.length > INTRO_VIDEO_MAX) return null

  let url: URL
  try {
    url = new URL(brut)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null

  const hote = url.hostname.replace(/^www\./, '').replace(/^m\./, '')
  const segments = url.pathname.split('/').filter(Boolean)

  if (hote === 'youtu.be') return youtube(segments[0])
  if (hote === 'youtube.com' || hote === 'youtube-nocookie.com') {
    if (segments[0] === 'watch') return youtube(url.searchParams.get('v'))
    if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live') return youtube(segments[1])
    return null
  }
  if (hote === 'vimeo.com') return vimeo(segments[0])
  if (hote === 'player.vimeo.com') return segments[0] === 'video' ? vimeo(segments[1]) : null

  if (/\.(mp4|webm)$/i.test(url.pathname)) return { kind: 'fichier', src: url.toString() }
  return null
}

const STOCKAGE_VIDEOS = '/storage/v1/object/public/formation-videos/'
const EXTENSION_VIDEO = /\.(mp4|webm)$/i

/**
 * Adresse de la vignette d'une vidéo téléversée depuis l'admin : la capture
 * est déposée à côté du fichier, même chemin avec l'extension .jpg.
 * Null pour toute vidéo hébergée ailleurs (pas de capture disponible).
 *
 * @example
 * vignetteVideoIntro('https://x.supabase.co/storage/v1/object/public/formation-videos/42/intro-1.mp4')
 * // → 'https://x.supabase.co/storage/v1/object/public/formation-videos/42/intro-1.jpg'
 */
export function vignetteVideoIntro(src: string): string | null {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !url.pathname.includes(STOCKAGE_VIDEOS) || !EXTENSION_VIDEO.test(url.pathname)) {
    return null
  }
  url.pathname = url.pathname.replace(EXTENSION_VIDEO, '.jpg')
  url.search = ''
  url.hash = ''
  return url.toString()
}

function youtube(id: string | null | undefined): VideoIntro | null {
  return id && YOUTUBE_ID.test(id)
    ? { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` }
    : null
}

function vimeo(id: string | null | undefined): VideoIntro | null {
  return id && VIMEO_ID.test(id) ? { kind: 'embed', src: `https://player.vimeo.com/video/${id}` } : null
}
