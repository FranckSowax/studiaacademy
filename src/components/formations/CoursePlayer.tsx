'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, Circle, Video, FileText, Target, Download,
  PlayCircle, Menu, X, Trophy, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleLessonComplete } from '@/lib/formations/actions'
import { QuizBlock } from './QuizBlock'
import { InteractiveLessonView } from './InteractiveLessonView'
import type { Formation, FormationLesson } from '@/types/formation'

function embedUrl(url: string): string {
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  // Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

const typeIcon = (t: string) => (t === 'video' ? Video : t === 'quiz' ? Target : FileText)

export function CoursePlayer({
  formation,
  lessons,
  enrollmentId,
  completedLessonIds,
  hasFinalQuiz = false,
}: {
  formation: Formation
  lessons: FormationLesson[]
  enrollmentId: string
  completedLessonIds: string[]
  hasFinalQuiz?: boolean
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedLessonIds))
  const [currentIdx, setCurrentIdx] = useState(() => {
    const firstIncomplete = lessons.findIndex((l) => !completedLessonIds.includes(l.id))
    return firstIncomplete === -1 ? 0 : firstIncomplete
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const current = lessons[currentIdx]
  const progress = lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0

  const toggle = async (lessonId: string) => {
    const isDone = completed.has(lessonId)
    const next = new Set(completed)
    if (isDone) next.delete(lessonId)
    else next.add(lessonId)
    setCompleted(next)
    await toggleLessonComplete(enrollmentId, lessonId, !isDone)
  }

  const markAndNext = async () => {
    if (current && !completed.has(current.id)) await toggle(current.id)
    if (currentIdx < lessons.length - 1) setCurrentIdx(currentIdx + 1)
  }

  const Sidebar = useMemo(
    () => (
      <div className="w-full sm:w-80 flex-shrink-0 bg-white border-r border-[#f0ebe3] flex flex-col h-full">
        <div className="p-5 border-b border-[#f0ebe3]">
          <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] mb-3">
            <ArrowLeft className="w-4 h-4" />
            Mes formations
          </Link>
          <h2 className="font-bold font-heading text-gray-900 leading-tight">{formation.titre}</h2>
          {/* Progression */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{completed.size}/{lessons.length} leçons</span>
              <span className="font-semibold text-[#e97e42]">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {lessons.map((l, i) => {
            const Icon = typeIcon(l.type)
            const done = completed.has(l.id)
            return (
              <button
                key={l.id}
                onClick={() => { setCurrentIdx(i); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  i === currentIdx ? 'bg-[#fff7ed]' : 'hover:bg-gray-50'
                }`}
              >
                {done ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                <Icon className={`w-4 h-4 flex-shrink-0 ${i === currentIdx ? 'text-[#e97e42]' : 'text-gray-400'}`} />
                <span className={`flex-1 text-sm ${i === currentIdx ? 'text-[#a84d16] font-medium' : 'text-gray-600'} truncate`}>{l.titre}</span>
                {l.duree_minutes > 0 && <span className="text-xs text-gray-400">{l.duree_minutes}min</span>}
              </button>
            )
          })}

          {/* Quiz final (Kahoot) */}
          {hasFinalQuiz && (
            <Link
              href={`/apprendre/${formation.slug}/quiz-final`}
              className="mt-3 flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6d28d9] text-white hover:shadow-lg transition-all"
            >
              <Trophy className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold leading-tight">Quiz final · Défi</p>
                <p className="text-[11px] text-white/70">Teste tes connaissances en mode jeu</p>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        {progress === 100 && (
          <div className="p-4 border-t border-[#f0ebe3] bg-green-50">
            <div className="flex items-center gap-2 text-green-700">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-semibold">Formation terminée ! 🎉</span>
            </div>
          </div>
        )}
      </div>
    ),
    [lessons, completed, currentIdx, progress, formation.titre, formation.slug, hasFinalQuiz]
  )

  return (
    <div className="flex h-screen bg-[#fbf8f3] overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden sm:flex">{Sidebar}</div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <>
          <div className="sm:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="sm:hidden fixed top-0 left-0 z-50 h-full">{Sidebar}</div>
        </>
      )}

      {/* Contenu */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar mobile */}
        <div className="sm:hidden sticky top-0 z-30 bg-white border-b border-[#f0ebe3] px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 truncate px-2">{current?.titre}</span>
          <span className="text-xs font-semibold text-[#e97e42]">{progress}%</span>
        </div>

        {current ? (
          <div className="max-w-3xl w-full mx-auto p-4 sm:p-8">
            {/* Lecteur selon type */}
            {current.type === 'video' && current.video_url ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg mb-6">
                <iframe
                  src={embedUrl(current.video_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={current.titre}
                />
              </div>
            ) : current.type === 'pdf' && current.document_url ? (
              <div className="rounded-2xl overflow-hidden border border-[#f0ebe3] mb-6 bg-white">
                <div className="aspect-[4/3] w-full">
                  <iframe src={current.document_url} className="w-full h-full" title={current.titre} />
                </div>
                <a href={current.document_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#e97e42] hover:bg-[#fff7ed] transition-colors">
                  <Download className="w-4 h-4" />Télécharger le document
                </a>
              </div>
            ) : current.blocks && current.blocks.length > 0 ? (
              <div className="mb-6">
                <InteractiveLessonView blocks={current.blocks} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 mb-6">
                {current.type === 'quiz' && (
                  <div className="inline-flex items-center gap-1.5 bg-[#fff7ed] text-[#a84d16] text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                    <Target className="w-3.5 h-3.5" />Quiz
                  </div>
                )}
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                  {current.contenu || 'Contenu à venir.'}
                </div>
              </div>
            )}

            {/* Titre + actions */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Leçon {currentIdx + 1} / {lessons.length}</p>
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-gray-900">{current.titre}</h1>
              </div>
              <button
                onClick={() => toggle(current.id)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  completed.has(current.id) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {completed.has(current.id) ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                {completed.has(current.id) ? 'Terminée' : 'Marquer terminée'}
              </button>
            </div>

            {/* Test d'évaluation — uniquement si les questions ne sont pas déjà
                tissées dans le cours interactif */}
            {current.quiz && current.quiz.length > 0 && !(current.blocks && current.blocks.length > 0) && (
              <div className="mb-8">
                <QuizBlock questions={current.quiz} />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 border-t border-[#f0ebe3] pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="rounded-xl border-[#e2e8f0]"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />Précédent
              </Button>
              {currentIdx < lessons.length - 1 ? (
                <Button onClick={markAndNext} className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl">
                  Leçon suivante <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => { if (current && !completed.has(current.id)) toggle(current.id) }}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                  <Trophy className="w-4 h-4 mr-1" />Terminer la formation
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <PlayCircle className="w-12 h-12 mx-auto mb-3" />
              <p>Cette formation n'a pas encore de leçons.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
