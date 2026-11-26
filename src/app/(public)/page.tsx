export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle,
  ClipboardCheck,
  MapPin,
  MessageCircle,
  MonitorPlay,
  PlayCircle,
  Search,
  Send,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FAQSection } from '@/components/sections/FAQSection'
import { SecteursSection } from '@/components/sections/SecteursSection'
import { CourseCatalog, type CatalogFormation } from '@/components/home/CourseCatalog'
import { HomeHeroSlider } from '@/components/home/HomeHeroSlider'
import { createClient } from '@/lib/supabase/server'
import { formationsIA, WHATSAPP_NUMBER } from '@/lib/formations-ia'
import { getSessionsBySlug } from '@/lib/formations-ia-data'
import { MAX_HOME_SLIDES, type HomeSlide } from '@/lib/home/slides'
import { modules } from '@/lib/modules'
import { formatNumber } from '@/lib/utils'
import type { PresentielSession } from '@/types/formation'

// ─── Types & helpers ─────────────────────────────────────────────────

interface HomeEvent {
  id: string
  date: Date
  showTime: boolean
  titre: string
  tag: string
  lieu: string
  placesLeft: number | null
  prixLabel: string
  href: string
}

const TZ = 'Africa/Libreville'
const MAX_EVENTS = 5

/** Borne basse de l'agenda : une session commencée depuis moins de 24 h reste affichée. */
const sinceYesterdayIso = () => new Date(Date.now() - 86400000).toISOString()

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString('fr-FR', { timeZone: TZ, ...opts })

const prixLabel = (n: number | null) =>
  n === null ? 'Sur devis' : n > 0 ? `${formatNumber(n)} FCFA` : 'Gratuit'

function placesText(n: number | null): { label: string; tone: string } | null {
  if (n === null) return null
  if (n <= 0) return { label: 'Complet', tone: 'text-red-600 bg-red-50' }
  if (n <= 3) return { label: `Plus que ${n} place${n > 1 ? 's' : ''}`, tone: 'text-amber-700 bg-amber-50' }
  return { label: `${n} places`, tone: 'text-emerald-700 bg-emerald-50' }
}

// ─── Contenus éditoriaux ─────────────────────────────────────────────

const parcours = [
  {
    icon: Search,
    title: 'Trouvez votre formation',
    description: 'Parcourez le catalogue par secteur et par niveau, ou réservez une place en salle à Libreville.',
  },
  {
    icon: MonitorPlay,
    title: 'Apprenez à votre rythme',
    description: 'Leçons interactives, vidéos et quiz : reprenez exactement là où vous vous êtes arrêté·e.',
  },
  {
    icon: ClipboardCheck,
    title: 'Validez vos acquis',
    description: 'Un quiz final par formation confirme ce que vous savez réellement mettre en pratique.',
  },
  {
    icon: Award,
    title: 'Obtenez votre attestation',
    description: 'Une attestation Studia Academy à ajouter à votre CV et à présenter à votre employeur.',
  },
]

const diagnosticSteps = [
  { title: 'Créez votre campagne', text: 'Vous recevez un lien de test unique à partager à vos collaborateurs.' },
  { title: 'Vos équipes répondent', text: 'Quelques minutes par salarié, depuis un téléphone ou un ordinateur.' },
  { title: 'Recevez votre rapport', text: 'En 48 h : le niveau de vos effectifs et un pack de formation sur mesure.' },
]

// Barres purement illustratives — l'aperçu est étiqueté « Exemple » dans l'interface.
const reportPreview = [
  { label: 'Bureautique', value: 72 },
  { label: 'IA générative', value: 38 },
  { label: 'Données & reporting', value: 54 },
  { label: 'Cybersécurité', value: 45 },
]

