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
  Video, Award, Target, MousePointerClick, Trophy, Flame, LineChart,
} from 'lucide-react'
import { codeLiveActif } from '@/lib/studia-live/lancement'
import { EnrollCTA } from '@/components/formations/EnrollCTA'
import { accesFormationAutorise } from '@/lib/formations/free-access'
import { FormationIntroVideo } from '@/components/formations/FormationIntroVideo'
import { UpgradeMetierSticker } from '@/components/formations/UpgradeMetierSticker'
import { estFormationMetier } from '@/lib/formations/secteur-link'
import { getAppConfig } from '@/lib/config/app-config'
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

  // Formation suivie sur Studia Live : son contenu n'est pas fait de
  // leçons Academy, la fiche ne doit donc ni les compter ni les lister.
  const surLive = codeLiveActif(f) !== null
  const deroulement = [
    { icon: MousePointerClick, titre: 'Des exercices pratiques', texte: 'Vous apprenez en faisant, un exercice interactif après l’autre.' },
    { icon: Trophy, titre: 'Des points et des niveaux', texte: 'Chaque exercice réussi rapporte des points et vous fait monter de niveau.' },
    { icon: Flame, titre: 'Une série de jours', texte: 'Revenez chaque jour pour garder votre série et ancrer les acquis.' },
    { icon: LineChart, titre: 'Votre avancement suivi', texte: 'Points, niveau et exercices réussis s’affichent dans votre tableau de bord Studia Academy.' },
  ]

  // Numéro Airtel Money affiché dans le parcours de paiement (NEXT_PUBLIC_AIRTEL_MONEY).
  const airtelNumber =
    getAppConfig().payment.methods.find((m) => m.id === 'airtel_money')?.merchantNumber ?? null

  const totalMin = lessons.reduce((s, l) => s + (l.duree_minutes || 0), 0)
  const lessonIcon = (t: string) =>
    t === 'video' ? Video : t === 'pdf' ? FileText : t === 'quiz' ? Target : FileText

  // Rendue à deux endroits selon la largeur d'écran (sous la carte / en fin de fiche).
  const formateur = f.formateur_nom ? (
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
  ) : null

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="relative flex-1 pt-24">
        {/* Fond dégradé du haut de page (décoratif) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-b from-[#fff7ed] to-white" />

        {/* WHY: une seule grille pour toute la fiche. La carte d'inscription, plus
            haute que le titre, occupe la colonne de droite sur deux rangées : le
            contenu (vidéo, description…) remonte ainsi juste sous le titre. */}
        <div className="relative py-10">
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
                  <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#e97e42]" />{f.duree_estimee || (surLive ? 'À votre rythme' : `${totalMin} min`)}</span>
                  <span className="inline-flex items-center gap-1.5"><BarChart className="w-4 h-4 text-[#e97e42]" />{f.niveau}</span>
                  <span className="inline-flex items-center gap-1.5"><PlayCircle className="w-4 h-4 text-[#e97e42]" />{surLive ? 'Exercices interactifs' : `${lessons.length} leçons`}</span>
                  <span className="inline-flex items-center gap-1.5"><Award className="w-4 h-4 text-[#e97e42]" />Certificat</span>
                </div>
              </div>

              {/* Carte CTA */}
              <div className="lg:row-span-2">
                <div className="lg:sticky lg:top-24">
                <div className="bg-white rounded-3xl border border-[#f0ebe3] shadow-lg overflow-hidden">
                  <div className="relative h-44 w-full bg-[#fbf8f3]">
                    {f.cover_image ? (
                      <Image src={f.cover_image} alt={f.titre} fill sizes="400px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e97e42]/20 to-[#fff7ed] flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-[#e97e42]" />
                      </div>
                    )}
                    {estFormationMetier(f) && <UpgradeMetierSticker className="absolute left-3 top-3" />}
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
                      isFree={(f.prix_fcfa ?? 0) === 0}
                      accessClosed={!accesFormationAutorise(f, user?.email)}
                      prixFcfa={f.prix_fcfa ?? 0}
                      paymentMethod={enrollment?.payment_method ?? null}
                      adminNote={enrollment?.admin_note ?? null}
                      airtelNumber={airtelNumber}
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
                {/* Formateur : sous la carte sur grand écran */}
                {formateur && <div className="mt-6 hidden lg:block">{formateur}</div>}
                </div>
              </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Vidéo de présentation (si renseignée dans l'admin) */}
            <FormationIntroVideo url={f.intro_video_url} titre={f.titre} />

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

            {/* Déroulement (formation suivie sur Studia Live) */}
            {surLive && (
              <div>
                <h2 className="text-xl font-bold font-heading text-gray-900 mb-4">Comment se déroule la formation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {deroulement.map((d) => (
                    <div key={d.titre} className="flex items-start gap-3 rounded-2xl border border-[#f0ebe3] bg-white p-4">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff7ed]">
                        <d.icon className="w-4 h-4 text-[#e97e42]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{d.titre}</p>
                        <p className="mt-0.5 text-sm text-gray-600">{d.texte}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            {!surLive && (
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
            )}

            {/* Formateur : en fin de fiche sur mobile */}
            {formateur && <div className="lg:hidden">{formateur}</div>}
          </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
