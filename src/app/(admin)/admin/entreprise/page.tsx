export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Building2, Users, FileBarChart, Package, Send } from 'lucide-react'

const fcfa = (n: number) => (n ?? 0).toLocaleString('fr-FR') + ' FCFA'

export default async function AdminEntreprisePage() {
  const admin = createAdminClient()

  const [{ data: companies }, { data: assessments }, { data: proposals }] = await Promise.all([
    admin.from('company_profiles').select('*').order('created_at', { ascending: false }),
    admin.from('company_assessments').select('id, company_id, titre, status, nb_submissions, created_at'),
    admin.from('training_proposals').select('id, company_id, assessment_id, titre, prix_total_fcfa, status, sent_at, created_at'),
  ])

  const comps = companies ?? []
  const asmts = assessments ?? []
  const props = proposals ?? []

  const byCompanyAsmt = new Map<string, typeof asmts>()
  for (const a of asmts) {
    const arr = byCompanyAsmt.get(a.company_id) ?? []
    arr.push(a); byCompanyAsmt.set(a.company_id, arr)
  }
  const byCompanyProp = new Map<string, typeof props>()
  for (const p of props) {
    const arr = byCompanyProp.get(p.company_id) ?? []
    arr.push(p); byCompanyProp.set(p.company_id, arr)
  }

  const totalParticipants = asmts.reduce((s, a) => s + (a.nb_submissions ?? 0), 0)
  const sentProposals = props.filter((p) => p.status === 'sent')
  const pipeline = sentProposals.reduce((s, p) => s + (p.prix_total_fcfa ?? 0), 0)

  const stats = [
    { icon: Building2, label: 'Entreprises', value: comps.length },
    { icon: FileBarChart, label: 'Diagnostics', value: asmts.length },
    { icon: Users, label: 'Participants', value: totalParticipants },
    { icon: Send, label: 'Devis envoyés', value: sentProposals.length },
  ]

  const statusLabel: Record<string, string> = { draft: 'Brouillon', open: 'Ouvert', closed: 'Clôturé', analyzing: 'Analyse', analyzed: 'Rapport prêt' }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Espace Entreprise</h2>
        <p className="text-muted-foreground text-sm mt-1">Diagnostics de compétences, rapports et propositions de packs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><s.icon className="w-4 h-4" /><span className="text-xs">{s.label}</span></div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
        <div className="bg-gradient-to-br from-[#7C3AED] to-[#4c1d95] rounded-2xl p-5 text-white col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 text-white/80 mb-1"><Package className="w-4 h-4" /><span className="text-xs">Pipeline commercial (devis envoyés)</span></div>
          <p className="text-3xl font-extrabold">{fcfa(pipeline)}</p>
        </div>
      </div>

      {/* Entreprises */}
      {comps.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune entreprise inscrite pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comps.map((c) => {
            const cAsmts = byCompanyAsmt.get(c.id) ?? []
            const cProps = byCompanyProp.get(c.id) ?? []
            const participants = cAsmts.reduce((s, a) => s + (a.nb_submissions ?? 0), 0)
            return (
              <div key={c.id} className="bg-white rounded-2xl border p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{c.nom_entreprise}</h3>
                    <p className="text-sm text-muted-foreground">
                      {[c.secteur, c.ville, c.effectif_estime && `${c.effectif_estime} pers.`].filter(Boolean).join(' · ')}
                    </p>
                    {(c.contact_nom || c.contact_phone) && (
                      <p className="text-xs text-muted-foreground mt-0.5">Contact : {c.contact_nom ?? ''} {c.contact_phone ? `· ${c.contact_phone}` : ''}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">{cAsmts.length} diagnostic{cAsmts.length > 1 ? 's' : ''} · {participants} participants</p>
                    {cProps.length > 0 && <p className="font-semibold text-[#7C3AED]">{cProps.filter((p) => p.status === 'sent').length} devis · {fcfa(cProps.reduce((s, p) => s + (p.prix_total_fcfa ?? 0), 0))}</p>}
                  </div>
                </div>
                {cAsmts.length > 0 && (
                  <div className="border-t pt-3 space-y-1.5">
                    {cAsmts.map((a) => {
                      const prop = cProps.find((p) => p.assessment_id === a.id)
                      return (
                        <div key={a.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{a.titre}</span>
                          <span className="flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">{a.nb_submissions ?? 0} rép.</span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{statusLabel[a.status as string] ?? a.status}</span>
                            {prop && <span className={`px-2 py-0.5 rounded-full ${prop.status === 'sent' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{prop.status === 'sent' ? 'Devis envoyé' : 'Pack prêt'} · {fcfa(prop.prix_total_fcfa ?? 0)}</span>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
