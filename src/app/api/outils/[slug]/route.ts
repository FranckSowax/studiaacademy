import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mistralChat } from '@/lib/mistral/client'
import { getServiceBySlug } from '@/lib/ai-services/definitions'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function stripCodeFences(s: string): string {
  return s
    .replace(/^```(?:html|markdown|md)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return NextResponse.json({ error: 'Service introuvable' }, { status: 404 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Connectez-vous pour utiliser cet outil', needLogin: true }, { status: 401 })
  }

  const inputs = (await request.json()) as Record<string, string>

  // Vérifier les champs requis
  for (const f of service.fields) {
    if (f.required && !inputs[f.name]?.trim()) {
      return NextResponse.json({ error: `Champ requis : ${f.label}` }, { status: 400 })
    }
  }

  // ── Crédits (monétisation) ──
  const admin = createAdminClient()
  let creditsApres: number | null = null
  if (service.prixCredits > 0) {
    const { data: wallet } = await admin
      .from('wallets')
      .select('id, balance, total_spent')
      .eq('user_id', user.id)
      .maybeSingle()

    if (wallet) {
      if (wallet.balance < service.prixCredits) {
        return NextResponse.json(
          { error: `Crédits insuffisants (${wallet.balance}/${service.prixCredits}). Rechargez votre solde.`, needCredits: true },
          { status: 402 }
        )
      }
      creditsApres = wallet.balance - service.prixCredits
      await admin
        .from('wallets')
        .update({ balance: creditsApres, total_spent: (wallet.total_spent ?? 0) + service.prixCredits })
        .eq('id', wallet.id)
      await admin.from('transactions').insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: 'service_payment',
        status: 'completed',
        amount: service.prixCredits,
        credits: service.prixCredits,
        description: `Outil IA : ${service.titre}`,
      })
    }
  }

  // ── Génération Mistral ──
  try {
    const { system, user: userMsg } = service.buildPrompt(inputs)
    const raw = await mistralChat({
      model: 'mistral-large-latest',
      temperature: service.outputType === 'html' ? 0.5 : 0.4,
      maxTokens: 8000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
    })
    const output = stripCodeFences(raw)
    return NextResponse.json({ output, outputType: service.outputType, credits: creditsApres })
  } catch (e) {
    // En cas d'échec, rembourser les crédits débités
    if (service.prixCredits > 0 && creditsApres !== null) {
      const { data: w } = await admin.from('wallets').select('id, balance, total_spent').eq('user_id', user.id).maybeSingle()
      if (w) {
        await admin.from('wallets').update({
          balance: w.balance + service.prixCredits,
          total_spent: Math.max(0, (w.total_spent ?? 0) - service.prixCredits),
        }).eq('id', w.id)
      }
    }
    const message = e instanceof Error ? e.message : 'Erreur de génération'
    return NextResponse.json({ error: message }, { status: 200 })
  }
}
