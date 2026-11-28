'use client'

import Link from 'next/link'
import {
  Eye, EyeOff, Trash2, Pencil, Loader2, GraduationCap, ExternalLink, Users, Clock, Radio, BarChart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatNumber } from '@/lib/utils'
import { UpgradeMetierSticker } from '@/components/formations/UpgradeMetierSticker'
import { estFormationMetier } from '@/lib/formations/secteur-link'
import type { Formation } from '@/types/formation'

interface Props {
  formation: Formation
  /** Élèves ayant accès (inscriptions actives ou terminées). */
  inscrits: number
  /** Demandes d'inscription en attente de validation. */
  enAttente: number
  busy: boolean
  onTogglePublish: (f: Formation) => void
  onDelete: (f: Formation) => void
}

/** Carte d'une formation dans la liste admin : couverture, état, chiffres, actions. */
export function AdminFormationCard({ formation: f, inscrits, enAttente, busy, onTogglePublish, onDelete }: Props) {
  const gratuit = (f.prix_fcfa ?? 0) <= 0
  const edition = `/admin/formations/${f.id}`

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#f0ebe3] bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={edition} className="relative block aspect-[16/9] overflow-hidden bg-[#fbf8f3]" aria-label={`Modifier ${f.titre}`}>
        {f.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element -- adresse libre saisie par l'admin (hôte non prévu par next/image)
          <img
            src={f.cover_image}
            alt=""
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]',
              !f.is_published && 'opacity-80 saturate-[0.6]',
            )}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#fff7ed] to-[#fde8d3] text-[#a84d16]">
            <GraduationCap className="h-8 w-8" />
            <span className="text-xs font-medium">Sans couverture</span>
          </div>
        )}

        <span
          className={cn(
            'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
            f.is_published ? 'bg-green-600 text-white' : 'bg-white text-gray-700',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', f.is_published ? 'bg-white' : 'bg-gray-400')} />
          {f.is_published ? 'Publiée' : 'Brouillon'}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-white">
          {gratuit ? 'Gratuit' : `${formatNumber(f.prix_fcfa)} FCFA`}
        </span>
        {estFormationMetier(f) && <UpgradeMetierSticker className="absolute bottom-3 left-3" />}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {f.categorie && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#a84d16]">{f.categorie}</p>
        )}
        <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900">
          <Link href={edition} className="hover:text-[#a84d16]">{f.titre}</Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1"><BarChart className="h-3.5 w-3.5" />{f.niveau}</span>
          {f.duree_estimee && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{f.duree_estimee}</span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {inscrits} inscrit{inscrits > 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {f.live_code && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
              <Radio className="h-3 w-3" />Studia Live · {f.live_code}
            </span>
          )}
          {enAttente > 0 && (
            <Link
              href="/admin/formations/inscriptions"
              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              {enAttente} paiement{enAttente > 1 ? 's' : ''} à valider
            </Link>
          )}
        </div>

        <div className="mt-auto flex items-center gap-1 pt-4">
          <Button asChild size="sm" className="flex-1 bg-[#e97e42] text-white hover:bg-[#d56a2e]">
            <Link href={edition}><Pencil className="mr-1.5 h-4 w-4" />Modifier</Link>
          </Button>
          {f.is_published && (
            <Button asChild variant="ghost" size="icon" title="Voir la fiche publique">
              <a href={`/formations/en-ligne/${f.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Voir la fiche publique de ${f.titre}`}>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            disabled={busy}
            onClick={() => onTogglePublish(f)}
            title={f.is_published ? 'Repasser en brouillon' : 'Publier'}
            aria-label={f.is_published ? `Repasser ${f.titre} en brouillon` : `Publier ${f.titre}`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : f.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={busy}
            onClick={() => onDelete(f)}
            title="Supprimer"
            aria-label={`Supprimer ${f.titre}`}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </article>
  )
}
