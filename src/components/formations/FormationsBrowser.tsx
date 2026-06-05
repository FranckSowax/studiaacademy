'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Clock, BarChart, PlayCircle, X } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { HorizontalGallery } from '@/components/sections/HorizontalGallery'
import { SECTEURS } from '@/lib/secteurs'

export interface BrowserFormation {
  id: string
  slug: string
  titre: string
  sous_titre: string | null
  categorie: string | null
  niveau: string | null
  prix_fcfa: number
  cover_image: string | null
}

// Ordre d'affichage des secteurs, puis le reste
const ORDER = SECTEURS.map((s) => s.label)

function Card({ f }: { f: BrowserFormation }) {
  return (
    <Link href={`/formations/en-ligne/${f.slug}`} className="snap-start flex-shrink-0 w-[170px] sm:w-[210px] group">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#e97e42]/20 to-[#7C3AED]/15 border border-[#f0ebe3] mb-2.5">
        {f.cover_image ? (
          <Image src={f.cover_image} alt={f.titre} fill sizes="(max-width:640px) 50vw, 210px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><PlayCircle className="w-10 h-10 text-[#e97e42]/60" /></div>
        )}
        <span className="absolute bottom-2 left-2 bg-white/95 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
          {f.prix_fcfa > 0 ? `${formatNumber(f.prix_fcfa)} FCFA` : 'Gratuit'}
        </span>
      </div>
      <h3 className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2 group-hover:text-[#e97e42] transition-colors">{f.titre}</h3>
      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
        {f.niveau && <span className="inline-flex items-center gap-1"><BarChart className="w-3 h-3" />{f.niveau}</span>}
      </div>
    </Link>
  )
}

export function FormationsBrowser({ formations }: { formations: BrowserFormation[] }) {
  const [q, setQ] = useState('')

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase()
    const filtered = query
      ? formations.filter((f) =>
          f.titre.toLowerCase().includes(query) ||
          (f.sous_titre ?? '').toLowerCase().includes(query) ||
          (f.categorie ?? '').toLowerCase().includes(query))
      : formations

    const byCat = new Map<string, BrowserFormation[]>()
    for (const f of filtered) {
      const cat = f.categorie ?? 'Autres formations'
      const arr = byCat.get(cat) ?? []
      arr.push(f); byCat.set(cat, arr)
    }
    const cats = [...byCat.keys()].sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
    return cats.map((c) => ({ cat: c, items: byCat.get(c)! }))
  }, [formations, q])

  const total = groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <div>
      {/* Recherche */}
      <div className="relative max-w-xl mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une formation, un métier, un secteur…"
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-[#f0ebe3] bg-white focus:border-[#e97e42] focus:outline-none text-sm shadow-sm"
        />
        {q && (
          <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        )}
      </div>

      {q && <p className="text-sm text-gray-500 mb-6">{total} résultat{total > 1 ? 's' : ''} pour « {q} »</p>}

      {total === 0 ? (
        <div className="text-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3]">
          <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune formation trouvée.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.cat}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold font-heading text-gray-900">{g.cat}</h2>
                <span className="text-xs text-gray-400">{g.items.length} formation{g.items.length > 1 ? 's' : ''}</span>
              </div>
              <HorizontalGallery>
                {g.items.map((f) => <Card key={f.id} f={f} />)}
              </HorizontalGallery>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
