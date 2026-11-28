'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarClock, ExternalLink, Link2Off, Loader2, Pencil, Plus, Radio, RefreshCw, Search, Tag, UserRound } from 'lucide-react'
import { EntrepriseFormDialog } from '@/components/admin/EntreprisesList'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { actualiserEtiquettes, detacherSession, rattacherSessions, type SessionARattacher } from '@/lib/entreprise/dossier-actions'
import type {
  Entreprise, ParticipantEntreprise, SessionDisponible, SessionEntreprise,
} from '@/lib/entreprise/dossier-regles'
import { entier, jourLong, niveauLabel, noteSur, pct } from '@/lib/studia-live/suivi-regles'

type Info = { ok: boolean; texte: string } | null

function Message({ info }: { info: Info }) {
  if (!info) return null
  return (
    <div
      role="status"
      className={`rounded-xl border p-3 text-sm ${info.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}
    >
      {info.texte}
    </div>
  )
}

const Pastille = ({ etat }: { etat: 'passee' | 'a_venir' }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${etat === 'a_venir' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
    {etat === 'a_venir' ? 'À venir' : 'Passée'}
  </span>
)

/** Bouton « Modifier » de l'en-tête de la fiche. */
export function EntrepriseModifier({ entreprise, responsables }: { entreprise: Entreprise; responsables: { id: string; nom: string }[] }) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOuvert(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Modifier
      </Button>
      {ouvert && <EntrepriseFormDialog ouvert fermer={() => setOuvert(false)} entreprise={entreprise} responsables={responsables} />}
    </>
  )
}

/**
 * Sessions rattachées à une entreprise : liste, rattachement (sessions
 * Studia Live clôturées et événements) et détachement.
 */
export function EntrepriseSessions({
  entrepriseId,
  sessions,
  disponibles,
}: {
  entrepriseId: string
  sessions: SessionEntreprise[]
  disponibles: SessionDisponible[]
}) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [info, setInfo] = useState<Info>(null)
  const [choix, setChoix] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<'toutes' | 'passee' | 'a_venir'>('toutes')
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [aDetacher, setADetacher] = useState<SessionEntreprise | null>(null)
  const [erreurChoix, setErreurChoix] = useState<string | null>(null)

  const cle = (s: { source: string; session_id: string }) => `${s.source}:${s.session_id}`
  const proposees = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return disponibles.filter(
      (s) =>
        (filtre === 'toutes' || s.etat === filtre) &&
        (!q || s.titre.toLowerCase().includes(q) || (s.code ?? '').toLowerCase().includes(q) || (s.formation ?? '').toLowerCase().includes(q)),
    )
  }, [disponibles, recherche, filtre])

  const ouvrirChoix = () => {
    setSelection(new Set())
    setRecherche('')
    setErreurChoix(null)
    setChoix(true)
  }

  const rattacher = () => {
    setErreurChoix(null)
    const liste: SessionARattacher[] = disponibles.filter((s) => selection.has(cle(s))).map((s) => ({ source: s.source, session_id: s.session_id }))
    demarrer(async () => {
      const r = await rattacherSessions(entrepriseId, liste)
      if (!r.ok) return setErreurChoix(r.error)
      setChoix(false)
      setInfo({
        ok: true,
        texte: `${r.rattachees} session${r.rattachees > 1 ? 's' : ''} rattachée${r.rattachees > 1 ? 's' : ''}. ${r.etiquetes} compte${r.etiquetes > 1 ? 's' : ''} Academy porte${r.etiquetes > 1 ? 'nt' : ''} l’étiquette de l’entreprise.`,
      })
      router.refresh()
    })
  }

  const detacher = (s: SessionEntreprise) => {
    setADetacher(null)
    demarrer(async () => {
      const r = await detacherSession(entrepriseId, s.lien_id)
      setInfo(r.ok ? { ok: true, texte: `« ${s.titre} » n’est plus rattachée à l’entreprise.` } : { ok: false, texte: r.error })
      if (r.ok) router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Sessions ({sessions.length})</h2>
          <p className="text-xs text-muted-foreground">Sessions Studia Live clôturées et événements en présentiel à venir.</p>
        </div>
        <Button size="sm" disabled={enCours} onClick={ouvrirChoix}>
          <Plus className="mr-2 h-4 w-4" />
          Rattacher des sessions
        </Button>
      </div>

      {info && <div className="border-b p-3"><Message info={info} /></div>}

      {sessions.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Aucune session rattachée. Commencez par les sessions déjà animées pour cette entreprise.
        </p>
      ) : (
        <ul className="divide-y">
          {sessions.map((s) => (
            <li key={s.lien_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#fff7ed] text-[#a84d16]">
                {s.source === 'live' ? <Radio className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-gray-900">{s.titre}</span>
                  <Pastille etat={s.etat} />
                  {s.supprimee_live && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">Supprimée dans Studia Live</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {[
                    jourLong(s.date),
                    s.formation,
                    s.code,
                    s.etat === 'a_venir'
                      ? `${entier(s.places_total)} places`
                      : typeof s.participants === 'number'
                        ? `${entier(s.participants)} participant${s.participants > 1 ? 's' : ''}`
                        : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {s.source === 'live' && (
                <dl className="hidden gap-4 text-right text-xs text-gray-500 sm:flex">
                  <div><dt>Indice</dt><dd className="text-sm font-semibold tabular-nums text-gray-900">{entier(s.resume.indice)}</dd></div>
                  <div><dt>Réussite</dt><dd className="text-sm font-semibold tabular-nums text-gray-900">{pct(s.resume.reussite_moy)}</dd></div>
                  <div><dt>Satisfaction</dt><dd className="text-sm font-semibold tabular-nums text-gray-900">{noteSur(s.resume.satisfaction, 5)}</dd></div>
                </dl>
              )}
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={s.source === 'live' ? `/admin/studia-live/${s.session_id}` : '/admin/evenements'}>
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Ouvrir
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" disabled={enCours} onClick={() => setADetacher(s)} aria-label={`Détacher ${s.titre}`}>
                  <Link2Off className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={choix} onOpenChange={(o) => !enCours && setChoix(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rattacher des sessions</DialogTitle>
            <DialogDescription>
              Seules les sessions qui n’appartiennent encore à aucune entreprise sont proposées.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <label className="relative min-w-52 flex-1">
              <span className="sr-only">Rechercher une session</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Titre, code ou formation…" className="pl-9" />
            </label>
            <div className="flex rounded-xl border p-0.5 text-sm" role="group" aria-label="Filtrer les sessions">
              {([['toutes', 'Toutes'], ['passee', 'Passées'], ['a_venir', 'À venir']] as const).map(([valeur, libelle]) => (
                <button
                  key={valeur}
                  type="button"
                  aria-pressed={filtre === valeur}
                  onClick={() => setFiltre(valeur)}
                  className={`rounded-lg px-3 py-1 ${filtre === valeur ? 'bg-[#fff7ed] font-medium text-[#a84d16]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {libelle}
                </button>
              ))}
            </div>
          </div>

          <ul className="max-h-[46vh] divide-y overflow-y-auto rounded-xl border">
            {proposees.map((s) => {
              const id = cle(s)
              const coche = selection.has(id)
              return (
                <li key={id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-orange-50/50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#e97e42]"
                      checked={coche}
                      onChange={() =>
                        setSelection((sel) => {
                          const suivant = new Set(sel)
                          if (suivant.has(id)) suivant.delete(id)
                          else suivant.add(id)
                          return suivant
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">{s.titre}</span>
                        <Pastille etat={s.etat} />
                      </span>
                      <span className="block text-xs text-gray-500">
                        {[
                          jourLong(s.date),
                          s.source === 'live' ? `Studia Live ${s.code ?? ''}`.trim() : 'Événement',
                          s.formation,
                          typeof s.participants === 'number' ? `${entier(s.participants)} ${s.etat === 'a_venir' ? 'places' : 'participants'}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
            {proposees.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                {disponibles.length === 0
                  ? 'Toutes les sessions sont déjà rattachées. Synchronisez Studia Live ou créez un événement.'
                  : 'Aucune session ne correspond à cette recherche.'}
              </li>
            )}
          </ul>

          {erreurChoix && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurChoix}</p>}

          <DialogFooter>
            <Button variant="outline" disabled={enCours} onClick={() => setChoix(false)}>Annuler</Button>
            <Button disabled={enCours || selection.size === 0} onClick={rattacher}>
              {enCours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rattacher{selection.size > 0 ? ` ${selection.size} session${selection.size > 1 ? 's' : ''}` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aDetacher !== null} onOpenChange={(o) => !o && setADetacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détacher cette session ?</DialogTitle>
            <DialogDescription>
              « {aDetacher?.titre} » ne fera plus partie du dossier. Ses participants perdront l’étiquette de l’entreprise s’ils ne
              viennent d’aucune autre session. La session elle-même n’est pas supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setADetacher(null)}>Annuler</Button>
            <Button onClick={() => aDetacher && detacher(aDetacher)}>Détacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/**
 * Participants des sessions Studia Live de l'entreprise, dédoublonnés,
 * avec l'état de leur étiquette sur leur compte Academy.
 */
export function EntrepriseParticipants({
  entrepriseId,
  participants,
  etiquetes,
}: {
  entrepriseId: string
  participants: ParticipantEntreprise[]
  etiquetes: string[]
}) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [info, setInfo] = useState<Info>(null)
  const [recherche, setRecherche] = useState('')
  const portent = useMemo(() => new Set(etiquetes), [etiquetes])
  const sansCompte = participants.filter((p) => !p.academy_user_id).length

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return q ? participants.filter((p) => (p.prenom ?? '').toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q)) : participants
  }, [participants, recherche])

  const actualiser = () => {
    setInfo(null)
    demarrer(async () => {
      const r = await actualiserEtiquettes(entrepriseId)
      setInfo(
        r.ok
          ? { ok: true, texte: `Étiquettes à jour : ${r.etiquetes} compte${r.etiquetes > 1 ? 's' : ''} Academy.` }
          : { ok: false, texte: r.error },
      )
      if (r.ok) router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Participants ({participants.length})</h2>
          <p className="text-xs text-muted-foreground">
            {etiquetes.length} compte{etiquetes.length > 1 ? 's' : ''} Academy étiqueté{etiquetes.length > 1 ? 's' : ''}
            {sansCompte > 0 ? ` · ${sansCompte} sans compte Academy relié` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <span className="sr-only">Rechercher un participant</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Prénom ou e-mail…" className="w-56 pl-9" />
          </label>
          <Button variant="outline" size="sm" disabled={enCours} onClick={actualiser}>
            {enCours ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Mettre à jour les étiquettes
          </Button>
        </div>
      </div>

      {info && <div className="border-b p-3"><Message info={info} /></div>}

      {participants.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Les participants apparaîtront ici dès qu’une session Studia Live clôturée sera rattachée.
        </p>
      ) : (
        <ul className="max-h-[32rem] divide-y overflow-y-auto">
          {visibles.map((p) => {
            const derniere = p.sessions[0]
            const etiquete = !!p.academy_user_id && portent.has(p.academy_user_id)
            return (
              <li key={p.cle} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{p.prenom ?? 'Sans prénom'}</p>
                  <p className="truncate text-xs text-gray-500">{p.email ?? 'Sans e-mail'}</p>
                </div>
                <p className="hidden min-w-0 max-w-xs flex-1 truncate text-xs text-gray-500 md:block">
                  {p.sessions.length} session{p.sessions.length > 1 ? 's' : ''}
                  {derniere ? ` · ${derniere.titre}` : ''}
                </p>
                <p className="w-28 text-right text-xs text-gray-500">
                  {derniere?.niveau ? niveauLabel(derniere.niveau) : '—'}
                  <span className="block tabular-nums text-gray-900">{pct(derniere?.reussite_pct)}</span>
                </p>
                {etiquete ? (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#fff7ed] px-2 py-0.5 text-xs font-medium text-[#a84d16]">
                    <Tag className="h-3 w-3" />
                    Étiqueté
                  </span>
                ) : (
                  <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    {p.academy_user_id ? 'À étiqueter' : 'Sans compte'}
                  </span>
                )}
                {p.academy_user_id ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/users/${p.academy_user_id}`}>
                      <UserRound className="mr-1.5 h-4 w-4" />
                      Fiche
                    </Link>
                  </Button>
                ) : (
                  <span className="w-[76px]" />
                )}
              </li>
            )
          })}
          {visibles.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun participant ne correspond.</li>}
        </ul>
      )}
    </section>
  )
}
