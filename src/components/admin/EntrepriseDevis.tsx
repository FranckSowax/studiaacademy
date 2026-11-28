'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Check, Copy, Eye, FileText, Loader2, Pencil, Plus, Send, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fcfa, STATUT_DEVIS_LABELS, STATUT_DEVIS_STYLES, type ContenuEmailDevis, type StatutDevis } from '@/lib/entreprise/devis'
import type { DevisEntreprise } from '@/lib/entreprise/devis-acces'
import { apercuEnvoiDevis, deciderDevis, enregistrerDevis, envoyerDevis, supprimerBrouillon } from '@/lib/entreprise/devis-actions'
import {
  calculerDevis, FORMULES, getPrestation, PRESTATIONS, REMISE_PROGRAMME_MAX, SUR_MESURE, type DevisSaisie, type LigneSaisie,
} from '@/lib/entreprise/tarifs'
import { jourLong } from '@/lib/studia-live/suivi-regles'

const SELECT = 'h-9 w-full rounded-xl border border-input bg-white px-3 text-sm'
type Info = { ok: boolean; texte: string } | null

/** Ligne du constructeur : les nombres restent des textes tant qu'ils sont saisis. */
interface LigneForm {
  cle: number
  code: string
  participants: string
  groupes: string
  remise: boolean
  quantite: string
  theme: string
  duree: string
  taille: string
}

const nombre = (v: string): number | null => {
  const n = Number(v.replace(',', '.'))
  return v.trim() !== '' && Number.isFinite(n) ? n : null
}
const versSaisie = (l: LigneForm): LigneSaisie => ({
  code: l.code,
  participants: nombre(l.participants),
  groupes: nombre(l.groupes),
  remise_groupes: l.remise,
  quantite: nombre(l.quantite),
  theme: l.theme,
  duree_h: nombre(l.duree),
  taille_max: nombre(l.taille),
})
const texte = (v: number | null | undefined) => (typeof v === 'number' ? String(v) : '')

let compteur = 0
const versForm = (l: LigneSaisie): LigneForm => ({
  cle: ++compteur,
  code: l.code,
  participants: texte(l.participants),
  groupes: texte(l.groupes),
  remise: l.remise_groupes !== false,
  quantite: texte(l.quantite),
  theme: l.theme ?? '',
  duree: texte(l.duree_h),
  taille: texte(l.taille_max),
})

interface Brouillon {
  devisId: string | null
  objet: string
  participants: string
  remise: string
  lignes: LigneForm[]
}

/**
 * Devis d'une entreprise : constructeur calé sur la grille tarifaire
 * (formules, groupes, remises, coût par personne calculés en direct),
 * envoi au contact et suivi de la décision.
 */
