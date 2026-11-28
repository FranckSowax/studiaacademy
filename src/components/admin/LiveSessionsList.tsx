'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { synchroniserLive } from '@/lib/studia-live/pilotage-actions'
import {
  entier, jourCourt, jourHeure, noteSur, pct, STATUT_SUIVI_LABELS, STATUT_SUIVI_STYLES, STATUTS_SUIVI, type LigneSuivi,
} from '@/lib/studia-live/suivi-regles'

const SELECT = 'h-9 rounded-xl border border-input bg-white px-3 text-sm'
const TH = 'whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'
const TD = 'whitespace-nowrap px-3 py-2.5 text-sm tabular-nums text-gray-700'

/**
 * Tableau des sessions clôturées de Studia Live suivies dans Academy :
 * synchronisation, filtres (statut, formation, période) et recherche.
 */
export function LiveSessionsList({
  lignes,
  configuree,
  derniereSynchro,
}: {
  lignes: LigneSuivi[]
  /** false : STUDIA_LIVE_URL ou le secret manque. */
  configuree: boolean
  derniereSynchro: string | null
}) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [info, setInfo] = useState<{ ok: boolean; texte: string } | null>(null)
  const [statut, setStatut] = useState('')
  const [formation, setFormation] = useState('')
  const [du, setDu] = useState('')
  const [au, setAu] = useState('')
  const [recherche, setRecherche] = useState('')

  const formations = useMemo(
    () => [...new Set(lignes.map((l) => l.formation_label).filter((f): f is string => !!f))].sort((a, b) => a.localeCompare(b, 'fr')),
    [lignes],
  )

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return lignes.filter((l) => {
      if (statut && l.statut_suivi !== statut) return false
      if (formation && l.formation_label !== formation) return false
      if (du && (!l.date_formation || l.date_formation < du)) return false
      if (au && (!l.date_formation || l.date_formation > au)) return false
      return !q || l.titre.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    })
  }, [lignes, statut, formation, du, au, recherche])

  const synchroniser = () => {
    setInfo(null)
    demarrer(async () => {
      const r = await synchroniserLive()
      if (!r.ok) return setInfo({ ok: false, texte: r.error })
      const b = r.bilan
      const morceaux = [
        `${b.total} session${b.total > 1 ? 's' : ''} clôturée${b.total > 1 ? 's' : ''}`,
        b.nouvelles > 0 ? `${b.nouvelles} nouvelle${b.nouvelles > 1 ? 's' : ''}` : null,
        `${b.details_recharges} détail${b.details_recharges > 1 ? 's' : ''} rechargé${b.details_recharges > 1 ? 's' : ''}`,
        b.details_en_echec > 0 ? `${b.details_en_echec} détail${b.details_en_echec > 1 ? 's' : ''} en échec` : null,
        b.supprimees > 0 ? `${b.supprimees} supprimée${b.supprimees > 1 ? 's' : ''} dans Studia Live` : null,
      ].filter(Boolean)
      setInfo({ ok: b.details_en_echec === 0, texte: `Synchronisation terminée : ${morceaux.join(', ')}.` })
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions Studia Live</h1>
          <p className="text-sm text-muted-foreground">
            Sessions clôturées des formations en présentiel : résultats, rapport au commanditaire et relances.
          </p>
        </div>
        <div className="text-right">
          <Button onClick={synchroniser} disabled={enCours || !configuree}>
            {enCours ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {enCours ? 'Synchronisation…' : 'Synchroniser avec Studia Live'}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            {derniereSynchro ? `Dernière synchronisation : ${jourHeure(derniereSynchro)}` : 'Jamais synchronisé'}
          </p>
        </div>
      </div>

      {!configuree && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Liaison Studia Live non configurée
        </div>
      )}
      {info && (
        <div
          role="status"
          className={`rounded-xl border p-3 text-sm ${info.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}
        >
          {info.texte}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Rechercher par titre ou code</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Titre ou code…" className="pl-9" />
        </label>
        <label className="text-xs text-gray-500">
          Statut
          <select value={statut} onChange={(e) => setStatut(e.target.value)} className={`${SELECT} mt-1 block`}>
            <option value="">Tous</option>
            {STATUTS_SUIVI.map((s) => (
              <option key={s} value={s}>{STATUT_SUIVI_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-500">
          Formation
          <select value={formation} onChange={(e) => setFormation(e.target.value)} className={`${SELECT} mt-1 block max-w-56`}>
            <option value="">Toutes</option>
            {formations.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-500">
          Du
          <input type="date" value={du} onChange={(e) => setDu(e.target.value)} className={`${SELECT} mt-1 block`} />
        </label>
        <label className="text-xs text-gray-500">
          Au
          <input type="date" value={au} onChange={(e) => setAu(e.target.value)} className={`${SELECT} mt-1 block`} />
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className={TH}>Session</th>
              <th className={TH}>Formation</th>
              <th className={TH}>Date</th>
              <th className={TH}>Participants</th>
              <th className={TH}>Indice</th>
              <th className={TH}>Réussite</th>
              <th className={TH}>Participation</th>
              <th className={TH}>Satisfaction</th>
              <th className={TH}>Gain de temps</th>
              <th className={TH}>Finales</th>
              <th className={TH}>Priorités</th>
              <th className={TH}>Suivi</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((l) => {
              const r = l.resume
              const joignables = r.nb_avec_email ?? r.nb_participants
              return (
                <tr key={l.live_session_id} className="border-b last:border-0 hover:bg-orange-50/40">
                  <td className="max-w-72 px-3 py-2.5">
                    <Link href={`/admin/studia-live/${l.live_session_id}`} className="block truncate text-sm font-medium text-gray-900 hover:text-[#a84d16]">
                      {l.titre}
                    </Link>
                    <span className="text-xs text-gray-500">{l.code}</span>
                    {l.supprimee_live_le && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        Supprimée dans Studia Live
                      </span>
                    )}
                  </td>
                  <td className="max-w-48 truncate px-3 py-2.5 text-sm text-gray-700">{l.formation_label ?? '—'}</td>
                  <td className={TD}>{jourCourt(l.date_formation)}</td>
                  <td className={TD}>{entier(r.nb_participants)}</td>
                  <td className={`${TD} font-semibold text-gray-900`}>{entier(r.indice)}</td>
                  <td className={TD}>{pct(r.reussite_moy)}</td>
                  <td className={TD}>{pct(r.participation_moy)}</td>
                  <td className={TD}>{noteSur(r.satisfaction, 5)}</td>
                  <td className={TD}>{pct(r.gain_temps_pct)}</td>
                  <td className={TD}>{typeof r.finales_envoyees === 'number' ? `${r.finales_envoyees}/${joignables ?? '—'}` : '—'}</td>
                  <td className={TD}>
                    {typeof r.priorites === 'number' && r.priorites > 0 ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">{r.priorites}</span>
                    ) : (
                      entier(r.priorites)
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_SUIVI_STYLES[l.statut_suivi]}`}>
                      {STATUT_SUIVI_LABELS[l.statut_suivi]}
                    </span>
                  </td>
                </tr>
              )
            })}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  {lignes.length === 0
                    ? 'Aucune session pour l’instant. Lancez une synchronisation avec Studia Live.'
                    : 'Aucune session ne correspond à ces filtres.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        {visibles.length} session{visibles.length > 1 ? 's' : ''} affichée{visibles.length > 1 ? 's' : ''} sur {lignes.length}.
      </p>
    </div>
  )
}
