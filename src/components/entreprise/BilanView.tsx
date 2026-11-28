import { CONTACT_STUDIA, type BilanEntreprise, type BilanTheme } from '@/lib/entreprise/bilan'
import { entier, jourLong, noteSur, pct } from '@/lib/studia-live/suivi-regles'

/**
 * Page de bilan remise à la direction d'une entreprise : résultats
 * agrégés des sessions et formations proposées. Aucune donnée de
 * participant. Mise en page pensée pour l'écran et l'impression en PDF.
 */

function Carte({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="rounded-2xl border border-[#f1e3d8] bg-white p-4 text-center print:break-inside-avoid">
      <p className="text-2xl font-bold tabular-nums text-[#a84d16]">{valeur}</p>
      <p className="mt-1 text-xs text-gray-500">{libelle}</p>
    </div>
  )
}

function Themes({ titre, themes, couleur, vide }: { titre: string; themes: BilanTheme[]; couleur: string; vide: string }) {
  return (
    <div className="print:break-inside-avoid">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{titre}</h3>
      {themes.length === 0 ? (
        <p className="text-sm text-gray-500">{vide}</p>
      ) : (
        <ul className="space-y-3">
          {themes.map((t) => (
            <li key={t.titre} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-gray-800">{t.titre}</span>
                <span className="flex-shrink-0 font-medium tabular-nums text-gray-900">{pct(t.taux)}</span>
              </div>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-gray-100">
                <span
                  className={`block h-full rounded-full ${couleur}`}
                  style={{ width: `${Math.max(2, Math.min(100, t.taux))}%`, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function BilanView({ bilan, expireLe }: { bilan: BilanEntreprise; expireLe?: string | null }) {
  const i = bilan.indicateurs
  const catalogue = bilan.formations.filter((f) => f.type === 'catalogue')
  const surMesure = bilan.formations.filter((f) => f.type === 'sur_mesure')

  return (
    <article className="mx-auto max-w-4xl bg-white text-gray-900 print:max-w-none">
      <header className="bg-[#e97e42] px-6 py-8 text-white sm:px-10" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <p className="text-sm font-semibold">Studia Academy</p>
        <p className="mt-6 text-xs uppercase tracking-wider text-white/80">Bilan de formation</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{bilan.entreprise}</h1>
        <p className="mt-2 text-sm text-white/90">
          {entier(i.sessions)} session{i.sessions > 1 ? 's' : ''} · {entier(i.participations)} participation{i.participations > 1 ? 's' : ''} · établi le{' '}
          {jourLong(bilan.genere_le)}
        </p>
      </header>

      <div className="space-y-10 px-6 py-8 sm:px-10">
        <section aria-labelledby="bilan-resultats">
          <h2 id="bilan-resultats" className="mb-4 text-lg font-bold">Les résultats de vos équipes</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Carte libelle="Indice global" valeur={i.indice === null ? '—' : `${i.indice}/100`} />
            <Carte libelle="Réussite moyenne" valeur={pct(i.reussite)} />
            <Carte libelle="Participation" valeur={pct(i.participation)} />
            <Carte libelle="Satisfaction" valeur={noteSur(i.satisfaction, 5)} />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Moyennes sur l’ensemble des sessions, pondérées par le nombre de participants. Ce bilan ne contient aucun résultat individuel.
          </p>
        </section>

        {bilan.sessions.length > 0 && (
          <section aria-labelledby="bilan-sessions">
            <h2 id="bilan-sessions" className="mb-4 text-lg font-bold">Sessions animées</h2>
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Session</th>
                    <th className="px-4 py-2 font-semibold">Date</th>
                    <th className="px-4 py-2 text-right font-semibold">Participants</th>
                    <th className="px-4 py-2 text-right font-semibold">Réussite</th>
                    <th className="px-4 py-2 text-right font-semibold">Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  {bilan.sessions.map((s, n) => (
                    <tr key={n} className="border-t tabular-nums">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-gray-900">{s.titre}</span>
                        {s.formation && <span className="block text-xs text-gray-500">{s.formation}</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">{jourLong(s.date)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{entier(s.participants)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{pct(s.reussite)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{noteSur(s.satisfaction, 5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {(bilan.themes_a_renforcer.length > 0 || bilan.themes_maitrises.length > 0) && (
          <section aria-labelledby="bilan-themes">
            <h2 id="bilan-themes" className="mb-4 text-lg font-bold">Acquis par thème</h2>
            <div className="grid gap-8 sm:grid-cols-2">
              <Themes titre="Points forts" themes={bilan.themes_maitrises} couleur="bg-green-500" vide="Aucun thème au-dessus de 80 % pour l’instant." />
              <Themes titre="À renforcer" themes={bilan.themes_a_renforcer} couleur="bg-[#e97e42]" vide="Aucun thème sous 60 % de réussite." />
            </div>
          </section>
        )}

        {bilan.formations.length > 0 && (
          <section aria-labelledby="bilan-formations">
            <h2 id="bilan-formations" className="mb-1 text-lg font-bold">Les formations que nous vous proposons</h2>
            <p className="mb-4 text-sm text-gray-600">Choisies à partir des résultats ci-dessus, pour prolonger ce qui a été engagé.</p>
            <ul className="space-y-3">
              {[...catalogue, ...surMesure].map((f, n) => (
                <li key={n} className="rounded-2xl border p-4 print:break-inside-avoid">
                  <p className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.type === 'catalogue' ? 'bg-teal-50 text-teal-700' : 'bg-violet-50 text-violet-700'}`}
                      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                    >
                      {f.type === 'catalogue' ? 'Catalogue' : 'Sur mesure'}
                    </span>
                    <span className="font-semibold text-gray-900">{f.titre}</span>
                  </p>
                  {[f.format, f.duree, f.niveau].some(Boolean) && (
                    <p className="mt-1 text-xs text-gray-500">{[f.format, f.duree, f.niveau].filter(Boolean).join(' · ')}</p>
                  )}
                  {f.justification && <p className="mt-2 text-sm text-gray-700">{f.justification}</p>}
                  {f.type === 'sur_mesure' && (
                    <p className="mt-2 text-xs text-gray-500">
                      {f.disponible ? 'Formation conçue pour vos équipes, prête à démarrer.' : 'Formation conçue pour vos équipes, en cours de préparation.'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {bilan.a_venir.length > 0 && (
          <section aria-labelledby="bilan-a-venir">
            <h2 id="bilan-a-venir" className="mb-4 text-lg font-bold">Prochaines sessions</h2>
            <ul className="divide-y rounded-2xl border text-sm">
              {bilan.a_venir.map((s, n) => (
                <li key={n} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span className="font-medium text-gray-900">{s.titre}</span>
                  <span className="text-gray-600">{jourLong(s.date)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="border-t pt-6 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Parlons de la suite</p>
          <p className="mt-1">
            Pour un devis ou un échange sur ce bilan, écrivez-nous :{' '}
            <a href={`mailto:${CONTACT_STUDIA}`} className="font-medium text-[#a84d16] underline underline-offset-2">{CONTACT_STUDIA}</a>.
          </p>
          <p className="mt-4 text-xs text-gray-400 print:hidden">
            {expireLe ? `Ce lien est personnel et reste valable jusqu’au ${jourLong(expireLe)}. ` : ''}
            Pour le conserver, imprimez cette page en PDF depuis votre navigateur.
          </p>
        </footer>
      </div>
    </article>
  )
}
