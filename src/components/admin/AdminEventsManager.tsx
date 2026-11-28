'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays, Check, ChevronDown, ExternalLink, Eye, EyeOff, Home, ImagePlus, Loader2, Pencil, Phone, Plus, Repeat,
  Trash2, Users, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  decideReservation, deleteEvenement, saveEvenement, setEvenementAccueil, setEvenementPublie,
} from '@/lib/events/actions'
import {
  ETAT_RESERVATION_LABELS, etatReservation, EVENT_TYPE_LABELS, EVENT_TYPES, FREQUENCE_LABELS, FREQUENCES,
  OCCURRENCES_MAX, typeEvenement, type EtatReservation,
} from '@/lib/events/rules'
import { PAYMENT_LABELS } from '@/lib/formations/enrollment-payment'
import { estAfficheAccueil } from '@/lib/home/event-settings'
import { formatNumber } from '@/lib/utils'
import type { PresentielReservation, PresentielSession } from '@/types/formation'

const FUSEAU = 'Africa/Libreville'
const BUCKET = 'event-covers'
const IMAGE_MAX_OCTETS = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type Onglet = 'a_venir' | 'passes' | 'reservations'

const FORMULAIRE_VIDE = {
  id: undefined as string | undefined,
  titre: '',
  categorie: '',
  date_debut: '',
  date_fin: '',
  lieu: '',
  ville: 'Libreville',
  places_total: '20',
  prix_fcfa: '0',
  formateur_nom: '',
  description: '',
  cover_image: '',
  is_published: true,
  afficher_accueil: true,
  type: 'formation',
  frequence: 'none',
  nombre: '4',
  creer_slide: false,
}
type Formulaire = typeof FORMULAIRE_VIDE

/** ISO → valeur d'un champ datetime-local, dans le fuseau du navigateur. */
function versChampDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const dateLongue = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    timeZone: FUSEAU, weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
const partie = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString('fr-FR', { timeZone: FUSEAU, ...options }).replace('.', '')
const whatsapp = (telephone: string) => `https://wa.me/${telephone.replace(/[^0-9]/g, '')}`

const ETAT_STYLES: Record<EtatReservation, string> = {
  a_valider: 'bg-amber-50 text-amber-700',
  reservee: 'bg-blue-50 text-blue-700',
  confirmee: 'bg-green-50 text-green-700',
  annulee: 'bg-gray-100 text-gray-500',
}
const SELECT = 'h-9 w-full rounded-xl border border-input bg-white px-3 text-sm'

/**
 * Onglet « Événements » de l'administration : création, modification,
 * publication, affichage sur l'accueil et réservations des événements en
 * présentiel.
 *
 * `limiteIso` (fournie par le serveur) sépare les événements à venir des passés.
 */