export function EntrepriseDevis({
  entrepriseId,
  devis,
  contactNom,
  contactEmail,
  effectif,
  themes,
}: {
  entrepriseId: string
  devis: DevisEntreprise[]
  contactNom: string | null
  contactEmail: string | null
  /** Participants connus de l'entreprise, proposés comme effectif de départ. */
  effectif: number
  /** Titres des formations retenues, proposés comme thème d'une ligne. */
  themes: string[]
}) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [action, setAction] = useState<string | null>(null)
  const [info, setInfo] = useState<Info>(null)
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null)
  const [erreurBrouillon, setErreurBrouillon] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState<DevisEntreprise | null>(null)
  const [contact, setContact] = useState({ nom: contactNom ?? '', email: contactEmail ?? '' })
  const [apercu, setApercu] = useState<{ destinataire: string; contenu: ContenuEmailDevis } | null>(null)
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null)
  const [lien, setLien] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)

  const lancer = (cle: string, tache: () => Promise<void>) => {
    setAction(cle)
    demarrer(async () => {
      await tache()
      setAction(null)
    })
  }

  // ---------- Constructeur ----------

  const saisie: DevisSaisie | null = useMemo(
    () =>
      brouillon && {
        lignes: brouillon.lignes.map(versSaisie),
        participants: nombre(brouillon.participants),
        remise_programme_pct: nombre(brouillon.remise),
      },
    [brouillon],
  )
  const calcul = useMemo(() => (saisie ? calculerDevis(saisie) : null), [saisie])

  const nouveau = () => {
    setErreurBrouillon(null)
    setBrouillon({ devisId: null, objet: '', participants: effectif > 0 ? String(effectif) : '', remise: '', lignes: [] })
  }
  const modifier = (d: DevisEntreprise) => {
    setErreurBrouillon(null)
    setBrouillon({
      devisId: d.id,
      objet: d.objet,
      participants: texte(d.saisie.participants),
      remise: texte(d.saisie.remise_programme_pct),
      lignes: d.saisie.lignes.map(versForm),
    })
  }
  const majLigne = (cle: number, champ: Partial<LigneForm>) =>
    setBrouillon((b) => b && { ...b, lignes: b.lignes.map((l) => (l.cle === cle ? { ...l, ...champ } : l)) })
  const ajouterLigne = (code: string) =>
    setBrouillon((b) => b && { ...b, lignes: [...b.lignes, versForm({ code, participants: nombre(b.participants) })] })
  const appliquerFormule = (code: string) =>
    setBrouillon((b) => {
      const formule = FORMULES.find((f) => f.code === code)
      if (!b || !formule) return b
      const lignes = formule.lignes(nombre(b.participants) ?? 1).map(versForm)
      return { ...b, objet: b.objet || `Formule ${formule.libelle}`, lignes }
    })

  const enregistrer = () => {
    if (!brouillon || !saisie) return
    setErreurBrouillon(null)
    lancer('enregistrer', async () => {
      const r = await enregistrerDevis(entrepriseId, { devisId: brouillon.devisId, objet: brouillon.objet, saisie })
      if (!r.ok) return setErreurBrouillon(r.error)
      setBrouillon(null)
      setInfo({ ok: true, texte: `Devis ${r.numero} enregistré en brouillon.` })
      router.refresh()
    })
  }

  // ---------- Liste ----------

  const supprimer = (d: DevisEntreprise) =>
    lancer(d.id, async () => {
      const r = await supprimerBrouillon(entrepriseId, d.id)
      setInfo(r.ok ? { ok: true, texte: `Brouillon ${d.numero} supprimé.` } : { ok: false, texte: r.error })
      if (r.ok) router.refresh()
    })
  const decider = (d: DevisEntreprise, statut: StatutDevis) =>
    lancer(d.id, async () => {
      const r = await deciderDevis(entrepriseId, d.id, statut)
      setInfo(r.ok ? null : { ok: false, texte: r.error })
      if (r.ok) router.refresh()
    })

  // ---------- Envoi ----------

  const ouvrirEnvoi = (d: DevisEntreprise) => {
    setApercu(null)
    setErreurEnvoi(null)
    setEnvoi(d)
  }
  const voirApercu = () =>
    envoi &&
    lancer('apercu', async () => {
      setErreurEnvoi(null)
      const r = await apercuEnvoiDevis(entrepriseId, envoi.id, contact)
      if (r.ok) setApercu({ destinataire: r.destinataire, contenu: r.apercu })
      else setErreurEnvoi(r.error)
    })
  const envoyer = () =>
    envoi &&
    apercu &&
    lancer('envoi', async () => {
      setErreurEnvoi(null)
      const r = await envoyerDevis(entrepriseId, envoi.id, { email: contact.email, emailConfirme: apercu.destinataire, nom: contact.nom })
      if (!r.ok) return setErreurEnvoi(r.error)
      setInfo({ ok: true, texte: `Devis ${envoi.numero} envoyé à ${r.destinataire}.` })
      setLien(r.lien)
      setCopie(false)
      setEnvoi(null)
      router.refresh()
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

  const acceptes = devis.filter((d) => d.statut === 'accepte').reduce((n, d) => n + d.total_ht, 0)
  const enAttente = devis.filter((d) => d.statut === 'envoye').reduce((n, d) => n + d.total_ht, 0)

  return (
    <section className="rounded-2xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Devis ({devis.length})</h2>
          <p className="text-xs text-muted-foreground">
            {devis.length === 0
              ? 'Prix par séance, groupes et remises calculés à partir de la grille tarifaire.'
              : `${fcfa(enAttente)} HT en attente de réponse · ${fcfa(acceptes)} HT acceptés`}
          </p>
        </div>
        <Button size="sm" disabled={enCours} onClick={nouveau}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau devis
        </Button>
      </div>

      {info && (
        <div role="status" className={`border-b px-4 py-3 text-sm ${info.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {info.texte}
        </div>
      )}
      {lien && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50 px-4 py-3 text-sm">
          <span className="text-gray-600">Lien du devis, affiché cette seule fois :</span>
          <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs text-gray-800">{lien}</code>
          <Button variant="outline" size="sm" onClick={copier}>
            {copie ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copie ? 'Copié' : 'Copier'}
          </Button>
        </div>
      )}

      {devis.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun devis pour cette entreprise. Partez d’une formule, puis ajustez les groupes et les prestations.
        </p>
      ) : (
        <ul className="divide-y">
          {devis.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium tabular-nums text-gray-900">{d.numero}</span>
                  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_DEVIS_STYLES[d.statut]}`}>
                    {STATUT_DEVIS_LABELS[d.statut]}
                  </span>
                </p>
                <p className="truncate text-sm text-gray-600">{d.objet}</p>
                <p className="text-xs text-gray-500">
                  {d.envoye_le ? `Envoyé le ${jourLong(d.envoye_le)} à ${d.destinataire ?? '—'}` : `Créé le ${jourLong(d.created_at)}`}
                </p>
              </div>
              <p className="text-right">
                <span className="block font-semibold tabular-nums text-gray-900">{fcfa(d.total_ht)}</span>
                <span className="text-xs text-gray-500">hors taxes</span>
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {action === d.id && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/entreprise/${entrepriseId}/devis/${d.id}`}>
                    <Eye className="mr-1.5 h-4 w-4" />
                    Aperçu
                  </Link>
                </Button>
                {d.statut === 'brouillon' && (
                  <>
                    <Button variant="ghost" size="sm" disabled={enCours} onClick={() => modifier(d)}>
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button variant="ghost" size="sm" disabled={enCours} onClick={() => supprimer(d)} aria-label={`Supprimer le brouillon ${d.numero}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {(d.statut === 'brouillon' || d.statut === 'envoye') && (
                  <Button variant="outline" size="sm" disabled={enCours} onClick={() => ouvrirEnvoi(d)}>
                    <Send className="mr-1.5 h-4 w-4" />
                    {d.statut === 'brouillon' ? 'Envoyer' : 'Renvoyer'}
                  </Button>
                )}
                {d.statut === 'envoye' && (
                  <>
                    <Button variant="ghost" size="sm" disabled={enCours} onClick={() => decider(d, 'accepte')}>
                      <Check className="mr-1.5 h-4 w-4" />
                      Accepté
                    </Button>
                    <Button variant="ghost" size="sm" disabled={enCours} onClick={() => decider(d, 'refuse')}>
                      <X className="mr-1.5 h-4 w-4" />
                      Refusé
                    </Button>
                  </>
                )}
                {(d.statut === 'accepte' || d.statut === 'refuse') && (
                  <Button variant="ghost" size="sm" disabled={enCours} onClick={() => decider(d, 'envoye')}>
                    Annuler la décision
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Constructeur de devis */}
      <Dialog open={brouillon !== null} onOpenChange={(o) => !o && !enCours && setBrouillon(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{brouillon?.devisId ? 'Modifier le devis' : 'Nouveau devis'}</DialogTitle>
            <DialogDescription>
              On vend des séances, pas des places : au-delà de la taille maximale d’un format, on ajoute des groupes.
            </DialogDescription>
          </DialogHeader>

          {brouillon && calcul && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                  <div className="space-y-1.5">
                    <Label htmlFor="devis-objet">Objet du devis</Label>
                    <Input
                      id="devis-objet"
                      maxLength={200}
                      placeholder="Initiation IA pour les cadres"
                      value={brouillon.objet}
                      onChange={(e) => setBrouillon({ ...brouillon, objet: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="devis-effectif">Collaborateurs</Label>
                    <Input
                      id="devis-effectif"
                      inputMode="numeric"
                      placeholder="38"
                      value={brouillon.participants}
                      onChange={(e) => setBrouillon({ ...brouillon, participants: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Partir d’une formule</p>
                  <div className="flex flex-wrap gap-2">
                    {FORMULES.map((f) => (
                      <button
                        key={f.code}
                        type="button"
                        title={f.description}
                        onClick={() => appliquerFormule(f.code)}
                        className="rounded-full border px-3 py-1 text-sm text-gray-700 hover:border-[#e97e42] hover:text-[#a84d16]"
                      >
                        {f.libelle}
                      </button>
                    ))}
                  </div>
                </div>

                <ul className="space-y-3">
                  {brouillon.lignes.map((l) => {
                    const prestation = getPrestation(l.code)
                    const seance = l.code === SUR_MESURE || prestation?.mode === 'seance'
                    return (
                      <li key={l.cle} className="rounded-xl border p-3">
                        <div className="flex items-start gap-2">
                          <select
                            className={SELECT}
                            value={l.code}
                            aria-label="Prestation"
                            onChange={(e) => majLigne(l.cle, { code: e.target.value })}
                          >
                            <optgroup label="Formations IA">
                              {PRESTATIONS.filter((p) => p.famille === 'ia').map((p) => (
                                <option key={p.code} value={p.code}>{p.libelle}{p.duree ? ` (${p.duree})` : ''} · {fcfa(p.prix)}</option>
                              ))}
                              <option value={SUR_MESURE}>Séance sur mesure (prix selon la durée)</option>
                            </optgroup>
                            <optgroup label="PC Express">
                              {PRESTATIONS.filter((p) => p.famille === 'pc_express').map((p) => (
                                <option key={p.code} value={p.code}>{p.libelle} ({p.duree}) · {fcfa(p.prix)}</option>
                              ))}
                            </optgroup>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Retirer cette prestation"
                            onClick={() => setBrouillon({ ...brouillon, lignes: brouillon.lignes.filter((x) => x.cle !== l.cle) })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {prestation?.aide && <p className="mt-1 text-xs text-gray-500">{prestation.aide}</p>}

                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {l.code === SUR_MESURE && (
                            <>
                              <label className="text-xs text-gray-500">
                                Durée (heures)
                                <Input className="mt-1" inputMode="decimal" placeholder="4" value={l.duree} onChange={(e) => majLigne(l.cle, { duree: e.target.value })} />
                              </label>
                              <label className="text-xs text-gray-500">
                                Taille max du groupe
                                <Input className="mt-1" inputMode="numeric" placeholder="20" value={l.taille} onChange={(e) => majLigne(l.cle, { taille: e.target.value })} />
                              </label>
                            </>
                          )}
                          {seance ? (
                            <>
                              <label className="text-xs text-gray-500">
                                Participants
                                <Input className="mt-1" inputMode="numeric" value={l.participants} onChange={(e) => majLigne(l.cle, { participants: e.target.value })} />
                              </label>
                              <label className="text-xs text-gray-500">
                                Groupes (auto si vide)
                                <Input className="mt-1" inputMode="numeric" value={l.groupes} onChange={(e) => majLigne(l.cle, { groupes: e.target.value })} />
                              </label>
                            </>
                          ) : (
                            <label className="text-xs text-gray-500">
                              Quantité
                              <Input className="mt-1" inputMode="numeric" placeholder="1" value={l.quantite} onChange={(e) => majLigne(l.cle, { quantite: e.target.value })} />
                            </label>
                          )}
                          <label className="col-span-2 text-xs text-gray-500">
                            Thème ou formation (facultatif)
                            <Input
                              className="mt-1"
                              maxLength={120}
                              list="devis-themes"
                              placeholder="Maintenance"
                              value={l.theme}
                              onChange={(e) => majLigne(l.cle, { theme: e.target.value })}
                            />
                          </label>
                        </div>
                        {seance && (
                          <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#e97e42]"
                              checked={l.remise}
                              onChange={(e) => majLigne(l.cle, { remise: e.target.checked })}
                            />
                            Remise des groupes suivants
                            {prestation?.famille === 'pc_express' ? ' (−15 %)' : ' (−30 %, contenu identique)'}
                          </label>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <datalist id="devis-themes">
                  {themes.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>

                <div className="flex flex-wrap items-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => ajouterLigne('atelier_ia')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une prestation
                  </Button>
                  <label className="text-xs text-gray-500">
                    Remise de programme (%, {REMISE_PROGRAMME_MAX} au plus)
                    <Input
                      className="mt-1 w-40"
                      inputMode="decimal"
                      placeholder="0"
                      value={brouillon.remise}
                      onChange={(e) => setBrouillon({ ...brouillon, remise: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              <aside className="space-y-3 rounded-2xl border bg-slate-50 p-4 lg:sticky lg:top-0 lg:self-start">
                <h3 className="text-sm font-semibold text-gray-900">Calcul en direct</h3>
                {calcul.lignes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Choisissez une formule ou ajoutez une prestation.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {calcul.lignes.map((l, n) => (
                      <li key={n} className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-gray-900">{l.libelle}</span>
                          <span className="block text-xs text-gray-500">
                            {l.detail ? `${l.detail} · ` : ''}
                            {l.quantite} × {fcfa(l.prix_unitaire)}
                          </span>
                        </span>
                        <span className="whitespace-nowrap font-medium tabular-nums text-gray-900">{fcfa(l.montant)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <dl className="space-y-1 border-t pt-3 text-sm tabular-nums">
                  {calcul.remise_programme > 0 && (
                    <>
                      <div className="flex justify-between text-gray-600"><dt>Sous-total HT</dt><dd>{fcfa(calcul.sous_total)}</dd></div>
                      <div className="flex justify-between text-gray-600">
                        <dt>Remise de programme ({calcul.remise_programme_pct.toLocaleString('fr-FR')} %)</dt>
                        <dd>−{fcfa(calcul.remise_programme)}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-base font-bold text-gray-900"><dt>Total HT</dt><dd>{fcfa(calcul.total_ht)}</dd></div>
                  <div className="flex justify-between text-gray-600">
                    <dt>Par collaborateur</dt>
                    <dd>{calcul.par_personne === null ? 'Indiquez l’effectif' : fcfa(calcul.par_personne)}</dd>
                  </div>
                </dl>
                {calcul.alertes.length > 0 && (
                  <ul className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    {calcul.alertes.map((a) => (
                      <li key={a} className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground">Ces remarques sont pour vous : elles n’apparaissent pas sur le devis.</p>
              </aside>
            </div>
          )}

          {erreurBrouillon && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurBrouillon}</p>}

          <DialogFooter>
            <Button variant="outline" disabled={enCours} onClick={() => setBrouillon(null)}>Annuler</Button>
            <Button disabled={enCours || !brouillon || brouillon.objet.trim() === '' || (calcul?.lignes.length ?? 0) === 0} onClick={enregistrer}>
              {action === 'enregistrer' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer le brouillon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Envoi au contact */}
      <Dialog open={envoi !== null} onOpenChange={(o) => !o && !enCours && setEnvoi(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer le devis {envoi?.numero}</DialogTitle>
            <DialogDescription>
              Le contact reçoit un lien vers la page du devis, imprimable en PDF. Une fois envoyé, le devis ne se modifie plus.
              {envoi?.statut === 'envoye' ? ' Le renvoyer remplace le lien précédent.' : ''}
            </DialogDescription>
          </DialogHeader>

          {!apercu ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="devis-contact-nom">Nom du contact</Label>
                <Input id="devis-contact-nom" maxLength={120} value={contact.nom} onChange={(e) => setContact((c) => ({ ...c, nom: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="devis-contact-email">E-mail du contact</Label>
                <Input
                  id="devis-contact-email"
                  type="email"
                  maxLength={254}
                  placeholder="rh@entreprise.com"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
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
              </dl>
              <iframe title="Aperçu de l’e-mail" sandbox="" srcDoc={apercu.contenu.html} className="h-[380px] w-full rounded-xl border bg-white" />
            </div>
          )}

          {erreurEnvoi && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurEnvoi}</p>}

          <DialogFooter>
            {!apercu ? (
              <>
                <Button variant="outline" disabled={enCours} onClick={() => setEnvoi(null)}>Annuler</Button>
                <Button disabled={enCours || contact.email.trim() === ''} onClick={voirApercu}>
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
