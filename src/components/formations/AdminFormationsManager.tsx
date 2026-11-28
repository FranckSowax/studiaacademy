'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, GraduationCap, Trash2, Loader2, X, Sparkles, Wand2, ArrowRight, Search, ChevronDown, SearchX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { saveFormation, togglePublishFormation, deleteFormation } from '@/lib/formations/admin-actions'
import { deleteGeneration } from '@/lib/formations/generation-actions'
import { AdminFormationCard } from '@/components/formations/AdminFormationCard'
import {
  compterFormations,
  DEFAULT_FILTERS,
  filtrerFormations,
  filtresActifs,
  listerCategories,
  trierFormations,
  type AdminFormationFilters,
  type CollectionFilter,
  type PriceFilter,
  type SortKey,
  type StatusFilter,
} from '@/lib/formations/admin-filter'
import type { Formation } from '@/types/formation'
import type { GenerationStatus } from '@/types/generation'

export interface GenerationRow {
  id: string
  titre: string
  niveau: string
  status: GenerationStatus
  sections_total: number
  sections_generated: number
  formation_id: string | null
  /** État réel de publication de la formation liée (null si pas encore créée). */
  formation_published?: boolean | null
  updated_at: string
}

/** Inscriptions par formation : élèves ayant accès et demandes en attente. */
export type EnrollmentCounts = Record<string, { inscrits: number; enAttente: number }>

const GEN_STATUS: Record<GenerationStatus, { label: string; cls: string }> = {
  extracting: { label: 'Extraction…', cls: 'bg-blue-50 text-blue-600' },
  outline_ready: { label: 'Sommaire à valider', cls: 'bg-amber-50 text-amber-600' },
  outline_validated: { label: 'Sommaire validé', cls: 'bg-violet-50 text-violet-600' },
  generating: { label: 'Génération en cours', cls: 'bg-blue-50 text-blue-600' },
  done: { label: 'Prêt à publier', cls: 'bg-green-50 text-green-600' },
  published: { label: 'Formation créée', cls: 'bg-gray-100 text-gray-500' },
}

const SELECT =
  'h-9 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-sm text-gray-700 focus:border-[#e97e42] focus:outline-none focus:ring-2 focus:ring-[#e97e42]/20'

