'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Plus, Trash2, Loader2, X, Video, FileText, Target, Upload,
  GripVertical, Eye, EyeOff, Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveLesson, deleteLesson, togglePublishFormation } from '@/lib/formations/admin-actions'
import type { Formation, FormationLesson, LessonType } from '@/types/formation'

const TYPE_META: Record<LessonType, { label: string; icon: typeof Video }> = {
  video: { label: 'Vidéo', icon: Video },
  pdf: { label: 'Document', icon: FileText },
  texte: { label: 'Texte', icon: FileText },
  quiz: { label: 'Quiz', icon: Target },
}

export function AdminLessonsManager({
  formation,
  initialLessons,
}: {
  formation: Formation
  initialLessons: FormationLesson[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [lessons] = useState(initialLessons)
  const [editing, setEditing] = useState<Partial<FormationLesson> | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const openNew = () =>
    setEditing({ type: 'video', titre: '', ordre: lessons.length + 1, is_preview: false, duree_minutes: 0 })

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const res = await saveLesson({
      id: editing.id,
      formation_id: formation.id,
      ordre: editing.ordre ?? lessons.length + 1,
      titre: editing.titre ?? '',
      type: (editing.type ?? 'video') as LessonType,
      video_url: editing.video_url ?? undefined,
      contenu: editing.contenu ?? undefined,
      document_url: editing.document_url ?? undefined,
      duree_minutes: editing.duree_minutes ?? 0,
      is_preview: editing.is_preview ?? false,
    })
    setSaving(false)
    if (res.success) {
      setEditing(null)
      router.refresh()
    } else alert(res.error || 'Erreur')
  }

  const uploadDoc = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${formation.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('formations').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('formations').getPublicUrl(path)
      setEditing((e) => ({ ...e, document_url: data.publicUrl }))
    } else alert(error.message)
    setUploading(false)
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/formations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#e97e42]">
        <ArrowLeft className="w-4 h-4" />
        Formations
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{formation.titre}</h2>
          <p className="text-sm text-muted-foreground">{lessons.length} leçons · {formation.is_published ? 'Publié' : 'Brouillon'}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => { await togglePublishFormation(formation.id, !formation.is_published); router.refresh() }}
          >
            {formation.is_published ? <><EyeOff className="w-4 h-4 mr-1" />Dépublier</> : <><Eye className="w-4 h-4 mr-1" />Publier</>}
          </Button>
          <Button onClick={openNew} className="bg-[#e97e42] hover:bg-[#d56a2e] text-white">
            <Plus className="w-4 h-4 mr-1" />Leçon
          </Button>
        </div>
      </div>

      {/* Liste leçons */}
      <div className="space-y-2">
        {lessons.map((l) => {
          const Icon = TYPE_META[l.type].icon
          return (
            <div key={l.id} className="flex items-center gap-3 bg-white border rounded-xl p-3">
              <GripVertical className="w-4 h-4 text-gray-300" />
              <span className="text-xs text-muted-foreground w-5">{l.ordre}</span>
              <Icon className="w-4 h-4 text-[#e97e42]" />
              <span className="flex-1 text-sm font-medium truncate">{l.titre}</span>
              {l.is_preview && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Aperçu</span>}
              <span className="text-xs text-muted-foreground">{TYPE_META[l.type].label}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditing(l)}><FileText className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={async () => { if (confirm('Supprimer ?')) { await deleteLesson(l.id, formation.id); router.refresh() } }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          )
        })}
        {lessons.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-xl border text-muted-foreground text-sm">
            Aucune leçon. Ajoutez la première.
          </div>
        )}
      </div>

      {/* Éditeur leçon */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">{editing.id ? 'Modifier' : 'Nouvelle'} leçon</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {/* Type */}
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(TYPE_META) as LessonType[]).map((t) => {
                  const Icon = TYPE_META[t].icon
                  return (
                    <button key={t} onClick={() => setEditing({ ...editing, type: t })}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs ${editing.type === t ? 'border-[#e97e42] bg-[#fff7ed] text-[#a84d16]' : 'border-[#f0ebe3] text-gray-500'}`}>
                      <Icon className="w-4 h-4" />{TYPE_META[t].label}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Titre *</Label>
                <Input value={editing.titre ?? ''} onChange={(e) => setEditing({ ...editing, titre: e.target.value })} className="rounded-xl" />
              </div>

              {editing.type === 'video' && (
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">Lien vidéo (YouTube / Vimeo)</Label>
                  <Input placeholder="https://youtube.com/watch?v=..." value={editing.video_url ?? ''} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} className="rounded-xl" />
                </div>
              )}

              {(editing.type === 'pdf') && (
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">Document</Label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl py-4 cursor-pointer hover:border-[#e97e42] text-sm text-gray-500">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {editing.document_url ? 'Document chargé ✓' : 'Téléverser un PDF/document'}
                    <input type="file" accept=".pdf,image/*,.docx,.pptx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f) }} />
                  </label>
                </div>
              )}

              {(editing.type === 'texte' || editing.type === 'quiz') && (
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">{editing.type === 'quiz' ? 'Énoncé du quiz' : 'Contenu'}</Label>
                  <Textarea rows={5} value={editing.contenu ?? ''} onChange={(e) => setEditing({ ...editing, contenu: e.target.value })} className="rounded-xl resize-none" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">Durée (min)</Label>
                  <Input type="number" value={editing.duree_minutes ?? 0} onChange={(e) => setEditing({ ...editing, duree_minutes: Number(e.target.value) })} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">Ordre</Label>
                  <Input type="number" value={editing.ordre ?? 1} onChange={(e) => setEditing({ ...editing, ordre: Number(e.target.value) })} className="rounded-xl" />
                </div>
              </div>

              <label className="flex items-center justify-between bg-[#fbf8f3] rounded-xl px-4 py-3 cursor-pointer">
                <span className="text-sm text-gray-700">Leçon en aperçu gratuit</span>
                <input type="checkbox" checked={editing.is_preview ?? false} onChange={(e) => setEditing({ ...editing, is_preview: e.target.checked })} className="w-4 h-4 accent-[#e97e42]" />
              </label>

              <Button onClick={save} disabled={!editing.titre || saving} className="w-full bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Enregistrer</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
