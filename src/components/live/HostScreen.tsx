'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Play, Clock, Trophy, Crown, Triangle, Diamond, Circle, Square,
  Copy, Check, ArrowRight, Loader2, Medal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hostNextQuestion, hostReveal, hostEndGame } from '@/lib/live/actions'
import type { LiveGame, LivePlayer } from '@/types/live'

const TIME_PER_Q = 20
const TILES = [
  { bg: '#e11d48', icon: Triangle },
  { bg: '#2563eb', icon: Diamond },
  { bg: '#f59e0b', icon: Circle },
  { bg: '#16a34a', icon: Square },
]

export function HostScreen({
  game: initialGame,
  initialPlayers,
  joinUrl,
}: {
  game: LiveGame
  initialPlayers: LivePlayer[]
  joinUrl: string
}) {
  const supabase = createClient()
  const [game, setGame] = useState(initialGame)
  const [players, setPlayers] = useState<LivePlayer[]>(initialPlayers)
  const [answerCount, setAnswerCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const revealedRef = useRef(false)

  const questions = game.questions ?? []
  const q = questions[game.current_index]

  const refresh = useCallback(async () => {
    const [{ data: pl }, { count }] = await Promise.all([
      supabase.from('live_players').select('*').eq('game_id', game.id).order('score', { ascending: false }),
      supabase.from('live_answers').select('*', { count: 'exact', head: true }).eq('game_id', game.id).eq('question_index', game.current_index),
    ])
    if (pl) setPlayers(pl as LivePlayer[])
    setAnswerCount(count ?? 0)
  }, [game.id, game.current_index, supabase])

  // Realtime (snappy) + polling de secours (fiabilité du nombre de joueurs / réponses)
  useEffect(() => {
    refresh()
    const ch = supabase
      .channel(`host-${game.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_players', filter: `game_id=eq.${game.id}` }, () => refresh())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_games', filter: `id=eq.${game.id}` }, (p) => setGame((g) => ({ ...g, ...(p.new as LiveGame) })))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_answers', filter: `game_id=eq.${game.id}` }, () => refresh())
      .subscribe()
    const poll = setInterval(refresh, 2000)
    return () => { supabase.removeChannel(ch); clearInterval(poll) }
  }, [game.id, supabase, refresh])

  // Timer pendant la phase question → révèle automatiquement à 0
  useEffect(() => {
    if (game.status !== 'question' || !game.question_started_at) return
    revealedRef.current = false
    const started = new Date(game.question_started_at).getTime()
    const tick = () => {
      const left = Math.max(0, TIME_PER_Q - Math.floor((Date.now() - started) / 1000))
      setTimeLeft(left)
      if (left <= 0 && !revealedRef.current) {
        revealedRef.current = true
        hostReveal(game.id)
      }
    }
    tick()
    const t = setInterval(tick, 500)
    return () => clearInterval(t)
  }, [game.status, game.question_started_at, game.id])

  const start = useCallback(async () => {
    setBusy(true); setAnswerCount(0)
    await hostNextQuestion(game.id)
    setBusy(false)
  }, [game.id])

  const next = useCallback(async () => {
    setBusy(true); setAnswerCount(0)
    const r = await hostNextQuestion(game.id)
    if (r.ended) await hostEndGame(game.id)
    setBusy(false)
  }, [game.id])

  const copyCode = () => {
    navigator.clipboard.writeText(game.code)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const ranked = [...players].sort((a, b) => b.score - a.score)

  // ── LOBBY ──
  if (game.status === 'lobby') {
    return (
      <div className="min-h-screen kahoot-gradient text-white p-6 flex flex-col">
        <div className="text-center mb-6">
          <p className="text-white/70 uppercase tracking-widest text-sm">Rejoignez la partie</p>
          <h1 className="text-3xl font-extrabold font-heading">{game.titre}</h1>
        </div>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 flex-1">
          {/* Code + QR */}
          <div className="bg-white rounded-3xl p-8 text-center text-gray-900 shadow-2xl">
            <p className="text-sm text-gray-500 mb-2">Scannez ou allez sur <strong>{joinUrl.replace(/^https?:\/\//, '')}</strong></p>
            <div className="bg-white p-3 rounded-2xl inline-block">
              <QRCodeSVG value={joinUrl} size={200} />
            </div>
            <div className="mt-5">
              <p className="text-sm text-gray-500">Code de la partie</p>
              <button onClick={copyCode} className="inline-flex items-center gap-2 text-4xl font-extrabold font-heading tracking-[0.2em] text-[#7C3AED]">
                {game.code}
                {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>
          {/* Joueurs */}
          <div className="kahoot-glass rounded-3xl p-6 w-full max-w-sm">
            <p className="font-semibold mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20"><Users className="w-4 h-4" /></span>
              <span className="text-2xl font-extrabold tabular-nums">{players.length}</span> joueur{players.length > 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {players.map((p) => (
                <span key={p.id} className="bg-white/20 px-3 py-1.5 rounded-full text-sm font-semibold kahoot-pop">{p.pseudo}</span>
              ))}
              {players.length === 0 && <p className="text-white/60 text-sm">En attente de joueurs…</p>}
            </div>
          </div>
        </div>
        <div className="text-center mt-6">
          <Button onClick={start} disabled={busy || players.length === 0} className="bg-white text-[#7C3AED] hover:bg-white/90 rounded-2xl px-12 py-7 text-lg font-bold">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 mr-2" />Démarrer la partie</>}
          </Button>
        </div>
      </div>
    )
  }

  // ── ENDED : podium ──
  if (game.status === 'ended') {
    const podium = ranked.slice(0, 3)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e97e42] to-[#c45a20] text-white p-6 flex flex-col items-center justify-center">
        <Trophy className="w-16 h-16 mb-4 kahoot-float" />
        <h1 className="text-3xl font-extrabold font-heading mb-8">Classement final</h1>
        <div className="flex items-end gap-4 mb-8">
          {[1, 0, 2].map((pos) => {
            const p = podium[pos]
            if (!p) return <div key={pos} className="w-24" />
            const heights = ['h-32', 'h-44', 'h-24']
            const medals = ['🥈', '🥇', '🥉']
            return (
              <div key={pos} className="flex flex-col items-center kahoot-pop" style={{ animationDelay: `${pos * 150}ms` }}>
                <span className="text-3xl mb-1">{medals[pos]}</span>
                <span className="font-bold mb-1 text-center">{p.pseudo}</span>
                <span className="text-sm text-white/80 mb-2">{p.score} pts</span>
                <div className={`w-24 ${heights[pos]} kahoot-glass rounded-t-2xl flex items-start justify-center pt-2 font-extrabold text-2xl`}>{pos === 1 ? 1 : pos === 0 ? 2 : 3}</div>
              </div>
            )
          })}
        </div>
        {ranked.length > 3 && (
          <div className="bg-white/10 rounded-2xl p-4 w-full max-w-sm space-y-1">
            {ranked.slice(3, 10).map((p, i) => (
              <div key={p.id} className="flex justify-between text-sm"><span>{i + 4}. {p.pseudo}</span><span className="font-bold">{p.score}</span></div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── QUESTION / REVEAL ──
  const isReveal = game.status === 'reveal'
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white flex flex-col">
      <div className="h-1.5 bg-white/10">
        <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#e97e42] transition-all duration-500" style={{ width: `${((game.current_index + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-white/60">Question {game.current_index + 1}/{questions.length}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-sm"><Users className="w-4 h-4" />{players.length}</span>
          {!isReveal && <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-sm">{answerCount} réponses</span>}
        </div>
      </div>

      {!isReveal && (
        <div className="flex justify-center mb-2">
          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold font-mono text-xl ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`}>
            <Clock className="w-5 h-5" />{timeLeft}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6">
        <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-center max-w-4xl leading-tight">{q?.question}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6 max-w-4xl mx-auto w-full">
        {q?.options.map((opt, i) => {
          const tile = TILES[i % 4]
          const TileIcon = tile.icon
          const correct = i === q.reponse_correcte
          const dim = isReveal && !correct ? 'opacity-35' : 'opacity-100'
          const ring = isReveal && correct ? 'ring-4 ring-white scale-[1.02]' : ''
          return (
            <div key={i} className={`kahoot-tile kahoot-tile-${i + 1} flex items-center gap-3 px-5 py-5 rounded-2xl font-bold text-white shadow-xl transition-all ${dim} ${ring}`} style={{ backgroundColor: tile.bg }}>
              <TileIcon className="w-6 h-6 flex-shrink-0" fill="white" />
              <span className="flex-1 text-lg">{opt}</span>
              {isReveal && correct && <Check className="w-7 h-7" />}
            </div>
          )
        })}
      </div>

      {/* Contrôles + mini classement au reveal */}
      <div className="px-6 pb-6">
        {isReveal && (
          <div className="max-w-md mx-auto bg-white/10 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Crown className="w-4 h-4" />Classement</p>
            {ranked.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex justify-between text-sm py-0.5">
                <span className="flex items-center gap-2">{i === 0 ? <Medal className="w-4 h-4 text-yellow-400" /> : <span className="w-4 text-white/50">{i + 1}</span>}{p.pseudo}</span>
                <span className="font-bold">{p.score}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-3">
          {isReveal ? (
            <Button onClick={next} disabled={busy} className="bg-white text-[#0f172a] hover:bg-white/90 rounded-2xl px-10 py-6 font-bold text-lg">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : game.current_index < questions.length - 1 ? <>Question suivante <ArrowRight className="w-5 h-5 ml-2" /></> : <>Voir le podium <Trophy className="w-5 h-5 ml-2" /></>}
            </Button>
          ) : (
            <Button onClick={() => hostReveal(game.id)} variant="outline" className="border-2 border-white text-white hover:bg-white/15 rounded-2xl px-8 py-6 font-bold">
              Révéler la réponse
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
