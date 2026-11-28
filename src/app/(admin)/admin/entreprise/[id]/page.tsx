export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, Phone, UserRound } from 'lucide-react'
import { EntrepriseModifier, EntrepriseParticipants, EntrepriseSessions } from '@/components/admin/EntrepriseDossier'
import { requireAdmin } from '@/lib/auth/require-admin'
import { lireDossier, lireSessionsDisponibles } from '@/lib/entreprise/dossier'
import { estUuid, initiales } from '@/lib/entreprise/dossier-regles'
import { lireFormationsLiables, lirePropositions } from '@/lib/entreprise/propositions'
import { EntreprisePropositions } from '@/components/admin/EntreprisePropositions'
import { EntrepriseBilan } from '@/components/admin/EntrepriseBilan'
import { EntrepriseDevis } from '@/components/admin/EntrepriseDevis'
import { lireDevisEntreprise } from '@/lib/entreprise/devis-acces'
import { lireBilansEnvoyes } from '@/lib/entreprise/bilan-acces'
import { lireResponsables } from '@/lib/studia-live/suivi'
import { entier, noteSur, pct } from '@/lib/studia-live/suivi-regles'
import { createAdminClient } from '@/lib/supabase/admin'

const STATUT_DIAGNOSTIC: Record<string, string> = {
  draft: 'Brouillon', open: 'Ouvert', closed: 'Clôturé', analyzing: 'Analyse', analyzed: 'Rapport prêt',
}

function Carte({ libelle, valeur, detail }: { libelle: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs text-gray-500">{libelle}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{valeur}</p>
      {detail && <p className="mt-0.5 text-xs text-gray-500">{detail}</p>}
    </div>
  )
}

/** Admin — dossier d'une entreprise : ses sessions, ses participants et ses indicateurs. */
export default async function AdminEntrepriseDossierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!estUuid(id)) notFound()

  const admin = createAdminClient()
  const [dossier, disponibles, responsables, propositions, formations, bilans, devis] = await Promise.all([
    lireDossier(admin, id),
    lireSessionsDisponibles(admin),
    lireResponsables(admin),
    lirePropositions(admin, id),
    lireFormationsLiables(admin),
    lireBilansEnvoyes(admin, id),
    lireDevisEntreprise(admin, id),
  ])
  if (!dossier) notFound()

  const { entreprise: e, sessions, indicateurs: i, participants, etiquetes, diagnostics, analyse } = dossier
  const responsable = responsables.find((r) => r.id === e.responsable_id)?.nom

  return (
    <div className="max-w-6xl space-y-6">
      <Link href="/admin/entreprise" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#a84d16]">
        <ArrowLeft className="h-4 w-4" />
        Entreprises
      </Link>

      <header className="flex flex-wrap items-start gap-4 rounded-2xl border bg-white p-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff7ed] text-xl font-bold text-[#a84d16]">
          {initiales(e.nom_entreprise)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">{e.nom_entreprise}</h1>
          <p className="text-sm text-gray-500">
            {[e.secteur, e.ville, e.effectif_estime && `${e.effectif_estime} pers.`].filter(Boolean).join(' · ') || 'Fiche à compléter'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-medium">
            {e.user_id && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Compte client</span>}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
              Responsable : {responsable ?? 'personne'}
            </span>
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-500">Direction</dt>
            <dd className="text-gray-900">{e.direction_nom ?? '—'}</dd>
            {e.direction_email && (
              <dd className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3 w-3" />{e.direction_email}</dd>
            )}
          </div>
          <div>
            <dt className="text-xs text-gray-500">Contact</dt>
            <dd className="flex items-center gap-1.5 text-gray-900"><UserRound className="h-3.5 w-3.5 text-gray-400" />{e.contact_nom ?? '—'}</dd>
            {e.contact_email && (
              <dd className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3 w-3" />{e.contact_email}</dd>
            )}
            {e.contact_phone && (
              <dd className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3 w-3" />{e.contact_phone}</dd>
            )}
          </div>
        </dl>
        <EntrepriseModifier entreprise={e} responsables={responsables} />
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Carte
          libelle="Sessions"
          valeur={entier(sessions.length)}
          detail={`${i.sessions_passees} passée${i.sessions_passees > 1 ? 's' : ''} · ${i.sessions_a_venir} à venir`}
        />
        <Carte libelle="Participants" valeur={entier(participants.length)} detail={`${entier(i.participations)} participations`} />
        <Carte libelle="Indice moyen" valeur={i.indice === null ? '—' : entier(Math.round(i.indice))} detail="Pondéré par session" />
        <Carte libelle="Réussite" valeur={pct(i.reussite === null ? null : Math.round(i.reussite))} />
        <Carte libelle="Participation" valeur={pct(i.participation === null ? null : Math.round(i.participation))} />
        <Carte
          libelle="Satisfaction"
          valeur={noteSur(i.satisfaction, 5)}
          detail={i.priorites > 0 ? `${i.priorites} priorité${i.priorites > 1 ? 's' : ''} relevée${i.priorites > 1 ? 's' : ''}` : undefined}
        />
      </div>

      <EntrepriseSessions entrepriseId={id} sessions={sessions} disponibles={disponibles} />
      <EntreprisePropositions
        entrepriseId={id}
        analyse={analyse}
        propositions={propositions.propositions}
        formations={formations}
        erreur={propositions.erreur}
      />
      <EntrepriseBilan
        entrepriseId={id}
        directionNom={e.direction_nom}
        directionEmail={e.direction_email}
        bilans={bilans}
        possible={analyse.sessions_analysees > 0}
        formationsRetenues={propositions.propositions.filter((p) => p.statut === 'retenue').length}
        admins={responsables}
      />
      <EntrepriseDevis
        entrepriseId={id}
        devis={devis}
        contactNom={e.contact_nom}
        contactEmail={e.contact_email}
        effectif={participants.length}
        themes={propositions.propositions.filter((p) => p.statut === 'retenue').map((p) => p.titre.replace(/^Sur mesure : /, ''))}
      />
      <EntrepriseParticipants entrepriseId={id} participants={participants} etiquetes={etiquetes} />

      {diagnostics.length > 0 && (
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Diagnostics de compétences</h2>
          <ul className="divide-y text-sm">
            {diagnostics.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate text-gray-900">{d.titre}</span>
                <span className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">{d.nb_submissions ?? 0} réponse{(d.nb_submissions ?? 0) > 1 ? 's' : ''}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{STATUT_DIAGNOSTIC[d.status] ?? d.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {e.notes && (
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Notes internes</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-800">{e.notes}</p>
        </section>
      )}
    </div>
  )
}
