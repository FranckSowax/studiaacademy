'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Sparkles, Plus, Trash2, Loader2, Check, ChevronDown, ChevronUp,
  GripVertical, Wand2, CircleCheck, AlertTriangle, Rocket, FileText, HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { validateOutline, publishGeneration } from '@/lib/formations/generation-actions'
import type { FormationGeneration, GenerationSection, OutlineSection } from '@/types/generation'

export function GenerationWorkspace({
  generation,
  initialSections,
}: {
  generation: FormationGeneration
  initialSections: GenerationSection[]
}) {
  const router = useRouter()
  const outlineValidated = generation.status === 'outline_validated' || generation.status === 'generating' || generation.status === 'done'
  const isPublished = generation.status === 'published'

  if (!outlineValidated && !isPublished) {
    return <OutlineReview generation={generation} />
  }
  return <SectionsWorkspace generation={generation} initialSections={initialSections} onRefresh={() => router.refresh()} />
}

// ── Étape 1 : valider le sommaire ──
function OutlineReview({ generation }: { generation: FormationGeneration }) {
  const router = useRouter()
  const [outline, setOutline] = useState<OutlineSection[]>(generation.outline ?? [])
  const [saving, setSaving] = useState(false)

  const update = (i: number, field: keyof OutlineSection, value: string) =>
    setOutline(outline.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  const remove = (i: number) => setOutline(outline.filter((_, idx) => idx !== i))
  const add = () => setOutline([...outline, { titre: '', description: '', points_cles: [] }])
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= outline.length) return
    const next = [...outline]
    ;[next[i], next[j]] = [next[j], next[i]]
    setOutline(next)
  }

  const validate = async () => {
    setSaving(true)
    const res = await validateOutline(generation.id, outline.filter((s) => s.titre.trim()))
    setSaving(false)
    if (res.success) router.refresh()
    else alert(res.error || 'Erreur')
  }

  if (generation.status === 'extracting') {
    return (
      <div className="max-w-2xl">
        <Link href="/admin/formations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#e97e42] mb-6">
          <ArrowLeft className="w-4 h-4" />Formations
        </Link>
        {generation.error_message ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            {generation.error_message}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-10 text-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="font-medium text-gray-700">Extraction et génération du sommaire…</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/formations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#e97e42]">
        <ArrowLeft className="w-4 h-4" />Formations
      </Link>

      <div>
        <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-3 py-1 rounded-full text-xs font-medium mb-2">
          <Sparkles className="w-3.5 h-3.5" />Étape 1 — Valider le sommaire
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{generation.titre}</h2>
        <p className="text-sm text-muted-foreground">{generation.niveau} · {outline.length} sections proposées</p>
      </div>

      <div className="space-y-3">
        {outline.map((s, i) => (
          <div key={i} className="bg-white border rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center gap-1 pt-1">
                <button onClick={() => move(i, -1)} className="text-gray-300 hover:text-gray-600"><ChevronUp className="w-4 h-4" /></button>
                <GripVertical className="w-4 h-4 text-gray-200" />
                <button onClick={() => move(i, 1)} className="text-gray-300 hover:text-gray-600"><ChevronDown className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#e97e42] w-5">{i + 1}</span>
                  <Input value={s.titre} onChange={(e) => update(i, 'titre', e.target.value)} placeholder="Titre de la section" className="rounded-xl font-medium" />
                  <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <Textarea value={s.description} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Description" rows={2} className="rounded-xl resize-none text-sm" />
                {s.points_cles?.length > 0 && (
                  <p className="text-xs text-gray-400">Points clés : {s.points_cles.join(' · ')}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={add} className="w-full rounded-xl border-dashed">
          <Plus className="w-4 h-4 mr-1" />Ajouter une section
        </Button>
      </div>

      <div className="flex items-center justify-between bg-[#fff7ed] rounded-2xl p-4 sticky bottom-4">
        <p className="text-sm text-[#a84d16]">Validez pour générer le cours section par section.</p>
        <Button onClick={validate} disabled={saving || outline.length === 0} className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Valider le sommaire</>}
        </Button>
      </div>
    </div>
  )
}

// ── Étape 2 : générer section par section ──
function SectionsWorkspace({
  generation,
  initialSections,
  onRefresh,
}: {
  generation: FormationGeneration
  initialSections: GenerationSection[]
  onRefresh: () => void
}) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [busy, setBusy] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const generated = sections.filter((s) => s.content).length

  const generateSection = async (sectionId: string) => {
    setBusy(sectionId)
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, status: 'generating' } : s)))
    const res = await fetch(`/api/admin/generation/${generation.id}/section/${sectionId}`, { method: 'POST' })
    const data = await res.json()
    setBusy(null)
    if (data.error) {
      alert(data.error)
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, status: 'error' } : s)))
    } else {
      // Recharger la section
      router.refresh()
      onRefresh()
      setExpanded(sectionId)
      // Optimiste : récupérer via refresh (le serveur renvoie les données)
      window.location.reload()
    }
  }

  const publish = async () => {
    setPublishing(true)
    const res = await publishGeneration(generation.id)
    setPublishing(false)
    if (res.success && res.formationId) {
      router.push(`/admin/formations/${res.formationId}`)
    } else alert(res.error || 'Erreur')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/formations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#e97e42]">
        <ArrowLeft className="w-4 h-4" />Formations
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-3 py-1 rounded-full text-xs font-medium mb-2">
            <Wand2 className="w-3.5 h-3.5" />Étape 2 — Générer le cours
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{generation.titre}</h2>
          <p className="text-sm text-muted-foreground">{generated}/{sections.length} sections générées</p>
        </div>
        <Button onClick={publish} disabled={generated === 0 || publishing}
          className="bg-green-600 hover:bg-green-700 text-white">
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Rocket className="w-4 h-4 mr-1" />{generation.formation_id ? 'Mettre à jour la formation' : 'Publier la formation'}</>}
        </Button>
      </div>

      <div className="space-y-3">
        {sections.map((s) => {
          const isOpen = expanded === s.id
          const hasContent = !!s.content
          return (
            <div key={s.id} className="bg-white border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-[#e97e42] w-5">{s.ordre}</span>
                  {hasContent ? <CircleCheck className="w-4 h-4 text-green-500 flex-shrink-0" /> : <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{s.titre}</h3>
                    <p className="text-xs text-muted-foreground truncate">{s.outline_description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasContent && (
                    <button onClick={() => setExpanded(isOpen ? null : s.id)} className="text-gray-400 p-1">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                  <Button size="sm" variant={hasContent ? 'outline' : 'default'}
                    onClick={() => generateSection(s.id)} disabled={busy === s.id}
                    className={hasContent ? 'rounded-lg' : 'bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-lg'}>
                    {busy === s.id || s.status === 'generating' ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-1" />Génération…</>
                    ) : hasContent ? (
                      <><Wand2 className="w-3.5 h-3.5 mr-1" />Régénérer</>
                    ) : (
                      <><Wand2 className="w-3.5 h-3.5 mr-1" />Générer</>
                    )}
                  </Button>
                </div>
              </div>

              {isOpen && hasContent && (
                <div className="border-t p-4 bg-muted/20 space-y-4">
                  {/* Contenu */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Contenu du cours</p>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line bg-white rounded-xl p-4 border max-h-72 overflow-y-auto">
                      {s.content}
                    </div>
                  </div>
                  {/* Quiz */}
                  {s.quiz?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" />Test — {s.quiz.length} questions</p>
                      <div className="space-y-2">
                        {s.quiz.map((q, qi) => (
                          <div key={qi} className="bg-white rounded-xl p-3 border text-sm">
                            <p className="font-medium text-gray-800 mb-1.5">{qi + 1}. {q.question}</p>
                            <ul className="space-y-1">
                              {q.options.map((opt, oi) => (
                                <li key={oi} className={`text-xs flex items-center gap-1.5 ${oi === q.reponse_correcte ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                  <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">{String.fromCharCode(65 + oi)}</span>
                                  {opt}{oi === q.reponse_correcte && <Check className="w-3 h-3" />}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-gray-400 mt-1.5 italic">{q.explication}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
