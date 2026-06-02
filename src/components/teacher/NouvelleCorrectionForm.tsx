'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Upload, FileImage, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

interface BaremeQ {
  numero: number
  enonce: string
  reponse_attendue: string
  points_max: number
}

interface EleveForm {
  nom: string
  prenom: string
  phone: string
  parent_phone: string
  files: File[]
}

export function NouvelleCorrectionForm() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [meta, setMeta] = useState({ titre: '', matiere: '', niveau: '' })
  const [bareme, setBareme] = useState<BaremeQ[]>([
    { numero: 1, enonce: '', reponse_attendue: '', points_max: 4 },
  ])
  const [eleves, setEleves] = useState<EleveForm[]>([
    { nom: '', prenom: '', phone: '', parent_phone: '', files: [] },
  ])

  // ── Barème ──
  const addQuestion = () =>
    setBareme([
      ...bareme,
      { numero: bareme.length + 1, enonce: '', reponse_attendue: '', points_max: 4 },
    ])
  const removeQuestion = (i: number) =>
    setBareme(bareme.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, numero: idx + 1 })))
  const updateQuestion = (i: number, field: keyof BaremeQ, value: string | number) =>
    setBareme(bareme.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)))

  // ── Élèves ──
  const addEleve = () =>
    setEleves([...eleves, { nom: '', prenom: '', phone: '', parent_phone: '', files: [] }])
  const removeEleve = (i: number) => setEleves(eleves.filter((_, idx) => idx !== i))
  const updateEleve = (i: number, field: keyof EleveForm, value: string | File[]) =>
    setEleves(eleves.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)))

  const totalPoints = bareme.reduce((sum, q) => sum + Number(q.points_max), 0)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Upload des copies vers Supabase Storage
      const elevesPayload = []
      for (const eleve of eleves) {
        const filePaths: string[] = []
        for (const file of eleve.files) {
          const ext = file.name.split('.').pop()
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error } = await supabase.storage.from('copies').upload(path, file)
          if (error) throw new Error(`Upload échoué : ${error.message}`)
          filePaths.push(path)
        }
        elevesPayload.push({
          nom: eleve.nom,
          prenom: eleve.prenom,
          phone: eleve.phone || undefined,
          parent_phone: eleve.parent_phone || undefined,
          files: filePaths,
        })
      }

      const res = await fetch('/api/correction/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: meta.titre,
          matiere: meta.matiere,
          niveau: meta.niveau,
          bareme: { questions: bareme },
          eleves: elevesPayload,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur création')

      router.push(`/professeur/correction/${data.session_id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
      setSubmitting(false)
    }
  }

  const canStep1 = meta.titre && meta.matiere && meta.niveau
  const canStep2 = bareme.every((q) => q.enonce && q.reponse_attendue && q.points_max > 0)
  const canSubmit = eleves.every((e) => e.nom && e.prenom && e.files.length > 0)

  return (
    <div className="max-w-3xl">
      <Link
        href="/professeur/correction"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      <h1 className="text-2xl font-bold font-heading text-gray-900 mb-1">
        Nouvelle session de correction
      </h1>
      <p className="text-gray-500 mb-6">Étape {step} sur 3</p>

      {/* Progression */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-[#e97e42]' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* ÉTAPE 1 — Infos */}
      {step === 1 && (
        <div className="space-y-5 bg-white rounded-2xl border border-[#f0ebe3] p-6">
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-700">Titre du devoir *</Label>
            <Input
              placeholder="Ex: Contrôle chapitre 3 — Les fonctions"
              value={meta.titre}
              onChange={(e) => setMeta({ ...meta, titre: e.target.value })}
              className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Matière *</Label>
              <Input
                placeholder="Mathématiques"
                value={meta.matiere}
                onChange={(e) => setMeta({ ...meta, matiere: e.target.value })}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Niveau *</Label>
              <Input
                placeholder="3ème"
                value={meta.niveau}
                onChange={(e) => setMeta({ ...meta, niveau: e.target.value })}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 — Barème */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Total : <span className="font-bold text-[#e97e42]">{totalPoints} points</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={addQuestion}
              className="rounded-xl border-[#e2e8f0] text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Question
            </Button>
          </div>

          {bareme.map((q, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#f0ebe3] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Question {q.numero}</span>
                {bareme.length > 1 && (
                  <button onClick={() => removeQuestion(i)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Textarea
                placeholder="Énoncé de la question"
                value={q.enonce}
                onChange={(e) => updateQuestion(i, 'enonce', e.target.value)}
                rows={2}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42] resize-none text-sm"
              />
              <Textarea
                placeholder="Réponse attendue / éléments de correction"
                value={q.reponse_attendue}
                onChange={(e) => updateQuestion(i, 'reponse_attendue', e.target.value)}
                rows={2}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42] resize-none text-sm"
              />
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-600">Points :</Label>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={q.points_max}
                  onChange={(e) => updateQuestion(i, 'points_max', Number(e.target.value))}
                  className="w-24 rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ÉTAPE 3 — Élèves + copies */}
      {step === 3 && (
        <div className="space-y-4">
          {eleves.map((eleve, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#f0ebe3] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Élève {i + 1}</span>
                {eleves.length > 1 && (
                  <button onClick={() => removeEleve(i)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Prénom *"
                  value={eleve.prenom}
                  onChange={(e) => updateEleve(i, 'prenom', e.target.value)}
                  className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
                />
                <Input
                  placeholder="Nom *"
                  value={eleve.nom}
                  onChange={(e) => updateEleve(i, 'nom', e.target.value)}
                  className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="WhatsApp élève (+241)"
                  value={eleve.phone}
                  onChange={(e) => updateEleve(i, 'phone', e.target.value)}
                  className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
                />
                <Input
                  placeholder="WhatsApp parent (option)"
                  value={eleve.parent_phone}
                  onChange={(e) => updateEleve(i, 'parent_phone', e.target.value)}
                  className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
                />
              </div>

              {/* Upload copies */}
              <div>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl py-4 cursor-pointer hover:border-[#e97e42] transition-colors text-sm text-gray-500">
                  <Upload className="w-4 h-4" />
                  Photos / scans de la copie
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      updateEleve(i, 'files', Array.from(e.target.files ?? []))
                    }
                  />
                </label>
                {eleve.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {eleve.files.map((f, fi) => (
                      <span
                        key={fi}
                        className="inline-flex items-center gap-1.5 bg-[#fff7ed] text-[#a84d16] text-xs px-2.5 py-1 rounded-full"
                      >
                        <FileImage className="w-3 h-3" />
                        {f.name.slice(0, 18)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addEleve}
            className="w-full rounded-xl border-dashed border-[#e2e8f0] text-gray-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter un élève
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="rounded-xl border-[#e2e8f0]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
        )}
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2)}
            className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl disabled:opacity-50"
          >
            Continuer
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Traitement...
              </>
            ) : (
              <>Lancer la correction IA</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
