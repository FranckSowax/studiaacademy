'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Save, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ContenuEmailRapport } from '@/lib/studia-live/email-rapport'
import { actualiserSessionLive, apercuRapport, enregistrerSuivi, envoyerRapport } from '@/lib/studia-live/pilotage-actions'
import {
  jourHeure, jourLong, STATUT_SUIVI_LABELS, STATUTS_SUIVI, TYPE_ENVOI_LABELS, type EnvoiJournal, type LigneSuivi,
} from '@/lib/studia-live/suivi-regles'

const SELECT = 'h-9 w-full rounded-xl border border-input bg-white px-3 text-sm'

/** Résultat d'une ligne du journal, en clair. */
function resultatEnClair(e: EnvoiJournal): string {
  const r = e.resultat ?? {}
  const n = (cle: string) => (typeof r[cle] === 'number' ? (r[cle] as number) : 0)
  if (typeof r.echec === 'string') return 'Échec de l’envoi'
  if (e.type === 'rapport_direction') {
    if (r.envoye !== true) return 'Échec de l’envoi'
    return typeof r.lien_expire_le === 'string' ? `Envoyé — lien valable jusqu’au ${jourLong(r.lien_expire_le)}` : 'Envoyé'
  }
  return [
    `${n('envoyes')} envoyé${n('envoyes') > 1 ? 's' : ''}`,
    n('echecs') > 0 ? `${n('echecs')} échec${n('echecs') > 1 ? 's' : ''}` : null,
    n('deja') > 0 ? `${n('deja')} déjà reçu${n('deja') > 1 ? 's' : ''}` : null,
    n('sans_email') > 0 ? `${n('sans_email')} sans e-mail` : null,
  ]
    .filter(Boolean)
    .join(', ')
}

/**
 * Bloc de suivi d'une session : statut, commanditaire, responsable,
 * notes, envoi du rapport de formation (saisie → aperçu → confirmation)
 * et historique des envois.
 */
