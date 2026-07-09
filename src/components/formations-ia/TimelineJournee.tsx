import { Coffee, Star } from 'lucide-react'
import type { TimelineStep } from '@/lib/formations-ia'

/**
 * Élément signature : la journée 8h30 → 16h30 comme objet graphique
 * vertical, pauses café/déjeuner marquées à l'or Studia.
 */
export function TimelineJournee({
  steps,
  from,
  to,
}: {
  steps: TimelineStep[]
  from: string
  to: string
}) {
  return (
    <div className="relative pl-8">
      <div
        className="absolute bottom-2 left-[9px] top-2 w-[3px] rounded-full"
        style={{ background: `linear-gradient(${from}, ${to})` }}
        aria-hidden
      />
      <ol className="flex flex-col gap-4">
        {steps.map((s) => (
          <li key={s.heure + s.titre} className="relative">
            <span
              className="absolute -left-[27px] top-5 h-[15px] w-[15px] rounded-full border-4 bg-white"
              style={{ borderColor: s.pause ? '#f5b301' : from }}
              aria-hidden
            />
            {s.pause ? (
              <div className="rounded-xl bg-[#fdf3d7] px-5 py-3">
                <p className="flex items-center gap-2 text-sm font-bold text-[#8a6200]">
                  <Coffee className="h-4 w-4" />
                  {s.heure} · {s.titre}
                </p>
              </div>
            ) : (
              <div
                className={`rounded-2xl bg-white p-5 shadow-[0_6px_20px_rgba(20,24,40,0.08)] ${
                  s.phare ? 'ring-2' : ''
                }`}
                style={s.phare ? ({ ['--tw-ring-color' as string]: from } as React.CSSProperties) : undefined}
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide text-white"
                  style={{ background: from }}
                >
                  {s.heure}
                  {s.phare && <Star className="h-3 w-3 fill-[#f5b301] text-[#f5b301]" />}
                </span>
                <h3 className="mt-2 font-heading text-base font-extrabold text-[#141828]">
                  {s.titre}
                </h3>
                {s.description && (
                  <p className="mt-1 text-sm text-[#4a5068]">{s.description}</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
