import Link from 'next/link'
import Image from 'next/image'
import { ModuleFlipCard } from '@/components/sections/ModuleFlipCard'
import { MicroServiceCard } from '@/components/sections/MicroServiceCard'
import { HorizontalGallery } from '@/components/sections/HorizontalGallery'
import { microServices } from '@/lib/micro-services'
import {
  ArrowRight,
  CheckCircle,
  Star,
  Sparkles,
  GraduationCap,
  BarChart2,
  Mic,
  BookOpen,
  Building2,
  Users,
  Laptop,
  Heart,
  MessageCircle,
  Zap,
  Shield,
  Globe,
  Clock,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsCounter } from '@/components/sections/StatsCounter'
import { FAQSection } from '@/components/sections/FAQSection'
import { GlobeWrapper } from '@/components/hero/GlobeWrapper'
import { modules } from '@/lib/modules'

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

const whyUs = [
  {
    icon: Globe,
    title: 'Réseau international',
    description: 'Partenariats avec des universités chinoises et des institutions africaines de premier plan.',
  },
  {
    icon: Zap,
    title: 'IA de pointe',
    description: "Des outils d'intelligence artificielle adaptés aux réalités du marché de l'emploi en Afrique Centrale.",
  },
  {
    icon: Shield,
    title: 'Certifications reconnues',
    description: 'Nos certificats sont vérifiables numériquement et reconnus par nos partenaires employeurs.',
  },
  {
    icon: Users,
    title: 'Accompagnement 360°',
    description: 'Online et présentiel : un suivi complet de votre parcours avec des experts dédiés.',
  },
  {
    icon: Smartphone,
    title: 'Paiement Mobile Money',
    description: 'Airtel Money, Moov Money et carte bancaire. Facilités de paiement disponibles.',
  },
  {
    icon: Clock,
    title: 'Communauté active',
    description: '+2000 membres actifs, hackathons, networking et projets collaboratifs chaque trimestre.',
  },
]

const testimonials = [
  {
    name: 'Marie Nguema',
    role: 'DRH, BGFIBank Gabon',
    content:
      "L'audit IA Studia Academy nous a permis de digitaliser 70% de nos processus RH en 4 mois. ROI exceptionnel et équipe très professionnelle.",
    avatar: '👩‍💼',
    rating: 5,
    metric: '70% processus digitalisés',
  },
  {
    name: 'Patrick Mba',
    role: 'Étudiant → Université de Pékin',
    content:
      "Grâce au programme Universités Chinoises, j'ai obtenu mon visa et rejoint l'Université de Pékin en 6 semaines. Accompagnement irréprochable.",
    avatar: '👨‍🎓',
    rating: 5,
    metric: 'Visa obtenu en 6 semaines',
  },
  {
    name: 'Claire Ndong',
    role: 'Chef de Projet, Total Energies',
    content:
      "Les tests de compétences et la certification m'ont donné la crédibilité nécessaire pour décrocher une promotion. Merci Studia !",
    avatar: '👩‍💻',
    rating: 5,
    metric: 'Promotion obtenue',
  },
  {
    name: 'Jean-Baptiste Ondo',
    role: 'CEO, PME Libreville',
    content:
      "La formation présentiel sur le management a transformé mon équipe. Taux de satisfaction collaborateurs passé de 58% à 89% en 3 mois.",
    avatar: '👨‍💼',
    rating: 5,
    metric: '+31 pts de satisfaction',
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Évaluez vos besoins',
    description: 'Passez notre test de compétences gratuit pour identifier vos axes de développement prioritaires.',
    color: '#e97e42',
  },
  {
    step: '02',
    title: 'Choisissez votre module',
    description: 'Parmi nos 9 modules, sélectionnez celui qui correspond à vos objectifs personnels ou professionnels.',
    color: '#7C3AED',
  },
  {
    step: '03',
    title: 'Progressez avec nos experts',
    description: 'Accédez aux formations, coachs dédiés et outils IA. En ligne ou en présentiel à Libreville.',
    color: '#10B981',
  },
  {
    step: '04',
    title: 'Certifiez-vous',
    description: 'Obtenez une certification numérique vérifiable, reconnue par nos partenaires employeurs.',
    color: '#3B82F6',
  },
]

