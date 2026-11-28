import Link from 'next/link'
import {
  ArrowRight, Banknote, CalendarDays, GraduationCap, MessageCircle, TrendingDown, TrendingUp, UserPlus, Wallet,
  type LucideIcon,
} from 'lucide-react'
import {
  estVide, evolution, PERIODE_LABELS, PERIODES,
  type Indicateur, type LigneBarre, type Periode, type TableauDeBord,
} from '@/lib/admin/dashboard-metrics'
import { BarresEmpilees, CourbeTendance } from '@/components/admin/dashboard/DashboardCharts'
import { COULEURS } from '@/components/admin/dashboard/couleurs'
import { formatNumber } from '@/lib/utils'

const fcfa = (n: number) => `${formatNumber(n)} FCFA`

function Tuile({ icon: Icon, label, indicateur, unite = 'nombre' }: { icon: LucideIcon; label: string; indicateur: Indicateur; unite?: 'nombre' | 'fcfa' }) {
  const pct = evolution(indicateur)
  const hausse = pct !== null && pct >= 0
  return (
    <div className="rounded-2xl border border-[#f0ebe3] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#52514e]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff7ed]">
          <Icon className="h-4 w-4 text-[#e97e42]" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[#0b0b0b]">
        {formatNumber(indicateur.valeur)}
        {unite === 'fcfa' && <span className="ml-1 text-base font-medium text-[#898781]">FCFA</span>}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-[#52514e]">
        {pct === null ? (
          <span>{indicateur.valeur > 0 ? 'Aucune activité sur la période précédente' : 'Aucune activité sur la période'}</span>
        ) : (
          <>
            <span className={`inline-flex items-center gap-0.5 whitespace-nowrap font-semibold ${hausse ? 'text-[#006300]' : 'text-[#b42318]'}`}>
              {hausse ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {hausse ? '+' : ''}{pct} %
            </span>
            <span>contre {unite === 'fcfa' ? fcfa(indicateur.precedent) : formatNumber(indicateur.precedent)} avant</span>
          </>
        )}
      </p>
    </div>
  )
}

function Carte({ titre, aide, children, className = '' }: { titre: string; aide?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-[#f0ebe3] bg-white p-5 ${className}`}>
      <h3 className="font-semibold text-[#0b0b0b]">{titre}</h3>
      {aide && <p className="mt-0.5 text-xs text-[#52514e]">{aide}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Barres horizontales d'une seule teinte, chaque valeur écrite au bout de sa barre. */
function ListeBarres({ lignes, vide, format = (l) => formatNumber(l.valeur) }: { lignes: LigneBarre[]; vide: string; format?: (l: LigneBarre) => string }) {
  if (lignes.length === 0 || lignes.every((l) => l.valeur === 0 && !l.max)) {
    return <p className="rounded-xl bg-[#fbf8f3] p-4 text-sm text-[#52514e]">{vide}</p>
  }
  const maxListe = Math.max(1, ...lignes.map((l) => l.valeur))
  return (
    <ul className="space-y-3">
      {lignes.map((l) => {
        const largeur = Math.round((l.valeur / (l.max ?? maxListe)) * 100)
        return (
          <li key={`${l.label}-${l.detail ?? ''}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-[#0b0b0b]" title={l.label}>
                {l.label}
                {l.detail && <span className="ml-2 text-xs text-[#898781]">{l.detail}</span>}
              </span>
              <span className="flex-shrink-0 font-semibold tabular-nums text-[#0b0b0b]">{format(l)}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[#f0efec]">
              <div className="h-2 rounded-full" style={{ width: `${Math.max(largeur, l.valeur > 0 ? 2 : 0)}%`, backgroundColor: COULEURS.orange }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Vue d'ensemble de l'admin : indicateurs, paiements à valider et graphiques
 * d'un tableau de bord déjà calculé (voir `calculerTableauDeBord`).
 *
 * @example
 * <DashboardView tableau={t} exemple={false} indisponibles={[]} />
 */
export function DashboardView({
  tableau: t,
  exemple,
  indisponibles,
}: {
  tableau: TableauDeBord
  /** Vrai : les chiffres affichés sont des données d'exemple, signalées comme telles. */
  exemple: boolean
  /** Sources de données qui n'ont pas pu être lues. */
  indisponibles: string[]
}) {
  const periode = t.periode
  const lien = (cible: Periode, avecExemple = exemple) => `/admin?p=${cible}${avecExemple ? '&demo=1' : ''}`

  const [comptes, demandes, validees] = t.entonnoir
  const taux = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)} %` : '—')
  const totalOrigines = t.origines.reduce((s, o) => s + o.valeur, 0)

  return (
    <div className="space-y-6">
      {/* En-tête : période et mode aperçu */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vue d’ensemble</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Activité et marketing sur les {PERIODE_LABELS[periode]} écoulés, comparés à la période précédente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Période" className="flex gap-1 rounded-xl bg-muted p-1">
            {PERIODES.map((x) => (
              <Link
                key={x}
                href={lien(x)}
                aria-current={x === periode ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${x === periode ? 'bg-white text-[#a84d16] shadow-sm' : 'text-muted-foreground hover:text-gray-900'}`}
              >
                {PERIODE_LABELS[x]}
              </Link>
            ))}
          </nav>
          <Link
            href={lien(periode, !exemple)}
            className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-medium text-[#52514e] hover:border-[#e97e42] hover:text-[#a84d16]"
          >
            {exemple ? 'Revenir aux données réelles' : 'Aperçu avec des données d’exemple'}
          </Link>
        </div>
      </div>

      {exemple && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Données d’exemple.</strong> Ces chiffres sont fictifs : ils montrent le tableau de bord rempli. Ils ne viennent pas de votre activité.
        </p>
      )}
      {indisponibles.length > 0 && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Données indisponibles pour le moment : {indisponibles.join(', ')}. Les chiffres correspondants sont à zéro.
        </p>
      )}
      {!exemple && indisponibles.length === 0 && estVide(t) && (
        <p className="rounded-xl border border-[#f0ebe3] bg-[#fbf8f3] px-4 py-3 text-sm text-[#52514e]">
          Aucune activité enregistrée sur cette période. Essayez une période plus longue, ou regardez l’aperçu avec des données d’exemple.
        </p>
      )}

      {/* Action attendue : paiements à valider */}
      {t.aValider.nombre > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
            <Wallet className="h-5 w-5 text-amber-700" />
          </span>
          <p className="min-w-0 flex-1 text-sm text-amber-900">
            <strong>{t.aValider.nombre} paiement{t.aValider.nombre > 1 ? 's' : ''} à valider</strong>
            {t.aValider.montant > 0 && <> · {fcfa(t.aValider.montant)} en attente</>}
            <span className="block text-xs">Une inscription n’ouvre l’accès qu’après votre validation.</span>
          </p>
          <Link href="/admin/formations/inscriptions" className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
            Formations en ligne <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/admin/evenements" className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
            Événements <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Indicateurs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Tuile icon={Banknote} label="Revenus encaissés" indicateur={t.indicateurs.revenus} unite="fcfa" />
        <Tuile icon={UserPlus} label="Nouveaux comptes" indicateur={t.indicateurs.comptes} />
        <Tuile icon={GraduationCap} label="Inscriptions en ligne" indicateur={t.indicateurs.inscriptions} />
        <Tuile icon={CalendarDays} label="Réservations en présentiel" indicateur={t.indicateurs.reservations} />
        <Tuile icon={MessageCircle} label="Contacts WhatsApp" indicateur={t.indicateurs.contacts} />
      </div>

      {/* Demandes et conversion */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Carte titre="Demandes d’inscription" aide="Formations en ligne et événements en présentiel, par date de demande." className="lg:col-span-2">
          <BarresEmpilees
            titre="Demandes d’inscription par période"
            data={t.serie}
            series={[
              { cle: 'enLigne', label: 'Formations en ligne', couleur: COULEURS.orange },
              { cle: 'presentiel', label: 'Présentiel', couleur: COULEURS.bleu },
            ]}
          />
        </Carte>
        <Carte titre="Du compte à l’inscription" aide="Sur la période : combien de visiteurs inscrits vont jusqu’au bout.">
          <ListeBarres lignes={t.entonnoir} vide="Pas encore de compte ni de demande sur cette période." />
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f0ebe3] pt-4 text-sm">
            <div>
              <dt className="text-xs text-[#52514e]">Demandes par compte créé</dt>
              <dd className="font-semibold text-[#0b0b0b]">{taux(demandes.valeur, comptes.valeur)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#52514e]">Demandes validées</dt>
              <dd className="font-semibold text-[#0b0b0b]">{taux(validees.valeur, demandes.valeur)}</dd>
            </div>
          </dl>
        </Carte>
      </div>

      {/* Revenus et remplissage */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Carte titre="Revenus encaissés" aide="Paiements validés par un admin, à la date de validation." className="lg:col-span-2">
          <BarresEmpilees
            titre="Revenus encaissés par mode de paiement"
            data={t.serie}
            unite="fcfa"
            series={[
              { cle: 'airtel', label: 'Airtel Money', couleur: COULEURS.vertEau },
              { cle: 'especes', label: 'Espèces', couleur: COULEURS.violet },
            ]}
          />
        </Carte>
        <Carte titre="Remplissage des prochains événements" aide="Places réservées sur places ouvertes.">
          <ListeBarres
            lignes={t.remplissage}
            vide="Aucun événement publié à venir."
            format={(l) => `${formatNumber(l.valeur)} / ${formatNumber(l.max ?? 0)}`}
          />
          <Link href="/admin/evenements" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#a84d16] hover:underline">
            Gérer les événements <ArrowRight className="h-4 w-4" />
          </Link>
        </Carte>
      </div>

      {/* Acquisition */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Carte titre="Nouveaux comptes" aide="Comptes créés sur le site.">
          <CourbeTendance titre="Nouveaux comptes par période" data={t.serie} serie={{ cle: 'comptes', label: 'Comptes créés', couleur: COULEURS.orange }} />
        </Carte>
        <Carte titre="D’où viennent les contacts WhatsApp" aide="Nouvelles conversations de la période, par origine.">
          <ListeBarres
            lignes={t.origines}
            vide="Aucune nouvelle conversation sur cette période."
            format={(l) => `${formatNumber(l.valeur)} · ${taux(l.valeur, totalOrigines)}`}
          />
        </Carte>
        <Carte titre="Formations les plus demandées" aide="Demandes d’inscription reçues sur la période.">
          <ListeBarres lignes={t.topFormations} vide="Aucune demande d’inscription sur cette période." />
          <Link href="/admin/formations" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#a84d16] hover:underline">
            Gérer les formations <ArrowRight className="h-4 w-4" />
          </Link>
        </Carte>
      </div>
    </div>
  )
}
