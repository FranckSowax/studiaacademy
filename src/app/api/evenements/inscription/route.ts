import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidPhone, normalizePhone } from '@/lib/whatsapp'
import { clientIpFrom, consumeRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { acknowledgeSiteRequest } from '@/lib/inbox/site-request'
import {
  checkProof,
  cleanReference,
  isPaymentMethod,
  paymentSummary,
  PROOF_BUCKET,
  PROOF_MAX_BYTES,
  proofContentType,
} from '@/lib/formations/enrollment-payment'
import { dateEvenement } from '@/lib/events/rules'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function refuse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

/**
 * POST /api/evenements/inscription — réserve une place à un événement en
 * présentiel (multipart/form-data), avec ou sans compte.
 *
 * Champs : session_id, prenom, nom, phone, email?, et pour un événement
 * payant : method ('cash' | 'airtel_money'), reference?, proof (image,
 * obligatoire pour Airtel Money).
 *
 * La place est retenue tout de suite (décompte atomique). Pour un événement
 * payant, la réservation reste « reserved » jusqu'à la validation du paiement
 * par un admin (/admin/evenements). Le montant vient de la base.
 */
export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return refuse('Formulaire illisible. Réessayez.')
  }

  const sessionId = String(form.get('session_id') ?? '')
  const prenom = String(form.get('prenom') ?? '').trim().slice(0, 60)
  const nom = String(form.get('nom') ?? '').trim().slice(0, 60)
  const phone = normalizePhone(String(form.get('phone') ?? ''))
  const emailBrut = String(form.get('email') ?? '').trim().slice(0, 200)
  const method = form.get('method')
  const reference = cleanReference(form.get('reference'))
  const proof = form.get('proof')

  if (!UUID_RE.test(sessionId)) return refuse('Événement introuvable.', 404)
  if (!prenom || !nom) return refuse('Nom et prénom requis.')
  if (!isValidPhone(phone)) return refuse('Numéro WhatsApp invalide.')
  if (emailBrut && !EMAIL_RE.test(emailBrut)) return refuse('Adresse e-mail invalide.')

  const ip = clientIpFrom(request.headers)
  if (!(await consumeRateLimit(`reserve:ip:${ip}`, RATE_LIMITS.reservationPerIp))) {
    return refuse('Trop de réservations. Réessayez plus tard.', 429)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // Réservation possible sans compte → client service_role (RLS contournée côté serveur)
  const admin = createAdminClient()

  const { data: session } = await admin
    .from('presentiel_sessions')
    .select('id, titre, date_debut, lieu, ville, prix_fcfa, is_published')
    .eq('id', sessionId)
    .maybeSingle()
  if (!session || session.is_published !== true) return refuse('Événement introuvable.', 404)
  if (new Date(session.date_debut as string).getTime() < Date.now() - 24 * 3600 * 1000) {
    return refuse('Cet événement est terminé.', 410)
  }

  const prix = Number(session.prix_fcfa ?? 0)
  const payant = prix > 0
  if (payant && !isPaymentMethod(method)) return refuse('Choisissez un mode de paiement.')

  // Une seule réservation active par numéro et par événement.
  const { data: existantes } = await admin
    .from('presentiel_reservations')
    .select('id, status')
    .eq('session_id', sessionId)
    .eq('phone', phone)
  if ((existantes ?? []).some((r) => r.status !== 'cancelled')) {
    return refuse('Ce numéro a déjà une réservation pour cet événement.', 409)
  }

  // Capture d'écran : contrôlée avant de retenir la place.
  let preuve: { bytes: Uint8Array; ext: 'jpg' | 'png' | 'webp' } | null = null
  if (payant && method === 'airtel_money') {
    if (!(proof instanceof File)) return refuse('Ajoutez la capture d’écran de votre paiement Airtel Money.')
    if (proof.size > PROOF_MAX_BYTES) return refuse('La capture d’écran dépasse 5 Mo. Réduisez-la puis réessayez.')
    const bytes = new Uint8Array(await proof.arrayBuffer())
    const checked = checkProof(bytes)
    if (!checked.ok) return refuse(checked.error)
    preuve = { bytes, ext: checked.ext }
  }

  // WHY: décrément atomique — deux réservations simultanées ne peuvent pas
  // dépasser places_total.
  const { data: seatOk, error: seatError } = await admin.rpc('reserve_presentiel_seat', { p_session_id: sessionId })
  if (seatError) return refuse('Réservation indisponible pour le moment.', 500)
  if (seatOk !== true) return refuse('Cet événement est complet.', 409)
  const liberer = () => admin.rpc('release_presentiel_seat', { p_session_id: sessionId })

  let path: string | null = null
  if (preuve) {
    path = `evenements/${sessionId}/${Date.now()}-${crypto.randomUUID()}.${preuve.ext}`
    const { error: uploadError } = await admin.storage
      .from(PROOF_BUCKET)
      .upload(path, preuve.bytes, { contentType: proofContentType(preuve.ext), upsert: false })
    if (uploadError) {
      console.error('[evenements] envoi de la preuve:', uploadError.message)
      await liberer()
      return refuse('La capture d’écran n’a pas pu être enregistrée. Réessayez.', 500)
    }
  }

  const paiement = payant && isPaymentMethod(method)
    ? {
        payment_method: method,
        payment_amount_fcfa: prix,
        payment_reference: method === 'airtel_money' ? reference : null,
        payment_proof_path: path,
      }
    : {}
  const { error } = await admin.from('presentiel_reservations').insert({
    session_id: sessionId,
    user_id: user?.id ?? null,
    prenom,
    nom,
    email: emailBrut || null,
    phone,
    status: 'reserved',
    ...paiement,
  })
  if (error) {
    console.error('[evenements] réservation:', error.code)
    await liberer()
    if (path) await admin.storage.from(PROOF_BUCKET).remove([path])
    return refuse('Réservation impossible pour le moment. Écrivez-nous sur WhatsApp.', 500)
  }

  // Accusé WhatsApp : la réservation apparaît dans /messagerie
  const lieu = (session.lieu as string | null) || (session.ville as string | null) || 'Libreville'
  await acknowledgeSiteRequest(phone, {
    kind: 'presentiel',
    name: `${prenom} ${nom}`,
    title: `${session.titre} — ${dateEvenement(session.date_debut as string)}, ${lieu}`,
    details: payant && isPaymentMethod(method) ? paymentSummary(method, prix, reference) : null,
    page: '/formations/presentiel',
  })

  revalidatePath('/formations/presentiel')
  revalidatePath('/admin/evenements')
  revalidatePath('/')
  return NextResponse.json({ success: true, payant })
}
