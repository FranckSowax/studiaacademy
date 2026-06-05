'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, BarChart, PlayCircle, X } from 'lucide-react'
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

const ORDER = SECTEURS.map((s) => s.label)

const PRIX_OPTIONS: { key: string; label: string; test: (p: number) => boolean }[] = [
  { key: 'all', label: 'Tous les prix', test: () => true },
  { key: 'free', label: 'Gratuit', test: (p) => p === 0 },
  { key: 'lt60', label: '≤ 60k', test: (p) => p > 0 && p <= 60000 },
  { key: '60-100', label: '60–100k', test: (p) => p > 60000 && p <= 100000 },
  { key: 'gt100', label: '> 100k', test: (p) => p > 100000 },
]

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
  const [secteur, setSecteur] = useState('all')
  const [niveau, setNiveau] = useState('all')
  const [prix, setPrix] = useState('all')

  // Options dynamiques
  const secteurs = useMemo(() => {
    const set = new Set(formations.map((f) => f.categorie ?? 'Autres formations'))
    return [...set].sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1; if (ib === -1) return -1; return ia - ib
    })
  }, [formations])
  const niveaux = useMemo(() => [...new Set(formations.map((f) => f.niveau).filter(Boolean) as string[])].sort(), [formations])

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase()
    const prixTest = PRIX_OPTIONS.find((o) => o.key === prix)?.test ?? (() => true)
    const filtered = formations.filter((f) => {
      const cat = f.categorie ?? 'Autres formations'
      if (secteur !== 'all' && cat !== secteur) return false
      if (niveau !== 'all' && f.niveau !== niveau) return false
      if (!prixTest(f.prix_fcfa)) return false
      if (query && !(
        f.titre.toLowerCase().includes(query) ||
        (f.sous_titre ?? '').toLowerCase().includes(query) ||
        cat.toLowerCase().includes(query))) return false
      return true
    })

    const byCat = new Map<string, BrowserFormation[]>()
    for (const f of filtered) {
      const cat = f.categorie ?? 'Autres formations'
      const arr = byCat.get(cat) ?? []
      arr.push(f); byCat.set(cat, arr)
    }
    const cats = [...byCat.keys()].sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1; if (ib === -1) return -1; return ia - ib
    })
    return cats.map((c) => ({ cat: c, items: byCat.get(c)! }))
  }, [formations, q, secteur, niveau, prix])

  const total = groups.reduce((s, g) => s + g.items.length, 0)
  const hasFilters = secteur !== 'all' || niveau !== 'all' || prix !== 'all' || q.trim() !== ''
  const reset = () => { setQ(''); setSecteur('all'); setNiveau('all'); setPrix('all') }

  return (
    <div>
      {/* Recherche */}
      <div className="relative max-w-xl mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une formation, un métier, un secteur…"
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-[#f0ebe3] bg-white focus:border-[#e97e42] focus:outline-none text-sm shadow-sm"
        />
        {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={secteur} onChange={(e) => setSecteur(e.target.value)} className="rounded-xl border border-[#f0ebe3] bg-white px-3 py-2 text-sm focus:border-[#e97e42] focus:outline-none">
          <option value="all">Tous les secteurs</option>
          {secteurs.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className="rounded-xl border border-[#f0ebe3] bg-white px-3 py-2 text-sm focus:border-[#e97e42] focus:outline-none">
          <option value="all">Tous les niveaux</option>
          {niveaux.map((nv) => <option key={nv} value={nv}>{nv}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          {PRIX_OPTIONS.map((o) => (
            <button key={o.key} onClick={() => setPrix(o.key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${prix === o.key ? 'bg-[#e97e42] text-white border-[#e97e42]' : 'bg-white text-gray-600 border-[#f0ebe3] hover:border-[#e97e42]'}`}>
              {o.label}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button onClick={reset} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#e97e42]"><X className="w-4 h-4" />Réinitialiser</button>
        )}
        <span className="ml-auto text-sm text-gray-400">{total} formation{total > 1 ? 's' : ''}</span>
      </div>

      {total === 0 ? (
        <div className="text-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3]">
          <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune formation ne correspond à ces critères.</p>
          {hasFilters && <button onClick={reset} className="mt-3 text-[#e97e42] font-semibold hover:underline">Réinitialiser les filtres</button>}
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
