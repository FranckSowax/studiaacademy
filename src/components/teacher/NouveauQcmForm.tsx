'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, ArrowRight, Loader2, FileText, Link2, Type, Upload, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

type SourceMode = 'texte' | 'url' | 'fichier'

export function NouveauQcmForm() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [meta, setMeta] = useState({ titre: '', matiere: '', niveau: '' })
  const [sourceModes, setSourceModes] = useState<SourceMode[]>(['texte'])
  const [sourceTexte, setSourceTexte] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [params, setParams] = useState({
    nb_questions_qcm: 10,
    nb_questions_ouvertes: 2,
    duree_minutes: 30,
    difficulte: 'moyen',
  })

  const toggleMode = (mode: SourceMode) => {
    setSourceModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    )
  }

  const buildSourceContent = async (): Promise<string> => {
    const parts: string[] = []
    if (sourceModes.includes('texte') && sourceTexte.trim()) {
      parts.push(sourceTexte.trim())
    }
    if (sourceModes.includes('url') && sourceUrl.trim()) {
      // Récupération côté serveur préférable ; ici on transmet l'URL en note
      try {
        const res = await fetch('/api/qcm/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sourceUrl.trim() }),
        })
        if (res.ok) {
          const data = await res.json()
          parts.push(data.content ?? '')
        }
      } catch {
        parts.push(`[Source URL : ${sourceUrl}]`)
      }
    }
    if (sourceModes.includes('fichier') && files.length > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const urls: string[] = []
        for (const file of files) {
          const ext = file.name.split('.').pop()
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error } = await supabase.storage.from('cours-sources').upload(path, file)
          if (!error) {
            const { data } = await supabase.storage.from('cours-sources').createSignedUrl(path, 600)
            if (data?.signedUrl) urls.push(data.signedUrl)
          }
        }
        // OCR côté serveur via la route de création
        if (urls.length > 0) {
          const res = await fetch('/api/qcm/ocr-source', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls }),
          })
          if (res.ok) {
            const data = await res.json()
            parts.push(data.content ?? '')
          }
        }
      }
    }
    return parts.join('\n\n---\n\n')
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const sourceContent = await buildSourceContent()
      if (!sourceContent.trim()) {
        throw new Error('Ajoutez au moins une source de contenu')
      }

      const res = await fetch('/api/qcm/devoirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...meta,
          source_content: sourceContent,
          ...params,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')

      router.push(`/professeur/qcm/${data.devoir_id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
      setSubmitting(false)
    }
  }

  const canStep1 = meta.titre && meta.matiere && meta.niveau
  const canStep2 =
    (sourceModes.includes('texte') && sourceTexte.trim()) ||
    (sourceModes.includes('url') && sourceUrl.trim()) ||
    (sourceModes.includes('fichier') && files.length > 0)

  return (
    <div className="max-w-3xl">
      <Link
        href="/professeur/qcm"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      <h1 className="text-2xl font-bold font-heading text-gray-900 mb-1">Nouveau QCM</h1>
      <p className="text-gray-500 mb-6">Étape {step} sur 3</p>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* ÉTAPE 1 — Infos */}
      {step === 1 && (
        <div className="space-y-5 bg-white rounded-2xl border border-[#f0ebe3] p-6">
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-700">Titre du devoir *</Label>
            <Input
              placeholder="Ex: Évaluation — La Seconde Guerre mondiale"
              value={meta.titre}
              onChange={(e) => setMeta({ ...meta, titre: e.target.value })}
              className="rounded-xl border-[#e2e8f0] focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Matière *</Label>
              <Input
                placeholder="Histoire-Géo"
                value={meta.matiere}
                onChange={(e) => setMeta({ ...meta, matiere: e.target.value })}
                className="rounded-xl border-[#e2e8f0] focus:border-blue-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Niveau *</Label>
              <Input
                placeholder="Terminale"
                value={meta.niveau}
                onChange={(e) => setMeta({ ...meta, niveau: e.target.value })}
                className="rounded-xl border-[#e2e8f0] focus:border-blue-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 — Source du contenu */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choisissez une ou plusieurs sources (combinables).
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { mode: 'texte' as const, icon: Type, label: 'Texte' },
              { mode: 'url' as const, icon: Link2, label: 'Lien' },
              { mode: 'fichier' as const, icon: FileText, label: 'PDF / Image' },
            ].map((s) => {
              const Icon = s.icon
              const active = sourceModes.includes(s.mode)
              return (
                <button
                  key={s.mode}
                  onClick={() => toggleMode(s.mode)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                    active ? 'border-blue-400 bg-blue-50' : 'border-[#f0ebe3] hover:border-blue-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${active ? 'text-blue-600' : 'text-gray-600'}`}>
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>

          {sourceModes.includes('texte') && (
            <Textarea
              placeholder="Collez le contenu du cours ici…"
              value={sourceTexte}
              onChange={(e) => setSourceTexte(e.target.value)}
              rows={6}
              className="rounded-xl border-[#e2e8f0] focus:border-blue-400 resize-none"
            />
          )}
          {sourceModes.includes('url') && (
            <Input
              placeholder="https://… (article, page de cours)"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="rounded-xl border-[#e2e8f0] focus:border-blue-400"
            />
          )}
          {sourceModes.includes('fichier') && (
            <div>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl py-5 cursor-pointer hover:border-blue-400 transition-colors text-sm text-gray-500">
                <Upload className="w-4 h-4" />
                PDF ou images du cours
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full">
                      <FileText className="w-3 h-3" />
                      {f.name.slice(0, 20)}
                      <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE 3 — Paramètres */}
      {step === 3 && (
        <div className="space-y-5 bg-white rounded-2xl border border-[#f0ebe3] p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Questions QCM</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={params.nb_questions_qcm}
                onChange={(e) => setParams({ ...params, nb_questions_qcm: Number(e.target.value) })}
                className="rounded-xl border-[#e2e8f0] focus:border-blue-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Questions ouvertes</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={params.nb_questions_ouvertes}
                onChange={(e) => setParams({ ...params, nb_questions_ouvertes: Number(e.target.value) })}
                className="rounded-xl border-[#e2e8f0] focus:border-blue-400"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-700">Durée (minutes)</Label>
            <Input
              type="number"
              min={5}
              max={180}
              value={params.duree_minutes}
              onChange={(e) => setParams({ ...params, duree_minutes: Number(e.target.value) })}
              className="rounded-xl border-[#e2e8f0] focus:border-blue-400"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-700">Difficulté</Label>
            <div className="grid grid-cols-4 gap-2">
              {['facile', 'moyen', 'difficile', 'mixte'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setParams({ ...params, difficulte: diff })}
                  className={`py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                    params.difficulte === diff
                      ? 'border-blue-400 bg-blue-50 text-blue-600'
                      : 'border-[#f0ebe3] text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            L'IA générera <strong>{params.nb_questions_qcm} QCM</strong> et{' '}
            <strong>{params.nb_questions_ouvertes} questions ouvertes</strong>, à réaliser en{' '}
            <strong>{params.duree_minutes} min</strong>.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl border-[#e2e8f0]">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
        )}
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl disabled:opacity-50"
          >
            Continuer
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>Générer le QCM</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
