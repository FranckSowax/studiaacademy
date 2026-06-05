'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight, Building2 } from 'lucide-react'

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

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false }}
      style={{ background: `linear-gradient(120deg, ${s.couleur}, #1e1147)` }}
    >
      <div className="pointer-events-none absolute -top-24 right-1/4 w-[40vw] h-[40vw] rounded-full bg-white/10 blur-3xl transition-all duration-700" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[540px] pt-24 pb-12 grid lg:grid-cols-2 items-center gap-6">
        {/* Texte */}
        <div className={`text-white ${textRight ? 'lg:order-2' : 'lg:order-1'}`}>
          <div key={`${s.id}-txt`} className="slide-anim max-w-xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
              <Building2 className="w-4 h-4" />Studia Pro · {idx + 1}/{n}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold font-heading leading-tight mb-3">{s.titre}</h1>
            {s.sous_titre && <p className="text-lg md:text-xl text-white/90 font-medium mb-3">{s.sous_titre}</p>}
            {s.texte && <p className="text-white/75 mb-7 max-w-lg">{s.texte}</p>}
            {s.cta_href && (
              <Link href={s.cta_href} className="inline-flex items-center gap-2 bg-white text-gray-900 rounded-2xl px-7 py-4 font-bold hover:bg-white/90 transition-colors">
                {s.cta_label || 'Découvrir'}<ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Visuel (personnage détouré) */}
        <div className={`hidden lg:flex items-end justify-center h-full ${textRight ? 'lg:order-1' : 'lg:order-2'}`}>
          {hasImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${s.id}-img`}
              src={s.image_url!}
              alt={s.titre}
              onError={() => setImgOk((m) => ({ ...m, [s.id]: false }))}
              className="slide-img-in max-h-[460px] w-auto object-contain drop-shadow-2xl"
            />
          ) : (
            <div key={`${s.id}-ph`} className="slide-img-in w-72 h-72 rounded-full bg-white/10 flex items-center justify-center">
              <Building2 className="w-24 h-24 text-white/30" />
            </div>
          )}
        </div>
      </div>

      {/* Flèches */}
      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Précédent" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Suivant" className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          {/* Points */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            {slides.map((sl, i) => (
              <button key={sl.id} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === idx ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
