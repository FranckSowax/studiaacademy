import { resoudreVideoIntro, vignetteVideoIntro } from '@/lib/formations/intro-video'

/**
 * Vidéo de présentation d'une formation, sur sa fiche publique.
 * Ne rend rien si l'adresse est vide ou non prise en charge.
 * À l'arrêt, un fichier vidéo affiche une image tirée de la vidéo elle-même :
 * la capture faite à l'envoi depuis l'admin, sinon une image du début.
 *
 * @example
 * <FormationIntroVideo url={formation.intro_video_url} titre={formation.titre} />
 */
export function FormationIntroVideo({ url, titre }: { url: string | null | undefined; titre: string }) {
  const video = resoudreVideoIntro(url)
  if (!video) return null

  return (
    <div>
      <h2 className="text-xl font-bold font-heading text-gray-900 mb-3">La formation en vidéo</h2>
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#f0ebe3] bg-black shadow-lg">
        {video.kind === 'embed' ? (
          <iframe
            src={video.src}
            title={`Vidéo de présentation — ${titre}`}
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video
            // WHY: « #t » fait afficher une image de la vidéo à l'arrêt (au lieu d'un
            // écran noir, notamment sur iPhone) quand aucune capture n'est disponible.
            src={video.src.includes('#') ? video.src : `${video.src}#t=0.1`}
            poster={vignetteVideoIntro(video.src) ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full"
            aria-label={`Vidéo de présentation — ${titre}`}
          />
        )}
      </div>
    </div>
  )
}
