'use client'

import { useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Check, Copy, Download, RefreshCw, ExternalLink,
  Lightbulb, AlertTriangle, ListChecks, BookMarked, Gauge,
  CheckCircle2, Info, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ───────────────────────────────────────────
// Styles de l'artefact (namespace .rich-result)
// Inline => identiques à l'écran ET dans le HTML exporté (standalone, sans JS).
// ───────────────────────────────────────────
const RICH_CSS = `
.rich-result{--accent:#e97e42;color:#334155;font-family:'Poppins',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.7;max-width:820px;margin:0 auto}
.rich-result *{box-sizing:border-box}
.rr-hero{background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 14%,#fff),#fff);border:1px solid #f0ebe3;border-radius:20px;padding:22px 24px;margin-bottom:18px}
.rr-hero h1{font-size:1.7rem;font-weight:800;color:#0f172a;margin:0;line-height:1.25}
.rr-hero .rr-sub{color:#64748b;margin-top:6px;font-size:.92rem}
.rr-badges{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.rr-score{display:inline-flex;align-items:center;gap:10px;background:#fff;border:2px solid var(--accent);border-radius:14px;padding:8px 14px}
.rr-score b{font-size:1.5rem;color:var(--accent);font-weight:800;line-height:1}
.rr-score span{font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:#64748b;font-weight:700}
.rr-section{background:#fff;border:1px solid #f0ebe3;border-radius:16px;margin:12px 0;overflow:hidden}
.rr-section>summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;padding:14px 18px;font-family:'Poppins',sans-serif;font-weight:700;color:#0f172a;font-size:1.08rem;user-select:none;border-left:4px solid var(--accent)}
.rr-section>summary::-webkit-details-marker{display:none}
.rr-section>summary .rr-ico{width:20px;height:20px;flex:none}
.rr-section>summary .rr-chev{margin-left:auto;width:18px;height:18px;color:#94a3b8;transition:transform .2s}
.rr-section[open]>summary .rr-chev{transform:rotate(180deg)}
.rr-body{padding:4px 20px 18px}
.rr-body p{margin:.6em 0}
.rr-body h3{font-family:'Poppins',sans-serif;font-size:1.02rem;font-weight:700;color:#1e293b;margin:1em 0 .3em}
.rr-body ul,.rr-body ol{margin:.6em 0;padding-left:1.3em}
.rr-body li{margin:.3em 0}
.rr-body ul li{list-style:disc}.rr-body ol li{list-style:decimal}
.rr-body strong,.rr-hl{color:#0f172a;font-weight:700;background:linear-gradient(transparent 60%,color-mix(in srgb,var(--accent) 28%,#fff) 0);padding:0 1px}
.rr-body a{color:#d56a2e;text-decoration:underline}
.rr-body code{background:#fbf8f3;padding:.1em .4em;border-radius:5px;font-size:.85em;font-family:ui-monospace,monospace}
.rr-body pre{background:#0f172a;color:#f8fafc;padding:1em;border-radius:12px;overflow-x:auto;margin:.8em 0}
.rr-body pre code{background:transparent;padding:0}
.rr-tablewrap{overflow-x:auto;margin:.8em 0;border:1px solid #eef2f7;border-radius:12px}
.rr-body table{width:100%;border-collapse:collapse;font-size:.88em}
.rr-body th,.rr-body td{border:1px solid #e2e8f0;padding:.55em .7em;text-align:left}
.rr-body th{background:#fbf8f3;font-weight:700;color:#0f172a}
.rr-body tr:nth-child(even) td{background:#fcfcfd}
.rr-callout{display:flex;gap:10px;border-radius:12px;padding:12px 14px;margin:.8em 0;font-style:normal}
.rr-callout .rr-ico{flex:none;width:18px;height:18px;margin-top:2px}
.rr-callout.info{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a}
.rr-callout.tip{background:#fffbeb;border:1px solid #fde68a;color:#92400e}
.rr-callout.warn{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}
.rr-callout p{margin:0}
.rr-check{list-style:none!important;display:flex;align-items:flex-start;gap:10px;margin:.4em 0;padding:0}
.rr-check input{appearance:none;-webkit-appearance:none;flex:none;width:20px;height:20px;border:2px solid #cbd5e1;border-radius:6px;margin-top:1px;cursor:pointer;position:relative;transition:.15s}
.rr-check input:checked{background:var(--accent);border-color:var(--accent)}
.rr-check input:checked::after{content:"";position:absolute;left:6px;top:2px;width:5px;height:10px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.rr-check input:checked + label{color:#94a3b8;text-decoration:line-through}
.rr-check label{cursor:pointer}
.rr-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:.6em 0}
.rr-flash{border:1px solid #e9d5ff;background:#faf5ff;border-radius:14px;overflow:hidden}
.rr-flash>summary{cursor:pointer;list-style:none;padding:12px 14px;font-weight:700;color:#6b21a8;display:flex;align-items:center;gap:8px}
.rr-flash>summary::-webkit-details-marker{display:none}
.rr-flash>summary::after{content:"+";margin-left:auto;font-size:1.2rem;color:#a855f7}
.rr-flash[open]>summary::after{content:"−"}
.rr-flash .rr-back{padding:0 14px 14px;color:#4c1d95;font-size:.92rem}
@media print{
  body{background:#fff!important}
  .rr-section,.rr-flash{break-inside:avoid;box-shadow:none}
  .rr-section>summary .rr-chev,.rr-flash>summary::after{display:none}
  /* Tout déplier pour le PDF, même les sections/cartes repliées */
  details>.rr-body,details>.rr-back{display:block!important}
  .rr-flash{background:#faf5ff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .rr-hero,.rr-callout,.rr-check input:checked,.rr-body th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
`

// ───────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────
type Tone = 'accent' | 'tip' | 'warn' | 'info' | 'defs' | 'check'

function sectionMeta(title: string): { tone: Tone; Icon: typeof Lightbulb } {
  const t = title.toLowerCase()
  if (/d[ée]finition|vocabulaire|glossaire|notions cl[ée]s/.test(t)) return { tone: 'defs', Icon: BookMarked }
  if (/astuce|m[ée]morisation|conseil|tip|m[ée]thode/.test(t)) return { tone: 'tip', Icon: Lightbulb }
  if (/important|attention|avertissement|vigilance|risque|garde-fou/.test(t)) return { tone: 'warn', Icon: AlertTriangle }
  if (/checklist|d[ée]marche|[ée]tape|à faire|actions?|jour 1|1[èe]re semaine|suivi|restitution|passation/.test(t)) return { tone: 'check', Icon: ListChecks }
  if (/score|note|barème|[ée]valuation|recommandation|conclusion|synth[èe]se/.test(t)) return { tone: 'accent', Icon: CheckCircle2 }
  return { tone: 'accent', Icon: ChevronDown }
}

// Rendu markdown inline (sans <p> bloquant) pour cartes/checklists
function Inline({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ p: ({ children }) => <>{children}</>, a: (p) => <a {...p} target="_blank" rel="noreferrer" /> }}
    >
      {children}
    </ReactMarkdown>
  )
}

