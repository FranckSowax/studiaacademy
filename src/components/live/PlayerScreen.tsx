'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Triangle, Diamond, Circle, Square, Loader2, Check, X, Clock, Trophy, Crown, Zap,
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
  const [game, setGame] = useState(initialGame)
  const [players, setPlayers] = useState<LivePlayer[]>([])
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [pseudo, setPseudo] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const [answered, setAnswered] = useState<number | null>(null)
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const lastIndexRef = useRef(-1)

  const questions = game.questions ?? []
  const me = players.find((p) => p.id === playerId)
  const ranked = [...players].sort((a, b) => b.score - a.score)
  const myRank = me ? ranked.findIndex((p) => p.id === playerId) + 1 : 0

  // Realtime jeu + scores
  useEffect(() => {
    if (!playerId) return
    const ch = supabase
      .channel(`player-${game.id}-${playerId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_games', filter: `id=eq.${game.id}` }, (p) => {
        setGame((g) => ({ ...g, ...(p.new as LiveGame) }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_players', filter: `game_id=eq.${game.id}` }, async () => {
        const { data } = await supabase.from('live_players').select('*').eq('game_id', game.id).order('score', { ascending: false })
        if (data) setPlayers(data as LivePlayer[])
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [game.id, playerId, supabase])

  // Charge les joueurs après join
  useEffect(() => {
    if (!playerId) return
    supabase.from('live_players').select('*').eq('game_id', game.id).then(({ data }) => {
      if (data) setPlayers(data as LivePlayer[])
    })
  }, [playerId, game.id, supabase])

  // Reset à chaque nouvelle question
  useEffect(() => {
    if (game.status === 'question' && game.current_index !== lastIndexRef.current) {
      lastIndexRef.current = game.current_index
      setAnswered(null)
      setLastResult(null)
    }
  }, [game.status, game.current_index])

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
    setPlayerId(r.playerId)
  }, [pseudo, game.code])

  const answer = useCallback(async (choice: number) => {
    if (answered !== null || !playerId) return
    setAnswered(choice)
    const r = await submitLiveAnswer({ gameId: game.id, playerId, questionIndex: game.current_index, choice })
    if (r.success) setLastResult({ correct: !!r.correct, points: r.points ?? 0 })
  }, [answered, playerId, game.id, game.current_index])

  // ── ÉCRAN JOIN ──
  if (!playerId) {
    const closed = game.status === 'ended'
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7C3AED] to-[#4c1d95] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <Zap className="w-10 h-10 mx-auto mb-2" />
            <h1 className="text-2xl font-extrabold font-heading">{game.titre}</h1>
            <p className="text-white/70 text-sm mt-1">Partie {game.code}</p>
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

  // ── LOBBY (attente) ──
  if (game.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7C3AED] to-[#4c1d95] text-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <h1 className="text-2xl font-bold font-heading">Tu es dans la partie, {me?.pseudo} !</h1>
        <p className="text-white/70 mt-2">En attente du lancement par l&apos;hôte…</p>
        <div className="mt-6 bg-white/10 rounded-full px-4 py-2 text-sm">{players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''}</div>
      </div>
    )
  }

  // ── ENDED ──
  if (game.status === 'ended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e97e42] to-[#c45a20] text-white flex flex-col items-center justify-center p-6 text-center">
        <Trophy className="w-14 h-14 mb-4" />
        <h1 className="text-3xl font-extrabold font-heading">{myRank === 1 ? '🏆 Tu as gagné !' : 'Partie terminée'}</h1>
        <p className="text-xl mt-3">{me?.pseudo}</p>
        <div className="mt-4 bg-white/15 rounded-2xl px-8 py-5">
          <p className="text-4xl font-extrabold">{me?.score ?? 0}</p>
          <p className="text-white/80 text-sm">points · {myRank}{myRank === 1 ? 'er' : 'e'} place</p>
        </div>
      </div>
    )
  }

  // ── REVEAL ──
  if (game.status === 'reveal') {
    const got = lastResult
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center text-white ${got?.correct ? 'bg-green-600' : answered !== null ? 'bg-red-600' : 'bg-slate-700'}`}>
        {answered === null ? (
          <><Clock className="w-12 h-12 mb-3" /><h1 className="text-2xl font-bold">Trop tard !</h1></>
        ) : got?.correct ? (
          <><Check className="w-16 h-16 mb-3" /><h1 className="text-3xl font-extrabold font-heading">Correct !</h1><p className="text-2xl mt-2">+{got.points}</p></>
        ) : (
          <><X className="w-16 h-16 mb-3" /><h1 className="text-3xl font-extrabold font-heading">Raté…</h1></>
        )}
        <div className="mt-6 bg-white/15 rounded-2xl px-6 py-3">
          <p className="font-bold text-lg">{me?.score ?? 0} pts</p>
          <p className="text-white/80 text-sm flex items-center gap-1.5 justify-center"><Crown className="w-4 h-4" />{myRank}{myRank === 1 ? 'er' : 'e'} sur {players.length}</p>
        </div>
      </div>
    )
  }

  // ── QUESTION (répondre) ──
  const q = questions[game.current_index]
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 text-sm">
        <span className="text-white/60">Q{game.current_index + 1}/{questions.length}</span>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold font-mono ${timeLeft <= 5 ? 'bg-red-500' : 'bg-white/10'}`}><Clock className="w-4 h-4" />{timeLeft}</span>
        <span className="font-semibold">{me?.score ?? 0} pts</span>
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
                <button
                  key={i}
                  onClick={() => answer(i)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 font-bold text-white shadow-lg active:scale-95 transition-transform min-h-[110px]"
                  style={{ backgroundColor: tile.bg }}
                >
                  <TileIcon className="w-8 h-8" fill="white" />
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
