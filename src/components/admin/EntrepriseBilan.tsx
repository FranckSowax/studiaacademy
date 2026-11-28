'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Copy, Eye, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ContenuEmailBilan } from '@/lib/entreprise/bilan'
import type { BilanEnvoye } from '@/lib/entreprise/bilan-acces'
import { apercuBilan, envoyerBilan, revoquerBilan } from '@/lib/entreprise/bilan-actions'
import { jourHeure, jourLong } from '@/lib/studia-live/suivi-regles'

type Info = { ok: boolean; texte: string } | null

function etatBilan(b: BilanEnvoye): { libelle: string; style: string } {
  if (b.etat === 'non_parti') return { libelle: 'E-mail non parti', style: 'bg-red-50 text-red-600' }
  if (b.etat === 'revoque') return { libelle: 'Lien désactivé', style: 'bg-gray-100 text-gray-600' }
  if (b.etat === 'expire') return { libelle: 'Expiré', style: 'bg-gray-100 text-gray-600' }
  return { libelle: `Actif jusqu’au ${jourLong(b.expire_le)}`, style: 'bg-green-50 text-green-700' }
}

/**
 * Bilan pour la direction : aperçu de la page, envoi par e-mail (saisie →
 * aperçu → confirmation) et historique des liens, que l'on peut désactiver.
 */
