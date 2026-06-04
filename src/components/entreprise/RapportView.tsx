'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Package,
  Loader2, Send, Users, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateProposal, sendProposal } from '@/lib/entreprise/actions'
import { DOMAINES } from '@/lib/entreprise/competences'

const domLabel = (slug: string) => DOMAINES.find((d) => d.slug === slug)?.libelle ?? slug
const fcfa = (n: number) => (n ?? 0).toLocaleString('fr-FR') + ' FCFA'

interface Synthese {
  synthese_executive?: string
  niveaux_domaines?: { domaine: string; niveau: string; pct: number; commentaire?: string }[]
  forces?: string[]
  lacunes_prioritaires?: { domaine: string; impact: string; priorite: string }[]
  recommandations?: { ref?: string; titre?: string; domaine?: string; justification?: string; prix_fcfa?: number }[]
  pack_resume?: string
  prix_total_estime_fcfa?: number
}

interface Proposal {
  id: string
  titre: string | null
  resume: string | null
  items: { titre: string; domaine: string; format?: string; duree?: string; justification?: string; prix_fcfa: number }[]
  prix_total_fcfa: number
  status: string
}

export function RapportView({
  assessmentId, titre, nbRepondants, synthese, proposal,
}: {
  assessmentId: string
  titre: string
  nbRepondants: number
  synthese: Synthese
  proposal: Proposal | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)

  const genPack = async () => {
    setBusy(true)
    const r = await generateProposal(assessmentId)
    setBusy(false)
    if (r.success) router.refresh()
    else alert(r.error || 'Erreur')
  }
  const send = async () => {
    setSending(true)
    const r = await sendProposal(assessmentId)
    setSending(false)
    if (r.success) { alert('Proposition transmise à notre équipe. Vous serez recontacté(e).'); router.refresh() }
    else alert(r.error || 'Erreur')
  }

  return (
    <div>
      <Link href={`/entreprise/diagnostic/${assessmentId}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#7C3AED] mb-6"><ArrowLeft className="w-4 h-4" />Diagnostic</Link>

      {/* En-tête rapport */}
      <div className="bg-gradient-to-br from-[#2e1065] to-[#7C3AED] rounded-3xl p-8 text-white mb-6">
        <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-xs font-medium mb-3"><FileText className="w-3 h-3" />Rapport d&apos;effectifs</div>
        <h1 className="text-3xl font-extrabold font-heading mb-2">{titre}</h1>
        <p className="text-white/70 text-sm inline-flex items-center gap-1.5"><Users className="w-4 h-4" />{nbRepondants} salarié{nbRepondants > 1 ? 's' : ''} évalué{nbRepondants > 1 ? 's' : ''}</p>
        {synthese.synthese_executive && <p className="mt-4 text-white/90 leading-relaxed bg-white/10 rounded-2xl p-4">{synthese.synthese_executive}</p>}
      </div>

      {/* Niveaux par domaine */}
      {synthese.niveaux_domaines && synthese.niveaux_domaines.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-6">
          <h2 className="font-bold font-heading text-gray-900 mb-4">Niveau par domaine</h2>
          <div className="space-y-3">
            {synthese.niveaux_domaines.map((n, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{domLabel(n.domaine)}</span><span className="font-semibold text-gray-900">{n.niveau} · {n.pct}%</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#e97e42]" style={{ width: `${n.pct}%` }} /></div>
                {n.commentaire && <p className="text-xs text-gray-400 mt-1">{n.commentaire}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        {/* Forces */}
        {synthese.forces && synthese.forces.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6">
            <h2 className="font-bold font-heading text-gray-900 mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" />Points forts</h2>
            <ul className="space-y-2">{synthese.forces.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{f}</li>)}</ul>
          </div>
        )}
        {/* Lacunes */}
        {synthese.lacunes_prioritaires && synthese.lacunes_prioritaires.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6">
            <h2 className="font-bold font-heading text-gray-900 mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />Lacunes prioritaires</h2>
            <ul className="space-y-2.5">{synthese.lacunes_prioritaires.map((l, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-gray-800">{domLabel(l.domaine)}</span>
                {l.priorite && <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${l.priorite === 'haute' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{l.priorite}</span>}
                <p className="text-gray-500 text-xs mt-0.5">{l.impact}</p>
              </li>
            ))}</ul>
          </div>
        )}
      </div>

      {/* PACK */}
      <div className="bg-white rounded-2xl border-2 border-[#e97e42]/30 p-6">
        <div className="flex items-center gap-2 mb-2"><Package className="w-6 h-6 text-[#e97e42]" /><h2 className="text-xl font-bold font-heading text-gray-900">Pack de formation recommandé</h2></div>
        {synthese.pack_resume && <p className="text-sm text-gray-600 mb-4">{synthese.pack_resume}</p>}

        {!proposal ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-4">Générez la proposition chiffrée à partir des recommandations de l&apos;analyse.</p>
            <Button onClick={genPack} disabled={busy} className="bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl px-6 py-5 font-bold">
              {busy ? <><Loader2 className="w-5 h-5 mr-1 animate-spin" />Construction du pack…</> : <><Sparkles className="w-5 h-5 mr-1" />Générer le pack sur mesure</>}
            </Button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#f0ebe3] border border-[#f0ebe3] rounded-xl overflow-hidden mb-4">
              {proposal.items.map((it, i) => (
                <div key={i} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{it.titre}</p>
                    <p className="text-xs text-gray-500">{domLabel(it.domaine)}{it.format ? ` · ${it.format}` : ''}{it.duree ? ` · ${it.duree}` : ''}</p>
                    {it.justification && <p className="text-xs text-gray-400 mt-1">{it.justification}</p>}
                  </div>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">{fcfa(it.prix_fcfa)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-[#fff7ed] rounded-xl p-4 mb-4">
              <span className="font-semibold text-[#a84d16]">Total estimé (par participant)</span>
              <span className="text-xl font-extrabold text-[#a84d16]">{fcfa(proposal.prix_total_fcfa)}</span>
            </div>
            {proposal.status === 'sent' ? (
              <div className="bg-green-50 text-green-700 rounded-xl p-4 text-sm font-medium flex items-center gap-2"><CheckCircle className="w-5 h-5" />Proposition transmise. Notre équipe vous recontacte sous 48 h.</div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={send} disabled={sending} className="flex-1 bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl py-5 font-bold">
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 mr-2" />Recevoir cette proposition</>}
                </Button>
                <Button onClick={genPack} disabled={busy} variant="outline" className="rounded-xl py-5">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Régénérer'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">Résultats agrégés et anonymes. Tarifs indicatifs, ajustables selon le nombre de participants et le format (intra/distanciel).</p>
    </div>
  )
}
