'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronUp, Eye, EyeOff, ImageIcon, Loader2, Pencil, Plus, Trash2, Upload, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { deleteHomeSlide, moveHomeSlide, saveHomeSlide, type HomeSlideInput } from '@/lib/home/slide-actions'
import { MAX_HOME_SLIDES, type HomeSlide } from '@/lib/home/slides'

const BUCKET = 'home-slides'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

const EMPTY: HomeSlideInput = {
  titre: '',
  sous_titre: '',
  texte: '',
  cta_label: 'Découvrir',
  cta_href: '/formations/en-ligne',
  image_url: '',
  is_active: true,
}

/** Gestion des slides du hero de la page d'accueil (5 maximum). */
export function HomeSlidesManager({ initial }: { initial: HomeSlide[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<HomeSlideInput | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const full = initial.length >= MAX_HOME_SLIDES
  const activeCount = initial.filter((s) => s.is_active).length

  const close = () => {
    setEditing(null)
    setError(null)
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    setError(null)
    const res = await saveHomeSlide(editing)
    setSaving(false)
    if (res.success) {
      close()
      router.refresh()
    } else {
      setError(res.error ?? "L'enregistrement a échoué")
    }
  }

  const upload = async (file: File) => {
    setError(null)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format non pris en charge : utilisez JPG, PNG, WebP ou AVIF.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image trop lourde : 5 Mo maximum.')
      return
    }
    setUploading(true)
    const supabase = createClient()
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
    if (uploadError) {
      setError(`Téléversement impossible : ${uploadError.message}`)
    } else {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      setEditing((e) => (e ? { ...e, image_url: data.publicUrl } : e))
    }
    setUploading(false)
  }

  const run = async (id: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    setBusy(id)
    const res = await action()
    setBusy(null)
    if (!res.success) alert(res.error ?? "L'opération a échoué")
    router.refresh()
  }

  const remove = (s: HomeSlide) => {
    if (!confirm(`Supprimer le slide « ${s.titre} » ?`)) return
    void run(s.id, () => deleteHomeSlide(s.id))
  }

  const toggle = (s: HomeSlide) =>
    void run(s.id, () => saveHomeSlide({ ...s, is_active: !s.is_active }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {initial.length}/{MAX_HOME_SLIDES} slides · {activeCount} visible{activeCount > 1 ? 's' : ''} sur le site
        </p>
        <Button
          onClick={() => setEditing({ ...EMPTY })}
          disabled={full}
          className="bg-[#e97e42] text-white hover:bg-[#d56a2e]"
        >
          <Plus className="mr-1 h-4 w-4" />
          Nouveau slide
        </Button>
      </div>
      {full && (
        <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Limite de {MAX_HOME_SLIDES} slides atteinte : supprimez-en un pour en ajouter un nouveau.
        </p>
      )}
      {activeCount === 0 && (
        <p className="rounded-xl bg-[#fff7ed] px-4 py-2 text-sm text-[#a84d16]">
          Aucun slide visible : le site affiche le hero par défaut avec la barre de recherche.
        </p>
      )}

      <ul className="space-y-2">
        {initial.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 rounded-xl border bg-white p-3">
            <div className="flex flex-col">
              <button
                onClick={() => void run(s.id, () => moveHomeSlide(s.id, 'up'))}
                disabled={i === 0 || busy !== null}
                aria-label="Monter"
                className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => void run(s.id, () => moveHomeSlide(s.id, 'down'))}
                disabled={i === initial.length - 1 || busy !== null}
                aria-label="Descendre"
                className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="flex h-12 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-900">
              {s.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL libre saisie dans l'admin
                <img src={s.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4 text-white/50" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{s.titre}</p>
              <p className="truncate text-xs text-muted-foreground">
                {s.sous_titre || '—'}
                {s.cta_href ? ` · ${s.cta_label || 'Découvrir'} → ${s.cta_href}` : ''}
              </p>
            </div>
            <button
              onClick={() => toggle(s)}
              disabled={busy !== null}
              aria-label={s.is_active ? 'Masquer le slide' : 'Afficher le slide'}
              title={s.is_active ? 'Visible — cliquer pour masquer' : 'Masqué — cliquer pour afficher'}
              className="p-1.5 disabled:opacity-40"
            >
              {s.is_active ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
            </button>
            <Button variant="ghost" size="sm" onClick={() => setEditing({ ...s })} aria-label="Modifier">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => remove(s)} disabled={busy !== null} aria-label="Supprimer">
              {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
            </Button>
          </li>
        ))}
        {initial.length === 0 && (
          <li className="rounded-xl border border-dashed py-10 text-center text-muted-foreground">
            Aucun slide pour le moment. Créez le premier.
          </li>
        )}
      </ul>

      {/* Éditeur */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
          <div role="dialog" aria-modal="true" aria-label="Éditer le slide" className="my-auto w-full max-w-lg rounded-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing.id ? 'Modifier le slide' : 'Nouveau slide'}</h3>
              <button onClick={close} aria-label="Fermer" className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {/* Aperçu */}
              <div className="relative flex aspect-[16/8] items-end overflow-hidden rounded-2xl bg-[#0f0d0b] p-4">
                {editing.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- URL libre saisie dans l'admin
                  <img src={editing.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f0d0b]/90 via-[#0f0d0b]/55 to-transparent" />
                <div className="relative max-w-[75%] text-white">
                  <p className="font-heading text-lg font-extrabold leading-tight">{editing.titre || 'Titre du slide'}</p>
                  {editing.sous_titre && <p className="text-sm font-semibold text-[#f8b98a]">{editing.sous_titre}</p>}
                  {editing.cta_href && (
                    <span className="mt-2 inline-block rounded-lg bg-[#e97e42] px-3 py-1 text-xs font-bold">
                      {editing.cta_label || 'Découvrir'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm">Image de fond (paysage, 1920 × 1080 conseillé, 5 Mo max)</Label>
                <div className="mt-1 flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-[#e2e8f0] px-3 py-2 text-sm text-gray-500 hover:border-[#e97e42]">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Téléverser
                    <input
                      type="file"
                      accept={ACCEPTED_TYPES.join(',')}
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void upload(file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <Input
                    placeholder="…ou URL https:// de l'image"
                    value={editing.image_url ?? ''}
                    onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Titre *</Label>
                <Input maxLength={120} value={editing.titre} onChange={(e) => setEditing({ ...editing, titre: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-sm">Sous-titre</Label>
                <Input maxLength={160} value={editing.sous_titre ?? ''} onChange={(e) => setEditing({ ...editing, sous_titre: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-sm">Texte de description</Label>
                <Textarea rows={3} maxLength={400} value={editing.texte ?? ''} onChange={(e) => setEditing({ ...editing, texte: e.target.value })} className="resize-none rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Texte du bouton</Label>
                  <Input maxLength={40} value={editing.cta_label ?? ''} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm">Lien du bouton</Label>
                  <Input placeholder="/formations/en-ligne" value={editing.cta_href ?? ''} onChange={(e) => setEditing({ ...editing, cta_href: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Lien interne (<code>/formations/presentiel</code>, <code>/entreprise/diagnostic</code>…) ou externe en{' '}
                <code>https://</code>. Laissez le lien vide pour un slide sans bouton.
              </p>

              <button
                type="button"
                onClick={() => setEditing({ ...editing, is_active: !editing.is_active })}
                className="inline-flex items-center gap-2 text-sm text-gray-600"
              >
                {editing.is_active ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                {editing.is_active ? 'Visible sur le site' : 'Masqué'}
              </button>

              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <Button
                onClick={save}
                disabled={!editing.titre.trim() || saving || uploading}
                className="w-full rounded-xl bg-[#e97e42] text-white hover:bg-[#d56a2e]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
