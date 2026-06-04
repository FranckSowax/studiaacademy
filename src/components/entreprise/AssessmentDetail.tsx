'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft, Copy, Check, Users, Radio, Link2, BarChart3, Lock, Unlock, Loader2, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setAssessmentStatus, analyzeAssessment } from '@/lib/entreprise/actions'
import { DOMAINES } from '@/lib/entreprise/competences'
import { niveauFromPct, NIVEAU_LABELS } from '@/lib/entreprise/scoring'
import type { CompanyAssessment } from '@/types/entreprise'

const domLabel = (slug: string) => DOMAINES.find((d) => d.slug === slug)?.libelle ?? slug
const pctColor = (p: number) => p >= 70 ? '#16a34a' : p >= 40 ? '#f59e0b' : '#e11d48'

export function AssessmentDetail({
  assessment, joinUrl, scoredCount, aggregate,
}: {
  assessment: CompanyAssessment
  joinUrl: string
  scoredCount: number
  aggregate: Record<string, number>
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const isOpen = assessment.status === 'open'
  const isAnalyzed = assessment.status === 'analyzed'

  const copy = () => { navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const toggle = async () => {
    setBusy(true)
    await setAssessmentStatus(assessment.id, isOpen ? 'closed' : 'open')
    setBusy(false); router.refresh()
  }
  const analyze = async () => {
    if (!confirm('Lancer l\'analyse IA des résultats et générer le rapport ? Le test sera clôturé.')) return
    setAnalyzing(true)
    const r = await analyzeAssessment(assessment.id)
    setAnalyzing(false)
    if (r.success) router.push(`/entreprise/diagnostic/${assessment.id}/rapport`)
    else alert(r.error || 'Erreur')
  }

  const domAgg = Object.entries(aggregate)

  return (
    <div>
      <Link href="/entreprise/diagnostic" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#7C3AED] mb-6"><ArrowLeft className="w-4 h-4" />Mes diagnostics</Link>

      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">{assessment.titre}</h1>
          <p className="text-sm text-gray-500 mt-1 inline-flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isOpen ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}><Radio className="w-3 h-3" />{isOpen ? 'Ouvert' : 'Clôturé'}</span>
            · {assessment.questions.length} questions
          </p>
        </div>
        <Button onClick={toggle} disabled={busy} variant="outline" className="rounded-xl">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : isOpen ? <><Lock className="w-4 h-4 mr-1" />Clôturer</> : <><Unlock className="w-4 h-4 mr-1" />Rouvrir</>}
        </Button>
      </div>

      {/* Diffusion */}
      <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-6">
        <h2 className="font-bold font-heading text-gray-900 mb-4 flex items-center gap-2"><Link2 className="w-5 h-5 text-[#7C3AED]" />Partager le test à vos équipes</h2>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="bg-white p-2 rounded-xl border border-gray-100"><QRCodeSVG value={joinUrl} size={120} /></div>
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-2">
              <span className="flex-1 text-sm text-gray-600 truncate">{joinUrl}</span>
              <button onClick={copy} className="text-[#7C3AED] flex-shrink-0">{copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
            </div>
            {assessment.access_code && <p className="text-sm text-gray-500">Code : <span className="font-mono font-bold tracking-widest text-gray-800">{assessment.access_code}</span></p>}
            <p className="text-xs text-gray-400 mt-2">Vos salariés ouvrent le lien (ou scannent le QR), sans compte. Les réponses sont anonymes dans le rapport.</p>
          </div>
        </div>
      </div>

      {/* Participation */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#f0ebe3] p-5">
          <p className="text-3xl font-extrabold font-heading text-gray-900 flex items-center gap-2"><Users className="w-6 h-6 text-[#7C3AED]" />{assessment.nb_submissions}</p>
          <p className="text-sm text-gray-500 mt-1">participants au total</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#f0ebe3] p-5">
          <p className="text-3xl font-extrabold font-heading text-gray-900">{scoredCount}</p>
          <p className="text-sm text-gray-500 mt-1">tests complétés</p>
        </div>
      </div>

      {/* Agrégat par domaine */}
      <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6">
        <h2 className="font-bold font-heading text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#7C3AED]" />Niveau moyen par domaine</h2>
        {domAgg.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">En attente des premières réponses…</p>
        ) : (
          <div className="space-y-3">
            {domAgg.map(([dom, pct]) => (
              <div key={dom}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{domLabel(dom)}</span>
                  <span className="font-semibold" style={{ color: pctColor(pct) }}>{pct}% · {NIVEAU_LABELS[niveauFromPct(pct)]}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pctColor(pct) }} /></div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 bg-[#fff7ed] rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-[#e97e42] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#a84d16]">
              <p className="font-semibold">Rapport détaillé & pack de formation sur mesure</p>
              <p className="text-[#a84d16]/80">Analyse IA des lacunes par département + recommandations de formations chiffrées.</p>
            </div>
          </div>
          {isAnalyzed ? (
            <Link href={`/entreprise/diagnostic/${assessment.id}/rapport`} className="inline-flex items-center gap-2 bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors">
              <BarChart3 className="w-4 h-4" />Voir le rapport & le pack
            </Link>
          ) : (
            <Button onClick={analyze} disabled={analyzing || scoredCount === 0} className="bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl">
              {analyzing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Analyse en cours…</> : <><Sparkles className="w-4 h-4 mr-1" />Analyser & générer le rapport</>}
            </Button>
          )}
          {scoredCount === 0 && <p className="text-xs text-[#a84d16]/70 mt-2">En attente de réponses complétées.</p>}
        </div>
      </div>
    </div>
  )
}
