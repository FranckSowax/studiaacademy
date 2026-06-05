import Link from 'next/link'
import { SECTEURS } from '@/lib/secteurs'
import {
  ArrowRight, ChevronRight, Building2,
  Users, Landmark, ClipboardList, Calculator, ShoppingBag, Megaphone, GraduationCap, HeartPulse,
  Sprout, Rocket, Scale, Wrench,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Users, Landmark, ClipboardList, Calculator, ShoppingBag, Megaphone, GraduationCap, HeartPulse, Sprout, Rocket, Scale, Wrench,
}

export function SecteursSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-[#faf8f5] border-y border-[#f0ebe3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-3 py-1 rounded-full text-sm font-medium mb-3">
            <Building2 className="w-4 h-4" />Pour les pros & les organisations
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900">
            Formez-vous à l&apos;IA selon votre secteur d&apos;activité
          </h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Choisissez votre métier : découvrez des formations et des outils IA qui transforment votre quotidien — en ligne ou en présentiel.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {SECTEURS.map((s) => {
            const Icon = iconMap[s.iconName] ?? Building2
            return (
              <Link key={s.slug} href={`/entreprise/secteur/${s.slug}`}
                className="group relative overflow-hidden bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: s.couleur }} />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${s.couleur}18` }}>
                    <Icon className="w-5 h-5" style={{ color: s.couleur }} />
                  </div>
                  <h3 className="font-bold font-heading text-gray-900 leading-tight mb-1">{s.label}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{s.accroche}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: s.couleur }}>
                    {s.formations.length} formations <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/entreprise" className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-2xl px-6 py-3 font-semibold transition-colors">
            Voir tous les secteurs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
