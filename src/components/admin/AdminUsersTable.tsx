'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDown, ArrowUp, ArrowUpDown, Building2, ChevronLeft, ChevronRight, Download, Eye, Loader2, LogIn, Search,
  SlidersHorizontal, X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { impersonateUser } from '@/lib/admin/impersonate'
import {
  ACTIVITE_LABEL,
  ACTIVITE_STYLE,
  PROVENANCE_LABEL,
  ROLE_LABEL,
  STATUT_LABEL,
  TRANCHE_LABEL,
  TYPE_COMPTE_LABEL,
  trancheProgression,
  type NiveauActivite,
  type Provenance,
  type ResumeUtilisateur,
  type StatutInscription,
  type TrancheProgression,
} from '@/lib/admin/user-activity'

const PAR_PAGE = 25
const FUSEAU = 'Africa/Libreville'

const jour = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { timeZone: FUSEAU, day: '2-digit', month: 'short', year: 'numeric' }) : '—'

type Tri = 'nom' | 'formations' | 'progression' | 'derniereActivite' | 'inscritLe'

const FILTRES_VIDES = {
  q: '',
  type: '',
  role: '',
  provenance: '',
  entreprise: '',
  formation: '',
  statut: '',
  activite: '',
  tranche: '',
  du: '',
  au: '',
}
type Filtres = typeof FILTRES_VIDES
const SANS_FORMATION = '__aucune__'

/** Valeur de tri d'une ligne ; null est toujours classé en dernier. */
function valeurTri(u: ResumeUtilisateur, tri: Tri): string | number | null {
  if (tri === 'nom') return (u.nom ?? u.email ?? '').toLowerCase() || null
  if (tri === 'formations') return u.formations
  if (tri === 'progression') return u.progression
  const date = u[tri]
  return date ? new Date(date).getTime() : null
}

/** Cellule CSV : guillemets échappés, et formules de tableur neutralisées. */
function celluleCsv(valeur: string | number | null): string {
  const texte = valeur === null ? '' : String(valeur)
  const sur = /^[=+\-@\t\r]/.test(texte) ? `'${texte}` : texte
  return `"${sur.replace(/"/g, '""')}"`
}

