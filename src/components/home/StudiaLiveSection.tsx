import {
  ArrowRight, Award, Bot, CalendarDays, Flame, Hand, Laptop, MessageSquareText, NotebookPen, PlayCircle, Smartphone,
  Sparkles, Timer, Trophy, Users, Wand2, Zap,
} from 'lucide-react'
import { StudiaLiveVideo } from '@/components/home/StudiaLiveVideo'

/**
 * Section « Studia Live » de la page d'accueil : la pédagogie interactive de
 * Studia Academy, en salle et en ligne, et ce qu'elle apporte à l'apprenant.
 *
 * Les fonctions citées sont celles de la plateforme Studia Live (dépôt
 * studialive) ; les deux maquettes sont illustratives et décoratives.
 */

const EN_SALLE = [
  {
    icon: Smartphone,
    titre: 'Chacun participe depuis son téléphone',
    texte: 'QCM chronométrés, sondages, nuages de mots : les réponses de la salle s’affichent en direct sur l’écran.',
  },
  {
    icon: Wand2,
    titre: 'Des ateliers IA en conditions réelles',
    texte: 'Rédiger un prompt, comparer plusieurs modèles d’IA, générer des images : on pratique sur de vrais outils.',
  },
  {
    icon: Sparkles,
    titre: 'Une correction personnalisée par l’IA',
    texte: 'Sur les questions ouvertes, chaque participant reçoit une note et un conseil sur son propre téléphone.',
  },
  {
    icon: Trophy,
    titre: 'Classement et bilan de fin de séance',
    texte: 'Points, rapidité et meilleure série : chacun voit sa progression et sa place dans la course.',
  },
]

const EN_LIGNE = [
  {
    icon: PlayCircle,
    titre: 'Des leçons animées, puis on pratique',
    texte: 'Chaque notion est révélée point par point, puis s’applique dans des exercices notés : score, temps, progression.',
  },
  {
    icon: Bot,
    titre: 'Un assistant IA dédié au cours',
    texte: 'Une notion n’est pas claire ? L’assistant du cours l’explique autrement, à tout moment.',
  },
  {
    icon: NotebookPen,
    titre: 'Vos notes, votre fiche, vos erreurs',
    texte: 'Prise de notes à côté de chaque leçon, fiche de révision et carnet des erreurs à retravailler.',
  },
  {
    icon: Laptop,
    titre: 'Reprise là où vous vous êtes arrêté',
    texte: 'Sur téléphone comme sur ordinateur, votre parcours et votre progression vous attendent.',
  },
]

const ARGUMENTS = [
  {
    icon: Hand,
    titre: 'On apprend en faisant',
    texte: 'Chaque notion se pratique aussitôt : exercice, atelier ou mise en situation plutôt qu’un long exposé.',
  },
  {
    icon: Zap,
    titre: 'Un retour immédiat',
    texte: 'Score, correction et conseil arrivent dès la réponse : on sait où l’on en est, sans attendre la fin.',
  },
  {
    icon: Users,
    titre: 'Une motivation qui tient',
    texte: 'Points, séries et classement donnent envie de revenir et d’aller jusqu’au bout du parcours.',
  },
  {
    icon: Award,
    titre: 'Un certificat à la clé',
    texte: 'Chaque parcours terminé se conclut par un certificat Studia Academy, à présenter à votre employeur.',
  },
]

function Fonction({ icon: Icon, titre, texte }: { icon: typeof Zap; titre: string; texte: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff1e4]">
        <Icon className="h-[18px] w-[18px] text-[#e97e42]" />
      </span>
      <div>
        <p className="font-heading font-bold text-gray-900">{titre}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{texte}</p>
      </div>
    </li>
  )
}

