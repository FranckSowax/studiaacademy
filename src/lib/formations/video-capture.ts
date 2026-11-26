/**
 * Capture, dans le navigateur, une image d'un fichier vidéo : elle sert de
 * vignette à la vidéo de présentation tant qu'elle n'est pas lancée.
 * À n'appeler que côté client (utilise <video> et <canvas>).
 */

const INSTANT_CIBLE_S = 1
const LARGEUR_MAX_PX = 1280
const QUALITE_JPEG = 0.82
const DELAI_MAX_MS = 15_000

/**
 * Renvoie une image JPEG prise vers la première seconde de la vidéo
 * (au milieu si elle dure moins de deux secondes), ou null si le
 * navigateur ne sait pas la décoder à temps. Ne lève jamais d'erreur :
 * l'absence de vignette ne doit pas empêcher l'envoi de la vidéo.
 *
 * @example
 * const image = await capturerVignette(fichier)
 * if (image) await supabase.storage.from('formation-videos').upload('…/intro-1.jpg', image)
 */
export function capturerVignette(fichier: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const adresse = URL.createObjectURL(fichier)
    const video = document.createElement('video')
    let termine = false

    const finir = (image: Blob | null) => {
      if (termine) return
      termine = true
      clearTimeout(minuteur)
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(adresse)
      resolve(image)
    }
    const minuteur = setTimeout(() => finir(null), DELAI_MAX_MS)

    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.onerror = () => finir(null)
    video.onloadedmetadata = () => {
      const duree = Number.isFinite(video.duration) ? video.duration : 0
      // WHY: la toute première image est souvent noire (fondu d'ouverture).
      video.currentTime = duree > 0 ? Math.min(INSTANT_CIBLE_S, duree / 2) : 0
    }
    video.onseeked = () => {
      const { videoWidth, videoHeight } = video
      if (!videoWidth || !videoHeight) return finir(null)
      const echelle = Math.min(1, LARGEUR_MAX_PX / videoWidth)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(videoWidth * echelle)
      canvas.height = Math.round(videoHeight * echelle)
      const contexte = canvas.getContext('2d')
      if (!contexte) return finir(null)
      try {
        contexte.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((image) => finir(image), 'image/jpeg', QUALITE_JPEG)
      } catch {
        finir(null)
      }
    }
    video.src = adresse
  })
}
