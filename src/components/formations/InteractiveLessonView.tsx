'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChevronDown, Lightbulb, Sparkles, Check, X, HelpCircle, BookOpen, Star, Quote,
} from 'lucide-react'
import type { LessonBlock } from '@/types/formation'

function MD({ children }: { children: string }) {
  return (
    <div className="markdown-body text-[15px] leading-relaxed text-gray-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}

// Section dépliable
function SectionBlock({ titre, resume, details, defaultOpen }: { titre: string; resume: string; details: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden transition-shadow hover:shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-start gap-3 p-5 text-left">
        <div className="w-9 h-9 rounded-xl bg-[#fff7ed] flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-[#e97e42]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold font-heading text-gray-900">{titre}</h3>
          {resume && <p className="text-sm text-gray-500 mt-0.5">{resume}</p>}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 ml-12 animate-fade-up">
          <MD>{details}</MD>
        </div>
      )}
    </div>
  )
}

// Concepts cliquables (révèlent leur définition)
function ConceptsBlock({ items }: { items: { terme: string; definition: string }[] }) {
  const [active, setActive] = useState<number | null>(null)
  return (
    <div className="bg-gradient-to-br from-[#fbf8f3] to-white rounded-2xl border border-[#f0ebe3] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#a84d16] mb-3 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />Concepts clés · cliquez pour découvrir
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((c, i) => (
          <button
            key={i}
            onClick={() => setActive(active === i ? null : i)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${active === i ? 'bg-[#e97e42] text-white border-[#e97e42]' : 'bg-white text-gray-700 border-[#f0ebe3] hover:border-[#e97e42]/50'}`}
          >
            {c.terme}
          </button>
        ))}
      </div>
      {active !== null && (
        <div className="mt-3 bg-white rounded-xl border border-[#f0ebe3] p-4 animate-fade-up">
          <p className="font-semibold text-gray-900 text-sm mb-1">{items[active].terme}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{items[active].definition}</p>
        </div>
      )}
    </div>
  )
}

// Question flash (intégrée dans le cours)
function QuestionFlash({ question, options, reponse_correcte, explication }: { question: string; options: string[]; reponse_correcte: number; explication: string }) {
  const [choice, setChoice] = useState<number | null>(null)
  const answered = choice !== null
  const correct = choice === reponse_correcte
  return (
    <div className="bg-gradient-to-br from-violet-50 to-white rounded-2xl border border-violet-100 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7C3AED] mb-2 flex items-center gap-1.5">
        <HelpCircle className="w-3.5 h-3.5" />Question flash
      </p>
      <p className="font-semibold text-gray-900 mb-3">{question}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt, i) => {
          let cls = 'border-violet-100 bg-white hover:border-[#7C3AED]/40'
          if (answered) {
            if (i === reponse_correcte) cls = 'border-green-400 bg-green-50 text-green-700'
            else if (i === choice) cls = 'border-red-300 bg-red-50 text-red-700'
            else cls = 'border-violet-100 bg-white opacity-60'
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setChoice(i)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all ${cls}`}
            >
              <span className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center text-[11px] font-semibold flex-shrink-0">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1">{opt}</span>
              {answered && i === reponse_correcte && <Check className="w-4 h-4 text-green-600" />}
              {answered && i === choice && i !== reponse_correcte && <X className="w-4 h-4 text-red-500" />}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`mt-3 rounded-xl p-3 text-sm animate-fade-up ${correct ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
          <p className="font-semibold mb-0.5">{correct ? '✅ Bonne réponse !' : '💡 Pas tout à fait'}</p>
          {explication && <p className="text-[13px] leading-relaxed opacity-90">{explication}</p>}
        </div>
      )}
    </div>
  )
}

export function InteractiveLessonView({ blocks }: { blocks: LessonBlock[] }) {
  let firstSection = true
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'accroche':
            return (
              <div key={i} className="bg-gradient-to-br from-[#fff7ed] to-white rounded-2xl border border-[#f0ebe3] p-5">
                <MD>{b.texte}</MD>
              </div>
            )
          case 'section': {
            const open = firstSection
            firstSection = false
            return <SectionBlock key={i} titre={b.titre} resume={b.resume} details={b.details} defaultOpen={open} />
          }
          case 'concepts':
            return <ConceptsBlock key={i} items={b.items} />
          case 'a_retenir':
            return (
              <div key={i} className="bg-[#fff7ed] rounded-2xl border border-[#e97e42]/20 p-5">
                <p className="font-bold font-heading text-[#a84d16] mb-3 flex items-center gap-2"><Star className="w-4 h-4" />À retenir</p>
                <ul className="space-y-2">
                  {b.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-[#e97e42] flex-shrink-0 mt-0.5" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            )
          case 'exemple':
            return (
              <div key={i} className="bg-blue-50/60 rounded-2xl border border-blue-100 p-5">
                <p className="font-semibold text-blue-800 mb-1.5 flex items-center gap-2"><Quote className="w-4 h-4" />{b.titre || 'Exemple concret'}</p>
                <MD>{b.texte}</MD>
              </div>
            )
          case 'le_saviez_vous':
            return (
              <div key={i} className="bg-amber-50/70 rounded-2xl border border-amber-100 p-5">
                <p className="font-semibold text-amber-800 mb-1.5 flex items-center gap-2"><Lightbulb className="w-4 h-4" />Le saviez-vous ?</p>
                <MD>{b.texte}</MD>
              </div>
            )
          case 'question_flash':
            return <QuestionFlash key={i} question={b.question} options={b.options} reponse_correcte={b.reponse_correcte} explication={b.explication} />
          default:
            return null
        }
      })}
    </div>
  )
}
