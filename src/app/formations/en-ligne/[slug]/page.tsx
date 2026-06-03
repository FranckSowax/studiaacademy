export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import {
  ArrowLeft, CheckCircle, Clock, BarChart, PlayCircle, Lock, FileText,
  Video, Award, Target,
} from 'lucide-react'
import { EnrollCTA } from '@/components/formations/EnrollCTA'
import type { Formation, FormationLesson, FormationEnrollment } from '@/types/formation'

export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: formation } = await supabase
    .from('formations')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!formation) notFound()
  const f = formation as Formation

  const { data: lessonsData } = await supabase
    .from('formation_lessons')
    .select('id, formation_id, ordre, titre, type, duree_minutes, is_preview, video_url, contenu, document_url, created_at')
    .eq('formation_id', f.id)
    .order('ordre', { ascending: true })
  const lessons = (lessonsData ?? []) as FormationLesson[]

  const {
    data: { user },
  } = await supabase.auth.getUser()
  let enrollment: FormationEnrollment | null = null
  if (user) {
    const { data } = await supabase
      .from('formation_enrollments')
      .select('*')
      .eq('formation_id', f.id)
      .eq('user_id', user.id)
      .maybeSingle()
    enrollment = data as FormationEnrollment | null
  }

  const totalMin = lessons.reduce((s, l) => s + (l.duree_minutes || 0), 0)
  const lessonIcon = (t: string) =>
    t === 'video' ? Video : t === 'pdf' ? FileText : t === 'quiz' ? Target : FileText

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-b from-[#fff7ed] to-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/formations/en-ligne" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] mb-6">
              <ArrowLeft className="w-4 h-4" />
              Formations en ligne
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {f.categorie && (
                  <span className="inline-block bg-[#fff7ed] text-[#a84d16] text-sm font-medium px-3 py-1 rounded-full mb-3">
                    {f.categorie}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900 mb-3">{f.titre}</h1>
                {f.sous_titre && <p className="text-lg text-gray-600 mb-4">{f.sous_titre}</p>}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#e97e42]" />{f.duree_estimee || `${totalMin} min`}</span>
                  <span className="inline-flex items-center gap-1.5"><BarChart className="w-4 h-4 text-[#e97e42]" />{f.niveau}</span>
                  <span className="inline-flex items-center gap-1.5"><PlayCircle className="w-4 h-4 text-[#e97e42]" />{lessons.length} leçons</span>
                  <span className="inline-flex items-center gap-1.5"><Award className="w-4 h-4 text-[#e97e42]" />Certificat</span>
                </div>
              </div>

              {/* Carte CTA */}
              <div className="lg:row-span-2">
                <div className="bg-white rounded-3xl border border-[#f0ebe3] shadow-lg overflow-hidden sticky top-24">
                  <div className="relative h-44 w-full bg-[#fbf8f3]">
                    {f.cover_image ? (
                      <Image src={f.cover_image} alt={f.titre} fill sizes="400px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e97e42]/20 to-[#fff7ed] flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-[#e97e42]" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="text-3xl font-extrabold font-heading text-gray-900 mb-4">
                      {f.prix_fcfa > 0 ? <>{formatNumber(f.prix_fcfa)} <span className="text-base font-medium text-gray-400">FCFA</span></> : 'Gratuit'}
                    </div>
                    <EnrollCTA
                      formationId={f.id}
                      formationSlug={f.slug}
                      isLoggedIn={!!user}
                      enrollmentStatus={enrollment?.status ?? null}
                    />
                    <ul className="mt-5 space-y-2">
                      {['Accès à vie au contenu', 'Supports téléchargeables', 'Certificat de réussite', 'Support par l\'équipe'].map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {f.description && (
              <div>
                <h2 className="text-xl font-bold font-heading text-gray-900 mb-3">À propos de cette formation</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{f.description}</p>
              </div>
            )}

            {/* Objectifs */}
            {f.objectifs.length > 0 && (
              <div className="bg-[#fbf8f3] rounded-2xl p-6 border border-[#f0ebe3]">
                <h2 className="text-xl font-bold font-heading text-gray-900 mb-4">Ce que vous allez apprendre</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {f.objectifs.map((o, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-[#e97e42] flex-shrink-0 mt-0.5" />{o}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            <div>
              <h2 className="text-xl font-bold font-heading text-gray-900 mb-4">Programme · {lessons.length} leçons</h2>
              <div className="border border-[#f0ebe3] rounded-2xl overflow-hidden divide-y divide-[#f0ebe3]">
                {lessons.map((l, i) => {
                  const Icon = lessonIcon(l.type)
                  const unlocked = l.is_preview || enrollment?.status === 'active'
                  return (
                    <div key={l.id} className="flex items-center gap-3 p-4 bg-white">
                      <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-700">{l.titre}</span>
                      {l.duree_minutes > 0 && <span className="text-xs text-gray-400">{l.duree_minutes} min</span>}
                      {l.is_preview && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Aperçu</span>
                      )}
                      {!unlocked && <Lock className="w-3.5 h-3.5 text-gray-300" />}
                    </div>
                  )
                })}
                {lessons.length === 0 && (
                  <p className="p-6 text-center text-gray-400 text-sm">Programme en cours de préparation.</p>
                )}
              </div>
            </div>
          </div>

          {/* Formateur */}
          <div>
            {f.formateur_nom && (
              <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6">
                <h2 className="text-lg font-bold font-heading text-gray-900 mb-4">Votre formateur</h2>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e97e42] to-[#d56a2e] flex items-center justify-center text-white text-lg font-bold">
                    {f.formateur_nom[0]}
                  </div>
                  <p className="font-semibold text-gray-800">{f.formateur_nom}</p>
                </div>
                {f.formateur_bio && <p className="text-sm text-gray-500 leading-relaxed">{f.formateur_bio}</p>}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
