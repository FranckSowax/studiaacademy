'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'
import {
  Triangle, Diamond, Circle, Square, Loader2, Check, X, Clock, Trophy, Crown, Zap, Wifi,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { joinLiveGame, submitLiveAnswer } from '@/lib/live/actions'
import type { LiveGame, LivePlayer } from '@/types/live'

const TIME_PER_Q = 20
const TILES = [
  { bg: '#e11d48', icon: Triangle },
  { bg: '#2563eb', icon: Diamond },
  { bg: '#f59e0b', icon: Circle },
  { bg: '#16a34a', icon: Square },
]

export function PlayerScreen({ game: initialGame }: { game: LiveGame }) {
  const supabase = createClient()
  const storageKey = `studia_live_${initialGame.code}`

  const [game, setGame] = useState(initialGame)
  const [players, setPlayers] = useState<LivePlayer[]>([])
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [pseudo, setPseudo] = useState('')
  const [restored, setRestored] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const [answered, setAnswered] = useState<number | null>(null)
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [connectedCount, setConnectedCount] = useState(0)
  const lastIndexRef = useRef(-1)

  const questions = game.questions ?? []
  const me = players.find((p) => p.id === playerId)
  const myScore = me?.score ?? 0
  const ranked = [...players].sort((a, b) => b.score - a.score)
  const myRank = me ? ranked.findIndex((p) => p.id === playerId) + 1 : 0

  // Restaure une session existante (évite de re-saisir un pseudo au refresh)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const s = JSON.parse(raw) as { playerId: string; pseudo: string }
        if (s.playerId) { setPlayerId(s.playerId); setPseudo(s.pseudo ?? '') }
      }
    } catch { /* ignore */ }
    setRestored(true)
  }, [storageKey])

  const refresh = useCallback(async () => {
    const [{ data: g }, { data: pl }] = await Promise.all([
      supabase.from('live_games').select('status, current_index, question_started_at, titre').eq('id', game.id).maybeSingle(),
      supabase.from('live_players').select('*').eq('game_id', game.id).order('score', { ascending: false }),
    ])
    if (g) setGame((prev) => ({ ...prev, ...(g as Partial<LiveGame>) }))
    if (pl) setPlayers(pl as LivePlayer[])
  }, [game.id, supabase])

  // Realtime (snappy) + polling de secours (fiabilité)
  useEffect(() => {
    if (!playerId) return
    refresh()
    const ch = supabase
      .channel(`player-${game.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_games', filter: `id=eq.${game.id}` }, (p) => setGame((prev) => ({ ...prev, ...(p.new as LiveGame) })))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_players', filter: `game_id=eq.${game.id}` }, () => refresh())
      .subscribe()
    const poll = setInterval(refresh, 2000)
    return () => { supabase.removeChannel(ch); clearInterval(poll) }
  }, [game.id, playerId, supabase, refresh])

  // Presence : se signaler connecté + compter les connectés en direct
  useEffect(() => {
    if (!playerId) return
    const ch = supabase.channel(`presence-${game.id}`, { config: { presence: { key: playerId } } })
    ch.on('presence', { event: 'sync' }, () => {
      setConnectedCount(Object.keys(ch.presenceState()).length)
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await ch.track({ pseudo: pseudo || 'Élève' })
    })
    return () => { supabase.removeChannel(ch) }
  }, [game.id, playerId, pseudo, supabase])

  // Reset à chaque nouvelle question
  useEffect(() => {
    if (game.status === 'question' && game.current_index !== lastIndexRef.current) {
      lastIndexRef.current = game.current_index
      setAnswered(null)
      setLastResult(null)
    }
  }, [game.status, game.current_index])

  // Confetti si bon classement à la fin
  useEffect(() => {
    if (game.status === 'ended' && myRank > 0 && myRank <= 3) {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } })
    }
  }, [game.status, myRank])

  // Timer joueur
  useEffect(() => {
    if (game.status !== 'question' || !game.question_started_at) return
    const started = new Date(game.question_started_at).getTime()
    const tick = () => setTimeLeft(Math.max(0, TIME_PER_Q - Math.floor((Date.now() - started) / 1000)))
    tick()
    const t = setInterval(tick, 500)
    return () => clearInterval(t)
  }, [game.status, game.question_started_at])

  const join = useCallback(async () => {
    if (pseudo.trim().length < 2) { setJoinError('Choisis un pseudo (2 caractères min.)'); return }
    setJoining(true); setJoinError('')
    const r = await joinLiveGame(game.code, pseudo.trim())
    setJoining(false)
    if (!r.success || !r.playerId) { setJoinError(r.error ?? 'Impossible de rejoindre'); return }
    try { localStorage.setItem(storageKey, JSON.stringify({ playerId: r.playerId, pseudo: pseudo.trim() })) } catch { /* ignore */ }
    setPlayerId(r.playerId)
  }, [pseudo, game.code, game.id, storageKey])

  const answer = useCallback(async (choice: number) => {
    if (answered !== null || !playerId) return
    setAnswered(choice)
    const r = await submitLiveAnswer({ gameId: game.id, playerId, questionIndex: game.current_index, choice })
    if (r.success) { setLastResult({ correct: !!r.correct, points: r.points ?? 0 }); refresh() }
  }, [answered, playerId, game.id, game.current_index, refresh])

  // ── ÉCRAN JOIN ──
  if (restored && !playerId) {
    const closed = game.status === 'ended'
    return (
      <div className="min-h-dvh kahoot-gradient text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3"><Zap className="w-8 h-8" /></div>
            <h1 className="text-2xl font-extrabold font-heading">{game.titre}</h1>
            <p className="text-white/70 text-sm mt-1 font-mono tracking-widest">{game.code}</p>
          </div>
          {closed ? (
            <div className="bg-white/10 rounded-2xl p-6 text-center">Cette partie est terminée.</div>
          ) : (
            <div className="bg-white rounded-3xl p-6 text-gray-900 shadow-2xl">
              <label className="block text-sm font-medium text-gray-600 mb-2">Ton pseudo</label>
              <input
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && join()}
                maxLength={24}
                placeholder="Ex : Aïcha241"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7C3AED] focus:outline-none text-lg"
                autoFocus
              />
              {joinError && <p className="text-red-500 text-sm mt-2">{joinError}</p>}
              <Button onClick={join} disabled={joining} className="w-full mt-4 bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl py-6 text-lg font-bold">
                {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rejoindre'}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!restored) {
    return <div className="min-h-dvh bg-[#4c1d95] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>
  }

  // ── LOBBY (salon d'attente) ──
  if (game.status === 'lobby') {
    return (
      <div className="min-h-dvh kahoot-gradient text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full kahoot-glass flex items-center justify-center mb-5 kahoot-float">
          <span className="text-3xl font-extrabold">{(pseudo || '?').charAt(0).toUpperCase()}</span>
        </div>
        <h1 className="text-2xl font-bold font-heading">Tu es dans la partie{pseudo ? `, ${pseudo}` : ''} !</h1>
        <p className="text-white/70 mt-2 inline-flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" />En attente du lancement par l&apos;hôte…</p>
        <div className="mt-6 bg-white/10 rounded-full px-4 py-2 text-sm inline-flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-300" />{(() => { const n = Math.max(connectedCount, players.length); return `${n} joueur${n > 1 ? 's' : ''} connecté${n > 1 ? 's' : ''}` })()}
        </div>
      </div>
    )
  }

  // ── ENDED ──
  if (game.status === 'ended') {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#e97e42] to-[#c45a20] text-white flex flex-col items-center justify-center p-6 text-center">
        <Trophy className="w-14 h-14 mb-4" />
        <h1 className="text-3xl font-extrabold font-heading">{myRank === 1 ? '🏆 Tu as gagné !' : 'Partie terminée'}</h1>
        <p className="text-xl mt-3">{pseudo}</p>
        <div className="mt-4 bg-white/15 rounded-2xl px-8 py-5">
          <p className="text-4xl font-extrabold">{myScore}</p>
          <p className="text-white/80 text-sm">points{myRank > 0 ? ` · ${myRank}${myRank === 1 ? 'er' : 'e'} place` : ''}</p>
        </div>
        <button
          onClick={() => { try { localStorage.removeItem(storageKey) } catch { /* ignore */ } ; window.location.href = '/' }}
          className="mt-6 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
        >
          Quitter
        </button>
      </div>
    )
  }

  // ── REVEAL ──
  if (game.status === 'reveal') {
    const got = lastResult
    return (
      <div className={`min-h-dvh flex flex-col items-center justify-center p-6 text-center text-white ${got?.correct ? 'bg-green-600' : answered !== null ? 'bg-red-600' : 'bg-slate-700'}`}>
        {answered === null ? (
          <><Clock className="w-12 h-12 mb-3" /><h1 className="text-2xl font-bold">Trop tard !</h1></>
        ) : got?.correct ? (
          <><Check className="w-16 h-16 mb-3" /><h1 className="text-3xl font-extrabold font-heading">Correct !</h1><p className="text-2xl mt-2">+{got.points}</p></>
        ) : (
          <><X className="w-16 h-16 mb-3" /><h1 className="text-3xl font-extrabold font-heading">Raté…</h1></>
        )}
        <div className="mt-6 bg-white/15 rounded-2xl px-6 py-3">
          <p className="font-bold text-lg">{myScore} pts</p>
          {myRank > 0 && <p className="text-white/80 text-sm flex items-center gap-1.5 justify-center"><Crown className="w-4 h-4" />{myRank}{myRank === 1 ? 'er' : 'e'} sur {players.length}</p>}
        </div>
      </div>
    )
  }

  // ── QUESTION (répondre) ──
  const q = questions[game.current_index]
  return (
    <div className="min-h-dvh bg-slate-900 text-white flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 text-sm">
        <span className="text-white/60">Q{game.current_index + 1}/{questions.length}</span>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold font-mono ${timeLeft <= 5 ? 'bg-red-500' : 'bg-white/10'}`}><Clock className="w-4 h-4" />{timeLeft}</span>
        <span className="font-semibold">{myScore} pts</span>
      </div>

      {answered !== null ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Check className="w-14 h-14 mb-3 text-green-400" />
          <p className="text-xl font-bold">Réponse envoyée !</p>
          <p className="text-white/60 mt-1">En attente des autres joueurs…</p>
        </div>
      ) : (
        <>
          <div className="px-6 py-4 text-center">
            <h2 className="text-lg sm:text-xl font-bold font-heading">{q?.question}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 flex-1 content-stretch">
            {q?.options.map((opt, i) => {
              const tile = TILES[i % 4]
              const TileIcon = tile.icon
              return (
                <button key={i} onClick={() => answer(i)}
                  className={`kahoot-tile kahoot-tile-${i + 1} flex flex-col items-center justify-center gap-2 rounded-2xl p-4 font-bold text-white shadow-xl active:scale-95 transition-transform min-h-[120px]`}
                  style={{ backgroundColor: tile.bg }}>
                  <TileIcon className="w-9 h-9" fill="white" />
                  <span className="text-sm leading-tight">{opt}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
