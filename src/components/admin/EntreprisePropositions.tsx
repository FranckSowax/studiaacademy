'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Plus, RotateCcw, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SEUIL_A_RENFORCER, SEUIL_MAITRISE, type AnalyseEntreprise, type ThemeAgrege } from '@/lib/entreprise/analyse'
import { CATALOGUE_B2B } from '@/lib/entreprise/catalogue'
import { ajouterProposition, deciderProposition, lancerAnalyse, lierFormation } from '@/lib/entreprise/proposition-actions'
import { estACreer, type FormationLiable, type Proposition, type StatutProposition } from '@/lib/entreprise/propositions'

const SELECT = 'h-9 w-full rounded-xl border border-input bg-white px-3 text-sm'
type Info = { ok: boolean; texte: string } | null

function Themes({ titre, themes, couleur, vide }: { titre: string; themes: ThemeAgrege[]; couleur: string; vide: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-gray-900">{titre}</h3>
      {themes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vide}</p>
      ) : (
        <ul className="space-y-2">
          {themes.slice(0, 6).map((t) => (
            <li key={t.titre} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-gray-800">{t.titre}</span>
                <span className="flex-shrink-0 tabular-nums text-gray-900">{Math.round(t.taux)} %</span>
              </div>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-gray-100">
                <span className={`block h-full rounded-full ${couleur}`} style={{ width: `${Math.max(2, Math.min(100, t.taux))}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Analyse des sessions passées et formations proposées à l'entreprise :
 * lancer l'analyse (par règles), retenir ou écarter chaque proposition,
 * en ajouter une à la main, relier la formation sur mesure une fois créée.
 */
export function EntreprisePropositions({
  entrepriseId,
  analyse,
  propositions,
  formations,
  erreur,
}: {
  entrepriseId: string
  analyse: AnalyseEntreprise
  propositions: Proposition[]
  formations: FormationLiable[]
  /** Message à afficher si les propositions n'ont pas pu être lues. */
  erreur: string | null
}) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [occupe, setOccupe] = useState<string | null>(null)
  const [info, setInfo] = useState<Info>(erreur ? { ok: false, texte: erreur } : null)
  const [ajout, setAjout] = useState(false)
  const [form, setForm] = useState({ catalogue_ref: '', titre: '', justification: '' })
  const [erreurAjout, setErreurAjout] = useState<string | null>(null)

  const titresFormations = new Map(formations.map((f) => [f.id, f]))
  const dejaAuCatalogue = new Set(propositions.map((p) => p.catalogue_ref).filter(Boolean))
  const aCreer = propositions.filter(estACreer).length

  const lancer = (cle: string, tache: () => Promise<void>) => {
    setOccupe(cle)
    demarrer(async () => {
      await tache()
      setOccupe(null)
    })
  }

  const analyser = () =>
    lancer('analyse', async () => {
      const r = await lancerAnalyse(entrepriseId)
      if (!r.ok) return setInfo({ ok: false, texte: r.error })
      const s = (n: number) => (n > 1 ? 's' : '')
      setInfo({
        ok: true,
        texte:
          r.ajoutees === 0 && r.mises_a_jour === 0
            ? `Analyse de ${r.sessions} session${s(r.sessions)} : aucune nouvelle proposition.`
            : `Analyse de ${r.sessions} session${s(r.sessions)} : ${r.ajoutees} nouvelle${s(r.ajoutees)} proposition${s(r.ajoutees)}, ${r.mises_a_jour} mise${s(r.mises_a_jour)} à jour.`,
      })
      router.refresh()
    })

  const decider = (p: Proposition, statut: StatutProposition) =>
    lancer(p.id, async () => {
      const r = await deciderProposition(entrepriseId, p.id, statut)
      if (!r.ok) return setInfo({ ok: false, texte: r.error })
      if (statut === 'retenue' && p.type === 'sur_mesure' && !p.formation_id) {
        setInfo({
          ok: true,
          texte: r.equipePrevenue
            ? `« ${p.titre} » est à créer : l’équipe a été prévenue sur WhatsApp.`
            : `« ${p.titre} » est à créer : elle apparaît dans la file des formations sur mesure.`,
        })
      } else setInfo(null)
      router.refresh()
    })

  const lier = (p: Proposition, formationId: string) =>
    lancer(p.id, async () => {
      const r = await lierFormation(entrepriseId, p.id, formationId || null)
      setInfo(r.ok ? (formationId ? { ok: true, texte: `« ${p.titre} » est reliée à sa formation : elle n’est plus à créer.` } : null) : { ok: false, texte: r.error })
      if (r.ok) router.refresh()
    })

  const ajouter = () => {
    setErreurAjout(null)
    lancer('ajout', async () => {
      const r = await ajouterProposition(entrepriseId, form)
      if (!r.ok) return setErreurAjout(r.error)
      setAjout(false)
      setForm({ catalogue_ref: '', titre: '', justification: '' })
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Analyse et formations proposées</h2>
          <p className="text-xs text-muted-foreground">
            {analyse.sessions_analysees} session{analyse.sessions_analysees > 1 ? 's' : ''} analysée{analyse.sessions_analysees > 1 ? 's' : ''}
            {analyse.sessions_sans_detail > 0 ? ` · ${analyse.sessions_sans_detail} sans détail reçu` : ''}
            {aCreer > 0 ? ` · ${aCreer} formation${aCreer > 1 ? 's' : ''} sur mesure à créer` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={enCours} onClick={() => { setErreurAjout(null); setAjout(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une proposition
          </Button>
          <Button size="sm" disabled={enCours || analyse.sessions_analysees === 0} onClick={analyser}>
            {occupe === 'analyse' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyser les sessions
          </Button>
        </div>
      </div>

      {info && (
        <div role="status" className={`border-b px-4 py-3 text-sm ${info.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {info.texte}
        </div>
      )}

      {analyse.sessions_analysees === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Rattachez une session Studia Live clôturée pour lancer l’analyse. Vous pouvez déjà ajouter une proposition à la main.
        </p>
      ) : (
        <div className="grid gap-6 border-b p-4 md:grid-cols-2">
          <Themes
            titre={`À renforcer (moins de ${SEUIL_A_RENFORCER} % de réussite)`}
            themes={analyse.themes_a_renforcer}
            couleur="bg-red-400"
            vide="Aucun thème sous le seuil."
          />
          <Themes
            titre={`Maîtrisés (${SEUIL_MAITRISE} % et plus)`}
            themes={analyse.themes_maitrises}
            couleur="bg-green-500"
            vide="Aucun thème au-dessus du seuil pour l’instant."
          />
        </div>
      )}

      {propositions.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune proposition enregistrée. Lancez l’analyse pour obtenir des formations adaptées.
        </p>
      ) : (
        <ul className="divide-y">
          {propositions.map((p) => {
            const aFaire = estACreer(p)
            const reliee = p.formation_id ? titresFormations.get(p.formation_id) : undefined
            return (
              <li key={p.id} className={`flex flex-wrap items-start gap-3 px-4 py-3 ${p.statut === 'ecartee' ? 'opacity-60' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${p.type === 'catalogue' ? 'bg-teal-50 text-teal-700' : 'bg-violet-50 text-violet-700'}`}>
                      {p.type === 'catalogue' ? `Catalogue ${p.catalogue_ref ?? ''}`.trim() : 'Sur mesure'}
                    </span>
                    <span className="font-medium text-gray-900">{p.titre}</span>
                    {p.statut === 'retenue' && !aFaire && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        {p.type === 'sur_mesure' ? 'Disponible' : 'Retenue'}
                      </span>
                    )}
                    {aFaire && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">À créer</span>}
                    {p.statut === 'ecartee' && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Écartée</span>}
                    {p.origine === 'manuelle' && <span className="text-xs text-gray-400">Ajoutée à la main</span>}
                  </p>
                  {p.justification && <p className="mt-1 text-sm text-gray-600">{p.justification}</p>}
                  {p.type === 'sur_mesure' && p.statut === 'retenue' && (
                    <label className="mt-2 flex max-w-md flex-wrap items-center gap-2 text-xs text-gray-500">
                      Formation créée
                      <select
                        className={`${SELECT} flex-1`}
                        value={p.formation_id ?? ''}
                        disabled={enCours}
                        onChange={(e) => lier(p, e.target.value)}
                        aria-label={`Formation reliée à ${p.titre}`}
                      >
                        <option value="">Pas encore créée</option>
                        {p.formation_id && !reliee && <option value={p.formation_id}>Formation reliée</option>}
                        {formations.map((f) => (
                          <option key={f.id} value={f.id}>{f.titre}{f.publiee ? '' : ' (brouillon)'}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <div className="flex gap-1">
                  {occupe === p.id && <Loader2 className="mt-2 h-4 w-4 animate-spin text-gray-400" />}
                  {p.statut !== 'retenue' && (
                    <Button variant="outline" size="sm" disabled={enCours} onClick={() => decider(p, 'retenue')}>
                      <Check className="mr-1.5 h-4 w-4" />
                      Retenir
                    </Button>
                  )}
                  {p.statut === 'proposee' && (
                    <Button variant="ghost" size="sm" disabled={enCours} onClick={() => decider(p, 'ecartee')}>
                      <X className="mr-1.5 h-4 w-4" />
                      Écarter
                    </Button>
                  )}
                  {p.statut !== 'proposee' && (
                    <Button variant="ghost" size="sm" disabled={enCours} onClick={() => decider(p, 'proposee')} aria-label={`Remettre ${p.titre} en attente`}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="border-t px-4 py-2 text-xs text-muted-foreground">
        Analyse par règles, sans IA : elle ne lit que les taux de réussite par thème et les priorités relevées, jamais une réponse nominative.
      </p>

      <Dialog open={ajout} onOpenChange={(o) => !enCours && setAjout(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une proposition</DialogTitle>
            <DialogDescription>Choisissez une formation du catalogue, ou décrivez un besoin sur mesure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="prop-catalogue">Formation du catalogue</Label>
              <select
                id="prop-catalogue"
                className={SELECT}
                value={form.catalogue_ref}
                onChange={(e) => setForm((f) => ({ ...f, catalogue_ref: e.target.value }))}
              >
                <option value="">Aucune : formation sur mesure</option>
                {CATALOGUE_B2B.filter((f) => !dejaAuCatalogue.has(f.ref)).map((f) => (
                  <option key={f.ref} value={f.ref}>{f.ref} · {f.titre}</option>
                ))}
              </select>
            </div>
            {form.catalogue_ref === '' && (
              <div className="space-y-1.5">
                <Label htmlFor="prop-titre">Titre de la formation sur mesure</Label>
                <Input
                  id="prop-titre"
                  maxLength={200}
                  placeholder="Copilot pour la logistique"
                  value={form.titre}
                  onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="prop-pourquoi">Pourquoi cette formation</Label>
              <Textarea
                id="prop-pourquoi"
                rows={3}
                maxLength={1000}
                value={form.justification}
                onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
              />
            </div>
          </div>
          {erreurAjout && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurAjout}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={enCours} onClick={() => setAjout(false)}>Annuler</Button>
            <Button disabled={enCours || (form.catalogue_ref === '' && form.titre.trim() === '')} onClick={ajouter}>
              {occupe === 'ajout' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
