import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidPhone, normalizePhone } from '@/lib/whatsapp'
import { consumeRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { acknowledgeSiteRequest } from '@/lib/inbox/site-request'
import { accesFormationAutorise } from '@/lib/formations/free-access'
import {
  checkProof,
  cleanMessage,
  cleanReference,
  isPaymentMethod,
  paymentSummary,
  PROOF_BUCKET,
  PROOF_MAX_BYTES,
  proofContentType,
  proofPath,
  submissionBlocker,
} from '@/lib/formations/enrollment-payment'
import { estErreurComplet, etatPlaces, MESSAGE_COMPLET, STATUTS_AVEC_PLACE } from '@/lib/formations/places'
import type { EnrollmentStatus } from '@/types/formation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function refuse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

/**
 * POST /api/formations/inscription — demande d'inscription à une formation
 * payante, avec son mode de paiement (multipart/form-data).
 *
 * Champs : formation_id, phone, method ('cash' | 'airtel_money'), reference?,
 * message?, proof (image, obligatoire pour Airtel Money).
 *
 * L'inscription est enregistrée « pending » : seul un admin ouvre l'accès
 * (/admin/formations/inscriptions). Le montant vient de la base, jamais du
 * formulaire.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return refuse('Connectez-vous pour vous inscrire.', 401)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return refuse('Formulaire illisible. Réessayez.')
  }

  const formationId = String(form.get('formation_id') ?? '')
  const method = form.get('method')
  const phone = normalizePhone(String(form.get('phone') ?? ''))
  const reference = cleanReference(form.get('reference'))
  const message = cleanMessage(form.get('message'))
  const proof = form.get('proof')

  if (!UUID_RE.test(formationId)) return refuse('Formation introuvable.', 404)
  if (!isPaymentMethod(method)) return refuse('Choisissez un mode de paiement.')
  if (!isValidPhone(phone)) return refuse('Numéro WhatsApp invalide.')

  if (!(await consumeRateLimit(`enroll:user:${user.id}`, RATE_LIMITS.siteRequestPerIp))) {
    return refuse('Trop de demandes. Réessayez dans une heure ou écrivez-nous sur WhatsApp.', 429)
  }

  // WHY: client service_role — l'élève n'a pas le droit d'écrire lui-même le
  // paiement ni le statut (garde-fou en base) ; tout est contrôlé ici d'abord.
  const admin = createAdminClient()

  const { data: formation } = await admin
    .from('formations')
    .select('*')
    .eq('id', formationId)
    .eq('is_published', true)
    .maybeSingle()
  if (!formation) return refuse('Formation introuvable.', 404)
  const prix = Number(formation.prix_fcfa ?? 0)
  if (!(prix > 0)) return refuse('Cette formation est gratuite : accédez-y directement depuis sa fiche.')
  if (!accesFormationAutorise(formation, user.email)) {
    return refuse("Cette formation n'est pas encore ouverte aux inscriptions.", 403)
  }

  const { data: existing } = await admin
    .from('formation_enrollments')
    .select('*')
    .eq('formation_id', formationId)
    .eq('user_id', user.id)
    .maybeSingle()
  const blocker = submissionBlocker((existing?.status ?? null) as EnrollmentStatus | null)
  if (blocker) return refuse(blocker, 409)

  // Formation à places limitées : refus avant tout envoi de fichier (la base
  // revérifie au moment de l'enregistrement, en cas d'inscriptions simultanées).
  if (typeof formation.places_max === 'number') {
    const { count } = await admin
      .from('formation_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('formation_id', formationId)
      .in('status', [...STATUTS_AVEC_PLACE])
      .neq('user_id', user.id)
    if (etatPlaces(formation.places_max, count)?.complet) return refuse(MESSAGE_COMPLET, 409)
  }

  // Capture d'écran : obligatoire pour Airtel Money, ignorée pour les espèces.
  let path: string | null = null
  if (method === 'airtel_money') {
    if (!(proof instanceof File)) return refuse('Ajoutez la capture d’écran de votre paiement Airtel Money.')
    if (proof.size > PROOF_MAX_BYTES) return refuse('La capture d’écran dépasse 5 Mo. Réduisez-la puis réessayez.')
    const bytes = new Uint8Array(await proof.arrayBuffer())
    const checked = checkProof(bytes)
    if (!checked.ok) return refuse(checked.error)

    path = proofPath(user.id, formationId, checked.ext, Date.now())
    const { error: uploadError } = await admin.storage
      .from(PROOF_BUCKET)
      .upload(path, bytes, { contentType: proofContentType(checked.ext), upsert: false })
    if (uploadError) {
      console.error('[inscription] envoi de la preuve:', uploadError.message)
      return refuse('La capture d’écran n’a pas pu être enregistrée. Réessayez.', 500)
    }
  }

  const { error } = await admin.from('formation_enrollments').upsert(
    {
      formation_id: formationId,
      user_id: user.id,
      status: 'pending',
      phone,
      message,
      payment_method: method,
      payment_amount_fcfa: prix,
      payment_reference: method === 'airtel_money' ? reference : null,
      payment_proof_path: path,
      admin_note: null,
      granted_at: null,
      granted_by: null,
      requested_at: new Date().toISOString(),
    },
    { onConflict: 'formation_id,user_id' },
  )
  if (error) {
    console.error('[inscription] enregistrement:', error.code)
    if (path) await admin.storage.from(PROOF_BUCKET).remove([path])
    if (estErreurComplet(error.message)) return refuse(MESSAGE_COMPLET, 409)
    return refuse('Inscription impossible pour le moment. Écrivez-nous sur WhatsApp.', 500)
  }

  // Nouvelle demande après un refus : l'ancienne capture ne sert plus.
  const oldPath = typeof existing?.payment_proof_path === 'string' ? existing.payment_proof_path : null
  if (oldPath && oldPath !== path) await admin.storage.from(PROOF_BUCKET).remove([oldPath])

  // Accusé WhatsApp : la demande apparaît dans /messagerie avec son paiement.
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  await acknowledgeSiteRequest(phone, {
    kind: 'formation',
    name: profile?.full_name,
    title: formation.titre,
    details: [paymentSummary(method, prix, reference), message].filter(Boolean).join('\n'),
    page: `/formations/en-ligne/${formation.slug}`,
  })

  revalidatePath('/admin/formations/inscriptions')
  revalidatePath(`/formations/en-ligne/${formation.slug}`)
  return NextResponse.json({ success: true })
}
