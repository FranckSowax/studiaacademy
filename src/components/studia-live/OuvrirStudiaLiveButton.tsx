'use client'

import { useEffect, useState } from 'react'
import { Loader2, MonitorPlay } from 'lucide-react'
import { cn } from '@/lib/utils'
import { peutOuvrirStudiaLive } from '@/lib/studia-live/etat'

/**
 * « Ouvrir Studia Live » : demande un ticket d'entrée au serveur pour le
 * compte connecté, puis y envoie le navigateur. N'apparaît que pour un
 * compte autorisé, et seulement si la liaison est configurée.
 */
export function OuvrirStudiaLiveButton({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let actif = true
    peutOuvrirStudiaLive()
      .then((ok) => {
        if (actif) setVisible(ok)
      })
      .catch(() => undefined)
    return () => {
      actif = false
    }
  }, [])

  if (!visible) return null

  const ouvrir = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      const reponse = await fetch('/api/studia-live/formateur', { method: 'POST', cache: 'no-store' })
      const donnees = (await reponse.json().catch(() => null)) as { url?: string; message?: string } | null
      if (reponse.ok && donnees?.url) {
        // Le bouton reste désactivé jusqu'au départ de la page.
        window.location.assign(donnees.url)
        return
      }
      setErreur(donnees?.message || "Studia Live n'a pas pu s'ouvrir. Réessayez dans quelques instants.")
    } catch {
      setErreur('Connexion impossible. Vérifiez votre réseau, puis réessayez.')
    }
    setEnCours(false)
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={ouvrir}
        disabled={enCours}
        aria-busy={enCours}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-[#e97e42] to-[#d56a2e] px-4 py-3 text-sm font-semibold text-white transition-opacity',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e97e42] focus-visible:ring-offset-2',
          enCours ? 'cursor-wait opacity-70' : 'hover:opacity-90'
        )}
      >
        {enCours ? <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" /> : <MonitorPlay className="h-5 w-5 flex-shrink-0" />}
        {enCours ? 'Ouverture…' : 'Ouvrir Studia Live'}
      </button>
      {erreur && (
        <p role="alert" className="mt-2 text-xs leading-snug text-red-600">
          {erreur}
        </p>
      )}
    </div>
  )
}
