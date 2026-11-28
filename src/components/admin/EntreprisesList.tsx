'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CalendarDays, ChevronRight, Hammer, Image as ImageIcon, Loader2, Plus, Search, Tag } from 'lucide-react'
import type { SurMesureACreer } from '@/lib/entreprise/propositions'
import { jourLong } from '@/lib/studia-live/suivi-regles'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EntrepriseResume } from '@/lib/entreprise/dossier'
import { creerEntreprise, modifierEntreprise } from '@/lib/entreprise/dossier-actions'
import { initiales, type Entreprise, type EntrepriseInput } from '@/lib/entreprise/dossier-regles'

const SELECT = 'h-9 w-full rounded-xl border border-input bg-white px-3 text-sm'

const CHAMPS_VIDES = {
  nom_entreprise: '', secteur: '', effectif_estime: '', ville: 'Libreville', contact_nom: '', contact_phone: '',
  contact_email: '', direction_nom: '', direction_email: '', notes: '', responsable_id: '',
}
type Champs = typeof CHAMPS_VIDES

const depuis = (e: Entreprise): Champs => ({
  nom_entreprise: e.nom_entreprise,
  secteur: e.secteur ?? '',
  effectif_estime: e.effectif_estime ?? '',
  ville: e.ville ?? '',
  contact_nom: e.contact_nom ?? '',
  contact_phone: e.contact_phone ?? '',
  contact_email: e.contact_email ?? '',
  direction_nom: e.direction_nom ?? '',
  direction_email: e.direction_email ?? '',
  notes: e.notes ?? '',
  responsable_id: e.responsable_id ?? '',
})

/**
 * Formulaire d'une entreprise, en création (sans `entreprise`) ou en
 * modification. À la création, ouvre directement la fiche créée.
 */
