import Link from 'next/link'
import {
  ArrowRight, CheckCircle, FileText, ScanLine, Mic, BarChart2, Bot, Building2, Sparkles,
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
      className="group relative w-full h-full bg-white rounded-2xl border border-[#f0ebe3] p-6 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
    >
      {/* Barre couleur top */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: service.couleur }} />

      {service.badge && (
        <span
          className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: service.couleur }}
        >
          {service.badge}
        </span>
      )}

      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mt-3"
        style={{ backgroundColor: `${service.couleur}18` }}
      >
        <Icon className="w-6 h-6" style={{ color: service.couleur }} />
      </div>

      <h3 className="text-lg font-bold font-heading text-gray-900 mb-1 group-hover:text-[#e97e42] transition-colors">
        {service.titre}
      </h3>
      <p className="text-xs font-medium mb-2" style={{ color: service.couleur }}>
        {service.sousTitre}
      </p>
      <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-3 flex-1">
        {service.description}
      </p>

      <ul className="space-y-1.5 mb-5">
        {service.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2 text-xs text-gray-600">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: service.couleur }} />
            {feat}
          </li>
        ))}
      </ul>

      <div className="flex items-center text-sm font-semibold" style={{ color: service.couleur }}>
        Essayer
        <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}
