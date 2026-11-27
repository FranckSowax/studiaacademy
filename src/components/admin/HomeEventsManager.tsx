'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays, Eye, EyeOff, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveReglagesEvenements, setEvenementAccueil } from '@/lib/events/actions'
import {
  EVENEMENTS_MAX_MAX, EVENEMENTS_MAX_MIN, estAfficheAccueil, type ReglagesEvenements,
} from '@/lib/home/event-settings'

const FUSEAU = 'Africa/Libreville'

export interface EvenementAccueil {
  id: string
  titre: string
  date_debut: string
  lieu: string | null
  ville: string | null
  afficher_accueil?: boolean | null
}

const date = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { timeZone: FUSEAU, weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Réglages de la section « Événements » de la page d'accueil : nombre
 * d'événements, journées IA, et choix des événements à afficher.
 *
 * `evenements` : les événements publiés et à venir, du plus proche au plus lointain.
 */
export function HomeEventsManager({
  reglages,
  evenements,
}: {
  reglages: ReglagesEvenements
  evenements: EvenementAccueil[]
}) {
  const router = useRouter()
  const [max, setMax] = useState(reglages.max)
  const [journeesIa, setJourneesIa] = useState(reglages.journeesIa)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)

  const modifie = max !== reglages.max || journeesIa !== reglages.journeesIa
  const affiches = evenements.filter((e) => estAfficheAccueil(e))

  const enregistrer = async () => {
    setSaving(true)
    setMessage(null)
    const res = await saveReglagesEvenements({ max, journeesIa })
    setSaving(false)
    setMessage(res.success ? { ok: true, texte: 'Réglages enregistrés.' } : { ok: false, texte: res.error ?? "L'enregistrement a échoué." })
    if (res.success) router.refresh()
  }

  const basculer = async (e: EvenementAccueil) => {
    setBusy(e.id)
    setMessage(null)
    const res = await setEvenementAccueil(e.id, !estAfficheAccueil(e))
    setBusy(null)
    if (!res.success) setMessage({ ok: false, texte: res.error ?? "L'opération a échoué." })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Réglages */}
      <div className="space-y-4 rounded-2xl border bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Nombre d&apos;événements dans l&apos;agenda
            <select
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm focus:border-[#e97e42] focus:outline-none"
            >
              {Array.from({ length: EVENEMENTS_MAX_MAX - EVENEMENTS_MAX_MIN + 1 }, (_, i) => i + EVENEMENTS_MAX_MIN).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Les plus proches dans le temps sont affichés en premier.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={journeesIa}
              onChange={(e) => setJourneesIa(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#e97e42]"
            />
            <span>
              Afficher les journées IA
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Leurs prochaines dates dans l&apos;agenda et les quatre vignettes à droite.
              </span>
            </span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={enregistrer} disabled={!modifie || saving} className="bg-[#e97e42] text-white hover:bg-[#d56a2e]">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Enregistrer
          </Button>
          {message && (
            <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
              {message.texte}
            </p>
          )}
        </div>
      </div>

      {/* Événements à venir */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {evenements.length} événement{evenements.length > 1 ? 's' : ''} publié{evenements.length > 1 ? 's' : ''} à venir ·{' '}
          {affiches.length} sélectionné{affiches.length > 1 ? 's' : ''} pour l&apos;accueil
        </p>
        <Link href="/admin/evenements" className="inline-flex items-center gap-1 text-sm font-medium text-[#a84d16] hover:underline">
          Gérer les événements <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className="space-y-2">
        {evenements.map((e) => {
          const affiche = estAfficheAccueil(e)
          const rang = affiche ? affiches.indexOf(e) : -1
          const horsLimite = affiche && rang >= reglages.max
          return (
            <li key={e.id} className="flex items-center gap-3 rounded-xl border bg-white p-3">
              <CalendarDays className="h-4 w-4 flex-shrink-0 text-[#e97e42]" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.titre}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {date(e.date_debut)} · {e.lieu || e.ville || 'Lieu à préciser'}
                </p>
              </div>
              {horsLimite && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700" title="D'autres événements plus proches occupent déjà les places de l'agenda.">
                  Au-delà de la limite
                </span>
              )}
              <button
                onClick={() => void basculer(e)}
                disabled={busy !== null}
                aria-label={affiche ? `Retirer ${e.titre} de l'accueil` : `Afficher ${e.titre} sur l'accueil`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                  affiche ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {busy === e.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : affiche ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {affiche ? "Sur l'accueil" : 'Masqué'}
              </button>
            </li>
          )
        })}
        {evenements.length === 0 && (
          <li className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
            Aucun événement publié à venir. Créez-en un dans l&apos;onglet Événements.
          </li>
        )}
      </ul>
    </div>
  )
}
