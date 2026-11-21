'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flame, MonitorPlay } from 'lucide-react'

interface LiveProgression {
  id: string
  formation_label: string
  points: number
  niveau: string
  exercices_reussis: number
  exercices_total: number
  serie_jours: number
  source_mis_a_jour: string
}

function pourcentage(reussis: number, total: number) {
  if (total <= 0) return 0
  return Math.min(100, Math.round((reussis / total) * 100))
}

/** « Formations en ligne » : progression sur les formations en ligne
 * Studia Live (table live_progressions, alimentée par Studia Live via
 * /api/integrations/studia-live/progression). Rien si aucune ligne. */
export function DashboardLiveProgressions() {
  const [items, setItems] = useState<LiveProgression[] | null>(null)

  useEffect(() => {
    let actif = true
    const supabase = createClient()
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('live_progressions')
        .select(
          'id, formation_label, points, niveau, exercices_reussis, exercices_total, serie_jours, source_mis_a_jour'
        )
        .eq('user_id', user.id)
        .order('source_mis_a_jour', { ascending: false })
        .limit(6)
      if (actif) setItems((data as LiveProgression[] | null) ?? [])
    })()
    return () => {
      actif = false
    }
  }, [])

  if (!items || items.length === 0) return null

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MonitorPlay className="h-5 w-5 text-[#e97e42]" />
        <h2 className="text-lg font-bold text-gray-900">Formations en ligne</h2>
        <span className="ml-auto text-xs font-semibold tracking-widest text-gray-400">STUDIA LIVE</span>
      </div>
      <ul className="space-y-2">
        {items.map((p) => {
          const pct = pourcentage(p.exercices_reussis, p.exercices_total)
          return (
            <li key={p.id} className="rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{p.formation_label}</p>
                  <p className="text-xs text-gray-500">
                    {[
                      p.niveau,
                      `Mis à jour le ${new Date(p.source_mis_a_jour).toLocaleDateString('fr-FR', {
                        dateStyle: 'medium',
                      })}`,
                    ].join(' · ')}
                  </p>
                </div>
                {p.serie_jours > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#e97e42]"
                    title="Série de jours consécutifs"
                  >
                    <Flame className="h-4 w-4" />
                    {p.serie_jours} {p.serie_jours > 1 ? 'jours' : 'jour'}
                  </span>
                )}
                <span className="font-bold text-gray-900">{p.points.toLocaleString('fr-FR')} pts</span>
              </div>
              <div className="mt-3">
                <div
                  className="h-2 overflow-hidden rounded-full bg-gray-100"
                  role="progressbar"
                  aria-label={`Exercices réussis : ${p.exercices_reussis} sur ${p.exercices_total}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #e97e42, #e97e4299)' }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {p.exercices_reussis.toLocaleString('fr-FR')} exercices réussis sur{' '}
                  {p.exercices_total.toLocaleString('fr-FR')}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
