'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { compressImages } from '@/lib/image-compress'
import {
  ArrowLeft, ArrowRight, Loader2, FileText, Link2, Type, Upload, X, Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type SourceMode = 'texte' | 'url' | 'fichier'

export function KahootCreateForm() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState('')

  const [meta, setMeta] = useState({ titre: '', matiere: '', niveau: '' })
  const [sourceModes, setSourceModes] = useState<SourceMode[]>(['texte'])
  const [sourceTexte, setSourceTexte] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [nbQuestions, setNbQuestions] = useState(10)

  const toggleMode = (mode: SourceMode) =>
    setSourceModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]))

  /** Combine les sources en un seul contenu texte. */
  const buildSourceContent = async (): Promise<string> => {
    const parts: string[] = []
    if (sourceModes.includes('texte') && sourceTexte.trim()) parts.push(sourceTexte.trim())

    // URL + fichiers → endpoint d'extraction serveur
    const extractBody: { url?: string; files?: { url: string; mime: string; name: string }[] } = {}
    if (sourceModes.includes('url') && sourceUrl.trim()) extractBody.url = sourceUrl.trim()

    if (sourceModes.includes('fichier') && files.length > 0) {
      setProgress('Téléversement des documents…')
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const optimized = await compressImages(files)
        const refs: { url: string; mime: string; name: string }[] = []
        for (const file of optimized) {
          const ext = file.name.split('.').pop()
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error } = await supabase.storage.from('cours-sources').upload(path, file)
          if (!error) {
            const { data } = await supabase.storage.from('cours-sources').createSignedUrl(path, 1800)
            if (data?.signedUrl) refs.push({ url: data.signedUrl, mime: file.type || 'application/octet-stream', name: file.name })
          }
        }
        if (refs.length > 0) extractBody.files = refs
      }
    }

    if (extractBody.url || extractBody.files) {
      setProgress('Lecture des sources (PDF, DOC, lien)…')
      const res = await fetch('/api/professeur/kahoot/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractBody),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.content) parts.push(data.content)
        if (data.errors?.length) console.warn('Extraction:', data.errors)
      }
    }
    return parts.join('\n\n---\n\n')
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const sourceContent = await buildSourceContent()
      if (sourceContent.trim().length < 50) {
        throw new Error('Ajoutez une source de contenu suffisante (cours, lien, PDF/DOC).')
      }
      setProgress('Génération des questions par l’IA…')
      const res = await fetch('/api/professeur/kahoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meta, source_content: sourceContent, nb_questions: nbQuestions }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Erreur')
      router.push(`/professeur/kahoot/${data.kahoot_id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
      setSubmitting(false)
      setProgress('')
    }
  }

  const canStep1 = meta.titre && meta.niveau
  const canStep2 =
    (sourceModes.includes('texte') && sourceTexte.trim()) ||
    (sourceModes.includes('url') && sourceUrl.trim()) ||
    (sourceModes.includes('fichier') && files.length > 0)

  return (
    <div className="max-w-3xl">
      <Link href="/professeur/kahoot" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#7C3AED] mb-6">
        <ArrowLeft className="w-4 h-4" />Retour
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-6 h-6 text-[#7C3AED]" />
        <h1 className="text-2xl font-bold font-heading text-gray-900">Nouveau Kahoot</h1>
      </div>
      <p className="text-gray-500 mb-6">Étape {step} sur 3</p>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-[#7C3AED]' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* ÉTAPE 1 — Infos */}
      {step === 1 && (
        <div className="space-y-5 bg-white rounded-2xl border border-[#f0ebe3] p-6">
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-700">Titre du Kahoot *</Label>
            <Input placeholder="Ex : Quiz — La photosynthèse" value={meta.titre}
              onChange={(e) => setMeta({ ...meta, titre: e.target.value })} className="rounded-xl border-[#e2e8f0] focus:border-violet-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Matière</Label>
              <Input placeholder="SVT" value={meta.matiere}
                onChange={(e) => setMeta({ ...meta, matiere: e.target.value })} className="rounded-xl border-[#e2e8f0] focus:border-violet-400" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Niveau *</Label>
              <Input placeholder="3ème" value={meta.niveau}
                onChange={(e) => setMeta({ ...meta, niveau: e.target.value })} className="rounded-xl border-[#e2e8f0] focus:border-violet-400" />
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 — Sources */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choisissez une ou plusieurs sources (combinables).</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { mode: 'texte' as const, icon: Type, label: 'Texte' },
              { mode: 'url' as const, icon: Link2, label: 'Lien' },
              { mode: 'fichier' as const, icon: FileText, label: 'PDF / DOC / Image' },
            ].map((s) => {
              const Icon = s.icon
              const active = sourceModes.includes(s.mode)
              return (
                <button key={s.mode} onClick={() => toggleMode(s.mode)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${active ? 'border-violet-400 bg-violet-50' : 'border-[#f0ebe3] hover:border-violet-300'}`}>
                  <Icon className={`w-5 h-5 ${active ? 'text-[#7C3AED]' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${active ? 'text-[#7C3AED]' : 'text-gray-600'}`}>{s.label}</span>
                </button>
              )
            })}
          </div>

          {sourceModes.includes('texte') && (
            <Textarea placeholder="Collez le contenu du cours ici…" value={sourceTexte}
              onChange={(e) => setSourceTexte(e.target.value)} rows={6}
              className="rounded-xl border-[#e2e8f0] focus:border-violet-400 resize-none" />
          )}
          {sourceModes.includes('url') && (
            <Input placeholder="https://… (article, page de cours)" value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)} className="rounded-xl border-[#e2e8f0] focus:border-violet-400" />
          )}
          {sourceModes.includes('fichier') && (
            <div>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl py-5 cursor-pointer hover:border-violet-400 transition-colors text-sm text-gray-500">
                <Upload className="w-4 h-4" />PDF, DOC/DOCX ou images du cours
                <input type="file" accept="image/*,.pdf,.doc,.docx" multiple className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
              </label>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-violet-50 text-[#7C3AED] text-xs px-2.5 py-1 rounded-full">
                      <FileText className="w-3 h-3" />{f.name.slice(0, 22)}
                      <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
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
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-700">Nombre de questions</Label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((n) => (
                <button key={n} onClick={() => setNbQuestions(n)}
                  className={`py-2 rounded-xl border text-sm font-medium transition-all ${nbQuestions === n ? 'border-violet-400 bg-violet-50 text-[#7C3AED]' : 'border-[#f0ebe3] text-gray-600 hover:border-violet-300'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-violet-50 rounded-xl p-4 text-sm text-violet-800">
            L&apos;IA génère <strong>{nbQuestions} questions</strong> à choix multiple à partir de vos sources. Vous pourrez ensuite lancer le Kahoot en direct (QR code) ou partager le lien.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && !submitting && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl border-[#e2e8f0]">
            <ArrowLeft className="w-4 h-4 mr-1" />Retour
          </Button>
        )}
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2)}
            className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#6d28d9] text-white rounded-xl disabled:opacity-50">
            Continuer<ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}
            className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#6d28d9] text-white rounded-xl">
            {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{progress || 'Génération…'}</> : <><Trophy className="w-4 h-4 mr-1" />Générer le Kahoot</>}
          </Button>
        )}
      </div>
    </div>
  )
}
