'use client'

import { MonitorPlay } from 'lucide-react'
import { OuvrirStudiaLiveButton } from './OuvrirStudiaLiveButton'

/**
 * Carte « Studia Live » de l'espace formateur : présente la plateforme
 * et porte le bouton d'entrée. `disponible` vient du serveur ; le bouton
 * revérifie lui-même le droit du compte.
 */
export function CarteStudiaLive({ disponible }: { disponible: boolean }) {
  return (
    <section
      aria-labelledby="carte-studia-live"
      className="rounded-3xl border border-[#f0ebe3] bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff7ed]">
          <MonitorPlay className="h-7 w-7 text-[#e97e42]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="carte-studia-live" className="font-heading text-xl font-bold text-gray-900">
            Studia Live
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Animez vos sessions en salle, suivez vos apprenants et gérez vos cours en ligne. Vous y
            arrivez connecté avec ce compte, sans rien ressaisir.
          </p>
        </div>
        <div className="sm:w-60 sm:flex-shrink-0">
          {disponible ? (
            <OuvrirStudiaLiveButton />
          ) : (
            <p className="rounded-xl bg-[#fbf8f3] px-4 py-3 text-xs leading-snug text-gray-500">
              L&apos;accès à Studia Live n&apos;est pas encore activé sur ce site. Prévenez un administrateur.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
