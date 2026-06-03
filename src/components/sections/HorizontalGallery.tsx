'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Galerie défilante horizontale avec flèches de navigation.
 * Les enfants doivent avoir une largeur fixe + `flex-shrink-0`.
 */
export function HorizontalGallery({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    update()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 600), behavior: 'smooth' })
  }

  return (
    <div className="relative group/gallery">
      {/* Flèche gauche */}
      <button
        onClick={() => scrollBy(-1)}
        aria-label="Précédent"
        className={`hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-[#f0ebe3] items-center justify-center text-gray-600 hover:text-[#e97e42] hover:border-[#e97e42] transition-all ${
          canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Piste défilante */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-1 scrollbar-hide snap-x snap-mandatory scroll-pl-4"
      >
        {children}
      </div>

      {/* Flèche droite */}
      <button
        onClick={() => scrollBy(1)}
        aria-label="Suivant"
        className={`hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-[#f0ebe3] items-center justify-center text-gray-600 hover:text-[#e97e42] hover:border-[#e97e42] transition-all ${
          canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
