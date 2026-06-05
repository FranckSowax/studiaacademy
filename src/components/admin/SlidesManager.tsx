'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, Pencil, ChevronUp, ChevronDown, Loader2, X, Upload, Eye, EyeOff, ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveSlide, deleteSlide, moveSlide, type SlideInput } from '@/lib/entreprise/slide-actions'

export interface SlideRow extends SlideInput {
  id: string
  ordre: number
  is_active: boolean
}

const empty: SlideInput = { titre: '', sous_titre: '', texte: '', cta_label: 'Découvrir', cta_href: '/entreprise/secteur/', side: 'right', couleur: '#7C3AED', is_active: true }

export function SlidesManager({ initial }: { initial: SlideRow[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState<SlideInput | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const refresh = () => router.refresh()

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const res = await saveSlide(editing)
    setSaving(false)
    if (res.success) { setEditing(null); refresh() }
    else alert(res.error || 'Erreur')
  }

  const upload = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `slides/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('entreprise').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('entreprise').getPublicUrl(path)
      setEditing((e) => (e ? { ...e, image_url: data.publicUrl } : e))
    } else alert(error.message)
    setUploading(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce slide ?')) return
    setBusy(id); await deleteSlide(id); setBusy(null); refresh()
  }
  const move = async (id: string, dir: 'up' | 'down') => {
    setBusy(id); await moveSlide(id, dir); setBusy(null); refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{initial.length} slides · affichés dans le hero de /entreprise</p>
        <Button onClick={() => setEditing({ ...empty })} className="bg-[#7C3AED] hover:bg-[#6d28d9] text-white"><Plus className="w-4 h-4 mr-1" />Nouveau slide</Button>
      </div>

      <div className="space-y-2">
        {initial.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 bg-white border rounded-xl p-3">
            <div className="flex flex-col">
              <button onClick={() => move(s.id, 'up')} disabled={i === 0 || busy === s.id} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
              <button onClick={() => move(s.id, 'down')} disabled={i === initial.length - 1 || busy === s.id} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
            </div>
            <div className="w-14 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: s.couleur }}>
              {s.image_url ? <img src={s.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-white/60" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{s.titre}</p>
              <p className="text-xs text-muted-foreground truncate">{s.sous_titre}</p>
            </div>
            {!s.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Masqué</span>}
            <Button variant="ghost" size="sm" onClick={() => setEditing(s)}><Pencil className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>{busy === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-500" />}</Button>
          </div>
        ))}
        {initial.length === 0 && <p className="text-center text-muted-foreground py-10">Aucun slide.</p>}
      </div>

      {/* Éditeur */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">{editing.id ? 'Modifier le slide' : 'Nouveau slide'}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {/* Image */}
              <div>
                <Label className="text-sm">Image (personnage détouré, PNG transparent idéal)</Label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-20 h-14 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: editing.couleur }}>
                    {editing.image_url ? <img src={editing.image_url} alt="" className="w-full h-full object-contain" /> : <ImageIcon className="w-5 h-5 text-white/60" />}
                  </div>
                  <label className="flex items-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl px-3 py-2 cursor-pointer hover:border-[#7C3AED] text-sm text-gray-500">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}Téléverser
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                  </label>
                </div>
                <Input placeholder="…ou URL de l'image" value={editing.image_url ?? ''} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} className="rounded-xl mt-2 text-xs" />
              </div>
              <div><Label className="text-sm">Titre *</Label><Input value={editing.titre} onChange={(e) => setEditing({ ...editing, titre: e.target.value })} className="rounded-xl" /></div>
              <div><Label className="text-sm">Sous-titre</Label><Input value={editing.sous_titre ?? ''} onChange={(e) => setEditing({ ...editing, sous_titre: e.target.value })} className="rounded-xl" /></div>
              <div><Label className="text-sm">Texte</Label><Textarea rows={2} value={editing.texte ?? ''} onChange={(e) => setEditing({ ...editing, texte: e.target.value })} className="rounded-xl resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Bouton (libellé)</Label><Input value={editing.cta_label ?? ''} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} className="rounded-xl" /></div>
                <div><Label className="text-sm">Bouton (lien)</Label><Input value={editing.cta_href ?? ''} onChange={(e) => setEditing({ ...editing, cta_href: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Côté du texte</Label>
                  <select value={editing.side} onChange={(e) => setEditing({ ...editing, side: e.target.value })} className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm">
                    <option value="right">Droite</option><option value="left">Gauche</option>
                  </select>
                </div>
                <div><Label className="text-sm">Couleur</Label>
                  <input type="color" value={editing.couleur ?? '#7C3AED'} onChange={(e) => setEditing({ ...editing, couleur: e.target.value })} className="w-full h-10 rounded-xl border border-[#e2e8f0]" />
                </div>
              </div>
              <button onClick={() => setEditing({ ...editing, is_active: !editing.is_active })} className="inline-flex items-center gap-2 text-sm text-gray-600">
                {editing.is_active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                {editing.is_active ? 'Visible' : 'Masqué'}
              </button>
              <Button onClick={save} disabled={!editing.titre || saving} className="w-full bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
