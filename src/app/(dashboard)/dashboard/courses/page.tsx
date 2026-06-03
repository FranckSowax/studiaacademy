export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import {
  BookOpen, PlayCircle, CheckCircle, TrendingUp, Clock, ArrowRight,
  GraduationCap, Sparkles,
} from 'lucide-react'
import type { Formation } from '@/types/formation'

interface EnrolledFormation {
  enrollment_id: string
  status: string
  progress: string[]
  formation: Formation
  totalLessons: number
}

export default async function MesFormationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Inscriptions actives/terminées
  const { data: enrollments } = await supabase
    .from('formation_enrollments')
    .select('id, status, progress, formations(*)')
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
    .order('granted_at', { ascending: false })

  const enrolled: EnrolledFormation[] = []
  for (const e of enrollments ?? []) {
    const formation = e.formations as unknown as Formation
    if (!formation) continue
    const { count } = await supabase
      .from('formation_lessons')
      .select('*', { count: 'exact', head: true })
      .eq('formation_id', formation.id)
    enrolled.push({
      enrollment_id: e.id as string,
      status: e.status as string,
      progress: (e.progress as string[]) ?? [],
      formation,
      totalLessons: count ?? 0,
    })
  }

  // KPIs
  const total = enrolled.length
  const enCours = enrolled.filter((e) => {
    const pct = e.totalLessons ? e.progress.length / e.totalLessons : 0
    return pct > 0 && pct < 1
  }).length
  const terminees = enrolled.filter((e) => e.totalLessons > 0 && e.progress.length >= e.totalLessons).length
  const progMoyenne = total
    ? Math.round(
        (enrolled.reduce((s, e) => s + (e.totalLessons ? e.progress.length / e.totalLessons : 0), 0) / total) * 100
      )
    : 0

  // Si 0 formation → suggestions
  let suggestions: Formation[] = []
  if (total === 0) {
    const { data } = await supabase
      .from('formations')
      .select('*')
      .eq('is_published', true)
      .order('ordre', { ascending: true })
      .limit(6)
    suggestions = (data ?? []) as Formation[]
  }

  const kpis = [
    { label: 'Formations', value: total, icon: BookOpen, color: '#e97e42' },
    { label: 'En cours', value: enCours, icon: PlayCircle, color: '#3B82F6' },
    { label: 'Terminées', value: terminees, icon: CheckCircle, color: '#10B981' },
    { label: 'Progression', value: `${progMoyenne}%`, icon: TrendingUp, color: '#8B5CF6' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900">Mes formations</h1>
        <p className="text-gray-500 mt-1">Reprenez là où vous vous êtes arrêté·e.</p>
      </div>

      {total > 0 ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {kpis.map((k) => {
              const Icon = k.icon
              return (
                <div key={k.label} className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${k.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: k.color }} />
                  </div>
                  <p className="text-2xl font-bold font-heading text-gray-900">{k.value}</p>
                  <p className="text-xs text-gray-500">{k.label}</p>
                </div>
              )
            })}
          </div>

          {/* Formations inscrites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrolled.map((e) => {
              const pct = e.totalLessons ? Math.round((e.progress.length / e.totalLessons) * 100) : 0
              const done = pct >= 100
              return (
                <Link
                  key={e.enrollment_id}
                  href={`/apprendre/${e.formation.slug}`}
                  className="group bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all flex"
                >
                  <div className="relative w-28 sm:w-36 flex-shrink-0 bg-[#fbf8f3]">
                    {e.formation.cover_image ? (
                      <Image src={e.formation.cover_image} alt={e.formation.titre} fill sizes="144px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e97e42]/20 to-[#fff7ed] flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-[#e97e42]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 min-w-0">
                    <h3 className="font-bold font-heading text-gray-900 text-sm group-hover:text-[#e97e42] transition-colors line-clamp-2">
                      {e.formation.titre}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{e.progress.length}/{e.totalLessons} leçons
                    </p>
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-semibold text-[#e97e42]">{pct}%</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 group-hover:text-[#e97e42]">
                          {done ? 'Revoir' : pct > 0 ? 'Reprendre' : 'Démarrer'}
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      ) : (
        /* 0 formation → suggestions de souscription */
        <div>
          <div className="bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-3xl p-6 sm:p-8 text-white text-center mb-8">
            <Sparkles className="w-10 h-10 mx-auto mb-3" />
            <h2 className="text-xl sm:text-2xl font-bold font-heading mb-2">Commencez votre première formation</h2>
            <p className="text-white/90 mb-5 max-w-md mx-auto">
              Vous n'êtes inscrit·e à aucune formation pour le moment. Découvrez notre catalogue et lancez-vous !
            </p>
            <Link href="/formations/en-ligne" className="inline-flex items-center gap-2 bg-white text-[#e97e42] px-6 py-3 rounded-xl font-semibold hover:bg-[#fbf8f3] transition-colors">
              Explorer les formations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {suggestions.length > 0 && (
            <>
              <h3 className="font-bold font-heading text-gray-900 mb-4">Suggestions pour vous</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {suggestions.map((f) => (
                  <Link key={f.id} href={`/formations/en-ligne/${f.slug}`}
                    className="group bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className="relative h-32 w-full bg-[#fbf8f3]">
                      {f.cover_image ? (
                        <Image src={f.cover_image} alt={f.titre} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#e97e42]/20 to-[#fff7ed] flex items-center justify-center">
                          <GraduationCap className="w-8 h-8 text-[#e97e42]" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#e97e42] transition-colors line-clamp-2">{f.titre}</h4>
                      <p className="text-xs font-semibold text-[#e97e42] mt-2">
                        {f.prix_fcfa > 0 ? `${formatNumber(f.prix_fcfa)} FCFA` : 'Gratuit'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
