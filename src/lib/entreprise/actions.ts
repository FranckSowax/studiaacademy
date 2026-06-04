'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { buildQuestionSet, DOMAINES } from './competences'
import { catalogueForPrompt, getCatalogueByRef } from './catalogue'
import { niveauFromPct, NIVEAU_LABELS } from './scoring'
import { analyserEffectifsRH } from '@/lib/mistral'
import { sendWhatsApp } from '@/lib/whapi'
import type { CompanyProfile, DomainScore } from '@/types/entreprise'

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = ''
  for (let i = 0; i < 6; i++) c += chars[Math.floor((globalThis.crypto?.getRandomValues?.(new Uint32Array(1))?.[0] ?? 0) % chars.length)]
  return c
}

/** Récupère le profil entreprise de l'utilisateur courant (ou null). */
export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('company_profiles').select('*').eq('user_id', user.id).maybeSingle()
  return data as CompanyProfile | null
}

/** Crée ou met à jour le profil entreprise. */
export async function saveCompanyProfile(input: {
  nom_entreprise: string
  secteur?: string
  effectif_estime?: string
  ville?: string
  contact_nom?: string
  contact_phone?: string
  contact_email?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connexion requise' }
  if (!input.nom_entreprise?.trim()) return { success: false, error: 'Nom de l\'entreprise requis' }

  const { error } = await supabase.from('company_profiles').upsert(
    { user_id: user.id, ...input, nom_entreprise: input.nom_entreprise.trim() },
    { onConflict: 'user_id' }
  )
  if (error) return { success: false, error: error.message }
  revalidatePath('/entreprise/diagnostic')
  return { success: true }
}

/** Crée un diagnostic (test) : snapshot des questions, code + lien, statut ouvert. */
export async function createAssessment(input: {
  titre: string
  description?: string
  domaines: string[]
  niveau_cible?: string
  seuil_analyse?: number
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connexion requise' }

  const { data: company } = await supabase.from('company_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) return { success: false, error: 'Profil entreprise requis' }
  if (!input.titre?.trim()) return { success: false, error: 'Titre requis' }
  if (!input.domaines || input.domaines.length === 0) return { success: false, error: 'Sélectionnez au moins un domaine' }

  const questions = buildQuestionSet(input.domaines)
  if (questions.length === 0) return { success: false, error: 'Aucune question pour ces domaines' }
  const total_points = questions.reduce((s, q) => s + q.points, 0)

  // code unique
  let access_code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: exist } = await supabase.from('company_assessments').select('id').eq('access_code', access_code).maybeSingle()
    if (!exist) break
    access_code = genCode()
  }

  const { data, error } = await supabase
    .from('company_assessments')
    .insert({
      company_id: company.id,
      created_by: user.id,
      titre: input.titre.trim(),
      description: input.description ?? null,
      domaines: input.domaines,
      niveau_cible: input.niveau_cible ?? null,
      questions,
      total_points,
      access_code,
      seuil_analyse: input.seuil_analyse ?? 5,
      status: 'open',
    })
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/entreprise/diagnostic')
  return { success: true, id: data.id }
}

/** Ouvre / ferme un diagnostic. */
export async function setAssessmentStatus(id: string, status: 'open' | 'closed'): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }
  await supabase.from('company_assessments').update({ status }).eq('id', id)
  revalidatePath(`/entreprise/diagnostic/${id}`)
  return { success: true }
}

