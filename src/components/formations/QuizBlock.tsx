'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, HelpCircle, RotateCcw, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LessonQuizQuestion } from '@/types/formation'

export function QuizBlock({ questions }: { questions: LessonQuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!questions || questions.length === 0) return null

  const score = questions.reduce(
    (s, q, i) => s + (answers[i] === q.reponse_correcte ? 1 : 0),
    0
  )
  const allAnswered = questions.every((_, i) => answers[i] !== undefined)

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-5 sm:p-6 mt-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#fff7ed] flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-[#e97e42]" />
        </div>
        <div>
          <h3 className="font-bold font-heading text-gray-900">Test d'évaluation</h3>
          <p className="text-xs text-gray-500">{questions.length} questions — validez vos acquis</p>
        </div>
      </div>

      <div className="space-y-5">
        {questions.map((q, qi) => (
          <div key={qi}>
            <p className="font-medium text-gray-800 text-sm mb-2">{qi + 1}. {q.question}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi
                const isCorrect = oi === q.reponse_correcte
                let cls = 'border-[#f0ebe3] hover:border-[#e97e42]/40 bg-white'
                if (submitted) {
                  if (isCorrect) cls = 'border-green-400 bg-green-50'
                  else if (selected) cls = 'border-red-300 bg-red-50'
                  else cls = 'border-[#f0ebe3] bg-white opacity-60'
                } else if (selected) {
                  cls = 'border-[#e97e42] bg-[#fff7ed]'
                }
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => setAnswers({ ...answers, [qi]: oi })}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-sm transition-all ${cls}`}
                  >
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1 text-gray-700">{opt}</span>
                    {submitted && isCorrect && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                    {submitted && selected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
            {submitted && (
              <p className="text-xs text-gray-500 mt-1.5 italic flex items-start gap-1">
                <span className="font-medium text-gray-600">Explication :</span> {q.explication}
              </p>
            )}
          </div>
        ))}
      </div>

      {!submitted ? (
        <Button
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className="w-full mt-5 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl disabled:opacity-50"
        >
          Valider mes réponses ({Object.keys(answers).length}/{questions.length})
        </Button>
      ) : (
        <div className="mt-5 flex items-center justify-between bg-white rounded-xl p-4 border border-[#f0ebe3]">
          <div className="flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${score === questions.length ? 'text-yellow-500' : 'text-[#e97e42]'}`} />
            <span className="font-semibold text-gray-800">
              Score : {score}/{questions.length}
            </span>
            <span className="text-sm text-gray-400">
              {score === questions.length ? '— Parfait ! 🎉' : score >= questions.length / 2 ? '— Bien joué' : '— À revoir'}
            </span>
          </div>
          <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#e97e42]">
            <RotateCcw className="w-4 h-4" />Recommencer
          </button>
        </div>
      )}
    </div>
  )
}
