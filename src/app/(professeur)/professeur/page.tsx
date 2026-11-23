export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { FileCheck, ListChecks, Users, ArrowRight, Sparkles, Trophy, GraduationCap, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../actions'
import { ActivateTeacher } from '@/components/teacher/ActivateTeacher'
import { CarteStudiaLive } from '@/components/studia-live/CarteStudiaLive'
import { estFormateurDesigne, peutOuvrirStudiaLive } from '@/lib/studia-live/etat'

export default async function ProfesseurDashboard({
  searchParams,
}: {
  searchParams: Promise<{ outils?: string }>
}) {
  const [teacherProfile, formateur, liveDisponible] = await Promise.all([
    getTeacherProfile(),
    estFormateurDesigne(),
    peutOuvrirStudiaLive(),
  ])

  if (!teacherProfile) {
    // Formateur désigné par un administrateur : son accueil, avec Studia
    // Live. Les outils de professeur (correction, QCM, Kahoot) restent
    // facultatifs et s'activent à la demande.
    if (formateur && (await searchParams).outils !== 'activer') {
      return <AccueilFormateur liveDisponible={liveDisponible} />
    }
    // Pas encore professeur → wizard d'activation
    return <ActivateTeacher />
  }

  const supabase = await createClient()

  // Stats
  const [{ count: nbCorrections }, { count: nbQcm }, { count: nbKahoots }, { count: nbClasses }] = await Promise.all([
    supabase
      .from('correction_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherProfile.id),
    supabase
      .from('qcm_devoirs')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherProfile.id),
    supabase
      .from('teacher_kahoots')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherProfile.id),
    supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherProfile.id),
  ])

  const features = [
    {
      icon: FileCheck,
      title: 'Correction de copies',
      description: 'Photographiez les copies, l\'IA les corrige selon votre style.',
      href: '/professeur/correction',
      color: '#e97e42',
      count: nbCorrections ?? 0,
      countLabel: 'sessions',
    },
    {
      icon: ListChecks,
      title: 'Devoirs QCM',
      description: 'Générez un QCM depuis un cours, partagez un lien avec timer.',
      href: '/professeur/qcm',
      color: '#3B82F6',
      count: nbQcm ?? 0,
      countLabel: 'devoirs',
    },
    {
      icon: Trophy,
      title: 'Kahoot',
      description: 'Générez un quiz depuis un cours, lancez-le en direct par QR code.',
      href: '/professeur/kahoot',
      color: '#7C3AED',
      count: nbKahoots ?? 0,
      countLabel: 'kahoots',
    },
    {
      icon: Users,
      title: 'Mes classes',
      description: 'Gérez vos classes et suivez la progression des élèves.',
      href: '/professeur/classes',
      color: '#10B981',
      count: nbClasses ?? 0,
      countLabel: 'classes',
    },
  ]

  return (
    <div className="max-w-5xl">
      {/* En-tête */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-3 py-1 rounded-full text-sm font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {teacherProfile.matiere} · {teacherProfile.niveau_enseignement}
        </div>
        <h1 className="text-3xl font-bold font-heading text-gray-900">
          Bienvenue dans votre espace professeur
        </h1>
        <p className="text-gray-500 mt-2">
          {teacherProfile.etablissement || 'Studia Academy'} · {teacherProfile.ville}
        </p>
      </div>

      {/* Studia Live : formateurs désignés et administrateurs */}
      {(formateur || liveDisponible) && (
        <div className="mb-8">
          <CarteStudiaLive disponible={liveDisponible} />
        </div>
      )}

      {/* Cartes fonctionnalités */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f) => {
          const Icon = f.icon
          return (
            <Link
              key={f.href}
              href={f.href}
              className="group bg-white rounded-2xl border border-[#f0ebe3] p-6 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${f.color}18` }}
              >
                <Icon className="w-6 h-6" style={{ color: f.color }} />
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold font-heading" style={{ color: f.color }}>
                  {f.count}
                </span>
                <span className="text-xs text-gray-400">{f.countLabel}</span>
              </div>
              <h3 className="font-bold font-heading text-gray-900 mb-1 group-hover:text-[#e97e42] transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{f.description}</p>
              <div className="flex items-center text-sm font-semibold" style={{ color: f.color }}>
                Ouvrir
                <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Actions rapides */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/professeur/correction/nouveau"
          className="flex items-center gap-4 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-2xl p-5 text-white hover:shadow-lg transition-all"
        >
          <FileCheck className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-bold font-heading">Corriger des copies</p>
            <p className="text-sm text-white/80">Nouvelle session de correction</p>
          </div>
        </Link>
        <Link
          href="/professeur/qcm/nouveau"
          className="flex items-center gap-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white hover:shadow-lg transition-all"
        >
          <ListChecks className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-bold font-heading">Créer un QCM</p>
            <p className="text-sm text-white/80">Génération IA depuis un cours</p>
          </div>
        </Link>
        <Link
          href="/professeur/kahoot/nouveau"
          className="flex items-center gap-4 bg-gradient-to-r from-[#7C3AED] to-[#6d28d9] rounded-2xl p-5 text-white hover:shadow-lg transition-all"
        >
          <Trophy className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-bold font-heading">Créer un Kahoot</p>
            <p className="text-sm text-white/80">Quiz en direct par QR code</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

/** Accueil d'un formateur désigné qui n'a pas activé les outils de professeur. */
function AccueilFormateur({ liveDisponible }: { liveDisponible: boolean }) {
  const liens = [
    {
      icon: FileCheck,
      titre: 'Outils de professeur',
      texte: 'Correction de copies, devoirs QCM, Kahoot et classes. À activer en deux étapes.',
      href: '/professeur?outils=activer',
      action: 'Activer',
    },
    {
      icon: BookOpen,
      titre: 'Catalogue des formations',
      texte: 'Les formations en ligne proposées aux apprenants de Studia Academy.',
      href: '/formations/en-ligne',
      action: 'Voir',
    },
  ]
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-3 py-1 rounded-full text-sm font-medium mb-3">
          <GraduationCap className="w-3.5 h-3.5" />
          Formateur Studia Academy
        </div>
        <h1 className="text-3xl font-bold font-heading text-gray-900">Bienvenue dans votre espace formateur</h1>
        <p className="text-gray-500 mt-2">Vos sessions et vos cours se gèrent sur Studia Live.</p>
      </div>

      <CarteStudiaLive disponible={liveDisponible} />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {liens.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group bg-white rounded-2xl border border-[#f0ebe3] p-6 hover:shadow-lg transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-[#fbf8f3] flex items-center justify-center mb-4">
              <l.icon className="w-5 h-5 text-[#e97e42]" />
            </div>
            <h2 className="font-bold font-heading text-gray-900 mb-1 group-hover:text-[#e97e42] transition-colors">
              {l.titre}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-3">{l.texte}</p>
            <span className="inline-flex items-center text-sm font-semibold text-[#e97e42]">
              {l.action}
              <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
