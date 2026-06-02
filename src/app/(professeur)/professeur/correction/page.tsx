export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { FileCheck, Plus, Settings, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../../actions'
import { redirect } from 'next/navigation'

export default async function CorrectionListPage() {
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')

  const supabase = await createClient()
  const { data: sessions } = await supabase
    .from('correction_sessions')
    .select('*')
    .eq('teacher_id', teacher.id)
    .eq('is_bootstrap', false)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900">Correction de copies</h1>
          <p className="text-gray-500 mt-1">L'IA corrige selon votre style de notation</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/professeur/correction/profil"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#f0ebe3] text-gray-600 hover:border-[#e97e42] hover:text-[#e97e42] transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Profil de correction
          </Link>
          <Link
            href="/professeur/correction/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white text-sm font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle session
          </Link>
        </div>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3] text-center">
          <div className="w-16 h-16 bg-[#fff7ed] rounded-2xl flex items-center justify-center mb-4">
            <FileCheck className="w-8 h-8 text-[#e97e42]" />
          </div>
          <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">
            Aucune session de correction
          </h3>
          <p className="text-gray-500 max-w-sm mb-6">
            Photographiez les copies de vos élèves et laissez l'IA les corriger selon votre méthode.
          </p>
          <Link
            href="/professeur/correction/nouveau"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white font-medium"
          >
            <Plus className="w-4 h-4" />
            Démarrer une correction
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const statusConfig = {
              draft: { icon: Clock, label: 'Brouillon', color: 'text-gray-500 bg-gray-100' },
              processing: { icon: Loader2, label: 'En cours', color: 'text-blue-600 bg-blue-50' },
              done: { icon: CheckCircle, label: 'Terminé', color: 'text-green-600 bg-green-50' },
              active: { icon: Loader2, label: 'En cours', color: 'text-blue-600 bg-blue-50' },
              closed: { icon: CheckCircle, label: 'Terminé', color: 'text-green-600 bg-green-50' },
            }[s.status as string] ?? { icon: Clock, label: s.status, color: 'text-gray-500 bg-gray-100' }
            const StatusIcon = statusConfig.icon

            return (
              <Link
                key={s.id}
                href={`/professeur/correction/${s.id}`}
                className="flex items-center justify-between bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-md hover:border-[#e97e42]/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#fff7ed] rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5 text-[#e97e42]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.titre}</h3>
                    <p className="text-sm text-gray-500">
                      {s.matiere} · {s.niveau} · {s.nb_copies} copie{s.nb_copies > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
