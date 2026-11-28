import { EMETTEUR, fcfa, type DevisContenu } from '@/lib/entreprise/devis'
import { jourLong } from '@/lib/studia-live/suivi-regles'

/**
 * Devis remis au contact d'une entreprise : prestations, quantités,
 * prix, remise, total hors taxes et conditions. Mise en page pensée pour
 * l'écran et l'impression en PDF.
 */
export function DevisView({ devis, mention }: { devis: DevisContenu; mention?: string | null }) {
  const exact = { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as const
  return (
    <article className="mx-auto max-w-4xl bg-white text-gray-900 print:max-w-none">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-4 border-[#e97e42] px-6 py-8 sm:px-10">
        <div>
          <p className="text-xl font-bold text-[#a84d16]">{EMETTEUR.nom}</p>
          <p className="mt-1 text-sm text-gray-600">{EMETTEUR.lieu}</p>
          <p className="text-sm text-gray-600">{EMETTEUR.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-gray-500">Devis</p>
          <p className="text-2xl font-bold tabular-nums">{devis.numero}</p>
          <p className="mt-1 text-sm text-gray-600">Émis le {jourLong(devis.emis_le)}</p>
          <p className="text-sm text-gray-600">Valable jusqu’au {jourLong(devis.valable_jusqu_au)}</p>
          {mention && (
            <p className="mt-2 inline-block rounded-full bg-[#fff7ed] px-3 py-0.5 text-xs font-semibold text-[#a84d16]" style={exact}>{mention}</p>
          )}
        </div>
      </header>

      <div className="space-y-8 px-6 py-8 sm:px-10">
        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Client</p>
            <p className="mt-1 text-lg font-semibold">{devis.entreprise}</p>
            {devis.contact_nom && <p className="text-sm text-gray-600">À l’attention de {devis.contact_nom}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Objet</p>
            <p className="mt-1 text-lg font-semibold">{devis.objet}</p>
            {devis.participants !== null && (
              <p className="text-sm text-gray-600">
                {devis.participants.toLocaleString('fr-FR')} collaborateur{devis.participants > 1 ? 's' : ''} concerné{devis.participants > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </section>

        <section aria-label="Prestations">
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500" style={exact}>
                <tr>
                  <th className="px-4 py-2 font-semibold">Prestation</th>
                  <th className="px-4 py-2 text-right font-semibold">Qté</th>
                  <th className="px-4 py-2 text-right font-semibold">Prix unitaire HT</th>
                  <th className="px-4 py-2 text-right font-semibold">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                {devis.lignes.map((l, n) => (
                  <tr key={n} className="border-t align-top tabular-nums print:break-inside-avoid">
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-900">{l.libelle}</span>
                      {l.detail && <span className="block text-xs text-gray-500">{l.detail}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{l.quantite}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-gray-700">{fcfa(l.prix_unitaire)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-gray-900">{fcfa(l.montant)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="tabular-nums">
                {devis.remise_programme > 0 && (
                  <>
                    <tr className="border-t">
                      <td colSpan={3} className="px-4 py-2 text-right text-gray-600">Sous-total HT</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-gray-900">{fcfa(devis.sous_total)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-gray-600">
                        Remise de programme ({devis.remise_programme_pct.toLocaleString('fr-FR')} %)
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-gray-900">−{fcfa(devis.remise_programme)}</td>
                    </tr>
                  </>
                )}
                <tr className="border-t-2 border-gray-300 bg-[#fff7ed]" style={exact}>
                  <td colSpan={3} className="px-4 py-3 text-right text-base font-bold">Total HT</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-base font-bold text-[#a84d16]">{fcfa(devis.total_ht)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-2 text-right text-sm text-gray-600">
            Montants hors taxes, TVA en sus.
            {devis.par_personne !== null && <> Soit <strong className="text-gray-900">{fcfa(devis.par_personne)}</strong> par collaborateur.</>}
          </p>
        </section>

        <section className="grid gap-8 text-sm sm:grid-cols-2 print:break-inside-avoid">
          <div>
            <h2 className="mb-2 font-semibold text-gray-900">Compris dans nos séances</h2>
            <p className="text-gray-700">
              Animation sur place, matériel, espace participant sur téléphone et bilan de séance.
            </p>
            <h2 className="mb-2 mt-5 font-semibold text-gray-900">Non compris</h2>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              {devis.non_inclus.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 font-semibold text-gray-900">Conditions</h2>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              {devis.conditions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="border-t pt-6 text-sm text-gray-600 print:break-inside-avoid">
          <p>
            Pour accepter ce devis ou en parler, écrivez-nous :{' '}
            <a href={`mailto:${EMETTEUR.email}`} className="font-medium text-[#a84d16] underline underline-offset-2">{EMETTEUR.email}</a>.
          </p>
          <div className="mt-8 hidden grid-cols-2 gap-10 print:grid">
            <div>
              <p className="text-xs text-gray-500">Pour {EMETTEUR.nom}</p>
              <div className="mt-12 border-t border-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Bon pour accord — {devis.entreprise} (date, nom, signature)</p>
              <div className="mt-12 border-t border-gray-400" />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400 print:hidden">Pour le conserver ou le signer, imprimez cette page en PDF depuis votre navigateur.</p>
        </footer>
      </div>
    </article>
  )
}
