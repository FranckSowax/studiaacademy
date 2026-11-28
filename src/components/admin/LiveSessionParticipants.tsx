'use client'

import { Fragment, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Download, Loader2, Mail, RotateCw, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { BilanFinales, ParticipantLive } from '@/lib/studia-live/pilotage'
import { envoyerFinalesManquantes, relancerParticipants } from '@/lib/studia-live/pilotage-actions'
import { entier, enTexte, jourHeure, niveauLabel, pct } from '@/lib/studia-live/suivi-regles'

/** Limite du contrat Studia Live pour une relance forcée. */
const RELANCE_MAX = 50
const TH = 'whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'
const TD = 'whitespace-nowrap px-3 py-2.5 text-sm tabular-nums text-gray-700'

const NIVEAU_STYLES: Record<string, string> = {
  maitrise: 'bg-green-50 text-green-700',
  acquis: 'bg-blue-50 text-blue-700',
  en_cours: 'bg-amber-50 text-amber-700',
  a_renforcer: 'bg-red-50 text-red-600',
}

function phraseBilan(b: BilanFinales): string {
  const s = (n: number) => (n > 1 ? 's' : '')
  return [
    `${b.envoyes} e-mail${s(b.envoyes)} envoyé${s(b.envoyes)}`,
    b.echecs > 0 ? `${b.echecs} échec${s(b.echecs)}` : null,
    b.deja > 0 ? `${b.deja} déjà reçu${s(b.deja)}` : null,
    b.sans_email > 0 ? `${b.sans_email} sans e-mail` : null,
    b.academy > 0 ? `${b.academy} relié${s(b.academy)} à un compte Academy` : null,
  ]
    .filter(Boolean)
    .join(', ')
}

const duree = (ms: number | null) => (typeof ms === 'number' && ms > 0 ? `${(ms / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s` : null)

/**
 * Participants d'une session : scores, envoi de la finale, réponses
 * dépliables activité par activité, et les actions d'envoi (finales
 * manquantes, relance d'une sélection, export CSV).
 */
export function LiveSessionParticipants({
  sessionId,
  participants,
  supprimee,
}: {
  sessionId: string
  participants: ParticipantLive[]
  /** Session supprimée dans Studia Live : plus aucun envoi possible. */
  supprimee: boolean
}) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [action, setAction] = useState<'finales' | 'relance' | null>(null)
  const [ouverts, setOuverts] = useState<Set<string>>(new Set())
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [aConfirmer, setAConfirmer] = useState<string[] | null>(null)
  const [info, setInfo] = useState<{ ok: boolean; texte: string } | null>(null)

  const sansFinale = participants.filter((p) => p.email && !p.finale?.envoyee_le).length
  const parId = new Map(participants.map((p) => [p.id, p]))

  const basculer = (ensemble: Set<string>, id: string) => {
    const suivant = new Set(ensemble)
    if (suivant.has(id)) suivant.delete(id)
    else suivant.add(id)
    return suivant
  }

  const envoyerManquantes = () => {
    setInfo(null)
    setAction('finales')
    demarrer(async () => {
      const r = await envoyerFinalesManquantes(sessionId)
      setInfo(r.ok ? { ok: r.bilan.echecs === 0, texte: `Finales manquantes : ${phraseBilan(r.bilan)}.` } : { ok: false, texte: r.error })
      setAction(null)
      router.refresh()
    })
  }

  const relancer = (ids: string[]) => {
    setAConfirmer(null)
    setInfo(null)
    setAction('relance')
    demarrer(async () => {
      const r = await relancerParticipants(sessionId, ids, true)
      setInfo(r.ok ? { ok: r.bilan.echecs === 0, texte: `Relance : ${phraseBilan(r.bilan)}.` } : { ok: false, texte: r.error })
      if (r.ok) setSelection(new Set())
      setAction(null)
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Participants ({participants.length})</h3>
          <p className="text-xs text-muted-foreground">
            {sansFinale > 0
              ? `${sansFinale} participant${sansFinale > 1 ? 's' : ''} avec e-mail n’${sansFinale > 1 ? 'ont' : 'a'} pas encore reçu la finale.`
              : 'Tous les participants joignables ont reçu la finale.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/admin/studia-live/${sessionId}/export`} download>
              <Download className="mr-2 h-4 w-4" />
              Exporter les réponses (CSV)
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={enCours || supprimee || selection.size === 0}
            onClick={() => setAConfirmer([...selection])}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Relancer la sélection{selection.size > 0 ? ` (${selection.size})` : ''}
          </Button>
          <Button size="sm" disabled={enCours || supprimee || sansFinale === 0} onClick={envoyerManquantes}>
            {action === 'finales' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Envoyer les finales manquantes
          </Button>
        </div>
      </div>

      {enCours && action && (
        <div role="status" className="flex items-center gap-2 border-b bg-orange-50 px-4 py-3 text-sm text-[#a84d16]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Envoi en cours par Studia Live : environ 0,6 s par participant, jusqu’à 5 minutes. Gardez cette page ouverte.
        </div>
      )}
      {info && (
        <div
          role="status"
          className={`border-b px-4 py-3 text-sm ${info.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}
        >
          {info.texte}
        </div>
      )}
      {supprimee && (
        <p className="border-b bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Cette session a été supprimée dans Studia Live : les envois ne sont plus possibles, les données restent consultables.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className={TH}><span className="sr-only">Sélection</span></th>
              <th className={TH}>Participant</th>
              <th className={TH}>Niveau</th>
              <th className={TH}>Réussite</th>
              <th className={TH}>Participation</th>
              <th className={TH}>Score</th>
              <th className={TH}>Finale envoyée</th>
              <th className={TH}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => {
              const ouvert = ouverts.has(p.id)
              const coche = selection.has(p.id)
              const reponses = [...(p.reponses ?? [])].sort((a, b) => a.ordre - b.ordre)
              const nom = enTexte(p.prenom) || 'Sans prénom'
              return (
                <Fragment key={p.id}>
                  <tr className="border-b">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner ${nom} pour une relance`}
                        className="h-4 w-4 accent-[#e97e42]"
                        checked={coche}
                        disabled={!p.email || supprimee || (!coche && selection.size >= RELANCE_MAX)}
                        onChange={() => setSelection((s) => basculer(s, p.id))}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        aria-expanded={ouvert}
                        onClick={() => setOuverts((o) => basculer(o, p.id))}
                        className="flex items-center gap-1.5 text-left text-sm font-medium text-gray-900 hover:text-[#a84d16]"
                      >
                        {ouvert ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {nom}
                      </button>
                      <span className="ml-6 block text-xs text-gray-500">{enTexte(p.email) || 'Sans e-mail'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${NIVEAU_STYLES[enTexte(p.niveau)] ?? 'bg-gray-100 text-gray-600'}`}>
                        {niveauLabel(enTexte(p.niveau) || null)}
                      </span>
                    </td>
                    <td className={TD}>{pct(p.reussite_pct)}</td>
                    <td className={TD}>{pct(p.participation_pct)}</td>
                    <td className={TD}>
                      {entier(p.score)}
                      {typeof p.rang === 'number' && <span className="ml-1 text-xs text-gray-400">({p.rang === 1 ? '1er' : `${p.rang}e`})</span>}
                    </td>
                    <td className={TD}>{p.finale?.envoyee_le ? jourHeure(p.finale.envoyee_le) : <span className="text-gray-400">Pas encore</span>}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        {p.academy_user_id && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/users/${p.academy_user_id}`}>
                              <UserRound className="mr-1.5 h-4 w-4" />
                              Fiche Academy
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" disabled={enCours || supprimee || !p.email} onClick={() => setAConfirmer([p.id])}>
                          <RotateCw className="mr-1.5 h-4 w-4" />
                          Relancer
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {ouvert && (
                    <tr className="border-b bg-slate-50/70">
                      <td />
                      <td colSpan={7} className="px-3 py-3">
                        {reponses.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucune réponse nominative.</p>
                        ) : (
                          <ol className="space-y-2">
                            {reponses.map((r, i) => (
                              <li key={`${r.activite_id}-${i}`} className="text-sm">
                                <p className="text-xs font-medium text-gray-500">
                                  {r.ordre}. {enTexte(r.titre)}
                                  {r.correct === true && <span className="ml-2 rounded-full bg-green-50 px-1.5 py-0.5 text-green-700">Juste</span>}
                                  {r.correct === false && <span className="ml-2 rounded-full bg-red-50 px-1.5 py-0.5 text-red-600">Faux</span>}
                                  {typeof r.points === 'number' && r.points > 0 && <span className="ml-2">{entier(r.points)} pts</span>}
                                  {duree(r.temps_ms) && <span className="ml-2">{duree(r.temps_ms)}</span>}
                                  {typeof r.note_ia === 'number' && <span className="ml-2">Note IA : {entier(r.note_ia)}</span>}
                                </p>
                                <p className="whitespace-pre-wrap break-words text-gray-900">{enTexte(r.texte) || '—'}</p>
                              </li>
                            ))}
                          </ol>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {participants.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">Aucun participant.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t px-4 py-2 text-xs text-muted-foreground">
        Une relance renvoie la finale même si elle a déjà été reçue : {RELANCE_MAX} participants au plus par envoi.
      </p>

      <Dialog open={aConfirmer !== null} onOpenChange={(o) => !o && setAConfirmer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relancer {aConfirmer?.length === 1 ? 'ce participant' : `${aConfirmer?.length ?? 0} participants`} ?</DialogTitle>
            <DialogDescription>
              L’e-mail « finale + bilan » sera renvoyé par Studia Live, même s’il a déjà été reçu.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-48 overflow-y-auto text-sm text-gray-700">
            {(aConfirmer ?? []).map((id) => (
              <li key={id} className="truncate">
                {enTexte(parId.get(id)?.prenom) || 'Sans prénom'} — {enTexte(parId.get(id)?.email)}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAConfirmer(null)}>Annuler</Button>
            <Button onClick={() => aConfirmer && relancer(aConfirmer)}>Confirmer la relance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
