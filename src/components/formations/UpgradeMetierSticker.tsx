/** Nom public de la collection des formations métier (une par secteur d'activité). */
export const COLLECTION_METIER = 'Upgrade Métier'

/**
 * Sticker posé sur la couverture des formations de la collection « Upgrade Métier ».
 * À placer dans un conteneur `relative` ; `className` règle sa position.
 */
export function UpgradeMetierSticker({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex -rotate-3 items-center rounded-lg bg-[#e97e42] px-3 py-1 font-heading text-xs font-extrabold uppercase tracking-wider text-[#0f0d0b] shadow-lg ring-2 ring-white ${className}`}
    >
      {COLLECTION_METIER}
    </span>
  )
}
