'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'

const SOURCE = '/studia-live/concept.mp4'
const AFFICHE = '/studia-live/concept-poster.jpg'

const BOUTON =
  'flex h-11 w-11 items-center justify-center rounded-full bg-[#141828]/80 text-white backdrop-blur-sm transition-colors hover:bg-[#e97e42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e97e42]'

/**
 * Vidéo verticale (9:16) qui présente Studia Live.
 *
 * Elle ne se charge et ne se lit que lorsqu'elle est à l'écran (économie de
 * données sur mobile), s'arrête quand on la quitte, et ne démarre pas seule si
 * l'utilisateur préfère réduire les animations. Elle démarre sans le son (seule
 * lecture automatique permise par les navigateurs) : un bouton l'active, et la
 * vidéo reprend alors du début pour que la voix off soit entendue en entier.
 *
 * @example
 * <StudiaLiveVideo />
 */
export function StudiaLiveVideo() {
  const video = useRef<HTMLVideoElement>(null)
  const [enLecture, setEnLecture] = useState(false)
  const [sonActif, setSonActif] = useState(false)
  // WHY: une pause demandée par l'utilisateur doit primer sur la lecture automatique au défilement.
  const pauseVoulue = useRef(false)

  useEffect(() => {
    const el = video.current
    if (!el) return
    const reduire = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduire) pauseVoulue.current = true

    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting && !pauseVoulue.current) {
          // WHY: avec le son, un navigateur peut refuser la reprise automatique : on retente en muet.
          el.play().catch(() => {
            el.muted = true
            setSonActif(false)
            el.play().catch(() => setEnLecture(false))
          })
        } else if (!entree.isIntersecting) {
          el.pause()
        }
      },
      { threshold: 0.35 }
    )
    observateur.observe(el)
    return () => observateur.disconnect()
  }, [])

  const basculer = () => {
    const el = video.current
    if (!el) return
    if (el.paused) {
      pauseVoulue.current = false
      el.play().catch(() => setEnLecture(false))
    } else {
      pauseVoulue.current = true
      el.pause()
    }
  }

  const basculerSon = () => {
    const el = video.current
    if (!el) return
    if (el.muted) {
      el.muted = false
      el.currentTime = 0
      pauseVoulue.current = false
      setSonActif(true)
      el.play().catch(() => setEnLecture(false))
    } else {
      el.muted = true
      setSonActif(false)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* Cadre de téléphone */}
      <div className="rounded-[2.6rem] bg-[#141828] p-2.5 shadow-[0_40px_80px_-30px_rgba(15,13,11,0.6)] ring-1 ring-black/10">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[2.1rem] bg-[#fbf8f3]">
          <video
            ref={video}
            src={SOURCE}
            poster={AFFICHE}
            muted
            loop
            playsInline
            preload="none"
            onPlay={() => setEnLecture(true)}
            onPause={() => setEnLecture(false)}
            aria-label="Vidéo : le concept Studia Live, en salle et en ligne"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={basculerSon}
        aria-pressed={sonActif}
        aria-label={sonActif ? 'Couper le son de la vidéo' : 'Activer le son de la vidéo'}
        className={
          sonActif
            ? `${BOUTON} absolute bottom-6 left-6`
            : 'absolute bottom-6 left-6 flex h-11 items-center gap-2 rounded-full bg-[#e97e42] pl-3 pr-4 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#d56a2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141828]'
        }
      >
        {sonActif ? (
          <Volume2 className="h-5 w-5" />
        ) : (
          <>
            <VolumeX className="h-5 w-5" />
            Activer le son
          </>
        )}
      </button>

      <button
        type="button"
        onClick={basculer}
        aria-label={enLecture ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}
        className={`${BOUTON} absolute bottom-6 right-6`}
      >
        {enLecture ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
      </button>
    </div>
  )
}