export function AdminEventsManager({
  evenements,
  reservations,
  preuves = {},
  limiteIso,
}: {
  evenements: PresentielSession[]
  reservations: PresentielReservation[]
  /** Liens signés (1 h) vers les captures d'écran de paiement, par identifiant de réservation. */
  preuves?: Record<string, string>
  limiteIso: string
}) {
  const router = useRouter()
  const [onglet, setOnglet] = useState<Onglet>('a_venir')
  const [form, setForm] = useState<Formulaire | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [info, setInfo] = useState<{ ok: boolean; texte: string } | null>(null)
  const aValider = reservations.filter((r) => etatReservation(r) === 'a_valider').length

  const aVenir = evenements.filter((e) => e.date_debut >= limiteIso).sort((a, b) => a.date_debut.localeCompare(b.date_debut))
  const passes = evenements.filter((e) => e.date_debut < limiteIso).sort((a, b) => b.date_debut.localeCompare(a.date_debut))
  const liste = onglet === 'passes' ? passes : aVenir
  const reservationsDe = (id: string) => reservations.filter((r) => r.session_id === id)

  const champ = (cle: keyof Formulaire) => ({
    value: form ? String(form[cle] ?? '') : '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => (f ? { ...f, [cle]: e.target.value } : f)),
  })

  const fermer = () => {
    setForm(null)
    setErreur(null)
  }

  const modifier = (e: PresentielSession) => {
    setErreur(null)
    setForm({
      id: e.id,
      titre: e.titre,
      categorie: e.categorie ?? '',
      date_debut: versChampDate(e.date_debut),
      date_fin: versChampDate(e.date_fin),
      lieu: e.lieu ?? '',
      ville: e.ville ?? 'Libreville',
      places_total: String(e.places_total),
      prix_fcfa: String(e.prix_fcfa),
      formateur_nom: e.formateur_nom ?? '',
      description: e.description ?? '',
      cover_image: e.cover_image ?? '',
      is_published: e.is_published,
      afficher_accueil: estAfficheAccueil(e),
      type: typeEvenement(e),
      frequence: 'none',
      nombre: '4',
      creer_slide: false,
    })
  }

  const envoyerImage = async (fichier: File) => {
    setErreur(null)
    if (!IMAGE_TYPES.includes(fichier.type)) {
      setErreur('Image refusée : formats acceptés JPG, PNG ou WebP.')
      return
    }
    if (fichier.size > IMAGE_MAX_OCTETS) {
      setErreur('Image trop lourde : 5 Mo maximum.')
      return
    }
    setUploading(true)
    const supabase = createClient()
    const ext = fichier.type === 'image/png' ? 'png' : fichier.type === 'image/webp' ? 'webp' : 'jpg'
    const chemin = `${Date.now()}-${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(chemin, fichier, { contentType: fichier.type, cacheControl: '31536000' })
    if (error) setErreur(`Envoi de l'image impossible : ${error.message}`)
    else {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(chemin)
      setForm((f) => (f ? { ...f, cover_image: data.publicUrl } : f))
    }
    setUploading(false)
  }

  const enregistrer = async () => {
    if (!form) return
    setErreur(null)
    if (!form.titre.trim()) {
      setErreur('Le titre est obligatoire.')
      return
    }
    if (!form.date_debut) {
      setErreur('La date de début est obligatoire.')
      return
    }
    setSaving(true)
    const res = await saveEvenement({
      id: form.id,
      titre: form.titre,
      categorie: form.categorie,
      description: form.description,
      cover_image: form.cover_image,
      date_debut: new Date(form.date_debut).toISOString(),
      date_fin: form.date_fin ? new Date(form.date_fin).toISOString() : null,
      lieu: form.lieu,
      ville: form.ville,
      places_total: Number(form.places_total),
      prix_fcfa: Number(form.prix_fcfa),
      formateur_nom: form.formateur_nom,
      is_published: form.is_published,
      afficher_accueil: form.afficher_accueil,
      type: form.type,
      ...(form.id
        ? {}
        : { recurrence: { frequence: form.frequence, nombre: Number(form.nombre) }, creer_slide: form.creer_slide }),
    })
    setSaving(false)
    if (!res.success) {
      setErreur(res.error ?? "L'enregistrement a échoué.")
      return
    }
    fermer()
    if (res.avertissement) setInfo({ ok: false, texte: res.avertissement })
    else if ((res.crees ?? 0) > 1) setInfo({ ok: true, texte: `${res.crees} dates créées pour cet événement récurrent.` })
    else setInfo(null)
    router.refresh()
  }

  const decider = async (r: PresentielReservation, decision: 'confirmed' | 'cancelled') => {
    let note: string | undefined
    if (decision === 'confirmed') {
      const montant = r.payment_amount_fcfa ? `${formatNumber(r.payment_amount_fcfa)} FCFA` : null
      const question = montant
        ? `Avez-vous bien reçu ${montant} (${r.payment_method ? PAYMENT_LABELS[r.payment_method] : 'paiement'}) de ${r.prenom} ${r.nom} ?`
        : `Confirmer la place de ${r.prenom} ${r.nom} ?`
      if (!window.confirm(question)) return
    } else {
      const saisie = window.prompt(`Annuler la réservation de ${r.prenom} ${r.nom} ? La place sera libérée.\nMotif (envoyé sur WhatsApp, facultatif) :`, '')
      if (saisie === null) return
      note = saisie
    }
    setBusy(r.id)
    const res = await decideReservation(r.id, decision, note)
    setBusy(null)
    if (!res.success) setInfo({ ok: false, texte: res.error ?? "L'opération a échoué." })
    else {
      const fait = decision === 'confirmed' ? `Place confirmée pour ${r.prenom} ${r.nom}.` : `Réservation de ${r.prenom} ${r.nom} annulée.`
      setInfo(
        res.notified
          ? { ok: true, texte: `${fait} La personne est prévenue sur WhatsApp.` }
          : { ok: false, texte: `${fait} Le message WhatsApp n’est pas parti : prévenez-la vous-même.` },
      )
    }
    router.refresh()
  }

  /** Ligne d'une réservation : état, paiement, preuve et décision. */
  const ligneReservation = (r: PresentielReservation, avecEvenement: boolean) => {
    const etat = etatReservation(r)
    return (
      <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-white px-3 py-2 text-sm">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {r.prenom} {r.nom}{' '}
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-normal ${ETAT_STYLES[etat]}`}>{ETAT_RESERVATION_LABELS[etat]}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {avecEvenement && `${evenements.find((e) => e.id === r.session_id)?.titre ?? 'Événement supprimé'} · `}
            {r.payment_method
              ? `${PAYMENT_LABELS[r.payment_method]} · ${formatNumber(r.payment_amount_fcfa ?? 0)} FCFA${r.payment_reference ? ` · réf. ${r.payment_reference}` : ''}`
              : 'Gratuit'}
            {r.status === 'cancelled' && r.admin_note ? ` · Motif : ${r.admin_note}` : ''}
          </p>
        </div>
        {preuves[r.id] && (
          <a href={preuves[r.id]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[#a84d16] hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />Voir la preuve
          </a>
        )}
        <a href={whatsapp(r.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-700 hover:underline">
          <Phone className="h-3.5 w-3.5" />{r.phone}
        </a>
        {r.status !== 'cancelled' && (
          <span className="flex gap-1">
            {r.status === 'reserved' && (
              <Button size="sm" disabled={busy !== null} onClick={() => void decider(r, 'confirmed')} className="h-8 bg-green-600 text-white hover:bg-green-700">
                {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-4 w-4" />{r.payment_method ? 'Valider le paiement' : 'Confirmer'}</>}
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void decider(r, 'cancelled')} className="h-8">
              <X className="mr-1 h-4 w-4" />Annuler
            </Button>
          </span>
        )}
      </li>
    )
  }

  const lancer = async (id: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    setBusy(id)
    const res = await action()
    setBusy(null)
    if (!res.success) alert(res.error ?? "L'opération a échoué.")
    router.refresh()
  }

  const supprimer = (e: PresentielSession) => {
    const n = reservationsDe(e.id).length
    const avertissement = n > 0 ? ` Il a ${n} réservation${n > 1 ? 's' : ''}.` : ''
    if (!confirm(`Supprimer définitivement « ${e.titre} » ?${avertissement} Cette action est irréversible.`)) return
    void lancer(e.id, () => deleteEvenement(e.id))
  }

  const onglets: { cle: Onglet; label: string }[] = [
    { cle: 'a_venir', label: `À venir (${aVenir.length})` },
    { cle: 'passes', label: `Passés (${passes.length})` },
    { cle: 'reservations', label: `Réservations (${reservations.length})${aValider > 0 ? ` · ${aValider} à valider` : ''}` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Événements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Formations en présentiel, masterclass, présentations et événements : dates, places, publication, inscriptions et paiements.
          </p>
        </div>
        <Button
          onClick={() => {
            setErreur(null)
            setForm({ ...FORMULAIRE_VIDE })
          }}
          className="bg-[#e97e42] text-white hover:bg-[#d56a2e]"
        >
          <Plus className="mr-1 h-4 w-4" />Nouvel événement
        </Button>
      </div>

      {info && (
        <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${info.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {info.texte}
        </p>
      )}

      <div className="flex w-fit flex-wrap gap-1 rounded-xl bg-muted p-1">
        {onglets.map((o) => (
          <button
            key={o.cle}
            onClick={() => setOnglet(o.cle)}
            aria-pressed={onglet === o.cle}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${onglet === o.cle ? 'bg-white text-[#a84d16] shadow-sm' : 'text-muted-foreground'}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Liste des événements */}
      {onglet !== 'reservations' &&
        (liste.length === 0 ? (
          <div className="rounded-xl border bg-muted/30 py-16 text-center">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {onglet === 'a_venir' ? 'Aucun événement à venir.' : 'Aucun événement passé.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {liste.map((e) => {
              const resa = reservationsDe(e.id)
              const deplie = ouvert === e.id
              const surAccueil = estAfficheAccueil(e)
              return (
                <li key={e.id} className="overflow-hidden rounded-xl border bg-white">
                  <div className="flex flex-wrap items-center gap-3 p-4">
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-[#fff7ed]">
                      <span className="text-lg font-extrabold leading-none text-[#e97e42]">{partie(e.date_debut, { day: 'numeric' })}</span>
                      <span className="text-[10px] uppercase text-[#a84d16]">{partie(e.date_debut, { month: 'short' })}</span>
                    </div>
                    {e.cover_image && (
                      // eslint-disable-next-line @next/next/no-img-element -- aperçu admin, source libre
                      <img src={e.cover_image} alt="" className="hidden h-14 w-20 flex-shrink-0 rounded-lg object-cover sm:block" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">{e.titre}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{EVENT_TYPE_LABELS[typeEvenement(e)]}</span>
                        {e.serie_id && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700" title="Date d'un événement récurrent">
                            <Repeat className="h-3 w-3" />Série
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs ${e.is_published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {e.is_published ? 'Publié' : 'Brouillon'}
                        </span>
                        {e.is_published && surAccueil && onglet === 'a_venir' && (
                          <span className="rounded-full bg-[#fff7ed] px-2 py-0.5 text-xs text-[#a84d16]">Sur l&apos;accueil</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dateLongue(e.date_debut)} · {e.lieu || e.ville} · {e.places_reservees}/{e.places_total} places ·{' '}
                        {e.prix_fcfa > 0 ? `${formatNumber(e.prix_fcfa)} FCFA` : 'Gratuit'}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => modifier(e)} aria-label={`Modifier ${e.titre}`} title="Modifier">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => void lancer(e.id, () => setEvenementPublie(e.id, !e.is_published))}
                        aria-label={e.is_published ? `Dépublier ${e.titre}` : `Publier ${e.titre}`}
                        title={e.is_published ? 'Publié — cliquer pour dépublier' : 'Brouillon — cliquer pour publier'}
                      >
                        {e.is_published ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => void lancer(e.id, () => setEvenementAccueil(e.id, !surAccueil))}
                        aria-label={surAccueil ? `Retirer ${e.titre} de l'accueil` : `Afficher ${e.titre} sur l'accueil`}
                        title={surAccueil ? "Affiché sur l'accueil — cliquer pour retirer" : "Masqué de l'accueil — cliquer pour afficher"}
                      >
                        <Home className={`h-4 w-4 ${surAccueil ? 'text-[#e97e42]' : 'text-gray-300'}`} />
                      </Button>
                      <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => supprimer(e)} aria-label={`Supprimer ${e.titre}`} title="Supprimer">
                        {busy === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setOuvert(deplie ? null : e.id)} aria-expanded={deplie} title="Réservations">
                        <Users className="mr-1 h-4 w-4" />
                        {resa.length}
                        <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${deplie ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  {deplie && (
                    <div className="border-t bg-muted/20 p-4">
                      {resa.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune réservation.</p>
                      ) : (
                        <ul className="space-y-1.5">{resa.map((r) => ligneReservation(r, false))}</ul>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ))}

      {/* Toutes les réservations */}
      {onglet === 'reservations' &&
        (reservations.length === 0 ? (
          <div className="rounded-xl border bg-muted/30 py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune réservation.</p>
          </div>
        ) : (
          <ul className="space-y-2">{reservations.map((r) => ligneReservation(r, true))}</ul>
        ))}

      {/* Formulaire création / modification */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
          <div role="dialog" aria-modal="true" aria-labelledby="evenement-titre" className="my-auto w-full max-w-xl rounded-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 id="evenement-titre" className="text-lg font-bold">{form.id ? "Modifier l'événement" : 'Nouvel événement'}</h3>
              <button onClick={fermer} aria-label="Fermer" className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              <Champ id="ev-titre" label="Titre *"><Input id="ev-titre" maxLength={160} {...champ('titre')} className="rounded-xl" /></Champ>
              <Champ id="ev-type" label="Type">
                <select id="ev-type" value={form.type} onChange={(ev) => setForm({ ...form, type: ev.target.value })} className={SELECT}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
                </select>
              </Champ>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Champ id="ev-debut" label="Début *"><Input id="ev-debut" type="datetime-local" {...champ('date_debut')} className="rounded-xl" /></Champ>
                <Champ id="ev-fin" label="Fin (optionnel)"><Input id="ev-fin" type="datetime-local" min={form.date_debut || undefined} {...champ('date_fin')} className="rounded-xl" /></Champ>
                <Champ id="ev-lieu" label="Lieu"><Input id="ev-lieu" placeholder="Centre Studia" {...champ('lieu')} className="rounded-xl" /></Champ>
                <Champ id="ev-ville" label="Ville"><Input id="ev-ville" {...champ('ville')} className="rounded-xl" /></Champ>
                <Champ id="ev-places" label="Places"><Input id="ev-places" type="number" min={1} step={1} inputMode="numeric" {...champ('places_total')} className="rounded-xl" /></Champ>
                <Champ id="ev-prix" label="Prix (FCFA, 0 = gratuit)"><Input id="ev-prix" type="number" min={0} step={1} inputMode="numeric" {...champ('prix_fcfa')} className="rounded-xl" /></Champ>
                <Champ id="ev-categorie" label="Catégorie"><Input id="ev-categorie" placeholder="Atelier, conférence…" {...champ('categorie')} className="rounded-xl" /></Champ>
                <Champ id="ev-formateur" label="Intervenant"><Input id="ev-formateur" {...champ('formateur_nom')} className="rounded-xl" /></Champ>
              </div>
              <Champ id="ev-description" label="Description"><Textarea id="ev-description" rows={4} {...champ('description')} className="rounded-xl" /></Champ>

              {/* Image */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-image">Image</Label>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-[#f0ebe3] bg-[#fbf8f3]">
                    {form.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- aperçu admin, source libre
                      <img src={form.cover_image} alt="Aperçu de l'image" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">Aucune image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm" disabled={uploading}>
                        <label htmlFor="ev-image" className="cursor-pointer">
                          {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1 h-4 w-4" />}
                          {form.cover_image ? 'Remplacer' : 'Choisir une image'}
                        </label>
                      </Button>
                      {form.cover_image && (
                        <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, cover_image: '' })}>
                          <Trash2 className="mr-1 h-4 w-4" />Retirer
                        </Button>
                      )}
                    </div>
                    <input
                      id="ev-image"
                      type="file"
                      accept={IMAGE_TYPES.join(',')}
                      className="sr-only"
                      onChange={(ev) => {
                        const fichier = ev.target.files?.[0]
                        if (fichier) void envoyerImage(fichier)
                        ev.target.value = ''
                      }}
                    />
                    <Input aria-label="Adresse de l'image" placeholder="ou collez l'adresse https:// d'une image" {...champ('cover_image')} className="rounded-xl text-xs" />
                  </div>
                </div>
              </div>

              {!form.id && (
                <div className="rounded-xl border border-[#f0ebe3] bg-[#fbf8f3] p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Champ id="ev-frequence" label="Récurrence">
                      <select id="ev-frequence" value={form.frequence} onChange={(ev) => setForm({ ...form, frequence: ev.target.value })} className={SELECT}>
                        {FREQUENCES.map((f) => <option key={f} value={f}>{FREQUENCE_LABELS[f]}</option>)}
                      </select>
                    </Champ>
                    {form.frequence !== 'none' && (
                      <Champ id="ev-nombre" label={`Nombre de dates (${OCCURRENCES_MAX} max)`}>
                        <Input id="ev-nombre" type="number" min={2} max={OCCURRENCES_MAX} step={1} inputMode="numeric" {...champ('nombre')} className="rounded-xl bg-white" />
                      </Champ>
                    )}
                  </div>
                  {form.frequence !== 'none' && (
                    <p className="mt-2 text-xs text-gray-600">
                      Une date est créée par période, à la même heure, chacune avec ses propres places. Elles se modifient ensuite séparément.
                    </p>
                  )}
                  <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.creer_slide} onChange={(ev) => setForm({ ...form, creer_slide: ev.target.checked })} className="h-4 w-4 accent-[#e97e42]" />
                    Annoncer {form.frequence !== 'none' ? 'la première date' : 'cet événement'} dans un slide de la page d&apos;accueil
                  </label>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_published} onChange={(ev) => setForm({ ...form, is_published: ev.target.checked })} className="h-4 w-4 accent-[#e97e42]" />
                Publié (visible sur le site et ouvert aux réservations)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.afficher_accueil} onChange={(ev) => setForm({ ...form, afficher_accueil: ev.target.checked })} className="h-4 w-4 accent-[#e97e42]" />
                Afficher dans l&apos;agenda de la page d&apos;accueil
              </label>
            </div>

            {erreur && <p role="alert" className="mt-3 text-sm text-red-600">{erreur}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={fermer} disabled={saving}>Annuler</Button>
              <Button onClick={enregistrer} disabled={saving || uploading} className="bg-[#e97e42] text-white hover:bg-[#d56a2e]">
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Champ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-gray-700">{label}</Label>
      {children}
    </div>
  )
}
