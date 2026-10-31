import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mistralChat } from '@/lib/mistral/client'
import { getServiceBySlug } from '@/lib/ai-services/definitions'
import { consumeRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const FORMAT_RICHE = `

MISE EN FORME (IMPORTANT) — ta réponse sera affichée comme une fiche HTML interactive :
- Commence par un titre principal « # ... » puis découpe TOUT le contenu en sections « ## ... » explicites (une idée par section).
- Pour des définitions / du vocabulaire : crée une section « ## Définitions » où CHAQUE puce suit EXACTEMENT le format « **Terme** : explication » (elles deviennent des cartes à retourner).
- Pour des démarches, étapes, actions ou points à vérifier : crée une section dont le titre contient « Checklist » / « Étapes » / « À faire » avec une puce par élément (elles deviennent des cases à cocher).
- Mets les conseils/astuces dans une section « ## Astuces » ou « ## Conseils », et les mises en garde dans une section « ## Important ».
- Mets en **gras** les éléments clés. Utilise des tableaux Markdown pour les données chiffrées. N'ajoute aucune balise HTML.`

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
    // WHY: débit atomique en base (solde vérifié et décrémenté en une requête).
    // Un wallet absent n'est plus synonyme de gratuité.
    const { data: newBalance, error: debitError } = await admin.rpc('consume_credits', {
      p_user_id: user.id,
      p_amount: service.prixCredits,
      p_description: `Outil IA : ${service.titre}`,
    })
    if (debitError) {
      return NextResponse.json({ error: 'Service de crédits indisponible' }, { status: 503 })
    }
    if (newBalance === null) {
      return NextResponse.json(
        { error: `Crédits insuffisants (${service.prixCredits} requis). Rechargez votre solde.`, needCredits: true },
        { status: 402 }
      )
    }
    creditsApres = newBalance as number
  } else if (!(await consumeRateLimit(`ai:${user.id}`, RATE_LIMITS.aiPerUser))) {
    // Outils gratuits : quota horaire pour protéger le budget Mistral.
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une heure.' }, { status: 429 })
  }

  // ── Génération Mistral ──
  try {
    const { system, user: userMsg } = service.buildPrompt(inputs)
    const systemFull = service.outputType === 'markdown' ? system + FORMAT_RICHE : system
    const raw = await mistralChat({
      model: 'mistral-large-latest',
      temperature: service.outputType === 'html' ? 0.5 : 0.4,
      maxTokens: 8000,
      messages: [
        { role: 'system', content: systemFull },
        { role: 'user', content: userMsg },
      ],
    })
    const output = stripCodeFences(raw)

    // ── Sauvegarde du résultat (historique « Mes documents ») ──
    // Via le client admin pour garantir l'enregistrement ; n'interrompt jamais la réponse.
    try {
      await admin.from('outil_generations').insert({
        user_id: user.id,
        tool_slug: service.slug,
        title: service.titre,
        inputs,
        output,
        output_type: service.outputType,
        credits_used: service.prixCredits,
      })
    } catch (saveErr) {
      console.error('outil_generations insert failed:', saveErr)
    }

    return NextResponse.json({ output, outputType: service.outputType, credits: creditsApres })
  } catch (e) {
    // En cas d'échec, rembourser les crédits débités
    if (service.prixCredits > 0 && creditsApres !== null) {
      await admin.rpc('refund_credits', {
        p_user_id: user.id,
        p_amount: service.prixCredits,
        p_description: `Remboursement (échec) : ${service.titre}`,
      })
    }
    console.error('[outils] génération échouée:', e instanceof Error ? e.message : e)
    return NextResponse.json(
      { error: 'La génération a échoué. Vos crédits ont été remboursés.' },
      { status: 200 }
    )
  }
}
