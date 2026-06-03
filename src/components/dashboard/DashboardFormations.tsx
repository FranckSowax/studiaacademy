'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, ArrowRight, GraduationCap, PlayCircle, Sparkles } from 'lucide-react'
import type { Formation } from '@/types/formation'

interface EnrolledCard {
  slug: string
  titre: string
  cover_image: string | null
  pct: number
}

export function DashboardFormations() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState<EnrolledCard[]>([])
  const [suggestions, setSuggestions] = useState<Formation[]>([])

  useEffect(() => {
    let active = true
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: enrollments } = await supabase
        .from('formation_enrollments')
        .select('progress, formations(id, slug, titre, cover_image)')
        .eq('user_id', user.id)
        .in('status', ['active', 'completed'])

      const cards: EnrolledCard[] = []
      for (const e of enrollments ?? []) {
        const f = e.formations as unknown as { id: string; slug: string; titre: string; cover_image: string | null } | null
        if (!f) continue
        const { count } = await supabase
          .from('formation_lessons')
          .select('*', { count: 'exact', head: true })
          .eq('formation_id', f.id)
        const done = ((e.progress as string[]) ?? []).length
        const totalL = count ?? 0
        cards.push({
          slug: f.slug,
          titre: f.titre,
          cover_image: f.cover_image,
          pct: totalL ? Math.round((done / totalL) * 100) : 0,
        })
      }

      if (cards.length === 0) {
        const { data } = await supabase
          .from('formations')
          .select('*')
          .eq('is_published', true)
          .order('ordre', { ascending: true })
          .limit(8)
        if (active) setSuggestions((data ?? []) as Formation[])
      }

      if (active) {
        setEnrolled(cards)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-2xl sm:rounded-3xl p-4 sm:p-6 h-44 animate-pulse" />
    )
  }

  const hasEnrolled = enrolled.length > 0

  return (
    <div className="bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Mes formations</h2>
          <p className="text-xs sm:text-sm text-white/80">
            {hasEnrolled ? 'Reprenez votre apprentissage' : 'Découvrez et souscrivez'}
          </p>
        </div>
        <Link
          href={hasEnrolled ? '/dashboard/courses' : '/formations/en-ligne'}
          className="px-2 sm:px-3 py-1 bg-white text-[#e97e42] rounded-full text-xs sm:text-sm font-medium hover:bg-[#fbf8f3] transition-colors flex items-center gap-1"
        >
          {hasEnrolled ? 'Tout voir' : 'Catalogue'} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {hasEnrolled ? (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
          {enrolled.map((c) => (
            <Link
              key={c.slug}
              href={`/apprendre/${c.slug}`}
              className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all text-gray-800 flex-shrink-0 w-[200px] snap-start"
            >
              <div className="relative h-24 w-full bg-[#fbf8f3]">
                {c.cover_image ? (
                  <Image src={c.cover_image} alt={c.titre} fill sizes="200px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#e97e42]/20 to-[#fff7ed] flex items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-[#e97e42]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-[#e97e42] transition-colors">{c.titre}</h3>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] font-semibold text-[#e97e42]">{c.pct}%</span>
                  <span className="text-[11px] font-semibold text-gray-500 inline-flex items-center gap-0.5">
                    {c.pct > 0 ? 'Reprendre' : 'Démarrer'} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
          {suggestions.map((f) => (
            <Link
              key={f.id}
              href={`/formations/en-ligne/${f.slug}`}
              className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all text-gray-800 flex-shrink-0 w-[200px] snap-start"
            >
              <div className="relative h-24 w-full bg-[#fbf8f3]">
                {f.cover_image ? (
                  <Image src={f.cover_image} alt={f.titre} fill sizes="200px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#e97e42]/20 to-[#fff7ed] flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-[#e97e42]" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-[#e97e42] transition-colors">{f.titre}</h3>
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-[#e97e42]">
                  Découvrir <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white/10 rounded-2xl p-6 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-white/80" />
          <p className="text-sm text-white/90 mb-3">Nos premières formations arrivent bientôt.</p>
          <Link href="/formations" className="inline-flex items-center gap-1 bg-white text-[#e97e42] px-4 py-2 rounded-xl text-sm font-semibold">
            Voir nos formations <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
