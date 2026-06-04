import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowUpRight, FileText, ScanLine, Mic, BarChart2, Bot, Building2, Sparkles,
} from 'lucide-react'
import type { MicroService } from '@/lib/micro-services'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  FileText, ScanLine, Mic, BarChart2, Bot, Building2,
}

export function MicroServiceCard({ service }: { service: MicroService }) {
  const Icon = iconMap[service.iconName] ?? Sparkles
  return (
    <Link
      href={service.href}
      className="group relative w-full h-[400px] flex flex-col bg-white rounded-3xl border border-[#f0ebe3] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300"
    >
      {/* Cover — s'agrandit au survol */}
      <div className="relative w-full h-[280px] group-hover:h-[330px] overflow-hidden transition-all duration-300 ease-out">
        <Image
          src={service.coverImage}
          alt={service.titre}
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover scale-105 group-hover:scale-100 transition-transform duration-500 ease-out"
        />
        {/* Voile dégradé bas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {/* Badge */}
        {service.badge && (
          <span
            className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full text-white shadow-lg"
            style={{ backgroundColor: service.couleur }}
          >
            {service.badge}
          </span>
        )}

        {/* Pastille icône */}
        <div
          className="absolute bottom-3 left-3 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg"
          style={{ backgroundColor: `${service.couleur}cc` }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Zone info → glisse au survol pour révéler le CTA */}
      <article className="relative flex-grow overflow-hidden">
        <div className="absolute inset-0 p-4 transition-transform duration-300 ease-out group-hover:-translate-y-16">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: service.couleur }}>
            {service.sousTitre}
          </p>
          <h3 className="font-bold font-heading text-gray-900 leading-tight">{service.titre}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{service.description}</p>
        </div>

        {/* CTA révélé au survol */}
        <div className="absolute left-4 right-4 -bottom-12 opacity-0 group-hover:bottom-3 group-hover:opacity-100 transition-all duration-300 ease-out">
          <span
            className="flex items-center justify-between w-full rounded-xl px-4 py-2.5 text-white text-sm font-semibold shadow-md"
            style={{ background: `linear-gradient(135deg, ${service.couleur}, ${service.couleur}cc)` }}
          >
            Essayer le service
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </article>
    </Link>
  )
}
