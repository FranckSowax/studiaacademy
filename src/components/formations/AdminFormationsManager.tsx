'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, GraduationCap, Eye, EyeOff, Trash2, Pencil, Loader2, X, Sparkles,
  Wand2, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatNumber } from '@/lib/utils'
import { saveFormation, togglePublishFormation, deleteFormation } from '@/lib/formations/admin-actions'
import { deleteGeneration } from '@/lib/formations/generation-actions'
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

const GEN_STATUS: Record<GenerationStatus, { label: string; cls: string }> = {
  extracting: { label: 'Extraction…', cls: 'bg-blue-50 text-blue-600' },
  outline_ready: { label: 'Sommaire à valider', cls: 'bg-amber-50 text-amber-600' },
  outline_validated: { label: 'Sommaire validé', cls: 'bg-violet-50 text-violet-600' },
  generating: { label: 'Génération en cours', cls: 'bg-blue-50 text-blue-600' },
  done: { label: 'Prêt à publier', cls: 'bg-green-50 text-green-600' },
  published: { label: 'Formation créée', cls: 'bg-gray-100 text-gray-500' },
}

export function AdminFormationsManager({
  initial,
  generations = [],
}: {
  initial: Formation[]
  generations?: GenerationRow[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titre: '', sous_titre: '', categorie: '', niveau: 'Tous niveaux',
    duree_estimee: '', prix_fcfa: 0, formateur_nom: '', cover_image: '',
    description: '', objectifs: '',
  })

  const create = async () => {
    setSaving(true)
    const res = await saveFormation({
      ...form,
      objectifs: form.objectifs.split('\n').map((s) => s.trim()).filter(Boolean),
    })
    setSaving(false)
    if (res.success && res.id) {
      router.push(`/admin/formations/${res.id}`)
    } else {
      alert(res.error || 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Formations en ligne</h2>
          <p className="text-muted-foreground text-sm mt-1">Créez et gérez vos formations (style Teachable).</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-[#e97e42] text-[#e97e42] hover:bg-[#fff7ed]">
            <Link href="/admin/formations/generer">
              <Sparkles className="w-4 h-4 mr-1" />
              Générer par IA
            </Link>
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-[#e97e42] hover:bg-[#d56a2e] text-white">
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle formation
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Nouvelle formation</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <Field label="Titre *"><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className="rounded-xl" /></Field>
              <Field label="Sous-titre"><Input value={form.sous_titre} onChange={(e) => setForm({ ...form, sous_titre: e.target.value })} className="rounded-xl" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Catégorie"><Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="rounded-xl" /></Field>
                <Field label="Niveau"><Input value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })} className="rounded-xl" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Durée estimée"><Input placeholder="6 semaines" value={form.duree_estimee} onChange={(e) => setForm({ ...form, duree_estimee: e.target.value })} className="rounded-xl" /></Field>
                <Field label="Prix (FCFA)"><Input type="number" value={form.prix_fcfa} onChange={(e) => setForm({ ...form, prix_fcfa: Number(e.target.value) })} className="rounded-xl" /></Field>
              </div>
              <Field label="Image de couverture (URL)"><Input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="rounded-xl" /></Field>
              <Field label="Formateur"><Input value={form.formateur_nom} onChange={(e) => setForm({ ...form, formateur_nom: e.target.value })} className="rounded-xl" /></Field>
              <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl resize-none" /></Field>
              <Field label="Objectifs (un par ligne)"><Textarea rows={3} value={form.objectifs} onChange={(e) => setForm({ ...form, objectifs: e.target.value })} className="rounded-xl resize-none" /></Field>
              <Button onClick={create} disabled={!form.titre || saving} className="w-full bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer et ajouter des leçons'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Générations IA (sommaires validés / en cours) */}
      {generations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#e97e42]" />
            <h3 className="font-semibold text-gray-800">Générations IA</h3>
            <span className="text-xs text-muted-foreground">({generations.length})</span>
          </div>
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
              <div key={g.id} className="flex items-center justify-between bg-white border rounded-xl p-4">
                <Link href={resumeHref} className="flex items-center gap-3 min-w-0 flex-1 group">
                  <div className="w-9 h-9 rounded-lg bg-[#fff7ed] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#e97e42]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate group-hover:text-[#e97e42] transition-colors">{g.titre}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {g.niveau}
                      {g.sections_total > 0 && ` · ${g.sections_generated}/${g.sections_total} sections générées`}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {g.status !== 'published' ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={resumeHref}>
                        Reprendre <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="ghost" size="sm" className="text-[#e97e42] hover:bg-[#fff7ed]">
                      <Link href={`/admin/formations/generer/${g.id}`}>
                        <Wand2 className="w-3.5 h-3.5 mr-1" />
                        {g.sections_generated < g.sections_total ? 'Générer la suite' : 'Sommaire'}
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={async () => { if (confirm('Supprimer ce brouillon de génération ?')) { await deleteGeneration(g.id); router.refresh() } }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {initial.length > 0 && (
        <h3 className="font-semibold text-gray-800 pt-2">Formations publiées & brouillons</h3>
      )}

      {initial.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl border">
          <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune formation. Créez la première.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initial.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-white border rounded-xl p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{f.titre}</h3>
                  {f.is_published ? (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Publié</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {f.categorie ? `${f.categorie} · ` : ''}{f.prix_fcfa > 0 ? `${formatNumber(f.prix_fcfa)} FCFA` : 'Gratuit'}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={async () => { await togglePublishFormation(f.id, !f.is_published); router.refresh() }}>
                  {f.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/formations/${f.id}`}><Pencil className="w-4 h-4" /></Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => { if (confirm('Supprimer ?')) { await deleteFormation(f.id); router.refresh() } }}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
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
