export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertTriangle, ArrowLeft, Award, BookOpen, Building2, CalendarCheck, CheckCircle2, Flame, GraduationCap, KeyRound,
  Mail, MapPin, Phone, Radio, Sparkles, Target, Trophy, UserPlus, Wallet, Wand2,
} from 'lucide-react'
import { requireAdmin } from '@/lib/auth/require-admin'
import { chargerProfilUtilisateur } from '@/lib/admin/users-data'
import { lireEntreprisesDuCompte } from '@/lib/entreprise/dossier'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ACTIVITE_LABEL,
  ACTIVITE_STYLE,
  PROVENANCE_LABEL,
  ROLE_LABEL,
  STATUT_LABEL,
  TYPE_COMPTE_LABEL,
  type StatutInscription,
  type TypeEvenement,
} from '@/lib/admin/user-activity'

const FUSEAU = 'Africa/Libreville'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const jour = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { timeZone: FUSEAU, day: 'numeric', month: 'long', year: 'numeric' }) : '—'
const jourHeure = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { timeZone: FUSEAU, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const STATUT_STYLE: Record<StatutInscription, string> = {
  pending: 'bg-amber-50 text-amber-700',
  active: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
}

const ICONE_EVENEMENT: Record<TypeEvenement, typeof BookOpen> = {
  compte: UserPlus,
  demande: GraduationCap,
  acces: KeyRound,
  lecon: BookOpen,
  quiz: Target,
  termine: Award,
  outil: Wand2,
  reservation: CalendarCheck,
  session_live: Radio,
  progression_live: Sparkles,
}

const INTENSITE = ['bg-gray-100', 'bg-[#fbd9c2]', 'bg-[#f3a268]', 'bg-[#e97e42]', 'bg-[#a84d16]']
const intensite = (n: number) => INTENSITE[n === 0 ? 0 : n <= 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4]

function Carte({ titre, children, className = '' }: { titre: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-white p-5 ${className}`}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{titre}</h3>
      {children}
    </section>
  )
}

function Info({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
      <div className="min-w-0">
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="break-words text-sm text-gray-900">{children}</dd>
      </div>
    </div>
  )
}

export default async function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!UUID.test(id)) notFound()

  const [profil, entreprises] = await Promise.all([
    chargerProfilUtilisateur(id),
    lireEntreprisesDuCompte(createAdminClient(), id),
  ])
  if (!profil) notFound()
  const { resume: u, infos, suivis, sessionsLive, bilan, evenements, calendrier, indisponibles } = profil

  const chiffres = [
    { icon: GraduationCap, label: 'Formations suivies', valeur: u.formations },
    { icon: Award, label: 'Formations terminées', valeur: u.formationsTerminees },
    { icon: BookOpen, label: 'Leçons terminées', valeur: u.leconsTerminees },
    { icon: Trophy, label: 'Points Studia Live', valeur: u.pointsLive },
    { icon: Wand2, label: 'Outils IA utilisés', valeur: u.outilsUtilises },
    { icon: CalendarCheck, label: 'Jours actifs (30 j)', valeur: bilan.joursActifs30 },
    { icon: Flame, label: 'Série en cours (jours)', valeur: bilan.serie },
    { icon: Target, label: 'Meilleur quiz final', valeur: bilan.meilleurQuiz ?? '—' },
  ]

  return (
    <div className="max-w-6xl space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#a84d16]">
        <ArrowLeft className="h-4 w-4" />
        Utilisateurs
      </Link>

      {/* En-tête */}
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e97e42]/25 to-[#7C3AED]/20 text-2xl font-bold text-[#a84d16]">
          {(u.nom || u.email || '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold tracking-tight">{u.nom || 'Sans nom'}</h2>
          <p className="truncate text-sm text-gray-500">{u.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-medium">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
              {TYPE_COMPTE_LABEL[u.typeCompte] ?? u.typeCompte}
            </span>
            {u.role !== 'user' && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600">{ROLE_LABEL[u.role] ?? u.role}</span>
            )}
            <span className="rounded-full bg-[#fff7ed] px-2 py-0.5 text-[#a84d16]">
              Provenance : {PROVENANCE_LABEL[u.provenance]}
            </span>
            <span className={`rounded-full px-2 py-0.5 ${ACTIVITE_STYLE[u.activite]}`}>{ACTIVITE_LABEL[u.activite]}</span>
            {entreprises.map((e) => (
              <Link
                key={e.id}
                href={`/admin/entreprise/${e.id}`}
                className="inline-flex items-center gap-1 rounded-full bg-[#fff7ed] px-2 py-0.5 text-[#a84d16] hover:underline"
              >
                <Building2 className="h-3 w-3" />
                {e.nom}
              </Link>
            ))}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <dt className="text-gray-500">Inscrit le</dt>
          <dd className="text-gray-900">{jour(u.inscritLe)}</dd>
          <dt className="text-gray-500">Dernière connexion</dt>
          <dd className="text-gray-900">{jour(u.derniereConnexion)}</dd>
          <dt className="text-gray-500">Dernière activité</dt>
          <dd className="text-gray-900">{jour(u.derniereActivite)}</dd>
        </dl>
      </header>

      {indisponibles.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            Certaines données n&apos;ont pas pu être lues ({indisponibles.join(', ')}) : cette fiche est incomplète.
          </p>
        </div>
      )}

      {/* Bilan d'activité */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {chiffres.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-white p-4">
            <c.icon className="h-4 w-4 text-[#e97e42]" />
            <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{c.valeur}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations personnelles */}
        <Carte titre="Informations personnelles">
          <dl className="space-y-3">
            <Info icon={Mail} label="E-mail">
              {u.email ?? '—'}
              {infos.emailVerifie !== null && (
                <span className={`ml-2 text-xs ${infos.emailVerifie ? 'text-green-600' : 'text-amber-600'}`}>
                  {infos.emailVerifie ? 'vérifié' : 'non vérifié'}
                </span>
              )}
            </Info>
            <Info icon={Phone} label="Téléphone">{u.telephone ?? '—'}</Info>
            <Info icon={MapPin} label="Localisation">
              {[u.ville, infos.pays].filter(Boolean).join(', ') || '—'}
              {infos.adresse && <span className="block text-xs text-gray-500">{infos.adresse}</span>}
            </Info>
            <Info icon={CalendarCheck} label="Date de naissance">{jour(infos.dateNaissance)}</Info>
            <Info icon={Wallet} label="Crédits">
              {bilan.soldeCredits === null
                ? '—'
                : `${bilan.soldeCredits} disponibles · ${bilan.creditsDepenses ?? 0} dépensés`}
            </Info>
            {infos.statutCompte && <Info icon={CheckCircle2} label="État du compte">{infos.statutCompte}</Info>}
          </dl>
          {infos.bio && <p className="mt-4 border-t pt-3 text-sm text-gray-600">{infos.bio}</p>}
        </Carte>

        {/* Activité des 12 dernières semaines */}
        <Carte titre="Activité des 12 dernières semaines" className="lg:col-span-2">
          <div
            role="img"
            aria-label={`${calendrier.filter((j) => j.nombre > 0).length} jours actifs sur les 84 derniers jours`}
            className="grid grid-flow-col grid-rows-7 gap-1"
          >
            {calendrier.map((j) => (
              <span
                key={j.jour}
                title={`${j.jour} : ${j.nombre} action${j.nombre > 1 ? 's' : ''}`}
                className={`h-3.5 rounded-sm ${intensite(j.nombre)}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              {bilan.quizPasses} quiz passé{bilan.quizPasses > 1 ? 's' : ''} · {bilan.reservations} réservation
              {bilan.reservations > 1 ? 's' : ''} en présentiel
            </span>
            <span className="flex items-center gap-1">
              Moins
              {INTENSITE.map((c) => (
                <span key={c} className={`h-3 w-3 rounded-sm ${c}`} />
              ))}
              Plus
            </span>
          </div>
          {bilan.outils.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-medium text-gray-500">Outils IA utilisés</p>
              <div className="flex flex-wrap gap-1.5">
                {bilan.outils.map((o) => (
                  <span key={o.slug} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                    {o.slug} · {o.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Carte>
      </div>

      {/* Formations et progression */}
      <Carte titre={`Formations et progression (${suivis.length})`}>
        {suivis.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune inscription à une formation.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">Formation</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Statut</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Progression</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Résultats</th>
                  <th scope="col" className="py-2 font-medium">Dates</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {suivis.map((s) => (
                  <tr key={s.formationId}>
                    <td className="py-3 pr-4">
                      {s.slug ? (
                        <Link href={`/formations/en-ligne/${s.slug}`} className="font-medium text-gray-900 hover:text-[#a84d16]">
                          {s.titre}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-900">{s.titre}</span>
                      )}
                      <span className="block text-xs text-gray-400">
                        {s.lieu === 'studia_live' ? 'Suivie sur Studia Live' : 'Lecteur Academy'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_STYLE[s.statut]}`}>
                        {STATUT_LABEL[s.statut]}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {s.progression === null ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-[#e97e42]" style={{ width: `${s.progression}%` }} />
                          </div>
                          <span className="tabular-nums text-gray-700">{s.progression} %</span>
                        </div>
                      )}
                      {s.total > 0 && (
                        <span className="text-xs text-gray-400">
                          {s.faites}/{s.total} {s.lieu === 'studia_live' ? 'exercices' : 'leçons'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-600">
                      {s.meilleurQuiz !== null && <span className="block">Quiz final : {s.meilleurQuiz} pts</span>}
                      {s.pointsLive !== null && (
                        <span className="block">
                          {s.pointsLive} pts{s.niveauLive ? ` · ${s.niveauLive}` : ''}
                        </span>
                      )}
                      {s.meilleurQuiz === null && s.pointsLive === null && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 text-xs text-gray-600">
                      <span className="block">Inscrit : {jour(s.demandeLe)}</span>
                      {s.termineLe && <span className="block">Terminé : {jour(s.termineLe)}</span>}
                      {s.derniereActivite && <span className="block">Dernière activité : {jour(s.derniereActivite)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sessions Studia Live */}
        <Carte titre={`Sessions Studia Live (${sessionsLive.length})`}>
          {sessionsLive.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune session en direct.</p>
          ) : (
            <ul className="space-y-3">
              {sessionsLive.map((s, i) => (
                <li key={`${s.titre}-${i}`} className="text-sm">
                  <p className="font-medium text-gray-900">{s.titre}</p>
                  <p className="text-xs text-gray-500">
                    {[s.formation, jour(s.date)].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {s.score} points
                    {s.rang !== null ? ` · ${s.rang}${s.rang === 1 ? 'er' : 'e'}${s.participants ? ` sur ${s.participants}` : ''}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        {/* Historique */}
        <Carte titre="Historique d'activité" className="lg:col-span-2">
          {evenements.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune activité enregistrée.</p>
          ) : (
            <ol className="space-y-3">
              {evenements.map((e, i) => {
                const Icone = ICONE_EVENEMENT[e.type]
                return (
                  <li key={`${e.date}-${e.type}-${i}`} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#fff7ed]">
                      <Icone className="h-4 w-4 text-[#e97e42]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{e.titre}</p>
                      {e.detail && <p className="truncate text-xs text-gray-500">{e.detail}</p>}
                    </div>
                    <time dateTime={e.date} className="flex-shrink-0 text-xs text-gray-400">
                      {jourHeure(e.date)}
                    </time>
                  </li>
                )
              })}
            </ol>
          )}
          {evenements.length >= 60 && (
            <p className="mt-4 border-t pt-3 text-xs text-gray-400">Seules les 60 actions les plus récentes sont affichées.</p>
          )}
        </Carte>
      </div>
    </div>
  )
}
