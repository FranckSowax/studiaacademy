'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, BarChart, Clock, PlayCircle } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { SECTEURS } from '@/lib/secteurs'

export interface CatalogFormation {
  id: string
  slug: string
  titre: string
  sous_titre: string | null
  categorie: string | null
  niveau: string | null
  duree_estimee: string | null
  prix_fcfa: number
  cover_image: string | null
}

const MAX_VISIBLE = 8
const OTHER = 'Autres formations'
const COLOR_BY_CATEGORY = new Map(SECTEURS.map((s) => [s.label, s.couleur]))
const ORDER = SECTEURS.map((s) => s.label)

function CourseCard({ f }: { f: CatalogFormation }) {
  const cat = f.categorie ?? OTHER
  const color = COLOR_BY_CATEGORY.get(cat) ?? '#e97e42'

  return (
    <Link
      href={`/formations/en-ligne/${f.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#ece4d8] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#e97e42]/50 hover:shadow-[0_18px_40px_-18px_rgba(168,77,22,0.45)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#fbe6d6] to-[#f3ede3]">
        {f.cover_image ? (
          <Image
            src={f.cover_image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PlayCircle className="h-12 w-12 text-[#e97e42]/50" />
          </div>
        )}
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {cat}
        </span>
        <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#e97e42] opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
          <PlayCircle className="h-5 w-5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-[15px] font-bold leading-snug text-gray-900 line-clamp-2 group-hover:text-[#a84d16]">
          {f.titre}
        </h3>
        {f.sous_titre && (
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500 line-clamp-2">{f.sous_titre}</p>
        )}

        <div className="mt-3 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {f.niveau && (
            <span className="inline-flex items-center gap-1">
              <BarChart className="h-3.5 w-3.5" />
              {f.niveau}
            </span>
          )}
          {f.duree_estimee && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {f.duree_estimee}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[#f3ede3] pt-3">
          <span className="font-heading text-base font-extrabold text-gray-900">
            {f.prix_fcfa > 0 ? (
              <>
                {formatNumber(f.prix_fcfa)} <span className="text-xs font-semibold text-gray-500">FCFA</span>
              </>
            ) : (
              <span className="text-emerald-600">Gratuit</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#a84d16]">
            Voir
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * Catalogue des formations en ligne de la page d'accueil :
 * filtres par secteur + grille de cartes de cours.
 */
export function CourseCatalog({ formations }: { formations: CatalogFormation[] }) {
  const [active, setActive] = useState('all')

  const categories = useMemo(() => {
    const set = new Set(formations.map((f) => f.categorie ?? OTHER))
    return [...set].sort((a, b) => {
      const ia = ORDER.indexOf(a)
      const ib = ORDER.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
  }, [formations])

  const filtered = useMemo(
    () => (active === 'all' ? formations : formations.filter((f) => (f.categorie ?? OTHER) === active)),
    [formations, active],
  )
  const visible = filtered.slice(0, MAX_VISIBLE)
  const hidden = filtered.length - visible.length

  const chipClass = (selected: boolean) =>
    `flex-shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      selected
        ? 'border-gray-900 bg-gray-900 text-white'
        : 'border-[#ece4d8] bg-white text-gray-600 hover:border-[#e97e42] hover:text-[#a84d16]'
    }`

  return (
    <div>
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Filtrer les formations par secteur"
          className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <button aria-pressed={active === 'all'} onClick={() => setActive('all')} className={chipClass(active === 'all')}>
            Toutes
          </button>
          {categories.map((c) => (
            <button key={c} aria-pressed={active === c} onClick={() => setActive(c)} className={chipClass(active === c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((f) => (
          <CourseCard key={f.id} f={f} />
        ))}
      </div>

      {hidden > 0 && (
        <p className="mt-6 text-center text-sm text-gray-500">
          + {hidden} autre{hidden > 1 ? 's' : ''} formation{hidden > 1 ? 's' : ''} dans le catalogue
        </p>
      )}
    </div>
  )
}
