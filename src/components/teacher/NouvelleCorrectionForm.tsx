'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getClassStudents } from '@/app/(professeur)/actions'
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Upload, FileImage, Loader2,
  Type, ScanText, Check, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import type { Classe, ClassStudent } from '@/types/teacher'

interface BaremeQ {
  numero: number
  enonce: string
  reponse_attendue: string
  points_max: number
}

interface CopieForm {
  files: File[]
  class_student_id: string
  prenom: string
  nom: string
  phone: string
  parent_phone: string
}

export function NouvelleCorrectionForm() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Étape 1
  const [meta, setMeta] = useState({ titre: '', matiere: '', niveau: '' })

  // Étape 2 — corrigé de référence
  const [useUpload, setUseUpload] = useState(true)
  const [useManuel, setUseManuel] = useState(false)
  const [corrigeFiles, setCorrigeFiles] = useState<File[]>([])
  const [corrigeStoragePaths, setCorrigeStoragePaths] = useState<string[]>([])
  const [corrigeText, setCorrigeText] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [bareme, setBareme] = useState<BaremeQ[]>([
    { numero: 1, enonce: '', reponse_attendue: '', points_max: 4 },
  ])

  // Étape 3 — classe + copies
  const [classes, setClasses] = useState<Classe[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [copies, setCopies] = useState<CopieForm[]>([
    { files: [], class_student_id: '', prenom: '', nom: '', phone: '', parent_phone: '' },
  ])

  // Charger les classes du prof
  useEffect(() => {
    supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setClasses((data ?? []) as Classe[]))
  }, [supabase])

  // Charger les élèves quand une classe est choisie
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([])
      return
    }
    getClassStudents(selectedClassId).then(setStudents)
  }, [selectedClassId])

  // ── Barème manuel ──
  const addQuestion = () =>
    setBareme([...bareme, { numero: bareme.length + 1, enonce: '', reponse_attendue: '', points_max: 4 }])
  const removeQuestion = (i: number) =>
    setBareme(bareme.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, numero: idx + 1 })))
  const updateQuestion = (i: number, field: keyof BaremeQ, value: string | number) =>
    setBareme(bareme.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)))
  const totalPoints = bareme.reduce((sum, q) => sum + Number(q.points_max), 0)

  // ── OCR du corrigé uploadé ──
  const lancerOcrCorrige = async (files: File[]) => {
    setCorrigeFiles(files)
    if (files.length === 0) return
    setOcrLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const paths: string[] = []
      const signedUrls: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/corrige-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('cours-sources').upload(path, file)
        if (error) throw new Error(error.message)
        paths.push(path)
        const { data } = await supabase.storage.from('cours-sources').createSignedUrl(path, 600)
        if (data?.signedUrl) signedUrls.push(data.signedUrl)
      }
      setCorrigeStoragePaths(paths)

      const res = await fetch('/api/correction/ocr-corrige', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: signedUrls }),
      })
      const data = await res.json()
      if (res.ok) setCorrigeText(data.content ?? '')
      else alert(data.error || 'Erreur OCR')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur OCR')
    }
    setOcrLoading(false)
  }

  // ── Copies ──
  const addCopie = () =>
    setCopies([...copies, { files: [], class_student_id: '', prenom: '', nom: '', phone: '', parent_phone: '' }])
  const removeCopie = (i: number) => setCopies(copies.filter((_, idx) => idx !== i))
  const updateCopie = (i: number, patch: Partial<CopieForm>) =>
    setCopies(copies.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))

  const assignStudent = (i: number, studentId: string) => {
    const s = students.find((st) => st.id === studentId)
    if (s) {
      updateCopie(i, {
        class_student_id: s.id,
        prenom: s.prenom,
        nom: s.nom,
        phone: s.eleve_phone ?? '',
        parent_phone: s.parent_phone ?? '',
      })
    } else {
      updateCopie(i, { class_student_id: '', prenom: '', nom: '', phone: '', parent_phone: '' })
    }
  }

  // ── Soumission ──
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Upload des copies
      const copiesPayload = []
      for (const copie of copies) {
        const filePaths: string[] = []
        for (const file of copie.files) {
          const ext = file.name.split('.').pop()
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error } = await supabase.storage.from('copies').upload(path, file)
          if (error) throw new Error(`Upload échoué : ${error.message}`)
          filePaths.push(path)
        }
        copiesPayload.push({
          nom: copie.nom,
          prenom: copie.prenom,
          phone: copie.phone || undefined,
          parent_phone: copie.parent_phone || undefined,
          class_student_id: copie.class_student_id || undefined,
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
          class_id: selectedClassId || undefined,
          bareme: { questions: useManuel ? bareme : [] },
          corrige_reference: useUpload ? corrigeText : undefined,
          corrige_files: useUpload ? corrigeStoragePaths : [],
          copies: copiesPayload,
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

  // ── Validations par étape ──
  const canStep1 = meta.titre && meta.matiere && meta.niveau
  const corrigeOk =
    (useUpload && corrigeText.trim().length > 0) ||
    (useManuel && bareme.every((q) => q.enonce && q.reponse_attendue && q.points_max > 0))
  const canSubmit = copies.every(
    (c) => c.prenom && c.nom && c.files.length > 0
  )

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

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-[#e97e42]' : 'bg-gray-200'}`} />
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
              <Input placeholder="Mathématiques" value={meta.matiere}
                onChange={(e) => setMeta({ ...meta, matiere: e.target.value })}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Niveau *</Label>
              <Input placeholder="3ème" value={meta.niveau}
                onChange={(e) => setMeta({ ...meta, niveau: e.target.value })}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]" />
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 — Corrigé de référence */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Fournissez le corrigé : importez un document (cours ou devoir déjà corrigé) qui sera
            analysé par OCR, et/ou saisissez le barème manuellement.
          </p>

          {/* Choix des sources */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setUseUpload(!useUpload)}
              className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                useUpload ? 'border-[#e97e42] bg-[#fff7ed]' : 'border-[#f0ebe3] hover:border-[#e97e42]/40'
              }`}
            >
              <ScanText className={`w-5 h-5 ${useUpload ? 'text-[#e97e42]' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${useUpload ? 'text-[#a84d16]' : 'text-gray-600'}`}>
                Importer un corrigé (OCR)
              </span>
            </button>
            <button
              onClick={() => setUseManuel(!useManuel)}
              className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                useManuel ? 'border-[#e97e42] bg-[#fff7ed]' : 'border-[#f0ebe3] hover:border-[#e97e42]/40'
              }`}
            >
              <Type className={`w-5 h-5 ${useManuel ? 'text-[#e97e42]' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${useManuel ? 'text-[#a84d16]' : 'text-gray-600'}`}>
                Saisir manuellement
              </span>
            </button>
          </div>

          {/* Upload corrigé */}
          {useUpload && (
            <div className="bg-white rounded-2xl border border-[#f0ebe3] p-5 space-y-3">
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl py-5 cursor-pointer hover:border-[#e97e42] transition-colors text-sm text-gray-500">
                <Upload className="w-4 h-4" />
                Photos/scans du cours ou du devoir corrigé
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => lancerOcrCorrige(Array.from(e.target.files ?? []))}
                />
              </label>

              {corrigeFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {corrigeFiles.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-[#fff7ed] text-[#a84d16] text-xs px-2.5 py-1 rounded-full">
                      <FileText className="w-3 h-3" />
                      {f.name.slice(0, 20)}
                    </span>
                  ))}
                </div>
              )}

              {ocrLoading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse OCR du corrigé en cours…
                </div>
              )}

              {corrigeText && !ocrLoading && (
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Corrigé extrait (modifiable)
                  </Label>
                  <Textarea
                    value={corrigeText}
                    onChange={(e) => setCorrigeText(e.target.value)}
                    rows={8}
                    className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42] text-sm font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* Barème manuel */}
          {useManuel && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total : <span className="font-bold text-[#e97e42]">{totalPoints} points</span>
                </p>
                <Button variant="outline" size="sm" onClick={addQuestion} className="rounded-xl border-[#e2e8f0] text-sm">
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
                  <Textarea placeholder="Énoncé de la question" value={q.enonce}
                    onChange={(e) => updateQuestion(i, 'enonce', e.target.value)} rows={2}
                    className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42] resize-none text-sm" />
                  <Textarea placeholder="Réponse attendue / éléments de correction" value={q.reponse_attendue}
                    onChange={(e) => updateQuestion(i, 'reponse_attendue', e.target.value)} rows={2}
                    className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42] resize-none text-sm" />
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">Points :</Label>
                    <Input type="number" min={0.5} step={0.5} value={q.points_max}
                      onChange={(e) => updateQuestion(i, 'points_max', Number(e.target.value))}
                      className="w-24 rounded-xl border-[#e2e8f0] focus:border-[#e97e42]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE 3 — Classe + copies */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Sélection classe */}
          <div className="bg-white rounded-2xl border border-[#f0ebe3] p-5">
            <Label className="text-sm text-gray-700 mb-2 block">Classe</Label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-gray-700 focus:border-[#e97e42] focus:outline-none"
            >
              <option value="">Sans classe — saisie manuelle des noms</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.niveau ? `(${c.niveau})` : ''} — {c.nb_eleves} élèves
                </option>
              ))}
            </select>
            {selectedClassId && students.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                Cette classe n'a pas encore d'élèves. Ajoutez-les dans « Mes classes » ou saisissez les noms manuellement.
              </p>
            )}
          </div>

          {/* Copies */}
          {copies.map((copie, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#f0ebe3] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Copie {i + 1}</span>
                {copies.length > 1 && (
                  <button onClick={() => removeCopie(i)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Assignation élève */}
              {selectedClassId && students.length > 0 ? (
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-600">Élève</Label>
                  <select
                    value={copie.class_student_id}
                    onChange={(e) => assignStudent(i, e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-gray-700 focus:border-[#e97e42] focus:outline-none"
                  >
                    <option value="">Choisir un élève…</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.prenom} {s.nom}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Prénom *" value={copie.prenom}
                      onChange={(e) => updateCopie(i, { prenom: e.target.value })}
                      className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]" />
                    <Input placeholder="Nom *" value={copie.nom}
                      onChange={(e) => updateCopie(i, { nom: e.target.value })}
                      className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="WhatsApp élève (+241)" value={copie.phone}
                      onChange={(e) => updateCopie(i, { phone: e.target.value })}
                      className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]" />
                    <Input placeholder="WhatsApp parent (option)" value={copie.parent_phone}
                      onChange={(e) => updateCopie(i, { parent_phone: e.target.value })}
                      className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]" />
                  </div>
                </>
              )}

              {/* Upload copie */}
              <div>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#e2e8f0] rounded-xl py-4 cursor-pointer hover:border-[#e97e42] transition-colors text-sm text-gray-500">
                  <Upload className="w-4 h-4" />
                  Photos / scans de la copie
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => updateCopie(i, { files: Array.from(e.target.files ?? []) })} />
                </label>
                {copie.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {copie.files.map((f, fi) => (
                      <span key={fi} className="inline-flex items-center gap-1.5 bg-[#fff7ed] text-[#a84d16] text-xs px-2.5 py-1 rounded-full">
                        <FileImage className="w-3 h-3" />
                        {f.name.slice(0, 18)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addCopie}
            className="w-full rounded-xl border-dashed border-[#e2e8f0] text-gray-600">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter une copie
          </Button>
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
            disabled={(step === 1 && !canStep1) || (step === 2 && !corrigeOk)}
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
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Traitement…</>
            ) : (
              <>Lancer la correction IA</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
