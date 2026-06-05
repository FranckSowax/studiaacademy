'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText, Eye, EyeOff, Trash2, Loader2, ExternalLink, Download, Coins,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RichResult } from './RichResult'
import type { OutilGeneration } from '@/types/ai-service'

const ACCENT = '#e97e42'

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function DocumentsList({ initial }: { initial: OutilGeneration[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [openId, setOpenId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const remove = async (id: string) => {
    if (!confirm('Supprimer définitivement ce document ?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/outils/generations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((p) => p.filter((d) => d.id !== id))
        router.refresh()
      } else {
        alert('Suppression impossible. Réessayez.')
      }
    } catch {
      alert('Erreur réseau.')
    }
    setDeleting(null)
  }

  // Pour les documents HTML : ouvrir / télécharger en PDF
  const openHtml = (html: string) => {
    const w = window.open(); if (w) { w.document.write(html); w.document.close() }
  }
  const pdfHtml = (html: string) => {
    const w = window.open('', '_blank', 'width=900,height=700'); if (!w) return
    const s = `<script>window.onload=function(){setTimeout(function(){window.focus();window.print()},350)};window.onafterprint=function(){setTimeout(function(){window.close()},100)}<\/script>`
    w.document.write(html.includes('</body>') ? html.replace('</body>', `${s}</body>`) : html + s)
    w.document.close()
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-[#f0ebe3]">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Aucun document pour le moment.</p>
        <p className="text-sm text-gray-400 mt-1">
          Chaque résultat généré dans les outils IA sera enregistré ici automatiquement.
        </p>
        <Button asChild className="mt-5 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl">
          <Link href="/outils">Découvrir les outils IA</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((d) => {
        const isOpen = openId === d.id
        return (
          <div key={d.id} className="bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden">
            <div className="flex items-center gap-3 p-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-none" style={{ backgroundColor: ACCENT }}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate">{d.title}</h3>
                <p className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                  <span>{formatDate(d.created_at)}</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f0ebe3] text-gray-500 uppercase tracking-wide text-[10px]">{d.output_type}</span>
                  {d.credits_used > 0 && (
                    <span className="inline-flex items-center gap-1"><Coins className="w-3 h-3" />{d.credits_used}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setOpenId(isOpen ? null : d.id)} className="rounded-lg border-[#e2e8f0]">
                  {isOpen ? <><EyeOff className="w-4 h-4 mr-1" />Masquer</> : <><Eye className="w-4 h-4 mr-1" />Voir</>}
                </Button>
                <Button
                  variant="outline" size="sm" onClick={() => remove(d.id)} disabled={deleting === d.id}
                  className="rounded-lg border-[#e2e8f0] text-red-500 hover:text-red-600 hover:border-red-200"
                >
                  {deleting === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-[#f0ebe3] p-4 sm:p-6 bg-[#fcfbf9]">
                {d.output_type === 'html' ? (
                  <>
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <Button variant="outline" size="sm" onClick={() => openHtml(d.output)} className="rounded-lg border-[#e2e8f0]">
                        <ExternalLink className="w-4 h-4 mr-1" />Ouvrir
                      </Button>
                      <Button size="sm" onClick={() => pdfHtml(d.output)} className="rounded-lg bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white">
                        <Download className="w-4 h-4 mr-1" />Télécharger PDF
                      </Button>
                    </div>
                    <div className="rounded-2xl border border-[#f0ebe3] overflow-hidden bg-white">
                      <iframe srcDoc={d.output} className="w-full h-[600px]" title={d.title} sandbox="allow-same-origin allow-popups" />
                    </div>
                  </>
                ) : (
                  <RichResult markdown={d.output} title={d.title} accent={ACCENT} heading="Aperçu" />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
