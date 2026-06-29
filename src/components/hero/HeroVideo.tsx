'use client'

import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { ArrowRight, CheckCircle, Sparkles, GraduationCap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
}

const trustPills = ['500+ certifications', '2000+ étudiants', '94% satisfaction']

export function HeroVideo() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-[#0b0a09]">
      {/* ── Vidéo de fond (autoplay, boucle, muette) ─────────────────── */}
      <motion.video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/hero-studia-poster.jpg"
        aria-hidden="true"
        initial={reduceMotion ? false : { scale: 1.12 }}
        animate={reduceMotion ? {} : { scale: 1 }}
        transition={{ duration: 18, ease: 'easeOut' }}
      >
        <source src="/hero-studia.mp4" type="video/mp4" />
      </motion.video>

      {/* ── Calques d'étalonnage cinématique (lisibilité du texte) ───── */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0a09]/90 via-[#0b0a09]/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a09] via-transparent to-[#0b0a09]/40" />
      {/* Halo de marque */}
      <div className="absolute top-10 right-[-6rem] w-[520px] h-[520px] bg-[#e97e42]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Contenu ──────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16 md:py-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-3xl space-y-6 text-center lg:text-left"
        >
          <motion.div variants={rise}>
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/15 px-4 py-1.5 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4 text-[#f3a268]" />
              Centre d'Excellence #1 en Afrique Centrale
            </span>
          </motion.div>

          <motion.h1
            variants={rise}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight text-white leading-[1.05] drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
          >
            Votre excellence,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f3a268] to-[#e97e42]">
              propulsée par l'IA
            </span>
          </motion.h1>

          <motion.p
            variants={rise}
            className="text-lg md:text-xl text-gray-200 max-w-xl mx-auto lg:mx-0"
          >
            Studia Academy vous ouvre les portes des universités chinoises, des certifications
            reconnues et de la transformation digitale — depuis Libreville, pour l'Afrique Centrale.
          </motion.p>

          <motion.div
            variants={rise}
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white px-8 py-6 text-base rounded-xl shadow-lg shadow-[#e97e42]/30"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/#modules">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/25 bg-white/5 backdrop-blur-md text-white hover:border-[#f3a268] hover:text-[#f3a268] hover:bg-white/10 px-8 py-6 text-base rounded-xl"
              >
                Nos 9 modules
              </Button>
            </Link>
          </motion.div>

          {/* Trust pills */}
          <motion.div
            variants={rise}
            className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2"
          >
            {trustPills.map((pill) => (
              <span
                key={pill}
                className="flex items-center gap-1.5 text-sm text-gray-100 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[#f3a268]" />
                {pill}
              </span>
            ))}
          </motion.div>

          {/* Badges flottants (desktop) */}
          <motion.div
            variants={rise}
            className="hidden lg:flex flex-wrap gap-3 pt-6"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/15 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#f3a268]" />
              <div>
                <p className="text-xs font-bold text-white">+20 universités</p>
                <p className="text-xs text-gray-300">chinoises partenaires</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-2xl px-4 py-3 shadow-xl text-white flex items-center gap-2">
              <Star className="w-5 h-5" fill="white" />
              <div>
                <p className="text-sm font-bold">4.9 / 5</p>
                <p className="text-xs text-white/80">Satisfaction</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Indicateur de scroll */}
      {!reduceMotion && (
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ opacity: { delay: 1.4 }, y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-white/70" />
          </div>
        </motion.div>
      )}
    </section>
  )
}