/** Maquette décorative : l'écran projeté en salle et un téléphone de participant. */
function MaquetteSalle() {
  const barres = [
    { lettre: 'A', label: 'Rôle · Contexte · Tâche · Format', part: 68, juste: true },
    { lettre: 'B', label: 'Une question la plus courte possible', part: 14 },
    { lettre: 'C', label: 'Tout écrire en majuscules', part: 6 },
    { lettre: 'D', label: 'Répéter la demande trois fois', part: 12 },
  ]
  return (
    <div aria-hidden="true" className="relative pb-10 pr-6 sm:pr-10">
      {/* Écran projeté */}
      <div className="rounded-2xl bg-[#0f0d0b] p-5 shadow-[0_30px_60px_-30px_rgba(15,13,11,0.7)] ring-1 ring-white/10">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="font-semibold uppercase tracking-wider">Question 4 / 10</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white">
            <Timer className="h-3.5 w-3.5 text-[#f3a268]" />
            12 s
          </span>
        </div>
        <p className="mt-3 font-heading text-base font-bold leading-snug text-white sm:text-lg">
          Quelle méthode structure un bon prompt&nbsp;?
        </p>
        <div className="mt-4 space-y-2">
          {barres.map((b) => (
            <div key={b.lettre} className="relative overflow-hidden rounded-lg bg-white/[0.06]">
              <div
                className={`absolute inset-y-0 left-0 ${b.juste ? 'bg-[#e97e42]' : 'bg-white/15'}`}
                style={{ width: `${b.part}%` }}
              />
              <div className="relative flex items-center justify-between gap-3 px-3 py-2 text-xs sm:text-sm">
                <span className="flex min-w-0 items-center gap-2 text-white">
                  <span className="font-bold">{b.lettre}</span>
                  <span className="truncate">{b.label}</span>
                </span>
                <span className="flex-shrink-0 whitespace-nowrap font-semibold tabular-nums text-white/80">{b.part}&nbsp;%</span>
              </div>
            </div>
          ))}
        </div>
        {/* Course des participants */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">La course</p>
          {[
            { initiale: 'A', avance: 86 },
            { initiale: 'J', avance: 71 },
            { initiale: 'C', avance: 58 },
          ].map((p) => (
            <div key={p.initiale} className="relative mb-1.5 h-5 rounded-full bg-white/[0.06]">
              <span
                className="absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#f3a268] text-[10px] font-bold text-[#0f0d0b]"
                style={{ left: `${p.avance}%` }}
              >
                {p.initiale}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Téléphone d'un participant */}
      <div className="absolute bottom-0 right-0 w-[132px] rounded-[1.6rem] bg-[#1b1714] p-2 shadow-2xl ring-1 ring-black/20 sm:w-[150px]">
        <div className="rounded-[1.2rem] bg-[#fbf8f3] p-2.5">
          <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-gray-500">Votre réponse</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {['A', 'B', 'C', 'D'].map((l, i) => (
              <span
                key={l}
                className={`flex h-10 items-center justify-center rounded-lg text-sm font-bold ${
                  i === 0 ? 'bg-[#e97e42] text-white ring-2 ring-[#e97e42]/40 ring-offset-1' : 'bg-white text-gray-700 ring-1 ring-[#ece4d8]'
                }`}
              >
                {l}
              </span>
            ))}
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-[9px] font-semibold text-green-700">
            + 840 points · série <Flame className="h-2.5 w-2.5 text-[#e97e42]" /> 3
          </p>
        </div>
      </div>
    </div>
  )
}

/** Maquette décorative : l'espace d'étude en ligne (chapitres, leçon, notes et assistant). */
function MaquetteEnLigne() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-30px_rgba(15,13,11,0.45)] ring-1 ring-[#ece4d8]">
      <div className="flex items-center gap-1.5 border-b border-[#f3ede3] bg-[#fbf8f3] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#f3a268]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ece4d8]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ece4d8]" />
        <span className="ml-3 truncate text-xs font-semibold text-gray-500">Espace d’étude · L’IA au travail</span>
      </div>
      <div className="grid grid-cols-[0.9fr_1.5fr] text-xs sm:grid-cols-[0.9fr_1.5fr_1.1fr]">
        {/* Chapitres */}
        <div className="space-y-2.5 border-r border-[#f3ede3] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Chapitres</p>
          {[
            { t: 'Comprendre l’IA', p: 100 },
            { t: 'Rédiger un prompt', p: 60 },
            { t: 'Cas pratiques', p: 0 },
          ].map((c) => (
            <div key={c.t}>
              <p className={`truncate font-medium ${c.p === 60 ? 'text-[#a84d16]' : 'text-gray-700'}`}>{c.t}</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-[#e97e42]" style={{ width: `${c.p}%` }} />
              </div>
            </div>
          ))}
        </div>
        {/* Leçon animée */}
        <div className="space-y-2 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Leçon animée · 2 / 5</p>
          <p className="font-heading text-sm font-bold text-gray-900">Les quatre briques d’un prompt</p>
          {['Le rôle', 'Le contexte', 'La tâche', 'Le format'].map((b, i) => (
            <p
              key={b}
              className={`rounded-md px-2 py-1 ${
                i < 2 ? 'bg-[#fff1e4] font-medium text-[#a84d16]' : 'bg-gray-50 text-gray-300'
              }`}
            >
              {i + 1}. {b}
            </p>
          ))}
          <p className="rounded-md border border-dashed border-[#f3a268] px-2 py-1 text-[11px] text-gray-600">
            <span className="font-semibold text-gray-900">À retenir :</span> plus le contexte est précis, meilleure est la réponse.
          </p>
        </div>
        {/* Notes et assistant */}
        <div className="hidden space-y-2 border-l border-[#f3ede3] bg-[#fbf8f3] p-3 sm:block">
          <div className="flex gap-1 text-[10px] font-semibold">
            <span className="rounded-full bg-white px-2 py-0.5 text-gray-500 ring-1 ring-[#ece4d8]">Notes</span>
            <span className="rounded-full bg-[#0f0d0b] px-2 py-0.5 text-white">Assistant</span>
          </div>
          <p className="ml-4 rounded-xl rounded-tr-sm bg-[#e97e42] px-2.5 py-1.5 text-white">
            C’est quoi, le « contexte » ?
          </p>
          <p className="mr-2 rounded-xl rounded-tl-sm bg-white px-2.5 py-1.5 text-gray-700 ring-1 ring-[#ece4d8]">
            Tout ce que l’IA doit savoir de votre situation : pour qui, pourquoi, avec quelles contraintes.
          </p>
          <p className="flex items-center gap-1 text-[10px] text-gray-400">
            <MessageSquareText className="h-3 w-3" />
            Assistant du cours
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Section de présentation de Studia Live, sous le hero de la page d'accueil.
 *
 * @example
 * <StudiaLiveSection />
 */
export function StudiaLiveSection() {
  return (
    <section id="studia-live" aria-labelledby="studia-live-titre" className="w-full scroll-mt-20 bg-white py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* En-tête : texte et vidéo de présentation */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#f3d6c2] bg-[#fff7ed] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#a84d16]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Studia Live
          </p>
          <h2 id="studia-live-titre" className="mt-4 font-heading text-3xl font-extrabold leading-tight text-gray-900 md:text-[2.8rem]">
            Ici, on n&apos;écoute pas un cours.{' '}
            <span className="text-[#e97e42]">On le vit.</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Studia Live est la plateforme d&apos;apprentissage interactive de Studia Academy. En salle, chaque participant
            répond, crée et progresse depuis son téléphone. En ligne, chaque apprenant avance avec ses leçons animées,
            ses notes et un assistant IA dédié au cours.
          </p>
          <ul className="mt-8 grid gap-3 text-left sm:grid-cols-2">
            {['Formations en salle à Libreville', 'Formations en ligne, à votre rythme', 'Correction et conseils par l’IA', 'Certificat en fin de parcours'].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#e97e42] text-white">
                  <Zap className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <StudiaLiveVideo />
        </div>

        {/* Deux façons d'apprendre */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-3xl border border-[#ece4d8] bg-[#fbf8f3] p-6 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84d16]">En salle · présentiel</p>
            <h3 className="mt-1 font-heading text-2xl font-extrabold text-gray-900">Une formation qui se joue ensemble</h3>
            <div className="mt-6">
              <MaquetteSalle />
            </div>
            <ul className="mt-8 space-y-5">
              {EN_SALLE.map((f) => (
                <Fonction key={f.titre} {...f} />
              ))}
            </ul>
            <a
              href="#evenements"
              className="group mt-8 inline-flex items-center gap-2 self-start rounded-full border border-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
            >
              <CalendarDays className="h-4 w-4" />
              Voir les prochaines sessions
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </article>

          <article className="flex flex-col rounded-3xl border border-[#ece4d8] bg-[#fbf8f3] p-6 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84d16]">En ligne · à votre rythme</p>
            <h3 className="mt-1 font-heading text-2xl font-extrabold text-gray-900">Un coach dans votre poche</h3>
            <div className="mt-6">
              <MaquetteEnLigne />
            </div>
            <ul className="mt-8 space-y-5">
              {EN_LIGNE.map((f) => (
                <Fonction key={f.titre} {...f} />
              ))}
            </ul>
            <a
              href="#formations"
              className="group mt-8 inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] px-5 py-2.5 text-sm font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-[#e97e42]/30"
            >
              <PlayCircle className="h-4 w-4" />
              Explorer les formations en ligne
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </article>
        </div>

        {/* Pourquoi c'est plus immersif */}
        <div className="mt-16">
          <h3 className="text-center font-heading text-2xl font-extrabold text-gray-900 md:text-3xl">
            Pourquoi on apprend mieux avec Studia Academy
          </h3>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-[#ece4d8] bg-[#ece4d8] sm:grid-cols-2 lg:grid-cols-4">
            {ARGUMENTS.map((a, i) => (
              <li key={a.titre} className="bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900">
                    <a.icon className="h-5 w-5 text-[#f3a268]" />
                  </span>
                  <span aria-hidden="true" className="font-heading text-3xl font-extrabold text-[#f0e6d8]">
                    0{i + 1}
                  </span>
                </div>
                <p className="mt-5 font-heading font-bold text-gray-900">{a.titre}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{a.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