/** Clôture et lance l'analyse IA agrégée des effectifs. */
export async function analyzeAssessment(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connexion requise' }

  const { data: assessment } = await supabase.from('company_assessments').select('id, domaines, status').eq('id', id).maybeSingle()
  if (!assessment) return { success: false, error: 'Diagnostic introuvable' }

  const { data: subs } = await supabase
    .from('assessment_submissions')
    .select('departement, scores_domaines')
    .eq('assessment_id', id)
    .eq('status', 'scored')
  const submissions = subs ?? []
  if (submissions.length === 0) return { success: false, error: 'Aucune réponse complétée à analyser.' }

  await supabase.from('company_assessments').update({ status: 'analyzing' }).eq('id', id)

  // Agrégat par domaine (pct moyen + répartition par niveau)
  const domaines: Record<string, { sum: number; n: number; rep: Record<string, number> }> = {}
  const departements: Record<string, Record<string, { sum: number; n: number }>> = {}
  for (const s of submissions) {
    const dep = (s.departement as string)?.trim() || 'Non précisé'
    const sd = (s.scores_domaines ?? {}) as Record<string, DomainScore>
    for (const [dom, v] of Object.entries(sd)) {
      if (!domaines[dom]) domaines[dom] = { sum: 0, n: 0, rep: { debutant: 0, intermediaire: 0, avance: 0, expert: 0 } }
      domaines[dom].sum += v.pct; domaines[dom].n += 1
      domaines[dom].rep[niveauFromPct(v.pct)] += 1
      if (!departements[dep]) departements[dep] = {}
      if (!departements[dep][dom]) departements[dep][dom] = { sum: 0, n: 0 }
      departements[dep][dom].sum += v.pct; departements[dep][dom].n += 1
    }
  }
  const aggregate = {
    nb_repondants: submissions.length,
    domaines: Object.fromEntries(Object.entries(domaines).map(([d, v]) => [d, {
      libelle: DOMAINES.find((x) => x.slug === d)?.libelle ?? d,
      pct_moyen: Math.round(v.sum / Math.max(1, v.n)),
      niveau: NIVEAU_LABELS[niveauFromPct(Math.round(v.sum / Math.max(1, v.n)))],
      repartition: v.rep,
    }])),
    departements: Object.fromEntries(Object.entries(departements).map(([dep, doms]) => [dep,
      Object.fromEntries(Object.entries(doms).map(([d, v]) => [d, Math.round(v.sum / Math.max(1, v.n))]))])),
    catalogue_disponible: catalogueForPrompt(),
  }

  let synthese: Record<string, unknown> = {}
  try {
    synthese = await analyserEffectifsRH(aggregate)
  } catch (e) {
    await supabase.from('company_assessments').update({ status: 'closed' }).eq('id', id)
    return { success: false, error: e instanceof Error ? e.message : 'Analyse impossible' }
  }

  await supabase.from('assessment_results').upsert({
    assessment_id: id,
    nb_repondants: submissions.length,
    aggregate,
    synthese,
    generated_at: new Date().toISOString(),
  }, { onConflict: 'assessment_id' })

  await supabase.from('company_assessments').update({ status: 'analyzed' }).eq('id', id)
  revalidatePath(`/entreprise/diagnostic/${id}`)
  revalidatePath(`/entreprise/diagnostic/${id}/rapport`)
  return { success: true }
}

/** Construit la proposition de pack à partir des recommandations de l'analyse. */
export async function generateProposal(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connexion requise' }

  const { data: assessment } = await supabase.from('company_assessments').select('id, company_id, titre').eq('id', id).maybeSingle()
  if (!assessment) return { success: false, error: 'Diagnostic introuvable' }
  const { data: result } = await supabase.from('assessment_results').select('synthese').eq('assessment_id', id).maybeSingle()
  if (!result) return { success: false, error: 'Lancez d\'abord l\'analyse.' }

  const synthese = (result.synthese ?? {}) as { recommandations?: { ref?: string; titre?: string; domaine?: string; justification?: string; prix_fcfa?: number }[]; pack_resume?: string }
  const recos = synthese.recommandations ?? []

  const items = recos.map((r) => {
    const cat = r.ref ? getCatalogueByRef(r.ref) : undefined
    return {
      type: 'formation',
      ref: r.ref ?? null,
      titre: cat?.titre ?? r.titre ?? 'Formation',
      domaine: r.domaine ?? cat?.domaines?.[0] ?? '',
      format: cat?.format ?? '',
      duree: cat?.duree ?? '',
      justification: r.justification ?? '',
      prix_fcfa: r.prix_fcfa ?? cat?.prix_fcfa ?? 0,
    }
  })
  const prix_total = items.reduce((s, i) => s + (i.prix_fcfa || 0), 0)

  const { data: existing } = await supabase.from('training_proposals').select('id').eq('assessment_id', id).maybeSingle()
  const payload = {
    assessment_id: id,
    company_id: assessment.company_id,
    titre: `Pack formation — ${assessment.titre}`,
    resume: synthese.pack_resume ?? '',
    items,
    prix_total_fcfa: prix_total,
    status: 'ready' as const,
  }
  if (existing) await supabase.from('training_proposals').update(payload).eq('id', existing.id)
  else await supabase.from('training_proposals').insert(payload)

  revalidatePath(`/entreprise/diagnostic/${id}/rapport`)
  return { success: true }
}

/** Marque la proposition envoyée + notifie l'équipe commerciale (WhatsApp). */
export async function sendProposal(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connexion requise' }

  const { data: proposal } = await supabase.from('training_proposals').select('id, company_id, titre, prix_total_fcfa').eq('assessment_id', id).maybeSingle()
  if (!proposal) return { success: false, error: 'Aucune proposition à envoyer' }

  await supabase.from('training_proposals').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', proposal.id)

  // Notifier l'équipe Studia
  const studiaPhone = process.env.STUDIA_TEAM_PHONE
  if (studiaPhone) {
    const { data: company } = await supabase.from('company_profiles').select('nom_entreprise, contact_nom, contact_phone').eq('id', proposal.company_id).maybeSingle()
    try {
      await sendWhatsApp(studiaPhone, `🏢 *Nouvelle demande de pack entreprise*\n${company?.nom_entreprise ?? ''}\n👤 ${company?.contact_nom ?? ''} · ${company?.contact_phone ?? ''}\n📦 ${proposal.titre}\n💰 ${proposal.prix_total_fcfa?.toLocaleString('fr-FR')} FCFA`)
    } catch { /* notification best-effort */ }
  }

  revalidatePath(`/entreprise/diagnostic/${id}/rapport`)
  return { success: true }
}
