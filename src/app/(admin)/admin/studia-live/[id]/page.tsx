export const dynamic = 'force-dynamic'
// L'envoi des finales par Studia Live peut prendre jusqu'à 5 minutes.
export const maxDuration = 300

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { LiveSessionParticipants } from '@/components/admin/LiveSessionParticipants'
import { LiveSessionSuivi } from '@/components/admin/LiveSessionSuivi'
import { requireAdmin } from '@/lib/auth/require-admin'
import { liaisonLiveConfiguree, type TypeRecommandation } from '@/lib/studia-live/pilotage'
import { lireFicheSuivi, lireJournal, lireResponsables } from '@/lib/studia-live/suivi'
import {
  entier, enTexte, groupesVerbatims, jourHeure, jourLong, NIVEAU_LABELS, noteSur, pct, RECOMMANDATION_LABELS, STATUT_SUIVI_LABELS,
  STATUT_SUIVI_STYLES,
} from '@/lib/studia-live/suivi-regles'
import { createAdminClient } from '@/lib/supabase/admin'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const RECOMMANDATION_STYLES: Record<TypeRecommandation, string> = {
  priorite: 'border-red-200 bg-red-50',
  conseil: 'border-amber-200 bg-amber-50',
  atout: 'border-green-200 bg-green-50',
}
const ORDRE_RECOMMANDATIONS: TypeRecommandation[] = ['priorite', 'conseil', 'atout']

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{titre}</h3>
      {children}
    </section>
  )
}

function Carte({ libelle, valeur, detail }: { libelle: string; valeur: string; detail?: string | null }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs text-gray-500">{libelle}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{valeur}</p>
      {detail && <p className="mt-0.5 text-xs text-gray-500">{detail}</p>}
    </div>
  )
}

function Barre({ taux }: { taux: number | null }) {
  const largeur = typeof taux === 'number' ? Math.max(0, Math.min(100, taux)) : 0
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <span className="block h-full rounded-full bg-[#e97e42]" style={{ width: `${largeur}%` }} />
    </span>
  )
}

