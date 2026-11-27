'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Galerie horizontale à défilement natif (doigt, molette, clavier) avec flèches.
 * Les enfants sont des `<li>` ; chacun s'aimante au bord gauche de la piste.
 */
export function HorizontalGallery({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // WHY: on avance d'environ une « page » visible, pour ne jamais sauter une carte.
  const move = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  const arrow =
    'flex h-11 w-11 items-center justify-center rounded-full border border-[#ece4d8] bg-white text-gray-900 transition-colors hover:bg-[#0f0d0b] hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-gray-900'

  return (
    <div>
      <div className="mx-auto mb-5 hidden max-w-7xl justify-end gap-2 px-4 sm:flex sm:px-6 lg:px-8">
        <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label="Formations précédentes" className={arrow}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label="Formations suivantes" className={arrow}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <ul
        ref={track}
        onScroll={measure}
        aria-label={label}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-6 [scrollbar-width:none] sm:px-6 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e97e42] scroll-px-4 sm:scroll-px-6 lg:scroll-px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
      >
        {children}
      </ul>
    </div>
  )
}
