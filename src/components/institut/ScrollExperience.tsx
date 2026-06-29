'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  Sparkles, Eye, GraduationCap, Users, LayoutDashboard,
  Wand2, MessageCircle, Share2, ArrowDown,
} from 'lucide-react'
import { PartnershipForm } from './PartnershipForm'

type Chapter = {
  id: string
  icon: React.ComponentType<{ className?: string }>
  kicker: string
  title: string
  body: string
  companion: string // ce que fait Aïcha (fil conducteur)
  tint: string // couleur d'ambiance (golden hour -> nuit)
  promptLabel: string // placeholder du clip Seedance à venir
  scrub?: boolean // chapitre signature (video pilotée au scroll)
}

const chapters: Chapter[] = [
  {
    id: 'ouverture', icon: Sparkles,
    kicker: 'Studia × Institut Français',
    title: "Allumer l'IA pour la francophonie",
    body: "Libreville, à l'aube. Suivez Aïcha, médiatrice culturelle à l'Institut Français.",
    companion: "Aïcha arrive à l'Institut Français",
    tint: '#2a1a0e', promptLabel: 'Ch.0 — Push-in aérien sur l’IF Libreville, golden hour',
  },
  {
    id: 'constat', icon: Eye,
    kicker: 'Le monde change',
    title: "La culture et l'éducation entrent dans l'ère de l'IA",
    body: "Ses publics — étudiants, expatriés, curieux — attendent de nouveaux outils. Aïcha le sent.",
    companion: 'Aïcha observe sa communauté',
    tint: '#33240f', promptLabel: 'Ch.1 — Slow orbit, cour de l’IF, affiches d’événements',
  },
  {
    id: 'staff', icon: GraduationCap,
    kicker: 'Pilier 1 · Le staff',
    title: "Former d'abord ceux qui transmettent",
    body: "Studia forme les équipes de l'Institut : IA au quotidien, contenus pédagogiques, automatisation. Aïcha apprend.",
    companion: "Aïcha se forme à l'IA",
    tint: '#3a1f3a', promptLabel: 'Ch.2 — Dolly-in salle de formation, écrans qui s’allument',
  },
  {
    id: 'communaute', icon: Users,
    kicker: 'Pilier 2 · La communauté',
    title: "Ouvrir l'IA à toute la communauté",
    body: "Initiation grand public, IA pour les candidats aux universités chinoises, pour entrepreneurs et expatriés. Aïcha transmet à son tour.",
    companion: 'Aïcha forme la communauté',
    tint: '#2a1f4d', promptLabel: 'Ch.3 — Crane up + travelling, atelier communautaire',
  },
  {
    id: 'plateforme', icon: LayoutDashboard,
    kicker: 'Pilier 3 · La plateforme',
    title: 'Une plateforme Studia pour tout piloter',
    body: "Conçue pour l'Institut : un seul endroit pour créer, diffuser et publier.",
    companion: 'Aïcha ouvre la plateforme Studia',
    tint: '#1b1f4d', promptLabel: 'Ch.4 — Locked-off, l’interface se construit en lévitation', scrub: true,
  },
  {
    id: 'creer', icon: Wand2,
    kicker: 'La plateforme · Créer',
    title: 'Contenus image & vidéo, avec vos prompts Institut',
    body: "Aïcha tape un « prompt Institut » : visuels et vidéos d'événements naissent en secondes, à votre charte.",
    companion: 'Aïcha génère un visuel d’événement',
    tint: '#141b46', promptLabel: 'Ch.5 — Push-in écran, images/vidéos qui éclosent',
  },
  {
    id: 'diffuser', icon: MessageCircle,
    kicker: 'La plateforme · Diffuser',
    title: 'Campagnes WhatsApp en un clic',
    body: "Invitations, rappels, relances : la communauté de l'Institut reçoit l'info là où elle est.",
    companion: 'Aïcha lance une campagne WhatsApp',
    tint: '#0f2a2a', promptLabel: 'Ch.6 — Dolly-out, bulles WhatsApp qui s’envolent sur la ville',
  },
  {
    id: 'rayonner', icon: Share2,
    kicker: 'La plateforme · Publier',
    title: 'Publié partout, depuis un seul endroit',
    body: "Instagram, Facebook, TikTok, LinkedIn — programmez et publiez sur tous vos réseaux. Libreville s'illumine.",
    companion: 'Aïcha publie sur tous les réseaux',
    tint: '#0b1230', promptLabel: 'Ch.7 — Crane up vers la skyline, écrans qui s’allument',
  },
]

