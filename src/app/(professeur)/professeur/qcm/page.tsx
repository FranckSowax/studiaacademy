export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ListChecks, Plus, Clock, CheckCircle, Loader2, Lock, Unlock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../../actions'
import { redirect } from 'next/navigation'

export default async function QcmListPage() {
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')

  const supabase = await createClient()
  const { data: devoirs } = await supabase
    .from('qcm_devoirs')
    .select('*')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900">Devoirs QCM</h1>
          <p className="text-gray-500 mt-1">Générés par IA, partagés par lien avec timer</p>
        </div>
        <Link
          href="/professeur/qcm/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouveau QCM
        </Link>
      </div>

      {!devoirs || devoirs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3] text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <ListChecks className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">Aucun devoir QCM</h3>
          <p className="text-gray-500 max-w-sm mb-6">
            Générez un QCM à partir d'un cours, partagez le lien à vos élèves avec un compte à rebours.
          </p>
          <Link
            href="/professeur/qcm/nouveau"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium"
          >
            <Plus className="w-4 h-4" />
            Créer un QCM
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {devoirs.map((d) => {
            const statusConfig = {
              draft: { icon: Clock, label: 'Brouillon', color: 'text-gray-500 bg-gray-100' },
              active: { icon: CheckCircle, label: 'Actif', color: 'text-green-600 bg-green-50' },
              closed: { icon: CheckCircle, label: 'Fermé', color: 'text-gray-500 bg-gray-100' },
            }[d.status as string] ?? { icon: Clock, label: d.status, color: 'text-gray-500 bg-gray-100' }
            const StatusIcon = d.generation_status === 'processing' ? Loader2 : statusConfig.icon

            return (
              <Link
                key={d.id}
                href={`/professeur/qcm/${d.id}`}
                className="flex items-center justify-between bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ListChecks className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{d.titre}</h3>
                    <p className="text-sm text-gray-500">
                      {d.matiere} · {d.niveau} · {d.nb_questions_qcm + d.nb_questions_ouvertes} questions · {d.duree_minutes} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.status === 'active' && (
                    d.is_locked ? (
                      <Lock className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-500" />
                    )
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      d.generation_status === 'processing'
                        ? 'text-blue-600 bg-blue-50'
                        : statusConfig.color
                    }`}
                  >
                    <StatusIcon className={`w-3 h-3 ${d.generation_status === 'processing' ? 'animate-spin' : ''}`} />
                    {d.generation_status === 'processing' ? 'Génération…' : statusConfig.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