export function EntrepriseFormDialog({
  ouvert,
  fermer,
  entreprise,
  responsables,
}: {
  ouvert: boolean
  fermer: () => void
  entreprise?: Entreprise
  responsables: { id: string; nom: string }[]
}) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [form, setForm] = useState<Champs>(entreprise ? depuis(entreprise) : CHAMPS_VIDES)
  const [erreur, setErreur] = useState<string | null>(null)

  const champ = (cle: keyof Champs) => ({
    value: form[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [cle]: e.target.value })),
  })

  const enregistrer = () => {
    setErreur(null)
    demarrer(async () => {
      const saisie: EntrepriseInput = form
      if (entreprise) {
        const r = await modifierEntreprise(entreprise.id, saisie)
        if (!r.ok) return setErreur(r.error)
        fermer()
        router.refresh()
      } else {
        const r = await creerEntreprise(saisie)
        if (!r.ok) return setErreur(r.error)
        router.push(`/admin/entreprise/${r.id}`)
      }
    })
  }

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && !enCours && fermer()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{entreprise ? 'Modifier l’entreprise' : 'Nouvelle entreprise'}</DialogTitle>
          <DialogDescription>
            {entreprise
              ? 'Ces informations servent au bilan envoyé à la direction et aux devis.'
              : 'Seul le nom est requis : le reste peut être complété plus tard.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ent-nom">Nom de l’entreprise</Label>
              <Input id="ent-nom" maxLength={160} autoFocus {...champ('nom_entreprise')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ent-secteur">Secteur</Label>
              <Input id="ent-secteur" maxLength={80} placeholder="Agroalimentaire" {...champ('secteur')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ent-ville">Ville</Label>
              <Input id="ent-ville" maxLength={80} {...champ('ville')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ent-effectif">Effectif</Label>
              <Input id="ent-effectif" maxLength={40} placeholder="250" {...champ('effectif_estime')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ent-responsable">Responsable Studia</Label>
              <select id="ent-responsable" className={SELECT} {...champ('responsable_id')}>
                <option value="">Personne</option>
                {responsables.map((r) => (
                  <option key={r.id} value={r.id}>{r.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Direction (reçoit le bilan)</legend>
            <div className="space-y-1.5">
              <Label htmlFor="ent-dir-nom">Nom</Label>
              <Input id="ent-dir-nom" maxLength={120} {...champ('direction_nom')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ent-dir-email">E-mail</Label>
              <Input id="ent-dir-email" type="email" maxLength={254} placeholder="direction@entreprise.com" {...champ('direction_email')} />
            </div>
          </fieldset>

          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Contact (reçoit les devis)</legend>
            <div className="space-y-1.5">
              <Label htmlFor="ent-contact-nom">Nom</Label>
              <Input id="ent-contact-nom" maxLength={120} {...champ('contact_nom')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ent-contact-email">E-mail</Label>
              <Input id="ent-contact-email" type="email" maxLength={254} placeholder="rh@entreprise.com" {...champ('contact_email')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ent-contact-tel">Téléphone</Label>
              <Input id="ent-contact-tel" maxLength={30} placeholder="+241 07 00 00 00" {...champ('contact_phone')} />
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="ent-notes">Notes internes</Label>
            <Textarea id="ent-notes" rows={3} maxLength={5000} {...champ('notes')} />
          </div>
        </div>

        {erreur && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}

        <DialogFooter>
          <Button variant="outline" disabled={enCours} onClick={fermer}>Annuler</Button>
          <Button disabled={enCours || form.nom_entreprise.trim() === ''} onClick={enregistrer}>
            {enCours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {entreprise ? 'Enregistrer' : 'Créer et ouvrir la fiche'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Liste des entreprises de l'admin : recherche, création, et accès à la
 * fiche de chaque entreprise.
 */
export function EntreprisesList({
  entreprises,
  responsables,
  aCreer = [],
}: {
  entreprises: EntrepriseResume[]
  responsables: { id: string; nom: string }[]
  /** Formations sur mesure retenues, pas encore créées. */
  aCreer?: SurMesureACreer[]
}) {
  const [recherche, setRecherche] = useState('')
  const [creation, setCreation] = useState(false)

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return entreprises
    return entreprises.filter((e) =>
      [e.nom_entreprise, e.secteur, e.ville, e.contact_nom].some((v) => v?.toLowerCase().includes(q)),
    )
  }, [entreprises, recherche])

  const totaux = [
    { icon: Building2, libelle: 'Entreprises', valeur: entreprises.length },
    { icon: CalendarDays, libelle: 'Sessions rattachées', valeur: entreprises.reduce((n, e) => n + e.nb_sessions, 0) },
    { icon: Tag, libelle: 'Participants étiquetés', valeur: entreprises.reduce((n, e) => n + e.nb_etiquetes, 0) },
  ]

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entreprises</h1>
          <p className="text-sm text-muted-foreground">Un dossier par entreprise : ses sessions, ses participants et son suivi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/entreprise/slides">
              <ImageIcon className="mr-2 h-4 w-4" />
              Slides de la page entreprise
            </Link>
          </Button>
          <Button onClick={() => setCreation(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle entreprise
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {totaux.map((t) => (
          <div key={t.libelle} className="rounded-2xl border bg-white p-4">
            <p className="flex items-center gap-2 text-xs text-gray-500"><t.icon className="h-4 w-4" />{t.libelle}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{t.valeur.toLocaleString('fr-FR')}</p>
          </div>
        ))}
      </div>

      {aCreer.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Hammer className="h-4 w-4" />
            {aCreer.length} formation{aCreer.length > 1 ? 's' : ''} sur mesure à créer
          </h2>
          <p className="mt-0.5 text-xs text-amber-800">
            Créez la formation dans « Formations en ligne », puis reliez-la depuis la fiche de l’entreprise.
          </p>
          <ul className="mt-3 divide-y divide-amber-200/70">
            {aCreer.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-amber-950">{f.titre}</span>
                  <span className="block text-xs text-amber-800">
                    {f.entreprise}{f.decidee_le ? ` · retenue le ${jourLong(f.decidee_le)}` : ''}
                  </span>
                </span>
                <Link href={`/admin/entreprise/${f.company_id}`} className="text-xs font-medium text-amber-900 underline underline-offset-2">
                  Ouvrir le dossier
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <label className="relative block max-w-md">
        <span className="sr-only">Rechercher une entreprise</span>
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom, secteur, ville…" className="bg-white pl-9" />
      </label>

      {visibles.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-14 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-900">{entreprises.length === 0 ? 'Créez votre première entreprise' : 'Aucune entreprise ne correspond'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {entreprises.length === 0
              ? 'Rattachez-lui ensuite ses sessions Studia Live et ses événements à venir.'
              : 'Essayez un autre nom, secteur ou ville.'}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visibles.map((e) => (
            <li key={e.id}>
              <Link
                href={`/admin/entreprise/${e.id}`}
                className="group flex items-center gap-4 rounded-2xl border bg-white p-4 transition-colors hover:border-[#e97e42]/60"
              >
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff7ed] text-sm font-bold text-[#a84d16]">
                  {initiales(e.nom_entreprise)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-gray-900">{e.nom_entreprise}</span>
                  <span className="block truncate text-sm text-gray-500">
                    {[e.secteur, e.ville].filter(Boolean).join(' · ') || 'Fiche à compléter'}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-medium">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                      {e.nb_sessions} session{e.nb_sessions > 1 ? 's' : ''}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                      {e.nb_etiquetes} étiqueté{e.nb_etiquetes > 1 ? 's' : ''}
                    </span>
                    {e.nb_diagnostics > 0 && (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">
                        {e.nb_diagnostics} diagnostic{e.nb_diagnostics > 1 ? 's' : ''}
                      </span>
                    )}
                    {e.user_id && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Compte client</span>}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300 group-hover:text-[#e97e42]" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creation && <EntrepriseFormDialog ouvert fermer={() => setCreation(false)} responsables={responsables} />}
    </div>
  )
}
