import Link from 'next/link'
import { microServices } from '@/lib/micro-services'
import { MicroServiceCard } from '@/components/sections/MicroServiceCard'
import { Sparkles, ArrowRight, Zap } from 'lucide-react'

export default function ServicesPage() {
  const featured = microServices[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-gray-800">Micro-Services IA</h1>
        <p className="text-gray-500">Des résultats concrets en 2 minutes — générés par IA.</p>
      </div>

      {/* Bannière mise en avant */}
      {featured && (
        <Link
          href={featured.href}
          className="block bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-3xl p-6 text-white relative overflow-hidden hover:shadow-lg transition-all"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium bg-white/20 px-2 py-0.5 rounded-full">
                {featured.badge ?? 'À la une'}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-heading mb-2">{featured.titre}</h2>
            <p className="text-white/85 mb-4 max-w-md">{featured.description}</p>
            <span className="inline-flex items-center gap-2 bg-white text-[#e97e42] px-5 py-2.5 rounded-xl font-semibold">
              Utiliser maintenant <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      )}

      {/* Grille des micro-services (synchronisée avec la home) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#e97e42]" />
          <h2 className="font-bold font-heading text-gray-800">Nos outils</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {microServices.map((service) => (
            <MicroServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </div>

      {/* Lien vers le catalogue complet */}
      <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold font-heading text-gray-800 mb-1">Découvrez tous les outils IA</h3>
          <p className="text-gray-500 text-sm">Candidature, concours, business plan, courriers et bien plus.</p>
        </div>
        <Link
          href="/outils"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap hover:shadow-lg transition-all"
        >
          Voir le catalogue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
