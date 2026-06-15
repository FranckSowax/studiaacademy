'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Sparkles, GraduationCap, FileText, Briefcase, Presentation, Mail, Zap,
  Globe, Palette, Receipt, Megaphone, FileSignature, TrendingUp, BookOpen, PenTool,
  FileCheck, Lightbulb, Compass, AlignLeft, Calculator, HelpCircle, CalendarDays, ListChecks,
  GraduationCap as Cap, Users, Baby, Building2,
} from 'lucide-react'
import { CATEGORY_LABELS, type ServiceCategory } from '@/types/ai-service'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  GraduationCap, FileText, Briefcase, Presentation, Mail,
  Globe, Palette, Receipt, Megaphone, FileSignature, TrendingUp, BookOpen, PenTool,
  FileCheck, Lightbulb, Compass, AlignLeft, Calculator, HelpCircle, CalendarDays, ListChecks,
}

export interface CatalogueService {
  slug: string
  titre: string
  sousTitre: string
  description: string
  couleur: string
  category: ServiceCategory
  badge?: string
  prixCredits: number
  iconName: string
  cover?: string
}

type PersonaId = 'all' | 'eleve' | 'prof' | 'parent' | 'pro'

const PERSONAS: { id: PersonaId; label: string; icon: React.ElementType; cats: ServiceCategory[] | null }[] = [
  { id: 'all', label: 'Tout', icon: Sparkles, cats: null },
  { id: 'eleve', label: 'Élèves', icon: Cap, cats: ['education'] },
  { id: 'prof', label: 'Profs', icon: Users, cats: ['enseignant'] },
  { id: 'parent', label: 'Parents', icon: Baby, cats: ['parent'] },
  { id: 'pro', label: 'Pros', icon: Building2, cats: ['emploi', 'entrepreneuriat', 'admin', 'entreprise'] },
]

const PERSONA_IDS: PersonaId[] = ['all', 'eleve', 'prof', 'parent', 'pro']

export function OutilsCatalogue({ services, initialPersona }: { services: CatalogueService[]; initialPersona?: string }) {
  const start = PERSONA_IDS.includes(initialPersona as PersonaId) ? (initialPersona as PersonaId) : 'all'
  const [persona, setPersona] = useState<PersonaId>(start)

  const counts = useMemo(() => {
    const c: Record<PersonaId, number> = { all: services.length, eleve: 0, prof: 0, parent: 0, pro: 0 }
    for (const p of PERSONAS) {
      if (!p.cats) continue
      c[p.id] = services.filter((s) => p.cats!.includes(s.category)).length
    }
    return c
  }, [services])

  const activeCats = PERSONAS.find((p) => p.id === persona)!.cats
  const orderedCats = (Object.keys(CATEGORY_LABELS) as ServiceCategory[])
    .filter((cat) => !activeCats || activeCats.includes(cat))

  return (
    <section className="py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Onglets persona */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-10 -mx-1 px-1 sm:justify-center [&::-webkit-scrollbar]:hidden">
          {PERSONAS.map((p) => {
            const Icon = p.icon
            const active = persona === p.id
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`flex-none inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all border ${
                  active
                    ? 'text-white border-transparent shadow-md bg-gradient-to-r from-[#e97e42] to-[#d56a2e]'
                    : 'bg-white text-gray-600 border-[#f0ebe3] hover:border-[#e97e42]/40 hover:text-[#a84d16]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {p.label}
                <span className={`text-xs ${active ? 'text-white/80' : 'text-gray-400'}`}>{counts[p.id]}</span>
              </button>
            )
          })}
        </div>

        {/* Catalogue filtré */}
        <div className="space-y-12">
          {orderedCats.map((cat) => {
            const list = services.filter((s) => s.category === cat)
            if (list.length === 0) return null
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-5">
                  <Zap className="w-4 h-4 text-[#e97e42]" />
                  <h2 className="text-xl font-bold font-heading text-gray-900">{CATEGORY_LABELS[cat]}</h2>
                  <span className="text-sm text-gray-400">({list.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {list.map((s) => {
                    const Icon = iconMap[s.iconName] ?? Sparkles
                    return (
                      <Link
                        key={s.slug}
                        href={`/outils/${s.slug}`}
                        className="group relative bg-white rounded-2xl border border-[#f0ebe3] hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
                      >
                        <div className="relative h-36 w-full bg-[#fbf8f3]">
                          {s.cover ? (
                            <>
                              <Image src={s.cover} alt={s.titre} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            </>
                          ) : (
                            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${s.couleur}, ${s.couleur}cc 60%, #1e293b)` }}>
                              <Icon className="absolute right-4 top-4 w-12 h-12 text-white/25" />
                            </div>
                          )}
                          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: s.couleur }} />
                          {s.badge && (
                            <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full text-white shadow" style={{ backgroundColor: s.couleur }}>
                              {s.badge}
                            </span>
                          )}
                          <div className="absolute -bottom-5 left-5 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg border-2 border-white" style={{ backgroundColor: s.couleur }}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="p-5 pt-7 flex-1 flex flex-col">
                          <h3 className="font-bold font-heading text-gray-900 group-hover:text-[#e97e42] transition-colors">{s.titre}</h3>
                          <p className="text-xs font-medium mb-2" style={{ color: s.couleur }}>{s.sousTitre}</p>
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">{s.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{s.prixCredits} crédits</span>
                            <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: s.couleur }}>
                              Utiliser <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