export function AdminFormationsManager({
  initial,
  generations = [],
  counts = {},
}: {
  initial: Formation[]
  generations?: GenerationRow[]
  counts?: EnrollmentCounts
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtres, setFiltres] = useState<AdminFormationFilters>(DEFAULT_FILTERS)
  const [tri, setTri] = useState<SortKey>('recent')
  const [form, setForm] = useState({
    titre: '', sous_titre: '', categorie: '', niveau: 'Tous niveaux',
    duree_estimee: '', prix_fcfa: 0, formateur_nom: '', cover_image: '',
    description: '', objectifs: '',
  })

  const chiffres = useMemo(() => compterFormations(initial), [initial])
  const categories = useMemo(() => listerCategories(initial), [initial])
  const visibles = useMemo(() => {
    const inscrits = Object.fromEntries(Object.entries(counts).map(([id, c]) => [id, c.inscrits]))
    return trierFormations(filtrerFormations(initial, filtres), tri, inscrits)
  }, [initial, filtres, tri, counts])
  const enCours = generations.filter((g) => g.status !== 'published').length

  const set = <K extends keyof AdminFormationFilters>(cle: K, valeur: AdminFormationFilters[K]) =>
    setFiltres((f) => ({ ...f, [cle]: valeur }))

  const create = async () => {
    setSaving(true)
    setError(null)
    const res = await saveFormation({
      ...form,
      objectifs: form.objectifs.split('\n').map((s) => s.trim()).filter(Boolean),
    })
    setSaving(false)
    if (res.success && res.id) router.push(`/admin/formations/${res.id}`)
    else setError(res.error || 'La formation n’a pas pu être créée.')
  }

  const togglePublish = async (f: Formation) => {
    setBusyId(f.id)
    setError(null)
    const res = await togglePublishFormation(f.id, !f.is_published)
    setBusyId(null)
    if (res && 'success' in res && !res.success) setError('La publication n’a pas pu être modifiée.')
    router.refresh()
  }

  const remove = async (f: Formation) => {
    if (!window.confirm(`Supprimer définitivement « ${f.titre} » ?\nSes leçons seront supprimées aussi.`)) return
    setBusyId(f.id)
    setError(null)
    const res = await deleteFormation(f.id)
    setBusyId(null)
    if (res && 'success' in res && !res.success) setError('La formation n’a pas pu être supprimée.')
    router.refresh()
  }

  const statuts: { id: StatusFilter; label: string; n: number }[] = [
    { id: 'all', label: 'Toutes', n: chiffres.total },
    { id: 'published', label: 'Publiées', n: chiffres.publiees },
    { id: 'draft', label: 'Brouillons', n: chiffres.brouillons },
  ]

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Formations en ligne</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {chiffres.total} formation{chiffres.total > 1 ? 's' : ''} · {chiffres.publiees} publiée{chiffres.publiees > 1 ? 's' : ''} ·{' '}
            {chiffres.brouillons} brouillon{chiffres.brouillons > 1 ? 's' : ''} · {chiffres.metier} Upgrade Métier
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-[#e97e42] text-[#a84d16] hover:bg-[#fff7ed]">
            <Link href="/admin/formations/generer">
              <Sparkles className="mr-1 h-4 w-4" />
              Générer par IA
            </Link>
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-[#e97e42] text-white hover:bg-[#d56a2e]">
            <Plus className="mr-1 h-4 w-4" />
            Nouvelle formation
          </Button>
        </div>
      </div>

      {error && !showForm && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Filtres */}
      {initial.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-[#f0ebe3] bg-white p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                aria-label="Rechercher une formation"
                placeholder="Rechercher un titre, une catégorie, un formateur…"
                value={filtres.q}
                onChange={(e) => set('q', e.target.value)}
                className="h-9 rounded-lg border-[#e2e8f0] pl-9"
              />
            </div>
            <div className="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Statut">
              {statuts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={filtres.status === s.id}
                  onClick={() => set('status', s.id)}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                    filtres.status === s.id ? 'bg-white text-[#a84d16] shadow-sm' : 'text-muted-foreground hover:text-gray-900',
                  )}
                >
                  {s.label} <span className="text-xs opacity-70">{s.n}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Collection" value={filtres.collection} className={SELECT}
              onChange={(e) => set('collection', e.target.value as CollectionFilter)}>
              <option value="all">Toutes les collections</option>
              <option value="catalogue">Catalogue</option>
              <option value="metier">Upgrade Métier</option>
            </select>
            <select aria-label="Catégorie" value={filtres.categorie} className={SELECT}
              onChange={(e) => set('categorie', e.target.value)}>
              <option value="">Toutes les catégories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select aria-label="Prix" value={filtres.price} className={SELECT}
              onChange={(e) => set('price', e.target.value as PriceFilter)}>
              <option value="all">Tous les prix</option>
              <option value="free">Gratuites</option>
              <option value="paid">Payantes</option>
            </select>
            {filtresActifs(filtres) && (
              <button type="button" onClick={() => setFiltres(DEFAULT_FILTERS)}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#a84d16] hover:underline">
                <X className="h-3.5 w-3.5" />Réinitialiser
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {visibles.length} résultat{visibles.length > 1 ? 's' : ''}
              </span>
              <select aria-label="Trier" value={tri} className={SELECT} onChange={(e) => setTri(e.target.value as SortKey)}>
                <option value="recent">Plus récentes</option>
                <option value="titre">Titre A → Z</option>
                <option value="inscrits">Plus suivies</option>
                <option value="prix">Prix décroissant</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Grille des formations */}
      {initial.length === 0 ? (
        <div className="rounded-2xl border bg-muted/30 py-16 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune formation. Créez la première.</p>
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white py-14 text-center">
          <SearchX className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <p className="font-medium text-gray-800">Aucune formation ne correspond à ces filtres.</p>
          <button type="button" onClick={() => setFiltres(DEFAULT_FILTERS)}
            className="mt-2 text-sm font-medium text-[#a84d16] hover:underline">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibles.map((f) => (
            <AdminFormationCard
              key={f.id}
              formation={f}
              inscrits={counts[f.id]?.inscrits ?? 0}
              enAttente={counts[f.id]?.enAttente ?? 0}
              busy={busyId === f.id}
              onTogglePublish={togglePublish}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {/* Générations IA : repliées quand tout est déjà transformé en formation */}
      {generations.length > 0 && (
        <details open={enCours > 0} className="group rounded-2xl border border-[#f0ebe3] bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-2 p-4 [&::-webkit-details-marker]:hidden">
            <Wand2 className="h-4 w-4 text-[#e97e42]" />
            <h3 className="font-semibold text-gray-800">Générations IA</h3>
            <span className="text-xs text-muted-foreground">
              {generations.length}{enCours > 0 ? ` · ${enCours} en cours` : ''}
            </span>
            <ChevronDown className="ml-auto h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-2 border-t border-[#f0ebe3] p-3">
            {generations.map((g) => {
              // Pour une génération finalisée, afficher l'état RÉEL de publication de la formation.
              const st =
                g.status === 'published'
                  ? g.formation_published
                    ? { label: 'Publiée', cls: 'bg-green-50 text-green-600' }
                    : { label: 'Brouillon', cls: 'bg-gray-100 text-gray-500' }
                  : GEN_STATUS[g.status]
              const resumeHref =
                g.status === 'published' && g.formation_id
                  ? `/admin/formations/${g.formation_id}`
                  : `/admin/formations/generer/${g.id}`
              return (
                <div key={g.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#f0ebe3] p-3">
                  <Link href={resumeHref} className="group/gen flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#fff7ed]">
                      <Sparkles className="h-4 w-4 text-[#e97e42]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate font-medium transition-colors group-hover/gen:text-[#a84d16]">{g.titre}</h4>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {g.niveau}
                        {g.sections_total > 0 && ` · ${g.sections_generated}/${g.sections_total} sections générées`}
                      </p>
                    </div>
                  </Link>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {g.status !== 'published' ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={resumeHref}>
                          Reprendre <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm" className="text-[#a84d16] hover:bg-[#fff7ed]">
                        <Link href={`/admin/formations/generer/${g.id}`}>
                          <Wand2 className="mr-1 h-3.5 w-3.5" />
                          {g.sections_generated < g.sections_total ? 'Générer la suite' : 'Sommaire'}
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" aria-label={`Supprimer la génération ${g.titre}`}
                      onClick={async () => {
                        if (window.confirm('Supprimer ce brouillon de génération ?')) {
                          await deleteGeneration(g.id)
                          router.refresh()
                        }
                      }}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </details>
      )}

      {/* Création rapide */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8"
          role="dialog" aria-modal="true" aria-labelledby="nouvelle-formation">
          <div className="my-auto w-full max-w-lg rounded-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 id="nouvelle-formation" className="text-lg font-bold">Nouvelle formation</h3>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Fermer" className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              <Field label="Titre *"><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className="rounded-xl" /></Field>
              <Field label="Sous-titre"><Input value={form.sous_titre} onChange={(e) => setForm({ ...form, sous_titre: e.target.value })} className="rounded-xl" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Catégorie"><Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="rounded-xl" /></Field>
                <Field label="Niveau"><Input value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })} className="rounded-xl" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Durée estimée"><Input placeholder="6 semaines" value={form.duree_estimee} onChange={(e) => setForm({ ...form, duree_estimee: e.target.value })} className="rounded-xl" /></Field>
                <Field label="Prix (FCFA)"><Input type="number" min={0} value={form.prix_fcfa} onChange={(e) => setForm({ ...form, prix_fcfa: Number(e.target.value) })} className="rounded-xl" /></Field>
              </div>
              <Field label="Image de couverture (URL)"><Input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="rounded-xl" /></Field>
              <Field label="Formateur"><Input value={form.formateur_nom} onChange={(e) => setForm({ ...form, formateur_nom: e.target.value })} className="rounded-xl" /></Field>
              <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="resize-none rounded-xl" /></Field>
              <Field label="Objectifs (un par ligne)"><Textarea rows={3} value={form.objectifs} onChange={(e) => setForm({ ...form, objectifs: e.target.value })} className="resize-none rounded-xl" /></Field>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <Button onClick={create} disabled={!form.titre || saving} className="w-full rounded-xl bg-[#e97e42] text-white hover:bg-[#d56a2e]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer et ajouter des leçons'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-gray-700">{label}</Label>
      {children}
    </div>
  )
}
