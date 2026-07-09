import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { FormationIA } from '@/lib/formations-ia'
import { fcfa } from '@/lib/formations-ia'

export function FormationCard({ formation }: { formation: FormationIA }) {
  const f = formation
  return (
    <Link
      href={`/formations-ia/${f.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(20,24,40,0.10)] transition-transform hover:-translate-y-1"
    >
      <div
        className="p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${f.from}, ${f.to})` }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-85">
          {f.code} · {f.tag}
        </p>
        <h3 className="mt-1.5 font-heading text-xl font-extrabold leading-tight">
          {f.titre}
        </h3>
        <p className="mt-2 text-sm font-semibold italic opacity-95">
          « {f.promesse} »
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="text-sm text-[#4a5068]">
          <b className="text-[#141828]">Pour :</b> {f.publicCible}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-bold text-[#141828]">
            {f.prixFcfa ? fcfa(f.prixFcfa) : 'Sur devis'}
          </span>
          <span
            className="inline-flex items-center gap-1 text-sm font-semibold transition-colors"
            style={{ color: f.executive ? '#f5b301' : f.from }}
          >
            Découvrir
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
