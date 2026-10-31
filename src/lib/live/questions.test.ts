import { describe, expect, it } from 'vitest'
import { answerAt, splitLiveQuestions, stripLiveAnswers } from './questions'

const questions = [
  { question: 'Q1', options: ['a', 'b'], reponse_correcte: 1, explication: 'car b' },
  { question: 'Q2', options: ['c', 'd', 'e'], reponse_correcte: 2, explication: '' },
]

describe('splitLiveQuestions', () => {
  it('sépare questions publiques et réponses', () => {
    const { publicQuestions, answers } = splitLiveQuestions(questions)
    expect(answers).toEqual([1, 2])
    expect(publicQuestions).toEqual([
      { question: 'Q1', options: ['a', 'b'] },
      { question: 'Q2', options: ['c', 'd', 'e'] },
    ])
    expect(JSON.stringify(publicQuestions)).not.toContain('reponse_correcte')
    expect(JSON.stringify(publicQuestions)).not.toContain('explication')
  })
})

describe('stripLiveAnswers', () => {
  it('nettoie des questions au format complet', () => {
    expect(JSON.stringify(stripLiveAnswers(questions))).not.toContain('reponse_correcte')
  })
  it('tolère une valeur inattendue', () => {
    expect(stripLiveAnswers(null)).toEqual([])
  })
})

describe('answerAt', () => {
  it('utilise la table secrète en priorité', () => {
    expect(answerAt(0, [0, 2], questions)).toBe(0)
  })
  it('se replie sur les anciennes questions complètes', () => {
    expect(answerAt(1, null, questions)).toBe(2)
  })
  it('retourne null si la réponse est introuvable', () => {
    expect(answerAt(5, [0], [{ question: 'x', options: [] }])).toBeNull()
  })
})
