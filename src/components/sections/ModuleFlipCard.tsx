'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  GraduationCap,
  BarChart2,
  Mic,
  BookOpen,
  Building2,
  Users,
  Laptop,
  Heart,
  Sparkles,
} from 'lucide-react'
import type { Module } from '@/lib/modules'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  GraduationCap,
  BarChart2,
  Mic,
  BookOpen,
  Building2,
  Users,
  Laptop,
  Heart,
  Sparkles,
}

interface ModuleFlipCardProps {
  module: Module
}

export function ModuleFlipCard({ module }: ModuleFlipCardProps) {
  const Icon = iconMap[module.iconName] ?? Sparkles
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="relative aspect-square w-full cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)}
      onBlur={() => setFlipped(false)}
      /* Support tactile mobile */
      onClick={() => setFlipped((v) => !v)}
      role="article"
      tabIndex={0}
      aria-label={`Module ${module.titre} — ${module.slogan}`}
    >
      <div
        className="relative w-full h-full transition-transform ease-in-out"
        style={{
          transformStyle: 'preserve-3d',
          transitionDuration: '650ms',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ── FACE AVANT ────────────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-md"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Image de couverture */}
          {module.coverImage ? (
            <Image
              src={module.coverImage}
              alt={module.titre}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={false}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${module.couleur}30, ${module.couleur}10)`,
              }}
            />
          )}

          {/* Barre couleur top */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: module.couleur }}
          />

          {/* Icône module (repère visuel, pas de texte) */}
          <div
            className="absolute top-4 left-4 w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: `${module.couleur}40`, border: `1px solid ${module.couleur}60` }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* ── FACE ARRIÈRE ──────────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Image de fond */}
          {module.backImage ? (
            <Image
              src={module.backImage}
              alt={`${module.titre} — verso`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: module.couleur }} />
          )}

          {/* Overlay couleur du module */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `${module.couleur}e5` }}
          />

          {/* Texture subtile */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px),
                                radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Contenu face arrière */}
          <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
            {/* Haut : icône + sous-titre */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-white/80">{module.sousTitre}</p>
            </div>

            {/* Milieu : slogan en grand */}
            <div className="flex-1 flex items-center justify-center px-2 py-2 min-h-0">
              <blockquote className="text-center">
                <span className="text-4xl text-white/30 font-serif leading-none">"</span>
                <p className="text-xl font-extrabold font-heading leading-tight text-white -mt-2">
                  {module.slogan}
                </p>
                <span className="text-4xl text-white/30 font-serif leading-none block -mt-2">"</span>
              </blockquote>
            </div>

            {/* Bas : description courte + CTA */}
            <div className="space-y-3">
              <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
                {module.description.slice(0, 90)}…
              </p>

              <Link
                href={`/modules/${module.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-3 transition-all group/cta"
              >
                <span className="font-bold text-sm text-white">{module.cta}</span>
                <ArrowRight className="w-4 h-4 text-white group-hover/cta:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
