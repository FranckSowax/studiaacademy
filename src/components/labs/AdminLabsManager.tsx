'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, FlaskConical, Eye, EyeOff, Trash2, Pencil, Loader2, X, Upload,
  ExternalLink, FileText, Plus as PlusIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveSolution, togglePublishSolution, deleteSolution } from '@/lib/labs/admin-actions'
import type { LabsSolution, KeyFigure } from '@/types/labs'

interface FormState {
  id?: string
  nom: string
  tagline: string
  description: string
  logo_url: string
  cover_image: string
  video_url: string
  app_url: string
  categorie: string
  badge: string
  has_detail_page: boolean
  key_figures: KeyFigure[]
  features: string
  is_published: boolean
}

const empty: FormState = {
  nom: '', tagline: '', description: '', logo_url: '', cover_image: '', video_url: '',
  app_url: '', categorie: '', badge: '', has_detail_page: true, key_figures: [], features: '', is_published: false,
}

export function AdminLabsManager({ initial }: { initial: LabsSolution[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null)

  const openNew = () => setForm({ ...empty })
  const openEdit = (s: LabsSolution) =>
    setForm({
      id: s.id, nom: s.nom, tagline: s.tagline ?? '', description: s.description ?? '',
      logo_url: s.logo_url ?? '', cover_image: s.cover_image ?? '', video_url: s.video_url ?? '',
      app_url: s.app_url ?? '', categorie: s.categorie ?? '', badge: s.badge ?? '',
      has_detail_page: s.has_detail_page, key_figures: s.key_figures ?? [],
      features: (s.features ?? []).join('\n'), is_published: s.is_published,
    })

  const upload = async (kind: 'logo' | 'cover', file: File) => {
    if (!form) return
    setUploading(kind)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('labs').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('labs').getPublicUrl(path)
      setForm({ ...form, [kind === 'logo' ? 'logo_url' : 'cover_image']: data.publicUrl })
    } else alert(error.message)
    setUploading(null)
  }

  const save = async () => {
    if (!form) return
    setSaving(true)
    const res = await saveSolution({
      ...form,
      features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
    })
    setSaving(false)
    if (res.success) {
      setForm(null)
      router.refresh()
    } else alert(res.error || 'Erreur')
  }

  const addFigure = () => form && setForm({ ...form, key_figures: [...form.key_figures, { label: '', value: '' }] })
  const updateFigure = (i: number, field: keyof KeyFigure, v: string) =>
    form && setForm({ ...form, key_figures: form.key_figures.map((kf, idx) => idx === i ? { ...kf, [field]: v } : kf) })
  const removeFigure = (i: number) =>
    form && setForm({ ...form, key_figures: form.key_figures.filter((_, idx) => idx !== i) })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Studia Labs</h2>
          <p className="text-sm text-muted-foreground mt-1">Gérez les solutions présentées au public.</p>
        </div>
        <Button onClick={openNew} className="bg-[#e97e42] hover:bg-[#d56a2e] text-white">
          <Plus className="w-4 h-4 mr-1" />Nouvelle solution
        </Button>
      </div>

      {initial.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl border">
          <FlaskConical className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune solution. Ajoutez la première.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initial.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-white border rounded-xl p-4">
              <div className="flex items-center gap-3 min-w-0">
                {s.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logo_url} alt={s.nom} className="w-10 h-10 rounded-lg object-contain border" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#fff7ed] flex items-center justify-center"><FlaskConical className="w-5 h-5 text-[#e97e42]" /></div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{s.nom}</h3>
                    {s.is_published ? <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Publié</span> : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>}
                    {s.has_detail_page ? <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5"><FileText className="w-3 h-3" />Page</span> : <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5"><ExternalLink className="w-3 h-3" />Redirection</span>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{s.tagline || s.categorie || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={async () => { await togglePublishSolution(s.id, !s.is_published); router.refresh() }}>
                  {s.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={async () => { if (confirm('Supprimer ?')) { await deleteSolution(s.id); router.refresh() } }}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Éditeur */}
      {form && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">{form.id ? 'Modifier' : 'Nouvelle'} solution</h3>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nom *"><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="rounded-xl" /></Field>
                <Field label="Catégorie"><Input placeholder="SaaS, IA…" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="rounded-xl" /></Field>
              </div>
              <Field label="Accroche (tagline)"><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="rounded-xl" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Badge"><Input placeholder="Nouveau, Beta…" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="rounded-xl" /></Field>
                <Field label="URL de l'application"><Input placeholder="https://…" value={form.app_url} onChange={(e) => setForm({ ...form, app_url: e.target.value })} className="rounded-xl" /></Field>
              </div>

              {/* Uploads logo + cover */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Logo">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl py-2.5 cursor-pointer hover:border-[#e97e42] text-xs text-gray-500">
                      {uploading === 'logo' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {form.logo_url ? 'Logo ✓' : 'Logo'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload('logo', f) }} />
                    </label>
                  </div>
                </Field>
                <Field label="Cover">
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl py-2.5 cursor-pointer hover:border-[#e97e42] text-xs text-gray-500">
                    {uploading === 'cover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {form.cover_image ? 'Cover ✓' : 'Cover'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload('cover', f) }} />
                  </label>
                </Field>
              </div>

              {/* Comportement clic */}
              <div className="bg-[#fbf8f3] rounded-xl p-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Au clic sur la vignette :</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setForm({ ...form, has_detail_page: true })}
                    className={`px-3 py-2 rounded-lg border text-sm ${form.has_detail_page ? 'border-[#e97e42] bg-white text-[#a84d16]' : 'border-[#f0ebe3] text-gray-500'}`}>
                    <FileText className="w-4 h-4 inline mr-1" />Page dédiée
                  </button>
                  <button onClick={() => setForm({ ...form, has_detail_page: false })}
                    className={`px-3 py-2 rounded-lg border text-sm ${!form.has_detail_page ? 'border-[#e97e42] bg-white text-[#a84d16]' : 'border-[#f0ebe3] text-gray-500'}`}>
                    <ExternalLink className="w-4 h-4 inline mr-1" />Redirection directe
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  {form.has_detail_page ? 'Ouvre une page de présentation (texte, chiffres, vidéo) avant l\'app.' : 'Redirige directement vers l\'URL de l\'application.'}
                </p>
              </div>

              {form.has_detail_page && (
                <>
                  <Field label="Vidéo (YouTube / Vimeo)"><Input placeholder="https://…" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="rounded-xl" /></Field>
                  <Field label="Description"><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl resize-none" /></Field>
                  <Field label="Fonctionnalités (une par ligne)"><Textarea rows={3} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="rounded-xl resize-none" /></Field>

                  {/* Chiffres clés */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-700">Chiffres clés</Label>
                      <Button variant="outline" size="sm" onClick={addFigure} className="rounded-lg text-xs"><PlusIcon className="w-3.5 h-3.5 mr-1" />Ajouter</Button>
                    </div>
                    {form.key_figures.map((kf, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder="Valeur (ex: 10 000)" value={kf.value} onChange={(e) => updateFigure(i, 'value', e.target.value)} className="rounded-xl w-32" />
                        <Input placeholder="Label (ex: utilisateurs)" value={kf.label} onChange={(e) => updateFigure(i, 'label', e.target.value)} className="rounded-xl flex-1" />
                        <button onClick={() => removeFigure(i)} className="text-gray-400 hover:text-red-500 px-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <label className="flex items-center justify-between bg-[#fbf8f3] rounded-xl px-4 py-3 cursor-pointer">
                <span className="text-sm text-gray-700">Publier (visible sur /studia-labs)</span>
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 accent-[#e97e42]" />
              </label>

              <Button onClick={save} disabled={!form.nom || saving} className="w-full bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm text-gray-700">{label}</Label>{children}</div>
}
