import { Flame, Lock } from 'lucide-react'
import { libelleBandeau, type EtatPlaces } from '@/lib/formations/places'

/**
 * Bandeau posé en bas de la couverture d'une formation à places limitées :
 * « Places limitées », ou « Complet » quand il n'y a plus de place.
 * À placer dans un conteneur `relative overflow-hidden` ; ne rend rien si la
 * formation n'est pas limitée (`etat` nul).
 *
 * @example
 * <PlacesLimiteesBandeau etat={etatPlaces(places[f.id]?.max, places[f.id]?.prises)} />
 */
export function PlacesLimiteesBandeau({
  etat,
  className = '',
  variante = 'bandeau',
}: {
  etat: EtatPlaces | null
  className?: string
  /** `pastille` : étiquette en haut à droite, pour les couvertures dont le bas porte déjà un titre. */
  variante?: 'bandeau' | 'pastille'
}) {
  if (!etat) return null
  const Icone = etat.complet ? Lock : Flame
  const forme =
    variante === 'pastille'
      ? 'right-3 top-3 inline-flex rounded-full px-2.5 py-1 shadow-lg ring-2 ring-white'
      : 'inset-x-0 bottom-0 flex justify-center px-2 py-1.5'
  return (
    <span
      className={`pointer-events-none absolute ${forme} items-center gap-1.5 font-heading text-[11px] font-extrabold uppercase tracking-wider text-white ${
        etat.complet ? 'bg-[#141828]/95' : 'bg-[#c2410c]/95'
      } ${className}`}
    >
      <Icone className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      {libelleBandeau(etat)}
    </span>
  )
}