export default function HomePage() {
  const spotlightModules = [
    modules.find((m) => m.slug === 'universites-chinoises')!,
    modules.find((m) => m.slug === 'audit-ia-entreprises')!,
  ]

  return (
    <div className="flex flex-col">
      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-screen flex items-center pt-16 overflow-hidden bg-white">
        {/* Orbes décoratifs */}
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#e97e42]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#7C3AED]/6 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 md:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Text */}
            <div className="flex-1 space-y-6 text-center lg:text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Centre d'Excellence #1 en Afrique Centrale
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight text-gray-900 leading-[1.05]">
                Votre excellence,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                  propulsée par l'IA
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
                Studia Academy vous ouvre les portes des universités chinoises, des certifications
                reconnues et de la transformation digitale — depuis Libreville, pour l'Afrique Centrale.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-up animate-fade-up-delay-1">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white px-8 py-6 text-base rounded-xl shadow-lg shadow-[#e97e42]/25"
                  >
                    Commencer gratuitement
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/#modules">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-gray-200 text-gray-700 hover:border-[#e97e42] hover:text-[#e97e42] hover:bg-[#fff7ed] px-8 py-6 text-base rounded-xl"
                  >
                    Nos 9 modules
                  </Button>
                </Link>
              </div>

              {/* Trust pills */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2 animate-fade-up animate-fade-up-delay-2">
                {['500+ certifications', '2000+ étudiants', '94% satisfaction'].map((pill) => (
                  <span
                    key={pill}
                    className="flex items-center gap-1.5 text-sm text-gray-600 bg-[#fbf8f3] border border-[#f0ebe3] px-3 py-1 rounded-full"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-[#e97e42]" />
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Globe 3D */}
            <div className="flex-1 relative w-full max-w-md lg:max-w-lg mx-auto animate-fade-up animate-fade-up-delay-2">
              {/* Fallback visible sur mobile, globe sur desktop */}
              <div className="relative aspect-square">
                {/* Fallback gradient orbs (toujours visible) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e97e42]/15 via-[#fff7ed]/30 to-[#7C3AED]/8 blur-2xl" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-tl from-[#e97e42]/10 to-transparent" />

                {/* Globe WebGL (hidden sur mobile < 640px pour perf) */}
                <div className="hidden sm:block absolute inset-0 rounded-full overflow-hidden">
                  <GlobeWrapper className="w-full h-full" />
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-xl border border-[#f0ebe3] hidden sm:flex items-center gap-2 animate-fade-up animate-fade-up-delay-3">
                  <GraduationCap className="w-5 h-5 text-[#7C3AED]" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">+20 universités</p>
                    <p className="text-xs text-gray-500">chinoises partenaires</p>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-2xl px-4 py-3 shadow-xl text-white hidden sm:flex items-center gap-2 animate-fade-up animate-fade-up-delay-4">
                  <Star className="w-5 h-5" fill="white" />
                  <div>
                    <p className="text-sm font-bold">4.9 / 5</p>
                    <p className="text-xs text-white/80">Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BANDEAU PARTENAIRES ───────────────────────────────────── */}
      <section className="w-full py-12 bg-[#fbf8f3] border-y border-[#f0ebe3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-gray-400 mb-8 uppercase tracking-wider">
            Ils nous font confiance
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {['BGFIBank', 'Total Energies', 'Université Omar Bongo', 'SEEG', 'Airtel Gabon', 'Port Autonome'].map(
              (partner) => (
                <div
                  key={partner}
                  className="text-gray-300 font-semibold text-sm md:text-base hover:text-gray-500 transition-colors cursor-default select-none"
                >
                  {partner}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────── */}
      <StatsCounter />

      {/* ─── MODULES GRID ──────────────────────────────────────────── */}
      <section id="modules" className="w-full py-20 md:py-28 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              Nos modules
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-gray-900 mb-4">
              9 modules pour{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                votre excellence
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Du programme Universités Chinoises à la digitalisation d'entreprise, chaque module est
              conçu pour transformer votre trajectoire.
            </p>
          </div>

          <HorizontalGallery>
            {modules.map((module) => (
              <div key={module.slug} className="w-[280px] sm:w-[300px] flex-shrink-0 snap-start">
                <ModuleFlipCard module={module} />
              </div>
            ))}
          </HorizontalGallery>
        </div>
      </section>

      {/* ─── MICRO-SERVICES ────────────────────────────────────────── */}
      <section id="services" className="w-full py-20 md:py-28 bg-[#fbf8f3] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#f0ebe3] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Nos micro-services IA
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-gray-900 mb-4">
              Des outils IA pour{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                votre carrière
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Candidatures, concours, business plans, courriers… Des résultats concrets en 2 minutes,
              générés par IA.
            </p>
          </div>

          <HorizontalGallery>
            {microServices.map((service) => (
              <div key={service.slug} className="w-[280px] sm:w-[300px] flex-shrink-0 snap-start">
                <MicroServiceCard service={service} />
              </div>
            ))}
          </HorizontalGallery>

          <div className="text-center mt-10">
            <Link
              href="/outils"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Voir tous les outils IA <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ─────────────────────────────────────── */}
      <section className="w-full py-20 md:py-28 bg-[#fbf8f3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white text-[#a84d16] border border-[#f0ebe3] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Processus
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-gray-900">
              Comment ça marche ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Connecteur */}
                {idx < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gray-200 to-transparent z-0" />
                )}
                <div className="relative z-10 bg-white rounded-2xl p-6 border border-[#f0ebe3] hover:shadow-lg transition-shadow">
                  <div
                    className="text-4xl font-extrabold font-heading mb-4 opacity-15"
                    style={{ color: step.color }}
                  >
                    {step.step}
                  </div>
                  <div
                    className="w-10 h-1 rounded-full mb-4"
                    style={{ backgroundColor: step.color }}
                  />
                  <h3 className="font-bold font-heading text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SPOTLIGHT — Universités Chinoises ─────────────────────── */}
      {spotlightModules.map((mod, idx) => {
        const Icon = iconMap[mod.iconName] ?? Sparkles
        const isEven = idx % 2 === 0
        return (
          <section
            key={mod.slug}
            className={`w-full py-20 md:py-28 ${isEven ? 'bg-white' : 'bg-[#fbf8f3]'}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div
                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}
              >
                {/* Visuel — image de couverture (fallback icône) */}
                <div className="flex-1 flex justify-center">
                  <div className="w-full max-w-md aspect-square rounded-3xl border border-white shadow-xl relative overflow-hidden">
                    {mod.coverImage ? (
                      <Image
                        src={mod.coverImage}
                        alt={mod.titre}
                        fill
                        sizes="(max-width: 1024px) 100vw, 28rem"
                        className="object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${mod.gradientBg}`}>
                        <div
                          className="w-28 h-28 rounded-3xl flex items-center justify-center"
                          style={{ backgroundColor: `${mod.couleur}20` }}
                        >
                          <Icon className="w-14 h-14" style={{ color: mod.couleur }} />
                        </div>
                      </div>
                    )}
                    {/* Voile dégradé pour lisibilité du badge */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                    {mod.badge && (
                      <span
                        className="absolute top-6 left-6 text-sm font-bold px-3 py-1 rounded-full text-white shadow-lg"
                        style={{ backgroundColor: mod.couleur }}
                      >
                        {mod.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Texte */}
                <div className="flex-1 space-y-5">
                  <div
                    className="inline-block text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${mod.couleur}18`, color: mod.couleur }}
                  >
                    {mod.sousTitre}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900">
                    {mod.titre}
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">{mod.description}</p>

                  <ul className="space-y-3">
                    {mod.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-gray-700">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: mod.couleur }} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <Link href={`/modules/${mod.slug}`}>
                    <Button
                      size="lg"
                      className="mt-2 px-8 py-6 text-base rounded-xl text-white"
                      style={{ background: `linear-gradient(135deg, ${mod.couleur}, ${mod.couleur}cc)` }}
                    >
                      {mod.cta}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )
      })}

      {/* ─── POURQUOI NOUS ─────────────────────────────────────────── */}
      <section id="pourquoi" className="w-full py-20 md:py-28 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Différenciation
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-gray-900 mb-4">
              Pourquoi choisir Studia ?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyUs.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="bg-[#fbf8f3] rounded-2xl p-6 border border-[#f0ebe3] hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-11 h-11 bg-[#fff7ed] rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#e97e42]" />
                  </div>
                  <h3 className="font-bold font-heading text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── TÉMOIGNAGES ───────────────────────────────────────────── */}
      <section className="w-full py-20 md:py-28 bg-[#fbf8f3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white text-[#a84d16] border border-[#f0ebe3] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Star className="w-3.5 h-3.5 fill-[#e97e42] text-[#e97e42]" />
              Témoignages
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-gray-900">
              Ils ont transformé leur trajectoire
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl p-6 border border-[#f0ebe3] shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed italic mb-4 flex-1">
                  "{t.content}"
                </p>
                <div className="pt-3 border-t border-[#f0ebe3]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#fbf8f3] rounded-full flex items-center justify-center text-xl">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs font-semibold text-[#a84d16] bg-[#fff7ed] px-3 py-1 rounded-full inline-block">
                    {t.metric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ─── CTA FINAL ─────────────────────────────────────────────── */}
      <section className="w-full py-20 md:py-28 bg-gradient-to-br from-[#e97e42] via-[#d56a2e] to-[#c45a20] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Commencez dès aujourd'hui
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold font-heading mb-5 leading-tight">
            Prêt à écrire votre success story ?
          </h2>
          <p className="text-white/90 text-lg md:text-xl mb-8 max-w-xl mx-auto">
            Rejoignez +2000 étudiants et professionnels qui font confiance à Studia Academy pour
            transformer leur trajectoire.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-[#e97e42] hover:bg-[#fbf8f3] px-8 py-6 text-base rounded-xl font-bold"
              >
                Créer mon compte gratuit
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a
              href="https://wa.me/24100000000?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20Studia%20Academy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/15 px-8 py-6 text-base rounded-xl"
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                Nous contacter sur WhatsApp
              </Button>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> 50 crédits offerts
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Sans carte bancaire
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Résiliation libre
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
