export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Trophy, Plus, HelpCircle, Radio } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../../actions'
import type { TeacherKahoot } from '@/types/teacher'

export default async function KahootListPage() {
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')

  const supabase = await createClient()
  const { data } = await supabase
    .from('teacher_kahoots')
    .select('*')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })

  const kahoots = (data ?? []) as TeacherKahoot[]

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900">Kahoot</h1>
          <p className="text-gray-500 mt-1">Quiz en direct, projetés par QR code ou partagés par lien</p>
        </div>
        <Link
          href="/professeur/kahoot/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6d28d9] text-white text-sm font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouveau Kahoot
        </Link>
      </div>

      {kahoots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3] text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">Aucun Kahoot</h3>
          <p className="text-gray-500 max-w-sm mb-6">
            Générez un quiz à partir d&apos;un cours (texte, lien, PDF, DOC), puis lancez-le en direct en classe via un QR code.
          </p>
          <Link
            href="/professeur/kahoot/nouveau"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6d28d9] text-white font-medium"
          >
            <Plus className="w-4 h-4" />
            Créer un Kahoot
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {kahoots.map((k) => (
            <Link
              key={k.id}
              href={`/professeur/kahoot/${k.id}`}
              className="flex items-center justify-between bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-md hover:border-violet-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-[#7C3AED]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{k.titre}</h3>
                  <p className="text-sm text-gray-500 inline-flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {k.questions?.length ?? 0} questions
                    {k.matiere && ` · ${k.matiere}`}
                    {k.niveau && ` · ${k.niveau}`}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#7C3AED] bg-violet-50">
                <Radio className="w-3 h-3" />
                Prêt à lancer
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
