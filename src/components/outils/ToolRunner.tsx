'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Sparkles, Loader2, Copy, Check, Download, RefreshCw,
  Wallet, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RichResult } from './RichResult'
import type { ServiceField, OutputType } from '@/types/ai-service'

interface ClientDef {
  slug: string
  titre: string
  sousTitre: string
  description: string
  couleur: string
  coverImage?: string
  badge?: string
  prixCredits: number
  ctaLabel: string
  generateLabel?: string
  outputType: OutputType
  fields: ServiceField[]
}

export function ToolRunner({
  def,
  isLoggedIn,
  solde,
}: {
  def: ClientDef
  isLoggedIn: boolean
  solde: number | null
}) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)

  // Barre de progression animée pendant la génération IA (durée non connue → easing)
  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 94) return p
        const inc = p < 45 ? 7 : p < 70 ? 3.5 : p < 88 ? 1.4 : 0.5
        return Math.min(94, p + inc)
      })
    }, 450)
    return () => clearInterval(id)
  }, [loading])

  const progressStep =
    progress < 30 ? 'Analyse de votre demande…' :
    progress < 60 ? 'Rédaction par l\'IA…' :
    progress < 88 ? 'Structuration du contenu…' :
    'Mise en forme finale…'

  const set = (name: string, v: string) => setValues((p) => ({ ...p, [name]: v }))
  const canSubmit = def.fields.every((f) => !f.required || values[f.name]?.trim())

  const generate = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/outils/${def.slug}`)
      return
    }
    setLoading(true)
    setProgress(6)
    setError('')
    setOutput(null)
    try {
      const res = await fetch(`/api/outils/${def.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (data.needLogin) {
        router.push(`/login?redirect=/outils/${def.slug}`)
        return
      }
      if (data.error) {
        setError(data.error)
      } else {
        setOutput(data.output)
        router.refresh()
      }
    } catch {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  // ── Actions pour les services à sortie HTML (pitch, site, devis, scoring) ──
  const copy = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openHtml = () => {
    if (!output) return
    const w = window.open()
    if (w) { w.document.write(output); w.document.close() }
  }

  // Télécharger en PDF : ouvre le document et lance « Enregistrer en PDF »
  const downloadPdf = () => {
    if (!output) return
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    const script = `<script>window.onload=function(){setTimeout(function(){window.focus();window.print()},350)};window.onafterprint=function(){setTimeout(function(){window.close()},100)}<\/script>`
    const doc = output.includes('</body>') ? output.replace('</body>', `${script}</body>`) : output + script
    w.document.write(doc)
    w.document.close()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/outils" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Tous les outils
      </Link>

      {/* Bannière cover */}
      {def.coverImage && (
        <div className="relative h-44 sm:h-56 w-full rounded-3xl overflow-hidden mb-6 shadow-sm">
          <Image src={def.coverImage} alt={def.titre} fill sizes="(max-width:768px) 100vw, 768px" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {def.badge && (
            <span className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full text-white shadow-lg" style={{ backgroundColor: def.couleur }}>
              {def.badge}
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">{def.sousTitre}</p>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">{def.titre}</h1>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          {!def.coverImage && <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900">{def.titre}</h1>}
          <p className="text-gray-500 mt-1">{def.description}</p>
        </div>
        {isLoggedIn && solde !== null && (
          <span className="inline-flex items-center gap-1.5 bg-[#fff7ed] text-[#a84d16] px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
            <Wallet className="w-4 h-4" />
            {solde} crédits
          </span>
        )}
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 space-y-4">
        {def.fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label className="text-sm text-gray-700">
              {f.label} {f.required && <span className="text-[#e97e42]">*</span>}
            </Label>
            {f.type === 'textarea' ? (
              <Textarea
                placeholder={f.placeholder}
                value={values[f.name] ?? ''}
                onChange={(e) => set(f.name, e.target.value)}
                rows={f.rows ?? 3}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42] resize-none"
              />
            ) : f.type === 'select' ? (
              <select
                value={values[f.name] ?? ''}
                onChange={(e) => set(f.name, e.target.value)}
                className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-gray-700 focus:border-[#e97e42] focus:outline-none"
              >
                <option value="">Choisir…</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <Input
                placeholder={f.placeholder}
                value={values[f.name] ?? ''}
                onChange={(e) => set(f.name, e.target.value)}
                className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
              />
            )}
          </div>
        ))}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={generate}
          disabled={!canSubmit || loading}
          className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl py-6 text-base"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération en cours…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />{def.generateLabel ?? def.ctaLabel}
              {def.prixCredits > 0 && <span className="ml-2 text-white/80 text-sm">· {def.prixCredits} crédits</span>}
            </>
          )}
        </Button>
        {loading && (
          <div className="pt-1" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-gray-500">{progressStep}</span>
              <span className="font-semibold text-[#a84d16]">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#f0ebe3] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!isLoggedIn && !loading && (
          <p className="text-xs text-center text-gray-400">Connexion requise — vous serez redirigé.</p>
        )}
      </div>

      {/* Résultat */}
      {output && (
        <div className="mt-8">
          {def.outputType === 'html' ? (
            <>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="font-bold font-heading text-gray-900 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />Résultat
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button variant="outline" size="sm" onClick={copy} className="rounded-lg border-[#e2e8f0]">
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}{copied ? 'Copié' : 'Copier'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={openHtml} className="rounded-lg border-[#e2e8f0]">
                    <ExternalLink className="w-4 h-4 mr-1" />Ouvrir
                  </Button>
                  <Button size="sm" onClick={downloadPdf} className="rounded-lg bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white">
                    <Download className="w-4 h-4 mr-1" />Télécharger PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={generate} className="rounded-lg border-[#e2e8f0]">
                    <RefreshCw className="w-4 h-4 mr-1" />Regénérer
                  </Button>
                </div>
              </div>
              <Link href="/dashboard/documents" className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 mb-3 hover:bg-green-100 transition-colors">
                <Check className="w-3.5 h-3.5" />Enregistré dans Mes documents
              </Link>
              <div className="rounded-2xl border border-[#f0ebe3] overflow-hidden bg-white">
                <iframe srcDoc={output} className="w-full h-[680px]" title="Aperçu" sandbox="allow-same-origin allow-popups" />
              </div>
            </>
          ) : (
            <RichResult
              markdown={output}
              title={def.titre}
              sousTitre={def.sousTitre}
              accent={def.couleur}
              onRegenerate={generate}
              savedHref="/dashboard/documents"
            />
          )}
        </div>
      )}
    </div>
  )
}
