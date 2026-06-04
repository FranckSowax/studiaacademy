'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Trophy, Zap, Clock, Flame, ArrowRight, RotateCcw, CheckCircle, XCircle,
  Triangle, Diamond, Circle, Square, Crown, Medal, Radio, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveFinalQuizResult } from '@/lib/formations/actions'
import { createLiveGame } from '@/lib/live/actions'
import type { LessonQuizQuestion } from '@/types/formation'

const TIME_PER_Q = 20 // secondes
const BASE_POINTS = 1000

// Style Kahoot : 4 tuiles colorées
const TILE_STYLES = [
  { bg: '#e11d48', icon: Triangle },
  { bg: '#2563eb', icon: Diamond },
  { bg: '#f59e0b', icon: Circle },
  { bg: '#16a34a', icon: Square },
]

interface LeaderEntry { nom: string; score: number }

export function KahootQuiz({
  formationId,
  formationSlug,
  formationTitre,
  questions,
  leaderboard,
}: {
  formationId: string
  formationSlug: string
  formationTitre: string
  questions: LessonQuizQuestion[]
  leaderboard: LeaderEntry[]
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<'intro' | 'play' | 'reveal' | 'done'>('intro')
  const [launchingLive, setLaunchingLive] = useState(false)
  const [liveError, setLiveError] = useState('')
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [lastGain, setLastGain] = useState(0)
  const startRef = useRef(0)
  const qStartRef = useRef(0)

  const q = questions[idx]

  const launchLive = useCallback(async () => {
    setLaunchingLive(true); setLiveError('')
    const r = await createLiveGame(formationId)
    if (r.success && r.code) {
      router.push(`/live/${r.code}/host`)
    } else {
      setLiveError(r.error ?? 'Impossible de lancer la partie')
      setLaunchingLive(false)
    }
  }, [formationId, router])

  // Timer par question
  useEffect(() => {
    if (phase !== 'play') return
    if (timeLeft <= 0) {
      answer(-1) // temps écoulé
      return
    }
    const t = setInterval(() => setTimeLeft((v) => v - 1), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft])

  const startGame = () => {
    setPhase('play')
    setIdx(0); setScore(0); setStreak(0); setCorrectCount(0)
    setSelected(null); setTimeLeft(TIME_PER_Q)
    startRef.current = Date.now()
    qStartRef.current = Date.now()
  }

  const answer = useCallback(
    (choice: number) => {
      if (selected !== null) return
      setSelected(choice)
      const correct = choice === q.reponse_correcte
      let gain = 0
      if (correct) {
        const elapsed = (Date.now() - qStartRef.current) / 1000
        const speedFactor = Math.max(0, 1 - elapsed / TIME_PER_Q)
        gain = Math.round((BASE_POINTS / 2) + (BASE_POINTS / 2) * speedFactor)
        const streakBonus = streak >= 1 ? Math.min(streak, 5) * 50 : 0
        gain += streakBonus
        setScore((s) => s + gain)
        setStreak((s) => s + 1)
        setCorrectCount((c) => c + 1)
      } else {
        setStreak(0)
      }
      setLastGain(gain)
      setPhase('reveal')
    },
    [q, selected, streak]
  )

  const next = async () => {
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1)
      setSelected(null)
      setTimeLeft(TIME_PER_Q)
      qStartRef.current = Date.now()
      setPhase('play')
    } else {
      const duree = Math.round((Date.now() - startRef.current) / 1000)
      const maxScore = questions.length * (BASE_POINTS + 250)
      await saveFinalQuizResult({
        formation_id: formationId,
        score,
        max_score: maxScore,
        correct_count: correctCount,
        total_questions: questions.length,
        duree_secondes: duree,
      })
      setPhase('done')
    }
  }

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#7C3AED] via-[#6d28d9] to-[#4c1d95] text-white px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mb-6">
          <Trophy className="w-10 h-10" />
        </div>
        <p className="text-white/70 uppercase tracking-widest text-sm mb-2">Quiz final</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading mb-3 max-w-xl">{formationTitre}</h1>
        <p className="text-white/80 mb-8 max-w-md">
          {questions.length} questions · {TIME_PER_Q}s par question. Plus tu réponds vite et juste, plus tu marques de points. Enchaîne les bonnes réponses pour des bonus de série !
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={startGame} className="bg-white text-[#7C3AED] hover:bg-white/90 rounded-2xl px-10 py-7 text-lg font-bold">
            <Zap className="w-5 h-5 mr-2" />Jouer en solo
          </Button>
          <Button onClick={launchLive} disabled={launchingLive} className="bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-2xl px-10 py-7 text-lg font-bold">
            {launchingLive ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Radio className="w-5 h-5 mr-2" />Lancer en direct (présentiel)</>}
          </Button>
        </div>
        {liveError && <p className="text-red-200 text-sm mt-3">{liveError}</p>}
        <p className="text-white/50 text-xs mt-3 max-w-sm">Mode direct : projette un QR code, les participants rejoignent depuis leur téléphone sans compte.</p>
        <Link href={`/apprendre/${formationSlug}`} className="text-white/60 hover:text-white text-sm mt-6">
          ← Retour à la formation
        </Link>

        {leaderboard.length > 0 && (
          <div className="mt-10 bg-white/10 rounded-2xl p-5 w-full max-w-sm">
            <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-1.5"><Crown className="w-4 h-4" />Meilleurs scores</p>
            <div className="space-y-1.5">
              {leaderboard.slice(0, 5).map((l, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-5 text-white/60">{i + 1}.</span>{l.nom}</span>
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
    const maxScore = questions.length * (BASE_POINTS + 250)
    const pct = Math.round((correctCount / questions.length) * 100)
    const mention = pct >= 90 ? 'Champion ! 🏆' : pct >= 70 ? 'Excellent ! 🎉' : pct >= 50 ? 'Bien joué 👍' : 'Continue à réviser 💪'
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#e97e42] via-[#d56a2e] to-[#c45a20] text-white px-4 text-center">
        <Medal className="w-16 h-16 mb-4" />
        <p className="text-white/80 uppercase tracking-widest text-sm mb-1">Score final</p>
        <div className="text-6xl font-extrabold font-heading mb-2">{score}</div>
        <p className="text-xl font-bold mb-6">{mention}</p>
        <div className="grid grid-cols-3 gap-4 bg-white/10 rounded-2xl p-5 mb-8 w-full max-w-sm">
          <div><p className="text-2xl font-bold">{correctCount}/{questions.length}</p><p className="text-xs text-white/70">Bonnes réponses</p></div>
          <div><p className="text-2xl font-bold">{pct}%</p><p className="text-xs text-white/70">Réussite</p></div>
          <div><p className="text-2xl font-bold">{Math.round((score / maxScore) * 100)}%</p><p className="text-xs text-white/70">Du max</p></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={startGame} className="bg-white text-[#e97e42] hover:bg-white/90 rounded-2xl px-8 py-6 font-bold">
            <RotateCcw className="w-5 h-5 mr-2" />Rejouer
          </Button>
          <Link href={`/apprendre/${formationSlug}`}>
            <Button variant="outline" className="border-2 border-white text-white hover:bg-white/15 rounded-2xl px-8 py-6 font-bold w-full">
              Retour à la formation
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── PLAY / REVEAL ──
  const urgent = timeLeft <= 5 && phase === 'play'
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white">
      {/* Barre haute */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4">
        <span className="text-sm text-white/60">Question {idx + 1}/{questions.length}</span>
        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm font-bold">
              <Flame className="w-4 h-4" />Série x{streak}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-sm font-bold">
            <Zap className="w-4 h-4 text-yellow-400" />{score}
          </span>
        </div>
      </div>

      {/* Chrono */}
      <div className="flex justify-center mb-2">
        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold font-mono text-lg ${urgent ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`}>
          <Clock className="w-5 h-5" />{phase === 'reveal' ? '—' : timeLeft}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-center max-w-3xl leading-tight">
          {q.question}
        </h2>
      </div>

      {/* Gain au reveal */}
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

      {/* Réponses (tuiles Kahoot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-8 max-w-4xl mx-auto w-full">
        {q.options.map((opt, i) => {
          const tile = TILE_STYLES[i % 4]
          const TileIcon = tile.icon
          const isCorrect = i === q.reponse_correcte
          const isSelected = selected === i
          let opacity = 'opacity-100'
          let ring = ''
          if (phase === 'reveal') {
            if (isCorrect) ring = 'ring-4 ring-white scale-[1.02]'
            else if (isSelected) opacity = 'opacity-60'
            else opacity = 'opacity-35'
          }
          return (
            <button
              key={i}
              disabled={phase === 'reveal' || selected !== null}
              onClick={() => answer(i)}
              className={`flex items-center gap-3 px-5 py-5 rounded-2xl text-left font-semibold text-white shadow-lg transition-all ${opacity} ${ring} ${phase === 'play' ? 'hover:scale-[1.02] active:scale-95' : ''}`}
              style={{ backgroundColor: tile.bg }}
            >
              <TileIcon className="w-6 h-6 flex-shrink-0" fill="white" />
              <span className="flex-1">{opt}</span>
              {phase === 'reveal' && isCorrect && <CheckCircle className="w-6 h-6" />}
              {phase === 'reveal' && isSelected && !isCorrect && <XCircle className="w-6 h-6" />}
            </button>
          )
        })}
      </div>

      {/* Bouton suivant au reveal */}
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