export function ScrollExperience() {
  const rootRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const scrubVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState(0)

  // ── Particules (braises flottantes) ─────────────────────────────
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)
    const N = 46
    const parts = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 2 + 0.6,
      vy: Math.random() * 0.0006 + 0.0002, vx: (Math.random() - 0.5) * 0.0003,
      a: Math.random() * 0.5 + 0.2,
    }))
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of parts) {
        p.y -= p.vy; p.x += p.vx
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random() }
        ctx.beginPath()
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r * dpr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(233,126,66,${p.a})`
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  // ── Lenis + GSAP ScrollTrigger ──────────────────────────────────
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => { lenis.raf(time * 1000); }
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('.chapter')
      sections.forEach((section, i) => {
        const card = section.querySelector('.chapter-card')
        const media = section.querySelector('.chapter-media')

        // reveal du texte
        if (card) {
          gsap.fromTo(card, { autoAlpha: 0, y: 60 }, {
            autoAlpha: 1, y: 0, ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 65%', end: 'top 25%', scrub: true },
          })
        }
        // léger zoom du média
        if (media) {
          gsap.fromTo(media, { scale: 1.12 }, {
            scale: 1, ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
          })
        }
        // ambiance + compagnon à l'entrée
        ScrollTrigger.create({
          trigger: section, start: 'top 55%', end: 'bottom 45%',
          onToggle: (self) => {
            if (self.isActive) {
              setActive(i)
              if (bgRef.current) gsap.to(bgRef.current, { backgroundColor: chapters[i].tint, duration: 1.1 })
            }
          },
        })
      })

      // chapitre signature : vidéo pilotée au scroll
      const scrubSection = document.querySelector<HTMLElement>('.chapter-scrub')
      const v = scrubVideoRef.current
      if (scrubSection && v) {
        const onLoaded = () => {
          ScrollTrigger.create({
            trigger: scrubSection, start: 'top top', end: 'bottom bottom', scrub: true,
            onUpdate: (self) => {
              if (v.duration) v.currentTime = self.progress * (v.duration - 0.05)
            },
          })
          ScrollTrigger.refresh()
        }
        if (v.readyState >= 1) onLoaded()
        else v.addEventListener('loadedmetadata', onLoaded, { once: true })
      }
    }, rootRef)

    return () => {
      ctx.revert()
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  const CompanionIcon = chapters[active].icon

  return (
    <div ref={rootRef} className="relative bg-[#0b0a09] text-white">
      {/* Fond d'ambiance (teinte évolutive golden hour → nuit) */}
      <div ref={bgRef} className="fixed inset-0 -z-10 transition-colors" style={{ backgroundColor: chapters[0].tint }} />
      {/* Texture vidéo de fond (placeholder — remplacé par les clips Seedance) */}
      <video
        className="fixed inset-0 -z-10 h-full w-full object-cover opacity-25 mix-blend-screen"
        autoPlay loop muted playsInline poster="/hero-studia-poster.jpg" aria-hidden
      >
        <source src="/hero-studia.mp4" type="video/mp4" />
      </video>

      {/* Effets cinématiques globaux */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-0" aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.7)_100%)]" aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.06] mix-blend-overlay" aria-hidden
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Compagnon — fil conducteur Aïcha (persistant) */}
      <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 md:left-6 md:translate-x-0">
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#e97e42] to-[#7C3AED] text-sm font-bold">Aï</span>
          <div className="pr-2">
            <p className="text-[10px] uppercase tracking-wide text-white/50">Aïcha · Institut Français</p>
            <p className="flex items-center gap-1.5 text-xs font-medium text-white">
              <CompanionIcon className="h-3.5 w-3.5 text-[#f3a268]" />
              {chapters[active].companion}
            </p>
          </div>
        </div>
      </div>

      {/* En-tête co-brandé */}
      <div className="fixed top-20 left-1/2 z-30 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 backdrop-blur-md">
          <Image src="/logo.png" alt="Studia" width={22} height={22} className="h-5 w-5 object-contain" />
          <span className="text-xs text-white/40">×</span>
          <span className="rounded bg-white px-1.5 py-0.5">
            <Image src="/institut-francais-logo-vector.png" alt="Institut Français" width={54} height={20} className="h-4 w-auto object-contain" />
          </span>
        </div>
      </div>

      {/* ── Chapitres ─────────────────────────────────────────────── */}
      {chapters.map((ch, i) => {
        const Icon = ch.icon
        return (
          <section
            key={ch.id}
            className={`chapter ${ch.scrub ? 'chapter-scrub' : ''} relative ${ch.scrub ? 'h-[280vh]' : 'h-[170vh]'}`}
          >
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
              {/* Média du chapitre */}
              <div className="chapter-media absolute inset-0">
                {ch.scrub ? (
                  <video ref={scrubVideoRef} className="h-full w-full object-cover opacity-50"
                    muted playsInline preload="auto" poster="/hero-studia-poster.jpg">
                    <source src="/hero-studia.mp4" type="video/mp4" />
                  </video>
                ) : (
                  <div className="h-full w-full" style={{ background: `radial-gradient(60% 60% at 70% 40%, ${ch.tint}cc, transparent)` }} />
                )}
              </div>

              {/* Carte texte (glass) */}
              <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
                <div className="chapter-card max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md md:p-10">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-[#f3a268]">
                    <Icon className="h-3.5 w-3.5" /> {ch.kicker}
                  </div>
                  <h2 className="mb-4 font-heading text-3xl font-extrabold leading-tight md:text-5xl">
                    {ch.title}
                  </h2>
                  <p className="text-lg text-white/75 md:text-xl">{ch.body}</p>

                  {/* Étiquette placeholder du clip Seedance */}
                  <p className="mt-6 inline-flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-[11px] text-white/40">
                    🎬 Placeholder · {ch.promptLabel}
                  </p>
                </div>
              </div>

              {/* Indicateur de scroll (chapitre 0) */}
              {i === 0 && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-bounce text-white/50 md:left-auto md:right-10 md:translate-x-0">
                  <ArrowDown className="h-6 w-6" />
                </div>
              )}
            </div>
          </section>
        )
      })}

      {/* ── Chapitre final · CTA + formulaire ─────────────────────── */}
      <section className="relative min-h-screen overflow-hidden py-24">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 70% at 50% 30%, rgba(124,58,237,0.25), transparent)' }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-center justify-center gap-4">
            <Image src="/logo.png" alt="Studia Academy" width={48} height={48} className="h-12 w-12 rounded-xl bg-white p-1.5 object-contain" />
            <span className="text-2xl font-light text-white/40">×</span>
            <span className="rounded-xl bg-white px-3 py-2">
              <Image src="/institut-francais-logo-vector.png" alt="Institut Français" width={120} height={44} className="h-9 w-auto object-contain" />
            </span>
          </div>
          <PartnershipForm />
        </div>
      </section>
    </div>
  )
}
