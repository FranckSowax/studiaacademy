'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { HomeSlide } from '@/lib/home/slides'

const SLIDE_DURATION_MS = 6500
const SWIPE_THRESHOLD_PX = 48

function Cta({ href, label }: { href: string; label: string }) {
  const className =
    'group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#e97e42] to-[#d56a2e] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#e97e42]/30 transition-shadow hover:shadow-xl hover:shadow-[#e97e42]/40 sm:px-8 sm:py-4 sm:text-base'
  const content = (
    <>
      {label}
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
    </>
  )
  return href.startsWith('/') ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  )
}

/**
 * Hero de la page d'accueil : carrousel plein écran géré depuis /admin/accueil.
 * Défilement automatique toutes les 6,5 s, en pause au survol et au focus clavier ;
 * la barre de progression n'est qu'un témoin visuel du minuteur.
 */
export function HomeHeroSlider({ slides }: { slides: HomeSlide[] }) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const touchX = useRef<number | null>(null)
  const n = slides.length

  const go = useCallback((d: number) => setIdx((i) => (i + d + n) % n), [n])

  // Défilement automatique : relancé à chaque changement de slide et à chaque reprise après pause.
  useEffect(() => {
    if (n < 2 || paused) return
    const timer = setTimeout(() => go(1), SLIDE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [idx, paused, n, go])

  if (n === 0) return null
  const current = slides[Math.min(idx, n - 1)]

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="À la une"
      className="relative w-full overflow-hidden bg-[#0f0d0b] pt-16 lg:pt-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null || n < 2) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > SWIPE_THRESHOLD_PX) go(dx < 0 ? 1 : -1)
      }}
    >
      {/* WHY: les visuels sont en paysage (16:9). Sur mobile et tablette, un fond plein écran
          n'en montrerait qu'un tiers (la personne, placée à droite, disparaissait) : l'image
          s'affiche donc entière en haut, le texte dessous. Sur ordinateur, elle redevient un
          fond, et la hauteur du hero suit le 16:9 pour limiter le recadrage. */}
      <div className="relative aspect-video w-full lg:absolute lg:inset-0 lg:aspect-auto">
      {/* Images empilées, fondu enchaîné */}
      {slides.map((s, i) => {
        const active = i === idx
        const hasImg = !!s.image_url && !broken[s.id]
        return (
          <div
            key={s.id}
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${active ? 'opacity-100' : 'opacity-0'}`}
          >
            {hasImg ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL libre saisie dans l'admin (hôte non connu de next/image)
              <img
                src={s.image_url!}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                onError={() => setBroken((m) => ({ ...m, [s.id]: true }))}
                className={`h-full w-full object-cover object-[50%_30%] motion-safe:transition-transform motion-safe:duration-[8000ms] motion-safe:ease-out ${
                  active ? 'scale-100' : 'scale-110'
                }`}
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(ellipse_at_75%_30%,#7a3a14_0%,#2a1a10_45%,#0f0d0b_80%)]" />
            )}
          </div>
        )
      })}

      {/* Mobile : l'image se fond dans le bas de la section, sous le texte */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0f0d0b] to-transparent lg:hidden" />
      {/* Ordinateur : étalonnage pour la lisibilité du texte posé sur l'image */}
      <div className="absolute inset-0 hidden bg-gradient-to-r from-[#0f0d0b]/90 via-[#0f0d0b]/60 to-[#0f0d0b]/10 lg:block" />
      <div className="absolute inset-0 hidden bg-gradient-to-t from-[#0f0d0b] via-transparent to-[#0f0d0b]/50 lg:block" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-center px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:min-h-[max(640px,min(56.25vw,90vh))] lg:px-8 lg:pb-52 lg:pt-36">
        {/* Texte du slide actif */}
        <div key={current.id} aria-live="polite" className="max-w-2xl">
          {n > 1 && (
            <p className="animate-fade-up mb-5 flex items-center gap-3 font-heading text-sm font-bold tracking-[0.2em] text-[#f3a268]">
              <span>{String(idx + 1).padStart(2, '0')}</span>
              <span className="h-px w-10 bg-[#f3a268]/60" />
              <span className="text-white/50">{String(n).padStart(2, '0')}</span>
            </p>
          )}
          <h1 className="animate-fade-up animate-fade-up-delay-1 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.45)] sm:text-5xl lg:text-[4.2rem]">
            {current.titre}
          </h1>
          {current.sous_titre && (
            <p className="animate-fade-up animate-fade-up-delay-2 mt-4 font-heading text-xl font-bold text-[#f8b98a] sm:text-2xl">
              {current.sous_titre}
            </p>
          )}
          {current.texte && (
            <p className="animate-fade-up animate-fade-up-delay-3 mt-4 max-w-xl text-base leading-relaxed text-gray-200 sm:text-lg">
              {current.texte}
            </p>
          )}
          {current.cta_href && (
            <div className="animate-fade-up animate-fade-up-delay-4 mt-8">
              <Cta href={current.cta_href} label={current.cta_label || 'Découvrir'} />
            </div>
          )}
        </div>

        {/* Navigation : barres de progression + flèches */}
        {n > 1 && (
          <div className="mt-8 flex items-center gap-4 lg:absolute lg:inset-x-8 lg:bottom-40 lg:mt-0">
            <div className="flex flex-1 items-center gap-2 sm:max-w-md">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Afficher le slide ${i + 1} : ${s.titre}`}
                  aria-current={i === idx}
                  className="group flex h-6 flex-1 items-center"
                >
                  <span className="relative block h-1 w-full overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/40">
                    {i < idx && <span className="absolute inset-0 bg-white/80" />}
                    {i === idx && (
                      <span
                        className={`absolute inset-0 origin-left bg-[#e97e42] ${paused ? 'opacity-60' : 'hero-slide-progress'}`}
                        style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Slide précédent"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-gray-900"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Slide suivant"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-gray-900"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
