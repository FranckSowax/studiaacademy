export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { aiServices } from '@/lib/ai-services/definitions'
import { CATEGORY_LABELS, type ServiceCategory } from '@/types/ai-service'
import {
  ArrowRight, Sparkles, GraduationCap, FileText, Briefcase, Presentation, Mail, Zap,
  Globe, Palette, Receipt, Megaphone, FileSignature, TrendingUp, BookOpen, PenTool,
  FileCheck, Lightbulb, Compass, AlignLeft,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  GraduationCap, FileText, Briefcase, Presentation, Mail,
  Globe, Palette, Receipt, Megaphone, FileSignature, TrendingUp, BookOpen, PenTool,
  FileCheck, Lightbulb, Compass, AlignLeft,
}

export default function OutilsPage() {
  const categories = Object.keys(CATEGORY_LABELS) as ServiceCategory[]

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-b from-[#fff7ed] to-white py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-[#f0ebe3] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-5 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Outils IA Studia
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-gray-900 mb-4">
              Des résultats concrets en{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                2 minutes
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              CV, candidatures, business plans, concours, courriers… Générés par IA, prêts à utiliser.
            </p>
          </div>
        </section>

        {/* Catalogue par catégorie */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {categories.map((cat) => {
              const services = aiServices.filter((s) => s.category === cat)
              if (services.length === 0) return null
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-5">
                    <Zap className="w-4 h-4 text-[#e97e42]" />
                    <h2 className="text-xl font-bold font-heading text-gray-900">{CATEGORY_LABELS[cat]}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {services.map((s) => {
                      const Icon = iconMap[s.iconName] ?? Sparkles
                      return (
                        <Link
                          key={s.slug}
                          href={`/outils/${s.slug}`}
                          className="group relative bg-white rounded-2xl border border-[#f0ebe3] p-6 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: s.couleur }} />
                          {s.badge && (
                            <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: s.couleur }}>
                              {s.badge}
                            </span>
                          )}
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mt-2" style={{ backgroundColor: `${s.couleur}18` }}>
                            <Icon className="w-6 h-6" style={{ color: s.couleur }} />
                          </div>
                          <h3 className="font-bold font-heading text-gray-900 group-hover:text-[#e97e42] transition-colors">{s.titre}</h3>
                          <p className="text-xs font-medium mb-2" style={{ color: s.couleur }}>{s.sousTitre}</p>
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{s.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{s.prixCredits} crédits</span>
                            <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: s.couleur }}>
                              Utiliser <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
