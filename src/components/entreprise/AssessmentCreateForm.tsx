'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, BarChart3, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAssessment } from '@/lib/entreprise/actions'
import { DOMAINES } from '@/lib/entreprise/competences'

export function AssessmentCreateForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [titre, setTitre] = useState('Diagnostic des compétences digitales')
  const [niveau, setNiveau] = useState('Tous niveaux')
  const [domaines, setDomaines] = useState<string[]>(DOMAINES.map((d) => d.slug))
  const [seuil, setSeuil] = useState(5)

  const toggle = (slug: string) =>
    setDomaines((d) => d.includes(slug) ? d.filter((x) => x !== slug) : [...d, slug])

  const submit = async () => {
    setSaving(true)
    const res = await createAssessment({ titre, niveau_cible: niveau, domaines, seuil_analyse: seuil })
    setSaving(false)
    if (res.success && res.id) router.push(`/entreprise/diagnostic/${res.id}`)
    else alert(res.error || 'Erreur')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/entreprise/diagnostic" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#7C3AED] mb-6"><ArrowLeft className="w-4 h-4" />Mes diagnostics</Link>
      <div className="flex items-center gap-2 mb-1"><BarChart3 className="w-6 h-6 text-[#7C3AED]" /><h1 className="text-2xl font-bold font-heading text-gray-900">Nouveau diagnostic</h1></div>
      <p className="text-gray-500 mb-6">Choisissez les domaines à évaluer. Un lien à partager sera généré.</p>

      <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 space-y-5">
        <div className="space-y-1.5"><Label className="text-sm">Titre du test</Label><Input value={titre} onChange={(e) => setTitre(e.target.value)} className="rounded-xl" /></div>

        <div>
          <Label className="text-sm mb-2 block">Domaines évalués ({domaines.length})</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOMAINES.map((d) => {
              const on = domaines.includes(d.slug)
              return (
                <button key={d.slug} onClick={() => toggle(d.slug)} type="button"
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${on ? 'border-[#7C3AED] bg-[#7C3AED]/5' : 'border-[#f0ebe3] hover:border-[#7C3AED]/40'}`}>
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${on ? 'bg-[#7C3AED] text-white' : 'bg-gray-100'}`}>{on && <Check className="w-3.5 h-3.5" />}</span>
                  <span><span className="block text-sm font-medium text-gray-800">{d.libelle}</span><span className="block text-xs text-gray-400">{d.description}</span></span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-sm">Niveau cible</Label>
            <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm">
              {['Tous niveaux', 'Débutant', 'Intermédiaire', 'Avancé'].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label className="text-sm">Analyse dès N réponses</Label><Input type="number" min={1} max={500} value={seuil} onChange={(e) => setSeuil(Number(e.target.value))} className="rounded-xl" /></div>
        </div>

        <Button onClick={submit} disabled={saving || domaines.length === 0 || !titre.trim()} className="w-full bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl py-6 font-bold">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer le diagnostic'}
        </Button>
      </div>
    </div>
  )
}