// Composants markdown enrichis (callouts, highlight, tables scroll)
const MD_COMPONENTS = {
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <div className="rr-callout info"><Info className="rr-ico" /><div>{children}</div></div>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="rr-tablewrap"><table>{children}</table></div>
  ),
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...p} target="_blank" rel="noreferrer" />,
}

// Découpe le markdown en intro (avant 1er ##) + sections (## ...)
function split(md: string) {
  const lines = md.split('\n')
  const intro: string[] = []
  const sections: { title: string; body: string }[] = []
  let cur: { title: string; body: string[] } | null = null
  for (const ln of lines) {
    const m = /^##\s+(.*)$/.exec(ln)
    if (m) {
      if (cur) sections.push({ title: cur.title, body: cur.body.join('\n').trim() })
      cur = { title: m[1].replace(/[#*]/g, '').trim(), body: [] }
    } else if (cur) {
      cur.body.push(ln)
    } else {
      intro.push(ln)
    }
  }
  if (cur) sections.push({ title: cur.title, body: cur.body.join('\n').trim() })
  return { intro: intro.join('\n').trim(), sections }
}

function getTitle(intro: string, fallback: string): { title: string; rest: string } {
  const m = /^#\s+(.+)$/m.exec(intro)
  if (m) return { title: m[1].replace(/[#*]/g, '').trim(), rest: intro.replace(m[0], '').trim() }
  return { title: fallback, rest: intro }
}

// Détecte le 1er score type 18/20 ou 87/100
function findScore(md: string): { value: string; label: string } | null {
  const m = /\b(\d{1,3})\s*\/\s*(20|100)\b/.exec(md)
  if (!m) return null
  return { value: `${m[1]}/${m[2]}`, label: m[2] === '20' ? 'Note' : 'Score' }
}

// Parse les items d'une liste markdown -> [texte]
function listItems(body: string): { pre: string; items: string[] } {
  const lines = body.split('\n')
  const pre: string[] = []
  const items: string[] = []
  let started = false
  for (const ln of lines) {
    const m = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(ln)
    if (m) { started = true; items.push(m[1].trim()) }
    else if (!started && ln.trim()) pre.push(ln)
  }
  return { pre: pre.join('\n').trim(), items }
}

function flashParse(item: string): { front: string; back: string } {
  const b = /^\*\*(.+?)\*\*\s*[:—–-]\s*(.+)$/.exec(item)
  if (b) return { front: b[1].trim(), back: b[2].trim() }
  const c = /^(.+?)\s*[:—–]\s*(.+)$/.exec(item)
  if (c) return { front: c[1].replace(/\*/g, '').trim(), back: c[2].trim() }
  return { front: item.replace(/\*/g, '').trim(), back: '' }
}

// ───────────────────────────────────────────
// Composant principal
// ───────────────────────────────────────────
export function RichResult({
  markdown, title, accent, sousTitre, onRegenerate,
}: {
  markdown: string
  title: string
  accent: string
  sousTitre?: string
  onRegenerate: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const { intro, sections } = useMemo(() => split(markdown), [markdown])
  const head = useMemo(() => getTitle(intro, title), [intro, title])
  const score = useMemo(() => findScore(markdown), [markdown])

  const fileName = `${title} — Studia`.replace(/[/\\?%*:|"<>]/g, '-')

  const standalone = (forPrint = false) => {
    const inner = ref.current?.innerHTML ?? ''
    const printScript = forPrint
      ? `<script>window.onload=function(){setTimeout(function(){window.focus();window.print()},350)};window.onafterprint=function(){setTimeout(function(){window.close()},100)}<\/script>`
      : ''
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${fileName}</title><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet"><style>@page{margin:14mm}body{margin:0;padding:28px 16px;background:#fbf8f3}${RICH_CSS}</style></head><body><div class="rich-result" style="--accent:${accent}">${inner}</div>${printScript}</body></html>`
  }

  // Copie le TEXTE rendu (aucune trace de markdown : ni #, ni **, ni |)
  const copy = () => {
    const txt = ref.current?.innerText ?? ''
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  const openTab = () => { const w = window.open(); if (w) { w.document.write(standalone()); w.document.close() } }
  // Télécharger en PDF : ouvre la fiche mise en page et déclenche l'impression → « Enregistrer en PDF »
  const downloadPdf = () => {
    const w = window.open('', '_blank', 'width=900,height=700'); if (!w) return
    w.document.write(standalone(true)); w.document.close()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-bold font-heading text-gray-900 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />Résultat
        </h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={copy} className="rounded-lg border-[#e2e8f0]">
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}{copied ? 'Copié' : 'Copier'}
          </Button>
          <Button variant="outline" size="sm" onClick={openTab} className="rounded-lg border-[#e2e8f0]">
            <ExternalLink className="w-4 h-4 mr-1" />Ouvrir
          </Button>
          <Button
            size="sm" onClick={downloadPdf}
            className="rounded-lg bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white"
          >
            <Download className="w-4 h-4 mr-1" />Télécharger PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate} className="rounded-lg border-[#e2e8f0]">
            <RefreshCw className="w-4 h-4 mr-1" />Regénérer
          </Button>
        </div>
      </div>

      <div ref={ref} className="rich-result" style={{ ['--accent' as string]: accent }}>
        <style dangerouslySetInnerHTML={{ __html: RICH_CSS }} />

        <div className="rr-hero">
          <h1>{head.title}</h1>
          {sousTitre && <p className="rr-sub">{sousTitre}</p>}
          {(score || head.rest) && (
            <div className="rr-badges">
              {score && <div className="rr-score"><Gauge className="w-5 h-5" style={{ color: accent }} /><b>{score.value}</b><span>{score.label}</span></div>}
            </div>
          )}
          {head.rest && <div className="rr-body" style={{ padding: '8px 0 0' }}><ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{head.rest}</ReactMarkdown></div>}
        </div>

        {sections.map((s, i) => {
          const { tone, Icon } = sectionMeta(s.title)
          return (
            <details key={i} className="rr-section" open style={{ ['--accent' as string]: accent }}>
              <summary>
                <Icon className="rr-ico" style={{ color: accent }} />
                {s.title}
                <ChevronDown className="rr-chev" />
              </summary>
              <div className="rr-body">
                {tone === 'defs' ? <Flashcards body={s.body} /> :
                 tone === 'check' ? <Checklist body={s.body} /> :
                 <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{s.body}</ReactMarkdown>}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}

function Flashcards({ body }: { body: string }) {
  const { pre, items } = listItems(body)
  if (items.length === 0) return <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{body}</ReactMarkdown>
  return (
    <>
      {pre && <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{pre}</ReactMarkdown>}
      <div className="rr-cards">
        {items.map((it, i) => {
          const { front, back } = flashParse(it)
          if (!back) return <details key={i} className="rr-flash"><summary><Inline>{front}</Inline></summary></details>
          return (
            <details key={i} className="rr-flash">
              <summary><BookMarked className="w-4 h-4" /><Inline>{front}</Inline></summary>
              <div className="rr-back"><Inline>{back}</Inline></div>
            </details>
          )
        })}
      </div>
    </>
  )
}

function Checklist({ body }: { body: string }) {
  const { pre, items } = listItems(body)
  if (items.length === 0) return <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{body}</ReactMarkdown>
  return (
    <>
      {pre && <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{pre}</ReactMarkdown>}
      <ul style={{ padding: 0, margin: '.4em 0' }}>
        {items.map((it, i) => (
          <li key={i} className="rr-check">
            <input type="checkbox" id={`ck-${i}`} />
            <label htmlFor={`ck-${i}`}><span><Inline>{it}</Inline></span></label>
          </li>
        ))}
      </ul>
    </>
  )
}