export function LiveSessionSuivi({
  fiche,
  responsables,
  journal,
  rapportPossible,
}: {
  fiche: LigneSuivi
  responsables: { id: string; nom: string }[]
  journal: EnvoiJournal[]
  /** false si la session est supprimée dans Studia Live ou son détail absent. */
  rapportPossible: boolean
}) {
  const router = useRouter()
  const id = fiche.live_session_id
  const [enCours, demarrer] = useTransition()
  const [action, setAction] = useState<'suivi' | 'actualiser' | 'apercu' | 'envoi' | null>(null)
  const [info, setInfo] = useState<{ ok: boolean; texte: string } | null>(null)
  const [form, setForm] = useState({
    statut_suivi: fiche.statut_suivi as string,
    commanditaire_nom: fiche.commanditaire_nom ?? '',
    commanditaire_email: fiche.commanditaire_email ?? '',
    responsable_id: fiche.responsable_id ?? '',
    notes: fiche.notes ?? '',
  })
  const [dialogue, setDialogue] = useState(false)
  const [erreurRapport, setErreurRapport] = useState<string | null>(null)
  const [apercu, setApercu] = useState<{ destinataire: string; contenu: ContenuEmailRapport } | null>(null)
  const nomsAdmins = new Map(responsables.map((r) => [r.id, r.nom]))

  const champ = (cle: keyof typeof form) => ({
    value: form[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [cle]: e.target.value })),
  })

  const lancer = (nom: NonNullable<typeof action>, tache: () => Promise<void>) => {
    setAction(nom)
    demarrer(async () => {
      await tache()
      setAction(null)
    })
  }

  const enregistrer = () =>
    lancer('suivi', async () => {
      const r = await enregistrerSuivi(id, form)
      setInfo(r.ok ? { ok: true, texte: 'Suivi enregistré.' } : { ok: false, texte: r.error })
      if (r.ok) router.refresh()
    })

  const actualiser = () =>
    lancer('actualiser', async () => {
      const r = await actualiserSessionLive(id)
      setInfo(r.ok ? { ok: true, texte: 'Session actualisée depuis Studia Live.' } : { ok: false, texte: r.error })
      if (r.ok) router.refresh()
    })

  const ouvrirRapport = () => {
    setApercu(null)
    setErreurRapport(null)
    setDialogue(true)
  }

  const voirApercu = () =>
    lancer('apercu', async () => {
      setErreurRapport(null)
      const r = await apercuRapport(id, { email: form.commanditaire_email, nom: form.commanditaire_nom })
      if (r.ok) setApercu({ destinataire: r.destinataire, contenu: r.apercu })
      else setErreurRapport(r.error)
    })

  const envoyer = () =>
    lancer('envoi', async () => {
      if (!apercu) return
      setErreurRapport(null)
      const r = await envoyerRapport(id, {
        email: form.commanditaire_email,
        emailConfirme: apercu.destinataire,
        nom: form.commanditaire_nom,
      })
      if (!r.ok) return setErreurRapport(r.error)
      setDialogue(false)
      setForm((f) => ({ ...f, statut_suivi: 'rapport_envoye', commanditaire_email: r.destinataire }))
      setInfo({ ok: true, texte: `Rapport envoyé à ${r.destinataire}. Le lien expire dans 30 jours.` })
      router.refresh()
    })

  return (
    <section className="rounded-2xl border bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Suivi</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={enCours} onClick={actualiser}>
            {action === 'actualiser' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualiser depuis Studia Live
          </Button>
          <Button size="sm" disabled={enCours || !rapportPossible} onClick={ouvrirRapport}>
            <Send className="mr-2 h-4 w-4" />
            Envoyer le rapport au commanditaire
          </Button>
        </div>
      </div>

      {info && (
        <div
          role="status"
          className={`mb-4 rounded-xl border p-3 text-sm ${info.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}
        >
          {info.texte}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="suivi-statut">Statut</Label>
              <select id="suivi-statut" className={SELECT} {...champ('statut_suivi')}>
                {STATUTS_SUIVI.map((s) => (
                  <option key={s} value={s}>{STATUT_SUIVI_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suivi-responsable">Responsable</Label>
              <select id="suivi-responsable" className={SELECT} {...champ('responsable_id')}>
                <option value="">Personne</option>
                {responsables.map((r) => (
                  <option key={r.id} value={r.id}>{r.nom}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suivi-nom">Commanditaire</Label>
              <Input id="suivi-nom" maxLength={120} placeholder="Nom du commanditaire" {...champ('commanditaire_nom')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suivi-email">E-mail du commanditaire</Label>
              <Input id="suivi-email" type="email" maxLength={254} placeholder="nom@entreprise.com" {...champ('commanditaire_email')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="suivi-notes">Notes</Label>
            <Textarea id="suivi-notes" rows={4} maxLength={5000} {...champ('notes')} />
          </div>
          <Button variant="outline" disabled={enCours} onClick={enregistrer}>
            {action === 'suivi' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer le suivi
          </Button>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-900">Historique des envois</h4>
          {journal.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun envoi pour cette session.</p>
          ) : (
            <ol className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {journal.map((e) => (
                <li key={e.id} className="border-l-2 border-[#e97e42]/40 pl-3 text-sm">
                  <p className="font-medium text-gray-900">{TYPE_ENVOI_LABELS[e.type] ?? e.type}</p>
                  <p className="break-words text-gray-700">{e.destinataires}</p>
                  <p className="text-gray-700">{resultatEnClair(e)}</p>
                  <p className="text-xs text-gray-500">
                    {jourHeure(e.created_at)}
                    {e.par ? ` — ${nomsAdmins.get(e.par) ?? 'un admin'}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <Dialog open={dialogue} onOpenChange={(o) => !enCours && setDialogue(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer le rapport au commanditaire</DialogTitle>
            <DialogDescription>
              Le lien vers le rapport de formation est demandé à Studia Live au moment de l’envoi. Il est valable 30 jours.
            </DialogDescription>
          </DialogHeader>

          {!apercu ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rapport-nom">Nom du commanditaire</Label>
                <Input id="rapport-nom" maxLength={120} {...champ('commanditaire_nom')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rapport-email">E-mail du commanditaire</Label>
                <Input id="rapport-email" type="email" maxLength={254} placeholder="nom@entreprise.com" {...champ('commanditaire_email')} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="text-gray-500">À</dt>
                <dd className="break-all font-medium text-gray-900">{apercu.destinataire}</dd>
                <dt className="text-gray-500">Objet</dt>
                <dd className="text-gray-900">{apercu.contenu.sujet}</dd>
              </dl>
              <iframe
                title="Aperçu de l’e-mail"
                sandbox=""
                srcDoc={apercu.contenu.html}
                className="h-[420px] w-full rounded-xl border bg-white"
              />
            </div>
          )}

          {erreurRapport && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurRapport}</p>
          )}

          <DialogFooter>
            {!apercu ? (
              <>
                <Button variant="outline" disabled={enCours} onClick={() => setDialogue(false)}>Annuler</Button>
                <Button disabled={enCours || form.commanditaire_email.trim() === ''} onClick={voirApercu}>
                  {action === 'apercu' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Voir l’aperçu
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" disabled={enCours} onClick={() => setApercu(null)}>Modifier l’adresse</Button>
                <Button disabled={enCours} onClick={envoyer}>
                  {action === 'envoi' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Envoyer à {apercu.destinataire}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
