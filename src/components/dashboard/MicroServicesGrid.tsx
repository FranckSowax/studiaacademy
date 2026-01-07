'use client'

import Link from 'next/link'
import {
  ChevronRight,
  TestTube,
  FileText,
  BrainCircuit,
  Users,
  Bot,
  Palette,
} from 'lucide-react'
import type { Service } from '@/types/database'

// Mapping des icônes par slug
const serviceIcons: Record<string, React.ElementType> = {
  'competency-test': TestTube,
  'cv-builder': FileText,
  'cv-analysis': BrainCircuit,
  'interview-simulator': Users,
  'career-assistant': Bot,
  'logo-creator': Palette,
}

// Couleurs par service
const serviceColors: Record<string, string> = {
  'competency-test': '#e97e42',
  'cv-builder': '#8B5CF6',
  'cv-analysis': '#EC4899',
  'interview-simulator': '#10B981',
  'career-assistant': '#3B82F6',
  'logo-creator': '#d56a2e',
}

interface MicroServicesGridProps {
  services?: Service[]
  isLoading?: boolean
}

// Données de démonstration
const demoServices = [
  { id: '1', slug: 'competency-test', name: 'Test de Compétences', isFree: true, users: 2340 },
  { id: '2', slug: 'cv-builder', name: 'Générateur de CV', isFree: true, users: 1856 },
  { id: '3', slug: 'cv-analysis', name: 'Analyse CV par IA', isFree: false, price: 1500, users: 987 },
  { id: '4', slug: 'interview-simulator', name: 'Simulation Entretien', isFree: false, price: 5000, users: 654 },
  { id: '5', slug: 'career-assistant', name: 'Assistant Carrière IA', isFree: true, users: 3210 },
  { id: '6', slug: 'logo-creator', name: 'Création Logo Express', isFree: false, price: 10000, users: 432 },
]

export function MicroServicesGrid({ services, isLoading }: MicroServicesGridProps) {
  // Utiliser les données de démo si pas de données réelles
  const displayServices = services?.length
    ? services.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name_fr,
        isFree: s.price_credits === 0,
        price: s.price_credits,
        users: s.usage_count,
      }))
    : demoServices

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 italic">Micro-Services Populaires</h2>
          <Link
            href="/services"
            className="text-[#e97e42] font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-[#f0ebe3] animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 italic">Micro-Services Populaires</h2>
        <Link
          href="/services"
          className="text-[#e97e42] font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          Voir tout <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayServices.map((service) => {
          const Icon = serviceIcons[service.slug] || FileText
          const color = serviceColors[service.slug] || '#e97e42'

          return (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="bg-white rounded-2xl p-4 border border-[#f0ebe3] hover:shadow-lg hover:shadow-[#e97e42]/10 transition-all cursor-pointer group hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-sm group-hover:text-[#e97e42] transition-colors">
                    {service.name}
                  </h4>
                  <p className="text-xs text-gray-400">{service.users.toLocaleString()} utilisations</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                {service.isFree ? (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    Gratuit
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#e97e42] bg-[#fff7ed] px-2 py-1 rounded-lg">
                    {service.price} Crédits
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#e97e42] transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
