'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

export interface HeroSlide {
  id: string
  titre: string
  sous_titre: string | null
  texte: string | null
  cta_label: string | null
  cta_href: string | null
  image_url: string | null
  side: string
  couleur: string
}

export function EntrepriseHeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [idx, setIdx] = useState(0)
  const [imgOk, setImgOk] = useState<Record<string, boolean>>({})
  const paused = useRef(false)
  const n = slides.length

  const go = useCallback((d: number) => setIdx((i) => (i + d + n) % n), [n])

  useEffect(() => {
    if (n <= 1) return
    const t = setInterval(() => { if (!paused.current) setIdx((i) => (i + 1) % n) }, 6000)
    return () => clearInterval(t)
  }, [n])

  if (n === 0) return null
  const s = slides[idx]
  const textRight = s.side === 'right'
  const hasImg = !!s.image_url && imgOk[s.id] !== false

  const TextBlock = (
    <div key={`${s.id}-txt`} className="slide-anim max-w-xl">
      <span className="inline-flex items-center gap-2 bg-[#fff1e6] text-[#a84d16] px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
        Studia Pro · {idx + 1}/{n}
      </span>
      <h1 className="text-xl sm:text-3xl md:text-4xl xl:text-5xl font-extrabold font-heading leading-tight mb-1.5 sm:mb-3 text-gray-900">{s.titre}</h1>
      {s.sous_titre && <p className="text-sm sm:text-lg md:text-xl xl:text-2xl text-[#e97e42] font-bold mb-2 sm:mb-3">{s.sous_titre}</p>}
      {s.texte && <p className="text-gray-700 text-sm md:text-base mb-4 sm:mb-6 max-w-lg hidden sm:block">{s.texte}</p>}
      {s.cta_href && (
        <Link href={s.cta_href} className="inline-flex items-center gap-2 bg-[#e97e42] text-white rounded-xl sm:rounded-2xl px-5 sm:px-7 py-3 sm:py-4 text-sm sm:text-base font-bold hover:bg-[#d56a2e] transition-colors shadow-lg shadow-[#e97e42]/25">
          {s.cta_label || 'Découvrir'}<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
      )}
    </div>
  )

  return (
    <section
      className="relative overflow-hidden bg-[#faf8f5]"
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false }}
    >
      {/* Boîte 16:9 bornée en largeur → l'image s'affiche ENTIÈRE, jamais rognée.
          Décalage en haut sur mobile pour ne pas passer sous le header. */}
      <div className="relative mx-auto w-full max-w-[1500px] pt-16 lg:pt-0 lg:aspect-[16/9]">
        {hasImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${s.id}-bg`}
            src={s.image_url!}
            alt={s.titre}
            onError={() => setImgOk((m) => ({ ...m, [s.id]: false }))}
            className="block w-full h-auto lg:absolute lg:inset-0 lg:w-full lg:h-full lg:object-cover"
          />
        ) : (
          <div className="w-full aspect-[16/9] lg:absolute lg:inset-0" style={{ background: `linear-gradient(120deg, ${s.couleur}22, #faf8f5)` }} />
        )}

        {/* Contenu texte : masqué sur mobile (image seule), superposé sur le côté vide en desktop */}
        <div className="hidden lg:block lg:absolute lg:inset-0">
          <div className="max-w-7xl mx-auto lg:h-full px-4 sm:px-6 lg:px-8 py-5 sm:py-7 lg:py-0 grid lg:grid-cols-2 items-center gap-4 lg:gap-6">
            <div className={textRight ? 'lg:order-2' : 'lg:order-1'}>{TextBlock}</div>
            <div className={`hidden lg:block ${textRight ? 'lg:order-1' : 'lg:order-2'}`} />
          </div>
        </div>

        {/* Navigation (alignée sur l'image) */}
        {n > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Précédent" className="absolute left-2 sm:left-3 top-[28%] lg:top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Suivant" className="absolute right-2 sm:right-3 top-[28%] lg:top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 sm:gap-2 max-w-[92vw]">
              {slides.map((sl, i) => (
                <button key={sl.id} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`}
                  className={`h-0.5 rounded-full transition-all flex-shrink-0 ${i === idx ? 'w-6 sm:w-8 bg-[#e97e42]' : 'w-3 sm:w-4 bg-[#e97e42]/35 hover:bg-[#e97e42]/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
