import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  ArrowLeft,
  GraduationCap,
  BarChart2,
  Mic,
  BookOpen,
  Building2,
  Users,
  Laptop,
  Heart,
  Sparkles,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { modules, getModuleBySlug } from '@/lib/modules'
import type { Metadata } from 'next'

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

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return modules.map((m) => ({ slug: m.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const mod = getModuleBySlug(slug)
  if (!mod) return {}
  return {
    title: `${mod.titre} — Studia Academy`,
    description: mod.description,
  }
}

export default async function ModulePage({ params }: Props) {
  const { slug } = await params
  const mod = getModuleBySlug(slug)
  if (!mod) notFound()

  const Icon = iconMap[mod.iconName] ?? Sparkles
  const related = modules.filter((m) => m.slug !== slug).slice(0, 3)

  const whatsappText = encodeURIComponent(
    `Bonjour Studia Academy, je souhaite en savoir plus sur le module : ${mod.titre}.`
  )

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/#modules"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux modules
        </Link>
      </div>

      {/* Hero du module */}
      <section
        className="w-full py-16 md:py-24"
        style={{ background: `linear-gradient(135deg, white 60%, ${mod.couleur}08)` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start gap-10">
            <div className="flex-1 space-y-5">
              {mod.badge && (
                <span
                  className="inline-block text-sm font-bold px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: mod.couleur }}
                >
                  {mod.badge}
                </span>
              )}
              <div
                className="inline-block text-sm font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: `${mod.couleur}18`, color: mod.couleur }}
              >
                {mod.sousTitre}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-gray-900 leading-tight">
                {mod.titre}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                {mod.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 py-6 text-base rounded-xl text-white font-semibold"
                    style={{ background: `linear-gradient(135deg, ${mod.couleur}, ${mod.couleur}cc)` }}
                  >
                    {mod.cta}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a
                  href={`https://wa.me/24100000000?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-6 text-base rounded-xl border-green-400 text-green-600 hover:bg-green-50"
                  >
                    <MessageCircle className="mr-2 w-5 h-5" />
                    Renseignements WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            {/* Visuel icône */}
            <div className="flex-shrink-0 flex justify-center">
              <div
                className="w-48 h-48 md:w-64 md:h-64 rounded-3xl flex items-center justify-center shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${mod.couleur}25, ${mod.couleur}10)` }}
              >
                <Icon className="w-24 h-24 md:w-32 md:h-32" style={{ color: mod.couleur }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="w-full py-16 bg-[#fbf8f3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-8">
            Ce que vous obtenez
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mod.features.map((feat) => (
              <div
                key={feat}
                className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-[#f0ebe3] shadow-sm"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${mod.couleur}18` }}
                >
                  <CheckCircle className="w-5 h-5" style={{ color: mod.couleur }} />
                </div>
                <p className="text-gray-700 font-medium text-sm leading-relaxed">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA inscription */}
      <section
        className="w-full py-16"
        style={{ background: `linear-gradient(135deg, ${mod.couleur}15, ${mod.couleur}05)` }}
      >
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-gray-600 mb-8">
            Inscrivez-vous gratuitement et recevez 50 crédits de bienvenue pour explorer ce module.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="px-8 py-6 rounded-xl text-white font-bold"
                style={{ background: `linear-gradient(135deg, ${mod.couleur}, ${mod.couleur}cc)` }}
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 rounded-xl"
                style={{ borderColor: mod.couleur, color: mod.couleur }}
              >
                Poser une question
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Autres modules */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold font-heading text-gray-900 mb-8">
            Autres modules disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((rel) => {
              const RelIcon = iconMap[rel.iconName] ?? Sparkles
              return (
                <Link
                  key={rel.slug}
                  href={`/modules/${rel.slug}`}
                  className="group bg-[#fbf8f3] rounded-2xl p-5 border border-[#f0ebe3] hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${rel.couleur}18` }}
                  >
                    <RelIcon className="w-5 h-5" style={{ color: rel.couleur }} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#e97e42] transition-colors text-sm">
                    {rel.titre}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{rel.description}</p>
                  <div
                    className="flex items-center mt-3 text-xs font-semibold"
                    style={{ color: rel.couleur }}
                  >
                    Découvrir
                    <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
