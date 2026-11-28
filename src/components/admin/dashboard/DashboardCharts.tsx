'use client'

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { PointSerie } from '@/lib/admin/dashboard-metrics'

const ENCRE = { texte: '#0b0b0b', secondaire: '#52514e', discret: '#898781', grille: '#e1e0d9', axe: '#c3c2b7' }

export type Unite = 'nombre' | 'fcfa'
type Cle = 'comptes' | 'enLigne' | 'presentiel' | 'airtel' | 'especes'
export interface Serie {
  cle: Cle
  label: string
  couleur: string
}

const milliers = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))
const valeurLisible = (n: number, unite: Unite) => (unite === 'fcfa' ? `${milliers(n)} FCFA` : milliers(n))
/** Graduations compactes : 25 000 → « 25 k ». */
const graduation = (n: number, unite: Unite) =>
  unite === 'fcfa' && n >= 1000 ? `${milliers(n / 1000)} k` : milliers(n)

interface InfoBulleProps {
  active?: boolean
  label?: string | number
  payload?: { dataKey?: string | number; value?: number | string }[]
  series: Serie[]
  unite: Unite
}

/** Info-bulle : le texte reste en encre neutre, la pastille porte la couleur de la série. */
function InfoBulle({ active, label, payload, series, unite }: InfoBulleProps) {
  if (!active || !payload?.length) return null
  const lignes = series.map((s) => ({ ...s, valeur: Number(payload.find((p) => p.dataKey === s.cle)?.value ?? 0) }))
  const total = lignes.reduce((somme, l) => somme + l.valeur, 0)
  return (
    <div className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-[#0b0b0b]">{label}</p>
      {lignes.map((l) => (
        <p key={l.cle} className="flex items-center gap-2 text-[#52514e]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.couleur }} />
          {l.label}
          <span className="ml-auto pl-3 font-semibold tabular-nums text-[#0b0b0b]">{valeurLisible(l.valeur, unite)}</span>
        </p>
      ))}
      {lignes.length > 1 && (
        <p className="mt-1 flex border-t border-black/10 pt-1 text-[#52514e]">
          Total
          <span className="ml-auto pl-3 font-semibold tabular-nums text-[#0b0b0b]">{valeurLisible(total, unite)}</span>
        </p>
      )}
    </div>
  )
}

function Legende({ series }: { series: Serie[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#52514e]">
      {series.map((s) => (
        <li key={s.cle} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.couleur }} />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

const axeX = {
  dataKey: 'label',
  tickLine: false,
  axisLine: { stroke: ENCRE.axe },
  tick: { fontSize: 11, fill: ENCRE.discret },
  minTickGap: 24,
  interval: 'preserveStartEnd' as const,
}
const axeY = (unite: Unite) => ({
  tickLine: false,
  axisLine: false,
  allowDecimals: false,
  width: 44,
  tick: { fontSize: 11, fill: ENCRE.discret },
  tickFormatter: (v: number) => graduation(v, unite),
})

/** Tableau équivalent au graphique, pour les lecteurs d'écran. */
function TableauAccessible({ titre, data, series, unite }: { titre: string; data: PointSerie[]; series: Serie[]; unite: Unite }) {
  return (
    <table className="sr-only">
      <caption>{titre}</caption>
      <thead>
        <tr>
          <th scope="col">Période</th>
          {series.map((s) => <th key={s.cle} scope="col">{s.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((p, i) => (
          <tr key={`${p.label}-${i}`}>
            <th scope="row">{p.label}</th>
            {series.map((s) => <td key={s.cle}>{valeurLisible(p[s.cle], unite)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Courbe d'une seule mesure dans le temps (aire légère, trait de 2 px).
 *
 * @example
 * <CourbeTendance titre="Nouveaux comptes" data={t.serie} serie={{ cle: 'comptes', label: 'Comptes créés', couleur: COULEURS.orange }} />
 */
export function CourbeTendance({ titre, data, serie, unite = 'nombre' }: { titre: string; data: PointSerie[]; serie: Serie; unite?: Unite }) {
  return (
    <figure className="m-0">
      <div className="h-64 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={ENCRE.grille} />
            <XAxis {...axeX} />
            <YAxis {...axeY(unite)} />
            <Tooltip
              cursor={{ stroke: ENCRE.axe, strokeWidth: 1 }}
              content={(p) => <InfoBulle {...(p as unknown as InfoBulleProps)} series={[serie]} unite={unite} />}
            />
            <Area
              type="monotone"
              dataKey={serie.cle}
              stroke={serie.couleur}
              strokeWidth={2}
              fill={serie.couleur}
              fillOpacity={0.12}
              dot={false}
              activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <TableauAccessible titre={titre} data={data} series={[serie]} unite={unite} />
    </figure>
  )
}

/**
 * Barres empilées dans le temps (2 séries au plus), avec légende.
 * Un liseré blanc de 2 px sépare les segments ; seul le sommet est arrondi.
 */
export function BarresEmpilees({ titre, data, series, unite = 'nombre' }: { titre: string; data: PointSerie[]; series: Serie[]; unite?: Unite }) {
  return (
    <figure className="m-0">
      <Legende series={series} />
      <div className="h-60 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={ENCRE.grille} />
            <XAxis {...axeX} />
            <YAxis {...axeY(unite)} />
            <Tooltip
              cursor={{ fill: 'rgba(11,11,11,0.04)' }}
              content={(p) => <InfoBulle {...(p as unknown as InfoBulleProps)} series={series} unite={unite} />}
            />
            {series.map((s, i) => (
              <Bar
                key={s.cle}
                dataKey={s.cle}
                stackId="pile"
                fill={s.couleur}
                stroke="#ffffff"
                strokeWidth={2}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableauAccessible titre={titre} data={data} series={series} unite={unite} />
    </figure>
  )
}
