import Link from 'next/link'
import { ArrowRight, GraduationCap, ClipboardList, Heart, Sparkles, CheckCircle } from 'lucide-react'
import { aiServices } from '@/lib/ai-services/definitions'
import type { ServiceCategory } from '@/types/ai-service'

const GROUPS: {
  id: string
  cat: ServiceCategory
  label: string
  pitch: string
  icon: React.ElementType
  color: string
}[] = [
  { id: 'eleve', cat: 'education', label: 'Élèves & étudiants', pitch: 'Réviser, s’entraîner, réussir ses examens.', icon: GraduationCap, color: '#3B82F6' },
  { id: 'prof', cat: 'enseignant', label: 'Enseignants', pitch: 'Préparer cours, sujets et évaluations en minutes.', icon: ClipboardList, color: '#16A34A' },
  { id: 'parent', cat: 'parent', label: 'Parents', pitch: 'Accompagner son enfant, sereinement.', icon: Heart, color: '#F59E0B' },
]

export function PersonaHighlight() {
  return (
    <section className="w-full py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Nouveau
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-gray-900 mb-4">
            Studia pour{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
              toute la famille
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Des outils IA pensés pour les élèves, les enseignants et les parents — au-delà des outils pros.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GROUPS.map((g) => {
            const list = aiServices.filter((s) => s.category === g.cat)
            const examples = list.slice(0, 3)
            const Icon = g.icon
            return (
              <Link
                key={g.id}
                href={`/outils?p=${g.id}`}
                className="group relative bg-[#fbf8f3] rounded-3xl p-7 border border-[#f0ebe3] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${g.color}18` }}>
                    <Icon className="w-6 h-6" style={{ color: g.color }} />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: g.color }}>
                    {list.length} outils
                  </span>
                </div>
                <h3 className="text-xl font-bold font-heading text-gray-900">{g.label}</h3>
                <p className="text-sm text-gray-500 mb-4">{g.pitch}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {examples.map((s) => (
                    <li key={s.slug} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-none" style={{ color: g.color }} />
                      {s.titre}
                    </li>
                  ))}
                </ul>

                <span className="inline-flex items-center gap-1.5 font-semibold text-sm" style={{ color: g.color }}>
                  Découvrir les outils
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
