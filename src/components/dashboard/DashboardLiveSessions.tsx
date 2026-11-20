'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Presentation, PlayCircle } from 'lucide-react'

interface LiveParticipation {
  id: string
  session_titre: string
  formation_label: string | null
  date_formation: string | null
  score: number
  rang: number | null
  nb_participants: number | null
  lien_finale: string | null
}

function rangTexte(r: number) {
  return r === 1 ? '1er' : `${r}e`
}

/** « Mes formations en présentiel » : sessions Studia Live reliées au
 * compte (table live_participations, alimentée par Studia Live). */
export function DashboardLiveSessions() {
  const [items, setItems] = useState<LiveParticipation[] | null>(null)

  useEffect(() => {
    let actif = true
    const supabase = createClient()
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('live_participations')
        .select('id, session_titre, formation_label, date_formation, score, rang, nb_participants, lien_finale')
        .eq('user_id', user.id)
        .order('date_formation', { ascending: false })
        .limit(6)
      if (actif) setItems((data as LiveParticipation[] | null) ?? [])
    })()
    return () => {
      actif = false
    }
  }, [])

  if (!items || items.length === 0) return null

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Presentation className="h-5 w-5 text-[#e97e42]" />
        <h2 className="text-lg font-bold text-gray-900">Mes formations en présentiel</h2>
        <span className="ml-auto text-xs font-semibold tracking-widest text-gray-400">STUDIA LIVE</span>
      </div>
      <ul className="space-y-2">
        {items.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-900">{p.session_titre}</p>
              <p className="text-xs text-gray-500">
                {[
                  p.formation_label,
                  p.date_formation
                    ? new Date(`${p.date_formation}T12:00:00`).toLocaleDateString('fr-FR', {
                        dateStyle: 'medium',
                      })
                    : null,
                  p.rang && p.nb_participants ? `${rangTexte(p.rang)} sur ${p.nb_participants}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <span className="font-bold text-gray-900">{p.score.toLocaleString('fr-FR')} pts</span>
            {p.lien_finale && (
              <a
                href={p.lien_finale}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-[#e97e42] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <PlayCircle className="h-4 w-4" /> Ma finale
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
