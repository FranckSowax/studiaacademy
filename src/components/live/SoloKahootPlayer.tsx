'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trophy, Zap, Clock, Flame, ArrowRight, RotateCcw, CheckCircle, XCircle,
  Triangle, Diamond, Circle, Square, Crown, Medal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveKahootSoloResult } from '@/lib/kahoot/solo-actions'
import type { LessonQuizQuestion } from '@/types/formation'

const TIME_PER_Q = 20
const BASE_POINTS = 1000
const TILES = [
  { bg: '#e11d48', icon: Triangle },
  { bg: '#2563eb', icon: Diamond },
  { bg: '#f59e0b', icon: Circle },
  { bg: '#16a34a', icon: Square },
]

export function SoloKahootPlayer({
  kahootId,
  titre,
  questions,
  leaderboard,
}: {
  kahootId: string
  titre: string
  questions: LessonQuizQuestion[]
  leaderboard: { pseudo: string; score: number }[]
}) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'reveal' | 'done'>('intro')
  const [pseudo, setPseudo] = useState('')
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [lastGain, setLastGain] = useState(0)
  const [saved, setSaved] = useState(false)
  const qStartRef = useRef(0)

  const q = questions[idx]

  useEffect(() => {
    if (phase !== 'play') return
    if (timeLeft <= 0) { answer(-1); return }
    const t = setInterval(() => setTimeLeft((v) => v - 1), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft])

  const start = () => {
    setPhase('play'); setIdx(0); setScore(0); setStreak(0); setCorrectCount(0)
    setSelected(null); setTimeLeft(TIME_PER_Q); setSaved(false)
    qStartRef.current = Date.now()
  }

  const answer = useCallback((choice: number) => {
    if (selected !== null) return
    setSelected(choice)
    const correct = choice === q.reponse_correcte
    let gain = 0
    if (correct) {
      const elapsed = (Date.now() - qStartRef.current) / 1000
      const speed = Math.max(0, 1 - elapsed / TIME_PER_Q)
      gain = Math.round(BASE_POINTS / 2 + (BASE_POINTS / 2) * speed)
      if (streak >= 1) gain += Math.min(streak, 5) * 50
      setScore((s) => s + gain); setStreak((s) => s + 1); setCorrectCount((c) => c + 1)
    } else setStreak(0)
    setLastGain(gain)
    setPhase('reveal')
  }, [q, selected, streak])

  const next = async () => {
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1); setSelected(null); setTimeLeft(TIME_PER_Q)
      qStartRef.current = Date.now(); setPhase('play')
    } else {
      setPhase('done')
      if (!saved) {
        setSaved(true)
        await saveKahootSoloResult({
          kahoot_id: kahootId, pseudo: pseudo.trim() || 'Élève',
          score, correct_count: correctCount, total_questions: questions.length,
        })
      }
    }
  }

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center kahoot-gradient text-white px-4 text-center">
        <div className="w-20 h-20 rounded-3xl kahoot-glass flex items-center justify-center mb-6 kahoot-float"><Trophy className="w-10 h-10" /></div>
        <p className="text-white/70 uppercase tracking-widest text-sm mb-2">Kahoot</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading mb-3 max-w-xl">{titre}</h1>
        <p className="text-white/80 mb-6 max-w-md">{questions.length} questions · {TIME_PER_Q}s par question. Réponds vite et juste pour marquer un max de points !</p>
        <div className="bg-white rounded-2xl p-4 w-full max-w-sm mb-4">
          <input
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pseudo.trim().length >= 2 && start()}
            maxLength={24}
            placeholder="Ton pseudo"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7C3AED] focus:outline-none text-lg text-gray-900"
            autoFocus
          />
        </div>
        <Button onClick={start} disabled={pseudo.trim().length < 2} className="bg-white text-[#7C3AED] hover:bg-white/90 rounded-2xl px-10 py-7 text-lg font-bold disabled:opacity-50">
          <Zap className="w-5 h-5 mr-2" />C&apos;est parti !
        </Button>

        {leaderboard.length > 0 && (
          <div className="mt-10 bg-white/10 rounded-2xl p-5 w-full max-w-sm">
            <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-1.5"><Crown className="w-4 h-4" />Meilleurs scores</p>
            <div className="space-y-1.5">
              {leaderboard.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-5 text-white/60">{i + 1}.</span>{l.pseudo}</span>
                  <span className="font-bold">{l.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── DONE ──
  if (phase === 'done') {
    const pct = Math.round((correctCount / questions.length) * 100)
    const mention = pct >= 90 ? 'Champion ! 🏆' : pct >= 70 ? 'Excellent ! 🎉' : pct >= 50 ? 'Bien joué 👍' : 'Continue à réviser 💪'
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#e97e42] via-[#d56a2e] to-[#c45a20] text-white px-4 text-center">
        <Medal className="w-16 h-16 mb-4" />
        <p className="text-white/80 uppercase tracking-widest text-sm mb-1">Score final · {pseudo}</p>
        <div className="text-6xl font-extrabold font-heading mb-2">{score}</div>
        <p className="text-xl font-bold mb-6">{mention}</p>
        <div className="grid grid-cols-2 gap-4 bg-white/10 rounded-2xl p-5 mb-8 w-full max-w-xs">
          <div><p className="text-2xl font-bold">{correctCount}/{questions.length}</p><p className="text-xs text-white/70">Bonnes réponses</p></div>
          <div><p className="text-2xl font-bold">{pct}%</p><p className="text-xs text-white/70">Réussite</p></div>
        </div>
        <Button onClick={start} className="bg-white text-[#e97e42] hover:bg-white/90 rounded-2xl px-8 py-6 font-bold">
          <RotateCcw className="w-5 h-5 mr-2" />Rejouer
        </Button>
      </div>
    )
  }

  // ── PLAY / REVEAL ──
  const urgent = timeLeft <= 5 && phase === 'play'
  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white">
      <div className="h-1.5 bg-white/10">
        <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#e97e42] transition-all duration-500" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between px-4 sm:px-8 py-4">
        <span className="text-sm text-white/60">Question {idx + 1}/{questions.length}</span>
        <div className="flex items-center gap-3">
          {streak >= 2 && <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm font-bold"><Flame className="w-4 h-4" />Série x{streak}</span>}
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-sm font-bold"><Zap className="w-4 h-4 text-yellow-400" />{score}</span>
        </div>
      </div>

      <div className="flex justify-center mb-2">
        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold font-mono text-lg ${urgent ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`}>
          <Clock className="w-5 h-5" />{phase === 'reveal' ? '—' : timeLeft}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-center max-w-3xl leading-tight">{q.question}</h2>
      </div>

      {phase === 'reveal' && (
        <div className="text-center mb-4">
          {selected === q.reponse_correcte ? (
            <p className="text-green-400 font-bold text-lg inline-flex items-center gap-2"><CheckCircle className="w-5 h-5" />+{lastGain} points</p>
          ) : (
            <p className="text-red-400 font-bold text-lg inline-flex items-center gap-2"><XCircle className="w-5 h-5" />{selected === -1 ? 'Temps écoulé' : 'Raté'}</p>
          )}
          {q.explication && <p className="text-white/60 text-sm mt-1 max-w-lg mx-auto px-4">{q.explication}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-8 max-w-4xl mx-auto w-full">
        {q.options.map((opt, i) => {
          const tile = TILES[i % 4]
          const TileIcon = tile.icon
          const isCorrect = i === q.reponse_correcte
          const isSelected = selected === i
          let opacity = 'opacity-100'; let ring = ''
          if (phase === 'reveal') {
            if (isCorrect) ring = 'ring-4 ring-white scale-[1.02]'
            else if (isSelected) opacity = 'opacity-60'
            else opacity = 'opacity-35'
          }
          return (
            <button key={i} disabled={phase === 'reveal' || selected !== null} onClick={() => answer(i)}
              className={`kahoot-tile kahoot-tile-${i + 1} flex items-center gap-3 px-5 py-5 rounded-2xl text-left font-semibold text-white shadow-xl transition-all ${opacity} ${ring} ${phase === 'play' ? 'hover:scale-[1.02] active:scale-95' : ''}`}
              style={{ backgroundColor: tile.bg }}>
              <TileIcon className="w-6 h-6 flex-shrink-0" fill="white" />
              <span className="flex-1">{opt}</span>
              {phase === 'reveal' && isCorrect && <CheckCircle className="w-6 h-6" />}
              {phase === 'reveal' && isSelected && !isCorrect && <XCircle className="w-6 h-6" />}
            </button>
          )
        })}
      </div>

      {phase === 'reveal' && (
        <div className="flex justify-center pb-8">
          <Button onClick={next} className="bg-white text-[#0f172a] hover:bg-white/90 rounded-2xl px-10 py-6 font-bold text-lg">
            {idx < questions.length - 1 ? <>Question suivante <ArrowRight className="w-5 h-5 ml-2" /></> : <>Voir mon score <Trophy className="w-5 h-5 ml-2" /></>}
          </Button>
        </div>
      )}
    </div>
  )
}