export function EntrepriseBilan({
  entrepriseId,
  directionNom,
  directionEmail,
  bilans,
  possible,
  formationsRetenues,
  admins,
}: {
  entrepriseId: string
  directionNom: string | null
  directionEmail: string | null
  bilans: BilanEnvoye[]
  /** false tant qu'aucune session Studia Live clôturée n'est rattachée. */
  possible: boolean
  formationsRetenues: number
  admins: { id: string; nom: string }[]
}) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [action, setAction] = useState<'apercu' | 'envoi' | string | null>(null)
  const [info, setInfo] = useState<Info>(null)
  const [dialogue, setDialogue] = useState(false)
  const [form, setForm] = useState({ nom: directionNom ?? '', email: directionEmail ?? '' })
  const [apercu, setApercu] = useState<{ destinataire: string; formations: number; contenu: ContenuEmailBilan } | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [lien, setLien] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)
  const noms = new Map(admins.map((a) => [a.id, a.nom]))

  const lancer = (cle: string, tache: () => Promise<void>) => {
    setAction(cle)
    demarrer(async () => {
      await tache()
      setAction(null)
    })
  }

  const ouvrir = () => {
    setApercu(null)
    setErreur(null)
    setDialogue(true)
  }

  const voirApercu = () =>
    lancer('apercu', async () => {
      setErreur(null)
      const r = await apercuBilan(entrepriseId, form)
      if (r.ok) setApercu({ destinataire: r.destinataire, formations: r.formations, contenu: r.apercu })
      else setErreur(r.error)
    })

  const envoyer = () =>
    lancer('envoi', async () => {
      if (!apercu) return
      setErreur(null)
      const r = await envoyerBilan(entrepriseId, { email: form.email, emailConfirme: apercu.destinataire, nom: form.nom })
      if (!r.ok) return setErreur(r.error)
      setDialogue(false)
      setLien(r.lien)
      setCopie(false)
      setInfo({ ok: true, texte: `Bilan envoyé à ${r.destinataire}. Le lien est valable 30 jours.` })
      router.refresh()
    })

  const revoquer = (b: BilanEnvoye) =>
    lancer(b.id, async () => {
      const r = await revoquerBilan(entrepriseId, b.id)
      setInfo(r.ok ? { ok: true, texte: 'Lien désactivé : la page n’est plus accessible.' } : { ok: false, texte: r.error })
      if (r.ok) router.refresh()
    })

  const copier = async () => {
    if (!lien) return
    try {
      await navigator.clipboard.writeText(lien)
      setCopie(true)
    } catch {
      setInfo({ ok: false, texte: 'Copie impossible : sélectionnez le lien à la main.' })
    }
  }

  return (
    <section className="rounded-2xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Bilan pour la direction</h2>
          <p className="text-xs text-muted-foreground">
            Une page Studia Academy avec les résultats agrégés et {formationsRetenues} formation{formationsRetenues > 1 ? 's' : ''} retenue
            {formationsRetenues > 1 ? 's' : ''}. Aucun résultat individuel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/entreprise/${entrepriseId}/bilan`}>
              <Eye className="mr-2 h-4 w-4" />
              Aperçu de la page
            </Link>
          </Button>
          <Button size="sm" disabled={enCours || !possible} onClick={ouvrir}>
            <Send className="mr-2 h-4 w-4" />
            Envoyer le bilan à la direction
          </Button>
        </div>
      </div>

      {info && (
        <div role="status" className={`border-b px-4 py-3 text-sm ${info.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {info.texte}
        </div>
      )}
      {lien && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50 px-4 py-3 text-sm">
          <span className="text-gray-600">Lien du bilan, affiché cette seule fois :</span>
          <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs text-gray-800">{lien}</code>
          <Button variant="outline" size="sm" onClick={copier}>
            {copie ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copie ? 'Copié' : 'Copier'}
          </Button>
        </div>
      )}
      {!possible && (
        <p className="border-b px-4 py-3 text-sm text-muted-foreground">
          Rattachez une session Studia Live clôturée pour pouvoir envoyer un bilan.
        </p>
      )}
      {possible && formationsRetenues === 0 && (
        <p className="border-b bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune formation n’est retenue : le bilan partirait sans proposition. Retenez-en dans le bloc ci-dessus si vous voulez en proposer.
        </p>
      )}

      {bilans.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun bilan envoyé pour cette entreprise.</p>
      ) : (
        <ul className="divide-y">
          {bilans.map((b) => {
            const etat = etatBilan(b)
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{b.destinataire}</p>
                  <p className="text-xs text-gray-500">
                    {jourHeure(b.created_at)}
                    {b.envoye_par ? ` — ${noms.get(b.envoye_par) ?? 'un admin'}` : ''}
                  </p>
                </div>
                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${etat.style}`}>{etat.libelle}</span>
                {b.etat === 'actif' && (
                  <Button variant="ghost" size="sm" disabled={enCours} onClick={() => revoquer(b)}>
                    {action === b.id && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                    Désactiver le lien
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={dialogue} onOpenChange={(o) => !enCours && setDialogue(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer le bilan à la direction</DialogTitle>
            <DialogDescription>
              Le bilan est figé au moment de l’envoi. Son lien est secret, valable 30 jours, et peut être désactivé à tout moment.
            </DialogDescription>
          </DialogHeader>

          {!apercu ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="bilan-nom">Nom du destinataire</Label>
                <Input id="bilan-nom" maxLength={120} value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bilan-email">E-mail de la direction</Label>
                <Input
                  id="bilan-email"
                  type="email"
                  maxLength={254}
                  placeholder="direction@entreprise.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="text-gray-500">À</dt>
                <dd className="break-all font-medium text-gray-900">{apercu.destinataire}</dd>
                <dt className="text-gray-500">Objet</dt>
                <dd className="text-gray-900">{apercu.contenu.sujet}</dd>
                <dt className="text-gray-500">Formations</dt>
                <dd className="text-gray-900">{apercu.formations} proposée{apercu.formations > 1 ? 's' : ''} dans le bilan</dd>
              </dl>
              <iframe title="Aperçu de l’e-mail" sandbox="" srcDoc={apercu.contenu.html} className="h-[400px] w-full rounded-xl border bg-white" />
            </div>
          )}

          {erreur && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}

          <DialogFooter>
            {!apercu ? (
              <>
                <Button variant="outline" disabled={enCours} onClick={() => setDialogue(false)}>Annuler</Button>
                <Button disabled={enCours || form.email.trim() === ''} onClick={voirApercu}>
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