const testimonials = [
  {
    name: 'Marie Nguema',
    role: 'DRH, BGFIBank Gabon',
    content:
      "L'audit IA Studia Academy nous a permis de digitaliser 70% de nos processus RH en 4 mois. ROI exceptionnel et équipe très professionnelle.",
    avatar: '👩‍💼',
    metric: '70% processus digitalisés',
  },
  {
    name: 'Claire Ndong',
    role: 'Chef de Projet, Total Energies',
    content:
      "Les tests de compétences et la certification m'ont donné la crédibilité nécessaire pour décrocher une promotion. Merci Studia !",
    avatar: '👩‍💻',
    metric: 'Promotion obtenue',
  },
  {
    name: 'Jean-Baptiste Ondo',
    role: 'CEO, PME Libreville',
    content:
      'La formation présentiel sur le management a transformé mon équipe. Taux de satisfaction collaborateurs passé de 58% à 89% en 3 mois.',
    avatar: '👨‍💼',
    metric: '+31 pts de satisfaction',
  },
]

// ─── Sous-composants ─────────────────────────────────────────────────

function CatalogSearch({ className = '' }: { className?: string }) {
  return (
    <form
      action="/formations/en-ligne"
      role="search"
      className={`flex items-center gap-2 rounded-2xl bg-white p-2 ${className}`}
    >
      <Search className="ml-3 h-5 w-5 flex-shrink-0 text-gray-400" />
      <input
        type="search"
        name="q"
        aria-label="Rechercher une formation"
        placeholder="Que voulez-vous apprendre ?"
        className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="flex-shrink-0 rounded-xl bg-gradient-to-r from-[#e97e42] to-[#d56a2e] px-5 py-3 text-sm font-bold text-white transition-shadow hover:shadow-lg hover:shadow-[#e97e42]/40"
      >
        Rechercher
      </button>
    </form>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: React.ReactNode
  description: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#a84d16]">{eyebrow}</p>
        <h2 className="font-heading text-3xl font-extrabold leading-tight text-gray-900 md:text-[2.6rem]">{title}</h2>
        <p className="mt-3 text-lg text-gray-500">{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex flex-shrink-0 items-center gap-2 self-start rounded-full border border-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white md:self-auto"
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

function EventRow({ event }: { event: HomeEvent }) {
  const places = placesText(event.placesLeft)
  return (
    <Link
      href={event.href}
      className="group flex items-center gap-4 rounded-2xl border border-[#ece4d8] bg-white p-4 transition-all hover:border-[#e97e42]/60 hover:shadow-[0_14px_34px_-20px_rgba(168,77,22,0.5)] sm:gap-5 sm:p-5"
    >
      <div className="flex h-[68px] w-[68px] flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gray-900 text-white">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#f3a268]">
          {fmt(event.date, { month: 'short' }).replace('.', '')}
        </span>
        <span className="font-heading text-2xl font-extrabold leading-none">{fmt(event.date, { day: 'numeric' })}</span>
        <span className="text-[10px] capitalize text-white/60">{fmt(event.date, { weekday: 'short' }).replace('.', '')}</span>
      </div>

      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#a84d16]">{event.tag}</span>
        <h3 className="font-heading font-bold leading-snug text-gray-900 group-hover:text-[#a84d16]">{event.titre}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {event.lieu}
          </span>
          {event.showTime && (
            <span>{event.date.toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {places && <span className={`rounded-full px-2 py-0.5 font-semibold ${places.tone}`}>{places.label}</span>}
        </div>
      </div>

      <div className="hidden flex-shrink-0 flex-col items-end gap-1.5 sm:flex">
        <span className="font-heading text-sm font-extrabold text-gray-900">{event.prixLabel}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#a84d16]">
          Réserver
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

// ─── Page ────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()

  const [slidesRes, formationsRes, sessionsRes, fiaSessions] = await Promise.all([
    supabase
      .from('home_slides')
      .select('id, ordre, titre, sous_titre, texte, cta_label, cta_href, image_url, is_active')
      .eq('is_active', true)
      .order('ordre', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(MAX_HOME_SLIDES),
    supabase
      .from('formations')
      .select('id, slug, titre, sous_titre, categorie, niveau, duree_estimee, prix_fcfa, cover_image')
      .eq('is_published', true)
      .order('ordre', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('presentiel_sessions')
      .select('*')
      .eq('is_published', true)
      .gte('date_debut', sinceYesterdayIso())
      .order('date_debut', { ascending: true })
      .limit(MAX_EVENTS),
    getSessionsBySlug(),
  ])

  // Table absente ou vide → hero par défaut (recherche) plutôt qu'une page cassée.
  const slides = (slidesRes.data ?? []) as HomeSlide[]
  const formations = (formationsRes.data ?? []) as CatalogFormation[]
  const sessions = (sessionsRes.data ?? []) as PresentielSession[]
  const featured = formations[0]
  const popularCategories = [...new Set(formations.map((f) => f.categorie).filter(Boolean) as string[])].slice(0, 4)

  // Agenda unifié : sessions en salle + prochaines journées IA
  const todayIso = sinceYesterdayIso().slice(0, 10)
  const nextFiaDate: Record<string, Date | undefined> = {}
  const events: HomeEvent[] = sessions.map((s) => ({
    id: `p-${s.id}`,
    date: new Date(s.date_debut),
    showTime: true,
    titre: s.titre,
    tag: s.categorie ?? 'Session en salle',
    lieu: s.lieu || s.ville,
    placesLeft: s.places_total - s.places_reservees,
    prixLabel: prixLabel(s.prix_fcfa),
    href: '/formations/presentiel',
  }))
  for (const f of formationsIA) {
    // Le repli statique (base injoignable) peut contenir des dates passées : on les écarte.
    const list = (fiaSessions[f.slug] ?? []).filter((s) => s.date >= todayIso)
    if (list[0]) nextFiaDate[f.slug] = new Date(list[0].date)
    for (const s of list.slice(0, 2)) {
      events.push({
        id: `fia-${s.id}`,
        date: new Date(s.date),
        showTime: false,
        titre: `${f.titre} — ${f.sousTitre}`,
        tag: `Journée IA · ${f.tag}`,
        lieu: s.lieu,
        placesLeft: s.placesRestantes,
        prixLabel: prixLabel(f.prixFcfa),
        href: `/formations-ia/${f.slug}`,
      })
    }
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime())
  const agenda = events.slice(0, MAX_EVENTS)
  const nextEvent = agenda[0]

  const pillars = [
    {
      icon: MonitorPlay,
      kicker: 'En ligne',
      title: 'Formations en ligne',
      text: 'Des cours IA par métier, accessibles 24 h/24 sur mobile et ordinateur.',
      meta:
        formations.length > 0
          ? `${formations.length} formation${formations.length > 1 ? 's' : ''} disponible${formations.length > 1 ? 's' : ''}`
          : 'Catalogue en ouverture',
      href: '#formations',
    },
    {
      icon: CalendarDays,
      kicker: 'Présentiel',
      title: 'Événements Studia Academy',
      text: 'Journées de formation et ateliers en salle, à Libreville, en petit groupe.',
      meta: nextEvent ? `Prochaine date : ${fmt(nextEvent.date, { day: 'numeric', month: 'long' })}` : 'Prochaines dates à venir',
      href: '#evenements',
    },
    {
      icon: BarChart3,
      kicker: 'Entreprise',
      title: 'Diagnostic entreprise',
      text: 'Mesurez le niveau digital de vos équipes et recevez un plan de formation.',
      meta: 'Gratuit · rapport en 48 h',
      href: '#diagnostic',
    },
  ]

  return (
    <div className="flex flex-col bg-[#fbf8f3]">
      {/* ─── HERO : slides gérés dans /admin/accueil, sinon hero par défaut ─── */}
      {slides.length > 0 ? (
        <HomeHeroSlider slides={slides} />
      ) : (
        <section className="relative w-full overflow-hidden bg-[#0f0d0b]">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/hero-studia-poster.jpg"
            aria-hidden="true"
          >
            <source src="/hero-studia.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0d0b] via-[#0f0d0b]/85 to-[#0f0d0b]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d0b] via-transparent to-[#0f0d0b]/60" />
          <div className="pointer-events-none absolute -right-24 top-16 h-[480px] w-[480px] rounded-full bg-[#e97e42]/20 blur-[120px]" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 pb-36 pt-32 sm:px-6 md:pt-40 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:pb-44">
            <div>
              <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-[#f3a268]" />
                La plateforme de formation de Studia Academy
              </p>

              <h1 className="animate-fade-up animate-fade-up-delay-1 mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[4.1rem]">
                Formez-vous à l&apos;IA.
                <br />
                <span className="bg-gradient-to-r from-[#f8b98a] to-[#e97e42] bg-clip-text text-transparent">
                  En ligne, en salle, en équipe.
                </span>
              </h1>

              <p className="animate-fade-up animate-fade-up-delay-2 mt-5 max-w-xl text-lg text-gray-200">
                Des formations en ligne par métier, des événements en présentiel à Libreville et un diagnostic pour
                faire monter vos équipes en compétences.
              </p>

              <CatalogSearch className="animate-fade-up animate-fade-up-delay-3 mt-8 max-w-xl shadow-2xl shadow-black/40" />

              {popularCategories.length > 0 && (
                <div className="animate-fade-up animate-fade-up-delay-4 mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-400">Populaire :</span>
                  {popularCategories.map((c) => (
                    <Link
                      key={c}
                      href={`/formations/en-ligne?secteur=${encodeURIComponent(c)}`}
                      className="rounded-full border border-white/20 px-3 py-1 text-gray-100 transition-colors hover:border-[#f3a268] hover:text-[#f3a268]"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              )}

              <ul className="animate-fade-up animate-fade-up-delay-4 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                {['Attestation en fin de parcours', 'Paiement Mobile Money', 'Accès mobile & ordinateur'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-[#f3a268]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Aperçu : formation à la une + prochain événement */}
            {(featured || nextEvent) && (
              <div className="relative hidden lg:block">
                {featured && (
                  <Link
                    href={`/formations/en-ligne/${featured.slug}`}
                    className="animate-fade-up animate-fade-up-delay-2 group block rotate-[1.5deg] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/50 transition-transform duration-500 hover:rotate-0"
                  >
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-[#fbe6d6] to-[#f3ede3]">
                      {featured.cover_image && (
                        <Image src={featured.cover_image} alt="" fill sizes="460px" className="object-cover" priority />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-[#e97e42] px-3 py-1 text-xs font-bold text-white">
                        À la une
                      </span>
                      <span className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#e97e42] shadow-lg transition-transform group-hover:scale-110">
                        <PlayCircle className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#a84d16]">
                        {featured.categorie ?? 'Formation en ligne'}
                      </p>
                      <p className="mt-1 font-heading text-lg font-bold leading-snug text-gray-900 line-clamp-2">
                        {featured.titre}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {[featured.niveau, featured.duree_estimee].filter(Boolean).join(' · ')}
                        </span>
                        <span className="font-heading font-extrabold text-gray-900">{prixLabel(featured.prix_fcfa)}</span>
                      </div>
                    </div>
                  </Link>
                )}

                {nextEvent && (
                  <Link
                    href={nextEvent.href}
                    className={`animate-fade-up animate-fade-up-delay-3 flex max-w-[330px] items-center gap-3 rounded-2xl border border-white/10 bg-[#1b1714]/95 p-3.5 text-white shadow-2xl backdrop-blur-md transition-transform hover:-translate-y-0.5 ${
                      featured ? 'absolute -bottom-10 -left-10 -rotate-2' : ''
                    }`}
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-[#e97e42]">
                      <span className="font-heading text-xl font-extrabold leading-none">
                        {fmt(nextEvent.date, { day: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-semibold uppercase">
                        {fmt(nextEvent.date, { month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#f3a268]">
                        Prochain événement en salle
                      </p>
                      <p className="font-heading text-sm font-bold leading-snug line-clamp-2">{nextEvent.titre}</p>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── 3 PORTES D'ENTRÉE ─────────────────────────────────────── */}
      <section aria-label="Nos trois offres" className="relative z-10 -mt-24 w-full px-4 sm:px-6 lg:-mt-28 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <a
              key={p.title}
              href={p.href}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#ece4d8] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(15,13,11,0.45)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#e97e42]/50 md:p-7"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-3 -top-6 font-heading text-[7rem] font-extrabold leading-none text-[#f6efe5] transition-colors group-hover:text-[#fde4d1]"
              >
                {i + 1}
              </span>
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-[#f3a268] transition-colors group-hover:bg-[#e97e42] group-hover:text-white">
                <p.icon className="h-6 w-6" />
              </div>
              <p className="relative mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#a84d16]">{p.kicker}</p>
              <h2 className="relative mt-1 font-heading text-xl font-extrabold text-gray-900">{p.title}</h2>
              <p className="relative mt-2 text-sm leading-relaxed text-gray-500">{p.text}</p>
              <div className="relative mt-5 flex items-center justify-between border-t border-[#f3ede3] pt-4 text-sm">
                <span className="font-semibold text-gray-700">{p.meta}</span>
                <ArrowRight className="h-5 w-5 text-[#e97e42] transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ─── PARTENAIRES ───────────────────────────────────────────── */}
      <section className="w-full py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Ils nous font confiance
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {['BGFIBank', 'Total Energies', 'Université Omar Bongo', 'SEEG', 'Airtel Gabon', 'Port Autonome'].map(
              (partner) => (
                <span key={partner} className="select-none text-sm font-semibold text-gray-400 md:text-base">
                  {partner}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ─── 1 · FORMATIONS EN LIGNE ───────────────────────────────── */}
      <section id="formations" className="w-full scroll-mt-20 bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="01 · Formations en ligne"
            title={
              <>
                Le catalogue, <span className="text-[#e97e42]">par métier</span>
              </>
            }
            description="Des cours IA concrets, pensés pour votre secteur d'activité. Commencez aujourd'hui, avancez à votre rythme."
            action={{ href: '/formations/en-ligne', label: 'Tout le catalogue' }}
          />

          {/* Avec le slider en hero, la recherche vit ici */}
          {slides.length > 0 && (
            <CatalogSearch className="mb-8 max-w-xl border border-[#ece4d8] shadow-sm" />
          )}

          {formations.length === 0 ? (
            <div className="rounded-3xl border border-[#ece4d8] bg-[#fbf8f3] py-16 text-center">
              <PlayCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">Les premières formations arrivent bientôt.</p>
              <Link href="/contact" className="mt-4 inline-block font-semibold text-[#a84d16] hover:underline">
                Être prévenu·e
              </Link>
            </div>
          ) : (
            <CourseCatalog formations={formations} />
          )}
        </div>
      </section>

      {/* ─── 2 · ÉVÉNEMENTS EN PRÉSENTIEL ──────────────────────────── */}
      <section id="evenements" className="w-full scroll-mt-20 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="02 · Événements en présentiel"
            title={
              <>
                Rendez-vous <span className="text-[#e97e42]">en salle</span>, à Libreville
              </>
            }
            description="Journées de formation 100 % pratiques et ateliers Studia Academy, en petit groupe avec un formateur."
            action={{ href: '/formations/presentiel', label: 'Tout le planning' }}
          />

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Agenda */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <CalendarDays className="h-4 w-4 text-[#e97e42]" />
                Prochaines dates
              </h3>
              {agenda.length === 0 ? (
                <div className="rounded-2xl border border-[#ece4d8] bg-white p-8 text-center">
                  <p className="text-gray-500">Aucune date programmée pour le moment.</p>
                  <Link href="/contact" className="mt-3 inline-block font-semibold text-[#a84d16] hover:underline">
                    Être informé·e des prochaines dates
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {agenda.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </div>
              )}
            </div>

            {/* Programmes des journées IA */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Users className="h-4 w-4 text-[#e97e42]" />
                Les journées IA
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {formationsIA.map((f) => {
                  const next = nextFiaDate[f.slug]
                  return (
                    <Link
                      key={f.slug}
                      href={`/formations-ia/${f.slug}`}
                      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 p-4 text-white"
                    >
                      <Image
                        src={`/fia-hero-${f.slug}-poster.jpg`}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 50vw, 260px"
                        className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d0b] via-[#0f0d0b]/50 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md">
                        {f.code} · {f.tag}
                      </span>
                      <div className="relative">
                        <h4 className="font-heading text-base font-extrabold leading-tight">{f.titre}</h4>
                        <p className="mt-1 text-xs text-white/70 line-clamp-2">{f.sousTitre}</p>
                        <p className="mt-2 text-xs font-semibold text-[#f3a268]">
                          {next ? fmt(next, { day: 'numeric', month: 'long' }) : 'Dates sur demande'} ·{' '}
                          {prixLabel(f.prixFcfa)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <Link
                href="/contact?sujet=presentiel"
                className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-[#d9cdbb] px-5 py-4 text-sm transition-colors hover:border-[#e97e42] hover:bg-white"
              >
                <span className="text-gray-600">
                  <strong className="text-gray-900">Une session pour vos équipes ?</strong> Toutes nos journées
                  existent en intra-entreprise.
                </span>
                <ArrowRight className="ml-3 h-5 w-5 flex-shrink-0 text-[#e97e42]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3 · DIAGNOSTIC ENTREPRISE ─────────────────────────────── */}
      <section id="diagnostic" className="relative w-full scroll-mt-20 overflow-hidden bg-[#0f0d0b] py-20 text-white md:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-[#e97e42]/20 blur-[130px]" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#f3a268]">
              03 · Diagnostic entreprise
            </p>
            <h2 className="font-heading text-3xl font-extrabold leading-tight md:text-[2.6rem]">
              Où en sont vraiment vos équipes sur le digital et l&apos;IA&nbsp;?
            </h2>
            <p className="mt-4 max-w-lg text-lg text-white/70">
              Envoyez un test de compétences à vos collaborateurs. Vous recevez un rapport clair du niveau de vos
              effectifs et un pack de formation sur mesure.
            </p>

            <ol className="mt-8 space-y-4">
              {diagnosticSteps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#e97e42] font-heading text-sm font-extrabold text-[#f3a268]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-heading font-bold">{s.title}</p>
                    <p className="text-sm text-white/60">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/entreprise/diagnostic"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e97e42] to-[#d56a2e] px-7 py-4 font-bold text-white transition-shadow hover:shadow-xl hover:shadow-[#e97e42]/30"
              >
                Lancer mon diagnostic gratuit
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/entreprise"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 px-7 py-4 font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Building2 className="h-5 w-5" />
                Offre entreprise
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/50">Gratuit · sans engagement · rapport sous 48 h</p>
          </div>

          {/* Aperçu de rapport (illustratif) */}
          <div className="rounded-3xl border border-white/10 bg-[#1b1714] p-6 shadow-2xl md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Exemple de rapport</p>
                <p className="mt-1 font-heading text-lg font-bold">Niveau digital des effectifs</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">Aperçu</span>
            </div>

            <div className="mt-7 space-y-5">
              {reportPreview.map((r) => (
                <div key={r.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-white/80">{r.label}</span>
                    <span className="font-heading font-bold text-[#f3a268]">{r.value} %</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#e97e42] to-[#f8b98a]"
                      style={{ width: `${r.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-start gap-3 rounded-2xl bg-white/5 p-4">
              <Send className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f3a268]" />
              <p className="text-sm text-white/70">
                <strong className="text-white">Pack recommandé :</strong> le rapport se termine par les formations
                prioritaires pour vos équipes, en ligne ou en présentiel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PARCOURS APPRENANT ────────────────────────────────────── */}
      <section className="w-full bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Votre parcours"
            title="De l'inscription à l'attestation"
            description="Une expérience d'apprentissage simple, pensée pour les connexions et les emplois du temps d'ici."
          />
          <ol className="grid gap-px overflow-hidden rounded-3xl border border-[#ece4d8] bg-[#ece4d8] sm:grid-cols-2 lg:grid-cols-4">
            {parcours.map((step, i) => (
              <li key={step.title} className="bg-white p-6 md:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff7ed]">
                    <step.icon className="h-5 w-5 text-[#e97e42]" />
                  </div>
                  <span aria-hidden="true" className="font-heading text-3xl font-extrabold text-[#f0e6d8]">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-heading font-bold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── SECTEURS D'ACTIVITÉ ───────────────────────────────────── */}
      <SecteursSection />

      {/* ─── TÉMOIGNAGES ───────────────────────────────────────────── */}
      <section className="w-full bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Témoignages"
            title="Ils se sont formés avec Studia"
            description="Apprenants, managers et dirigeants racontent ce que la formation a changé pour eux."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="flex flex-col rounded-2xl border border-[#ece4d8] bg-[#fbf8f3] p-6">
                <div className="mb-4 flex items-center gap-1" role="img" aria-label="5 étoiles sur 5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#e97e42] text-[#e97e42]" />
                  ))}
                </div>
                <blockquote className="flex-1 text-[15px] leading-relaxed text-gray-700">« {t.content} »</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-[#ece4d8] pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl">
                    {t.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                  <span className="hidden rounded-full bg-[#fff1e4] px-3 py-1 text-xs font-semibold text-[#a84d16] xl:inline-block">
                    {t.metric}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AUSSI CHEZ STUDIA (outils IA + accompagnements) ───────── */}
      <section id="modules" className="w-full scroll-mt-20 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 rounded-3xl border border-[#ece4d8] bg-white p-6 md:p-8 lg:flex-row lg:items-center lg:gap-10">
            <div className="lg:w-72 lg:flex-shrink-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84d16]">Aussi chez Studia</p>
              <h2 className="mt-1 font-heading text-xl font-extrabold text-gray-900">Outils IA & accompagnements</h2>
              <Link
                href="/outils"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#a84d16] hover:underline"
              >
                <Sparkles className="h-4 w-4" />
                Découvrir les outils IA
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <Link
                  key={m.slug}
                  href={`/modules/${m.slug}`}
                  className="rounded-full border border-[#ece4d8] bg-[#fbf8f3] px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#e97e42] hover:text-[#a84d16]"
                >
                  {m.titre}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ─── CTA FINAL ─────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#e97e42] via-[#d56a2e] to-[#c45a20] py-20 md:py-24">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 text-center text-white sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-extrabold leading-tight md:text-5xl">
            Votre prochaine compétence commence ici
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90">
            Créez votre compte, choisissez une formation et commencez dès aujourd&apos;hui — ou réservez votre place à
            notre prochain événement.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full rounded-xl bg-white px-8 py-6 text-base font-bold text-[#a84d16] hover:bg-[#fbf8f3] sm:w-auto"
              >
                Créer mon compte gratuit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20les%20formations%20Studia%20Academy`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-xl border-2 border-white bg-transparent px-8 py-6 text-base text-white hover:bg-white/15 hover:text-white sm:w-auto"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Nous écrire sur WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
