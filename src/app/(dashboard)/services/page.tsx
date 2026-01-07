'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  TestTube,
  FileText,
  BrainCircuit,
  Users,
  Bot,
  Palette,
  GraduationCap,
  Building2,
  MessageCircle,
  ChevronRight,
  Star,
  Zap,
  Check,
  ArrowRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Icons mapping
const serviceIcons: Record<string, React.ElementType> = {
  'assess': TestTube,
  'create': FileText,
  'analyze': BrainCircuit,
  'interview': Users,
  'assistant': Bot,
  'learn': GraduationCap,
  'business': Building2,
  'community': MessageCircle,
}

// Colors mapping
const serviceColors: Record<string, string> = {
  'assess': '#e97e42',
  'create': '#8B5CF6',
  'analyze': '#EC4899',
  'interview': '#10B981',
  'assistant': '#3B82F6',
  'learn': '#F59E0B',
  'business': '#6366F1',
  'community': '#14B8A6',
}

const services = [
  {
    id: 1,
    name: 'Test de Compétences',
    slug: 'assess',
    category: 'assess',
    description: 'Évaluez vos compétences techniques et comportementales avec nos tests adaptatifs.',
    price: 0,
    freeLimit: 1,
    users: 2340,
    rating: 4.8,
    features: ['Tests adaptatifs', 'Certificat', 'Analyse détaillée'],
  },
  {
    id: 2,
    name: 'Générateur de CV',
    slug: 'create',
    category: 'create',
    description: 'Créez un CV professionnel en quelques minutes avec nos modèles optimisés.',
    price: 2000,
    freeLimit: 1,
    users: 1856,
    rating: 4.7,
    features: ['Modèles pro', 'Optimisé ATS', 'Export PDF'],
  },
  {
    id: 3,
    name: 'Analyse CV par IA',
    slug: 'analyze',
    category: 'create',
    description: 'Obtenez un feedback instantané sur votre CV et des suggestions d\'amélioration.',
    price: 1500,
    freeLimit: 0,
    users: 987,
    rating: 4.9,
    features: ['Score qualité', 'Mots-clés', 'Conseils IA'],
  },
  {
    id: 4,
    name: 'Simulateur d\'Entretien',
    slug: 'interview',
    category: 'ai-tools',
    description: 'Entraînez-vous avec notre IA pour réussir vos entretiens d\'embauche.',
    price: 3000,
    freeLimit: 1,
    users: 654,
    rating: 4.6,
    features: ['Simulation IA', 'Feedback vocal', 'Questions métier'],
  },
  {
    id: 5,
    name: 'Assistant Carrière IA',
    slug: 'assistant',
    category: 'ai-tools',
    description: 'Un coach virtuel disponible 24/7 pour répondre à vos questions professionnelles.',
    price: 0,
    freeLimit: 10,
    users: 3210,
    rating: 4.8,
    features: ['Chat 24/7', 'Conseils perso', 'Orientation'],
  },
  {
    id: 6,
    name: 'Micro-Cours',
    slug: 'learn',
    category: 'learn',
    description: 'Développez vos compétences avec nos modules courts et impactants.',
    price: 5000,
    freeLimit: 0,
    users: 1432,
    rating: 4.7,
    features: ['Modules courts', 'Certificats', 'Quiz interactifs'],
  },
]

const categories = [
  { id: 'all', label: 'Tous', count: services.length },
  { id: 'assess', label: 'Évaluation', count: 1 },
  { id: 'create', label: 'Création', count: 2 },
  { id: 'ai-tools', label: 'Outils IA', count: 2 },
  { id: 'learn', label: 'Formation', count: 1 },
]

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Micro-Services</h1>
          <p className="text-gray-500">Découvrez tous nos outils pour booster votre carrière</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher un service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white'
                  : 'bg-[#fbf8f3] text-gray-600 hover:bg-[#fff7ed] hover:text-[#e97e42]'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Featured Service Banner */}
      <div className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-white/10 rounded-full" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium bg-white/20 px-2 py-0.5 rounded-full">Populaire</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Test de Compétences Gratuit</h2>
            <p className="text-white/80 mb-4 max-w-md">
              Évaluez vos compétences et obtenez une certification reconnue par les recruteurs.
            </p>
            <Link href="/services/assess">
              <Button className="bg-white text-[#e97e42] hover:bg-[#fbf8f3]">
                Commencer gratuitement <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center">
              <TestTube className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const Icon = serviceIcons[service.category] || FileText
          const color = serviceColors[service.category] || '#e97e42'

          return (
            <div
              key={service.id}
              className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] overflow-hidden hover:shadow-lg hover:shadow-[#e97e42]/10 transition-all group"
            >
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" fill="#EAB308" />
                    <span className="text-sm font-semibold text-gray-700">{service.rating}</span>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-[#e97e42] transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {service.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {service.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white px-2 py-1 rounded-lg text-gray-600 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-green-500" />
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{service.users.toLocaleString()} utilisateurs</span>
                  {service.freeLimit > 0 && (
                    <span className="text-green-600 font-medium">
                      {service.freeLimit} essai{service.freeLimit > 1 ? 's' : ''} gratuit{service.freeLimit > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-4 bg-white border-t border-[#f0ebe3] flex items-center justify-between">
                <div>
                  {service.price === 0 ? (
                    <span className="text-lg font-bold text-green-600">Gratuit</span>
                  ) : (
                    <span className="text-lg font-bold text-gray-800">
                      {service.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">XAF</span>
                    </span>
                  )}
                </div>
                <Link href={`/services/${service.slug}`}>
                  <Button
                    className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white"
                  >
                    Accéder <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#fbf8f3] rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun service trouvé</h3>
          <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-800 mb-1">Vous ne trouvez pas ce que vous cherchez ?</h3>
          <p className="text-gray-500 text-sm">Notre assistant IA peut vous aider à trouver le service adapté à vos besoins.</p>
        </div>
        <Link href="/services/assistant">
          <Button variant="outline" className="border-[#e97e42] text-[#e97e42] hover:bg-[#fff7ed] whitespace-nowrap">
            <Bot className="w-4 h-4 mr-2" />
            Parler à l'assistant
          </Button>
        </Link>
      </div>
    </div>
  )
}