function exporterCsv(lignes: ResumeUtilisateur[]) {
  const entetes = [
    'Nom', 'E-mail', 'Téléphone', 'Ville', 'Type de compte', 'Rôle', 'Provenance', 'Inscrit le',
    'Dernière activité', 'Activité', 'Formations', 'Formations terminées', 'Demandes en attente',
    'Progression moyenne (%)', 'Leçons terminées', 'Points Studia Live', 'Outils IA utilisés',
  ]
  const corps = lignes.map((u) =>
    [
      u.nom, u.email, u.telephone, u.ville, TYPE_COMPTE_LABEL[u.typeCompte] ?? u.typeCompte,
      ROLE_LABEL[u.role] ?? u.role, PROVENANCE_LABEL[u.provenance], u.inscritLe?.slice(0, 10) ?? null,
      u.derniereActivite?.slice(0, 10) ?? null, ACTIVITE_LABEL[u.activite], u.formations, u.formationsTerminees,
      u.demandesEnAttente, u.progression, u.leconsTerminees, u.pointsLive, u.outilsUtilises,
    ].map(celluleCsv).join(';')
  )
  // BOM + point-virgule : ouverture directe dans Excel en français.
  const blob = new Blob(['﻿' + [entetes.map(celluleCsv).join(';'), ...corps].join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const lien = document.createElement('a')
  lien.href = URL.createObjectURL(blob)
  lien.download = 'utilisateurs-studia-academy.csv'
  lien.click()
  URL.revokeObjectURL(lien.href)
}

function Choix({
  label, valeur, onChange, options,
}: {
  label: string
  valeur: string
  onChange: (v: string) => void
  options: { valeur: string; label: string }[]
}) {
  return (
    <label className="block text-xs font-medium text-gray-500">
      {label}
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#e97e42] focus:outline-none ${
          valeur ? 'border-[#e97e42]' : 'border-[#e2e8f0]'
        }`}
      >
        <option value="">Tous</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function EnteteTri({
  colonne, tri, onTri, children,
}: {
  colonne: Tri
  tri: { colonne: Tri; sens: 1 | -1 }
  onTri: (colonne: Tri) => void
  children: React.ReactNode
}) {
  const actif = tri.colonne === colonne
  return (
    <th scope="col" aria-sort={actif ? (tri.sens === 1 ? 'ascending' : 'descending') : 'none'} className="px-4 py-3 font-medium">
      <button type="button" onClick={() => onTri(colonne)} className="inline-flex items-center gap-1 uppercase hover:text-gray-900">
        {children}
        {!actif ? (
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-300" />
        ) : tri.sens === 1 ? (
          <ArrowUp className="h-3.5 w-3.5 text-[#e97e42]" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 text-[#e97e42]" />
        )}
      </button>
    </th>
  )
}

const depuis = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((valeur) => ({ valeur, label: labels[valeur] }))

/**
 * Table des utilisateurs de l'écran d'administration : recherche, filtres
 * combinables, tri, pagination et export CSV des lignes filtrées.
 */
export function AdminUsersTable({
  users,
  formations,
  isSuperAdmin,
  entreprises = {},
}: {
  users: ResumeUtilisateur[]
  formations: { id: string; titre: string }[]
  isSuperAdmin: boolean
  /** Étiquettes entreprise par identifiant de compte. */
  entreprises?: Record<string, { id: string; nom: string }[]>
}) {
  const [f, setF] = useState<Filtres>(FILTRES_VIDES)
  const [ouvert, setOuvert] = useState(true)
  const [tri, setTri] = useState<{ colonne: Tri; sens: 1 | -1 }>({ colonne: 'inscritLe', sens: -1 })
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)

  const changer = (cle: keyof Filtres) => (valeur: string) => {
    setF((prev) => ({ ...prev, [cle]: valeur }))
    setPage(0)
  }
  const actifs = (Object.keys(f) as (keyof Filtres)[]).filter((k) => f[k] !== '').length

  const types = useMemo(
    () => [...new Set(users.map((u) => u.typeCompte))].sort().map((v) => ({ valeur: v, label: TYPE_COMPTE_LABEL[v] ?? v })),
    [users]
  )
  const roles = useMemo(
    () => [...new Set(users.map((u) => u.role))].sort().map((v) => ({ valeur: v, label: ROLE_LABEL[v] ?? v })),
    [users]
  )

  const listeEntreprises = useMemo(() => {
    const noms = new Map<string, string>()
    for (const etiquettes of Object.values(entreprises)) for (const e of etiquettes) noms.set(e.id, e.nom)
    return [...noms.entries()].map(([valeur, label]) => ({ valeur, label })).sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  }, [entreprises])

  const filtres = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    return users.filter((u) => {
      const etiquettes = entreprises[u.id] ?? []
      if (q && ![u.nom, u.email, u.telephone, u.ville, ...etiquettes.map((e) => e.nom)].some((v) => v?.toLowerCase().includes(q))) return false
      if (f.entreprise && !etiquettes.some((e) => e.id === f.entreprise)) return false
      if (f.type && u.typeCompte !== f.type) return false
      if (f.role && u.role !== f.role) return false
      if (f.provenance && u.provenance !== (f.provenance as Provenance)) return false
      if (f.formation === SANS_FORMATION) {
        if (u.formationIds.length > 0) return false
      } else if (f.formation && !u.formationIds.includes(f.formation)) return false
      if (f.statut && !u.statuts.includes(f.statut as StatutInscription)) return false
      if (f.activite && u.activite !== (f.activite as NiveauActivite)) return false
      if (f.tranche && (u.formations === 0 || trancheProgression(u.progression) !== (f.tranche as TrancheProgression))) return false
      const inscrit = u.inscritLe?.slice(0, 10) ?? ''
      if (f.du && (!inscrit || inscrit < f.du)) return false
      if (f.au && (!inscrit || inscrit > f.au)) return false
      return true
    })
  }, [users, f, entreprises])

  const tries = useMemo(() => {
    return [...filtres].sort((a, b) => {
      const va = valeurTri(a, tri.colonne)
      const vb = valeurTri(b, tri.colonne)
      if (va === vb) return 0
      if (va === null) return 1
      if (vb === null) return -1
      return (va < vb ? -1 : 1) * tri.sens
    })
  }, [filtres, tri])

  const pages = Math.max(1, Math.ceil(tries.length / PAR_PAGE))
  const pageCourante = Math.min(page, pages - 1)
  const visibles = tries.slice(pageCourante * PAR_PAGE, (pageCourante + 1) * PAR_PAGE)

  const trier = (colonne: Tri) =>
    setTri((t) => (t.colonne === colonne ? { colonne, sens: t.sens === 1 ? -1 : 1 } : { colonne, sens: colonne === 'nom' ? 1 : -1 }))

  const impersonate = async (u: ResumeUtilisateur) => {
    if (!confirm(`Se connecter en tant que ${u.nom || u.email} ? Vous serez déconnecté de votre session admin.`)) return
    setBusy(u.id)
    const r = await impersonateUser(u.id)
    if (r.success && r.link) window.location.assign(r.link)
    else {
      alert(r.error || 'Erreur')
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Recherche + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            aria-label="Rechercher un utilisateur"
            placeholder="Nom, e-mail, téléphone ou ville…"
            value={f.q}
            onChange={(e) => changer('q')(e.target.value)}
            className="rounded-xl pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} className="rounded-xl">
          <SlidersHorizontal className="mr-1.5 h-4 w-4" />
          Filtres
          {actifs > 0 && (
            <span className="ml-1.5 rounded-full bg-[#e97e42] px-1.5 text-xs font-semibold text-white">{actifs}</span>
          )}
        </Button>
        {actifs > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setF(FILTRES_VIDES)
              setPage(0)
            }}
            className="rounded-xl text-gray-500"
          >
            <X className="mr-1 h-4 w-4" />Réinitialiser
          </Button>
        )}
        <Button variant="outline" onClick={() => exporterCsv(tries)} disabled={tries.length === 0} className="rounded-xl">
          <Download className="mr-1.5 h-4 w-4" />
          Exporter ({tries.length})
        </Button>
      </div>

      {/* Filtres */}
      {ouvert && (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3 xl:grid-cols-5">
          <Choix label="Type de compte" valeur={f.type} onChange={changer('type')} options={types} />
          <Choix label="Rôle" valeur={f.role} onChange={changer('role')} options={roles} />
          <Choix label="Provenance" valeur={f.provenance} onChange={changer('provenance')} options={depuis(PROVENANCE_LABEL)} />
          {listeEntreprises.length > 0 && (
            <Choix label="Entreprise" valeur={f.entreprise} onChange={changer('entreprise')} options={listeEntreprises} />
          )}
          <Choix
            label="Formation"
            valeur={f.formation}
            onChange={changer('formation')}
            options={[{ valeur: SANS_FORMATION, label: 'Aucune formation' }, ...formations.map((x) => ({ valeur: x.id, label: x.titre }))]}
          />
          <Choix label="Statut d'inscription" valeur={f.statut} onChange={changer('statut')} options={depuis(STATUT_LABEL)} />
          <Choix label="Activité" valeur={f.activite} onChange={changer('activite')} options={depuis(ACTIVITE_LABEL)} />
          <Choix label="Progression" valeur={f.tranche} onChange={changer('tranche')} options={depuis(TRANCHE_LABEL)} />
          <label className="block text-xs font-medium text-gray-500">
            Inscrit à partir du
            <Input type="date" value={f.du} max={f.au || undefined} onChange={(e) => changer('du')(e.target.value)} className="mt-1 rounded-xl" />
          </label>
          <label className="block text-xs font-medium text-gray-500">
            Inscrit jusqu&apos;au
            <Input type="date" value={f.au} min={f.du || undefined} onChange={(e) => changer('au')(e.target.value)} className="mt-1 rounded-xl" />
          </label>
        </div>
      )}

      <p className="text-sm text-muted-foreground" role="status">
        {tries.length} utilisateur{tries.length > 1 ? 's' : ''}
        {tries.length !== users.length ? ` sur ${users.length}` : ''}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs tracking-wide text-gray-500">
            <tr>
              <EnteteTri colonne="nom" tri={tri} onTri={trier}>Utilisateur</EnteteTri>
              <th scope="col" className="px-4 py-3 font-medium uppercase">Provenance</th>
              <EnteteTri colonne="formations" tri={tri} onTri={trier}>Formations</EnteteTri>
              <EnteteTri colonne="progression" tri={tri} onTri={trier}>Progression</EnteteTri>
              <EnteteTri colonne="derniereActivite" tri={tri} onTri={trier}>Dernière activité</EnteteTri>
              <EnteteTri colonne="inscritLe" tri={tri} onTri={trier}>Inscrit le</EnteteTri>
              <th scope="col" className="px-4 py-3 text-right font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visibles.map((u) => (
              <tr key={u.id} className="hover:bg-[#fffaf5]">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="group flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e97e42]/25 to-[#7C3AED]/20 font-bold text-[#a84d16]">
                      {(u.nom || u.email || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-gray-900 group-hover:text-[#a84d16]">{u.nom || '—'}</span>
                        {u.role !== 'user' && (
                          <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                            {ROLE_LABEL[u.role] ?? u.role}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-gray-500">{u.email}</span>
                      {(entreprises[u.id] ?? []).length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {(entreprises[u.id] ?? []).map((e) => (
                            <span
                              key={e.id}
                              className="inline-flex items-center gap-1 rounded-full bg-[#fff7ed] px-1.5 py-0.5 text-[10px] font-semibold text-[#a84d16]"
                            >
                              <Building2 className="h-2.5 w-2.5" />
                              {e.nom}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="block text-gray-700">{PROVENANCE_LABEL[u.provenance]}</span>
                  <span className="text-xs text-gray-400">{TYPE_COMPTE_LABEL[u.typeCompte] ?? u.typeCompte}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{u.formations}</span>
                  <span className="block text-xs text-gray-400">
                    {[
                      u.formationsTerminees > 0 ? `${u.formationsTerminees} terminée${u.formationsTerminees > 1 ? 's' : ''}` : '',
                      u.demandesEnAttente > 0 ? `${u.demandesEnAttente} en attente` : '',
                    ].filter(Boolean).join(' · ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.progression === null ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#e97e42]" style={{ width: `${u.progression}%` }} />
                      </div>
                      <span className="tabular-nums text-gray-700">{u.progression} %</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITE_STYLE[u.activite]}`}>
                    {ACTIVITE_LABEL[u.activite]}
                  </span>
                  <span className="block text-xs text-gray-400">{jour(u.derniereActivite)}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{jour(u.inscritLe)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Button asChild size="sm" variant="outline" className="rounded-xl">
                      <Link href={`/admin/users/${u.id}`}><Eye className="mr-1 h-4 w-4" />Profil</Link>
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => impersonate(u)}
                        disabled={busy === u.id}
                        aria-label={`Se connecter en tant que ${u.nom || u.email}`}
                        title="Se connecter en tant que cet utilisateur"
                        className="rounded-xl"
                      >
                        {busy === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tries.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-400">Aucun utilisateur ne correspond à ces critères.</p>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {pageCourante + 1} sur {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(pageCourante - 1)} disabled={pageCourante === 0} className="rounded-xl">
              <ChevronLeft className="mr-1 h-4 w-4" />Précédent
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(pageCourante + 1)} disabled={pageCourante >= pages - 1} className="rounded-xl">
              Suivant<ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
