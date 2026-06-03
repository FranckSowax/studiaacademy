'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, ArrowRight, Loader2, Type, Link2, FileText, FileAudio, Upload, X, Sparkles, FileType,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SourceType } from '@/types/generation'

const NIVEAUX = ['Collège', 'Lycée', 'Université', 'Formation professionnelle', 'Tous niveaux']

const SOURCES: { type: SourceType; label: string; icon: typeof Type; accept?: string }[] = [
  { type: 'texte', label: 'Texte collé', icon: Type },
  { type: 'url', label: 'Lien (URL)', icon: Link2 },
  { type: 'pdf', label: 'PDF / Image', icon: FileText, accept: 'image/*,.pdf' },
  { type: 'docx', label: 'Word (.docx)', icon: FileType, accept: '.docx' },
  { type: 'audio', label: 'Audio', icon: FileAudio, accept: 'audio/*' },
]

export function GenerationWizard() {
  const router = useRouter()
  const supabase = createClient()
  const [meta, setMeta] = useState({ titre: '', niveau: 'Lycée', objectif: '', matiere: '' })
  const [sourceType, setSourceType] = useState<SourceType>('texte')
  const [texte, setTexte] = useState('')
  const [url, setUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const uploadFiles = async (): Promise<{ url: string; mime: string; name: string }[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')
    const out: { url: string; mime: string; name: string }[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/gen-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('cours-sources').upload(path, file)
      if (error) throw new Error(error.message)
      const { data } = await supabase.storage.from('cours-sources').createSignedUrl(path, 1800)
      if (data?.signedUrl) out.push({ url: data.signedUrl, mime: file.type || 'application/octet-stream', name: file.name })
    }
    return out
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      let source
      if (sourceType === 'texte') {
        if (!texte.trim()) throw new Error('Collez du texte')
        source = { type: sourceType, texte }
      } else if (sourceType === 'url') {
        if (!url.trim()) throw new Error('Entrez une URL')
        source = { type: sourceType, url }
      } else {
        if (files.length === 0) throw new Error('Ajoutez un fichier')
        const uploaded = await uploadFiles()
        source = { type: sourceType, files: uploaded }
      }

      const res = await fetch('/api/admin/generation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meta, source }),
      })
      const data = await res.json()
      if (data.error && !data.generation_id) throw new Error(data.error)
      if (data.error) { setError(data.error); setLoading(false); return }
      router.push(`/admin/formations/generer/${data.generation_id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setLoading(false)
    }
  }

  const canSubmit =
    meta.titre &&
    ((sourceType === 'texte' && texte.trim()) ||
      (sourceType === 'url' && url.trim()) ||
      (['pdf', 'docx', 'audio'].includes(sourceType) && files.length > 0))

  const currentSource = SOURCES.find((s) => s.type === sourceType)!

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/formations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#e97e42]">
        <ArrowLeft className="w-4 h-4" />Formations
      </Link>

      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#e97e42]" />
          Générer une formation par IA
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          À partir d'une source, l'IA propose un sommaire que vous validerez avant de générer le cours section par section.
        </p>
      </div>

      {/* Méta */}
      <div className="bg-white border rounded-2xl p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm">Titre de la formation *</Label>
          <Input placeholder="Ex: Introduction à la comptabilité" value={meta.titre} onChange={(e) => setMeta({ ...meta, titre: e.target.value })} className="rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Niveau / classe</Label>
            <select value={meta.niveau} onChange={(e) => setMeta({ ...meta, niveau: e.target.value })}
              className="w-full h-10 rounded-xl border border-input bg-white px-3 text-sm">
              {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Matière / catégorie</Label>
            <Input placeholder="Comptabilité" value={meta.matiere} onChange={(e) => setMeta({ ...meta, matiere: e.target.value })} className="rounded-xl" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Objectif pédagogique (optionnel)</Label>
          <Input placeholder="Ce que l'apprenant saura faire à la fin" value={meta.objectif} onChange={(e) => setMeta({ ...meta, objectif: e.target.value })} className="rounded-xl" />
        </div>
      </div>

      {/* Source */}
      <div className="bg-white border rounded-2xl p-5 space-y-4">
        <Label className="text-sm font-medium">Source du contenu</Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {SOURCES.map((s) => {
            const Icon = s.icon
            const active = sourceType === s.type
            return (
              <button key={s.type} onClick={() => { setSourceType(s.type); setFiles([]) }}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs transition-all ${active ? 'border-[#e97e42] bg-[#fff7ed] text-[#a84d16]' : 'border-[#f0ebe3] text-gray-500 hover:border-[#e97e42]/40'}`}>
                <Icon className="w-4 h-4" />{s.label}
              </button>
            )
          })}
        </div>

        {sourceType === 'texte' && (
          <Textarea placeholder="Collez ici le contenu de référence…" value={texte} onChange={(e) => setTexte(e.target.value)} rows={8} className="rounded-xl resize-none" />
        )}
        {sourceType === 'url' && (
          <Input placeholder="https://… (article, cours en ligne)" value={url} onChange={(e) => setUrl(e.target.value)} className="rounded-xl" />
        )}
        {['pdf', 'docx', 'audio'].includes(sourceType) && (
          <div>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl py-6 cursor-pointer hover:border-[#e97e42] text-sm text-gray-500">
              <Upload className="w-4 h-4" />
              {sourceType === 'audio' ? 'Fichier audio à transcrire' : sourceType === 'docx' ? 'Document Word (.docx)' : 'PDF ou images'}
              <input type="file" accept={currentSource.accept} multiple={sourceType === 'pdf'} className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            </label>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 bg-[#fff7ed] text-[#a84d16] text-xs px-2.5 py-1 rounded-full">
                    <FileText className="w-3 h-3" />{f.name.slice(0, 24)}
                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={submit} disabled={!canSubmit || loading}
        className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl py-6">
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extraction & génération du sommaire…</>
        ) : (
          <>Générer le sommaire <ArrowRight className="w-4 h-4 ml-2" /></>
        )}
      </Button>
      {loading && <p className="text-xs text-center text-muted-foreground">Cette étape peut prendre 1 à 2 minutes selon la source.</p>}
    </div>
  )
}