/** Admin — fiche d'une session clôturée de Studia Live. Données nominatives : jamais publiques. */
export default async function AdminStudiaLiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!UUID.test(id)) notFound()

  const admin = createAdminClient()
  const [fiche, journal, responsables] = await Promise.all([lireFicheSuivi(admin, id), lireJournal(admin, id), lireResponsables(admin)])
  if (!fiche) notFound()

  const { donnees: d, ...ligne } = fiche
  const i = d?.indicateurs
  const supprimee = !!fiche.supprimee_live_le
  const configuree = liaisonLiveConfiguree()
  const recommandations = i?.recommandations ?? []
  const themes = i?.themes ?? []
  const repartition = i?.acquisition?.repartition
  const exercices = i?.impact?.exercices ?? []
  const verbatims = groupesVerbatims(i?.satisfaction?.verbatims)
  const synthese = enTexte(i?.synthese)
  const anonymes = [...(d?.reponses_anonymes ?? [])].sort((a, b) => a.ordre - b.ordre)
  const gain = fiche.resume.gain_temps_pct ?? i?.impact?.gain_moyen ?? null

  return (
    <div className="max-w-7xl space-y-6">
      <Link href="/admin/studia-live" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#a84d16]">
        <ArrowLeft className="h-4 w-4" />
        Sessions Studia Live
      </Link>

      {!configuree && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Liaison Studia Live non configurée
        </div>
      )}

      <header className="flex flex-wrap items-start gap-5 rounded-2xl border bg-white p-5">
        <div className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-[#fff7ed] text-[#a84d16]">
          <span className="text-3xl font-bold leading-none tabular-nums">{typeof i?.indice === 'number' ? Math.round(i.indice) : '—'}</span>
          <span className="mt-1 text-[11px] font-medium uppercase tracking-wide">Indice</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{fiche.titre}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {[fiche.code, fiche.formation_label, jourLong(fiche.date_formation), d?.formateur?.nom ? `Animée par ${d.formateur.nom}` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-medium">
            <span className={`rounded-full px-2 py-0.5 ${STATUT_SUIVI_STYLES[fiche.statut_suivi]}`}>{STATUT_SUIVI_LABELS[fiche.statut_suivi]}</span>
            {supprimee && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600">Supprimée dans Studia Live</span>}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              {fiche.synchronise_le ? `Synchronisée le ${jourHeure(fiche.synchronise_le)}` : 'Détail jamais reçu'}
            </span>
          </div>
          {synthese && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-800">{synthese}</p>}
        </div>
      </header>

      {!d ? (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Le détail de cette session n’a pas encore été reçu. Utilisez « Actualiser depuis Studia Live » ci-dessous.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Carte
              libelle="Participants"
              valeur={entier(i?.effectifs?.inscrits ?? d.participants.length)}
              detail={`${entier(i?.effectifs?.actifs)} actifs · ${entier(i?.effectifs?.evalues)} évalués`}
            />
            <Carte libelle="Réussite moyenne" valeur={pct(i?.acquisition?.reussite_moy)} detail={`${entier(i?.acquisition?.nb_qcm)} QCM`} />
            <Carte
              libelle="Participation"
              valeur={pct(i?.engagement?.participation_moy)}
              detail={`${entier(i?.engagement?.activites_jouees)}/${entier(i?.engagement?.activites_total)} activités · ${entier(i?.engagement?.reponses)} réponses`}
            />
            <Carte
              libelle="Satisfaction"
              valeur={noteSur(i?.satisfaction?.moyenne, 5)}
              detail={`${entier(i?.satisfaction?.nb_notes)} note${(i?.satisfaction?.nb_notes ?? 0) > 1 ? 's' : ''}`}
            />
            <Carte
              libelle="Gain de temps"
              valeur={pct(gain)}
              detail={typeof i?.impact?.utilisable_pct === 'number' ? `${pct(i.impact.utilisable_pct)} utilisable` : 'Exercices chronométrés'}
            />
            <Carte libelle="Qualité des productions IA" valeur={entier(i?.qualite_ia?.note_moy)} detail={`${entier(i?.qualite_ia?.nb)} notées`} />
          </div>

          {recommandations.length > 0 && (
            <Bloc titre="Recommandations">
              <div className="grid gap-4 lg:grid-cols-3">
                {ORDRE_RECOMMANDATIONS.map((type) => {
                  const groupe = recommandations.filter((r) => r.type === type)
                  if (groupe.length === 0) return null
                  return (
                    <div key={type} className={`rounded-xl border p-4 ${RECOMMANDATION_STYLES[type]}`}>
                      <h4 className="mb-2 text-sm font-semibold text-gray-900">{RECOMMANDATION_LABELS[type]} ({groupe.length})</h4>
                      <ul className="space-y-2 text-sm text-gray-800">
                        {groupe.map((r, n) => (
                          <li key={n}>
                            {enTexte(r.axe) && <span className="font-medium">{enTexte(r.axe)} : </span>}
                            {enTexte(r.texte)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </Bloc>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Bloc titre="Acquisition par thème">
                {themes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun thème évalué dans cette session.</p>
                ) : (
                  <ul className="space-y-2">
                    {themes.map((t, n) => (
                      <li key={n}>
                        <details className="group rounded-xl border px-3 py-2">
                          <summary className="flex cursor-pointer list-none items-center gap-3 text-sm">
                            <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{enTexte(t.titre)}</span>
                            <span className="w-28"><Barre taux={t.taux} /></span>
                            <span className="w-14 text-right tabular-nums text-gray-700">{pct(t.taux)}</span>
                            <span className="text-xs text-gray-400 group-open:hidden">Détail</span>
                            <span className="hidden text-xs text-gray-400 group-open:inline">Fermer</span>
                          </summary>
                          <ul className="mt-2 space-y-1 border-t pt-2">
                            {(t.questions ?? []).map((q, m) => (
                              <li key={m} className="flex items-center gap-3 text-sm text-gray-700">
                                <span className="min-w-0 flex-1">{enTexte(q.titre)}</span>
                                <span className="w-14 text-right tabular-nums">{pct(q.taux)}</span>
                                <span className="w-24 text-right text-xs text-gray-500">{entier(q.nb)} réponse{(q.nb ?? 0) > 1 ? 's' : ''}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </Bloc>
            </div>
            <Bloc titre="Niveaux">
              {repartition ? (
                <dl className="space-y-2 text-sm">
                  {Object.entries(NIVEAU_LABELS).map(([cle, libelle]) => (
                    <div key={cle} className="flex items-center justify-between">
                      <dt className="text-gray-600">{libelle}</dt>
                      <dd className="font-semibold tabular-nums text-gray-900">{entier(repartition[cle as keyof typeof repartition])}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Répartition non mesurée.</p>
              )}
            </Bloc>
          </div>

          {exercices.length > 0 && (
            <Bloc titre="Exercices chronométrés, sans puis avec IA">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="py-1.5 pr-3 font-semibold">Exercice</th>
                      <th className="px-3 py-1.5 font-semibold">Réalisations</th>
                      <th className="px-3 py-1.5 font-semibold">Sans IA</th>
                      <th className="px-3 py-1.5 font-semibold">Avec IA</th>
                      <th className="px-3 py-1.5 font-semibold">Gain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercices.map((e, n) => (
                      <tr key={n} className="border-t tabular-nums text-gray-700">
                        <td className="py-2 pr-3 text-gray-900">{enTexte(e.titre)}</td>
                        <td className="px-3 py-2">{entier(e.n)}</td>
                        <td className="px-3 py-2">{typeof e.sans === 'number' ? `${entier(e.sans)} min` : '—'}</td>
                        <td className="px-3 py-2">{typeof e.avec === 'number' ? `${entier(e.avec)} min` : '—'}</td>
                        <td className="px-3 py-2 font-semibold text-gray-900">{pct(e.gain)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Bloc>
          )}

          <LiveSessionParticipants sessionId={id} participants={d.participants} supprimee={supprimee || !configuree} />

          <Bloc titre="Réponses anonymes">
            <p className="-mt-2 mb-3 text-xs text-muted-foreground">
              Ces activités étaient anonymes : les réponses ne sont rattachées à aucun participant.
            </p>
            {anonymes.length === 0 && verbatims.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité anonyme dans cette session.</p>
            ) : (
              <ul className="space-y-2">
                {anonymes.map((a) => (
                  <li key={a.activite_id}>
                    <details className="rounded-xl border px-3 py-2">
                      <summary className="cursor-pointer text-sm font-medium text-gray-900">
                        {a.ordre}. {enTexte(a.titre)}
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          {a.reponses.length} réponse{a.reponses.length > 1 ? 's' : ''}
                        </span>
                      </summary>
                      <ul className="mt-2 list-disc space-y-1 border-t pl-5 pt-2 text-sm text-gray-700">
                        {a.reponses.map((r, n) => (
                          <li key={n} className="whitespace-pre-wrap break-words">{enTexte(r)}</li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
                {verbatims.map((g, n) => (
                  <li key={`verbatims-${n}`}>
                    <details className="rounded-xl border px-3 py-2">
                      <summary className="cursor-pointer text-sm font-medium text-gray-900">
                        {g.titre ?? 'Commentaires de satisfaction'}
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          {g.textes.length} commentaire{g.textes.length > 1 ? 's' : ''}
                        </span>
                      </summary>
                      <ul className="mt-2 list-disc space-y-1 border-t pl-5 pt-2 text-sm text-gray-700">
                        {g.textes.map((t, m) => (
                          <li key={m} className="whitespace-pre-wrap break-words">{t}</li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Bloc>
        </>
      )}

      <LiveSessionSuivi fiche={ligne} responsables={responsables} journal={journal} rapportPossible={!!d && !supprimee && configuree} />
    </div>
  )
}
