// ============================================
// Connexion équipe par code (serveur uniquement)
// ============================================
// 1. requestLoginCode : code envoyé par WhatsApp (WAHA), email en repli.
// 2. verifyLoginCode  : code vérifié, puis session Supabase ouverte sans mot
//    de passe (lien magique généré et consommé côté serveur).

import { createHash, randomUUID } from 'node:crypto'
import { getAppConfig } from '@/lib/config/app-config'
import { sendEmail } from '@/lib/email/send'
import { consumeRateLimit, currentClientIp, RATE_LIMITS } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp'
import { deliverOtp } from './delivery'
import {
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  evaluateOtpAttempt,
  generateOtpCode,
  hashOtp,
  normalizeOtpInput,
  parseLoginIdentifier,
  type OtpRow,
} from './otp'
import { parseStaffRole, safeNextPath, type StaffRole } from './roles'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GENERIC_INVALID = 'Code invalide ou expiré. Demandez un nouveau code.'
const TOO_MANY = 'Trop de tentatives. Réessayez dans quelques minutes.'

export type RequestCodeResult = { ok: true; challengeId: string } | { ok: false; error: string }
export type VerifyCodeResult = { ok: true; redirectTo: string } | { ok: false; error: string }

interface CollaboratorRow {
  id: string
  user_id: string | null
  full_name: string
  email: string | null
  whatsapp_phone: string | null
  role: 'admin' | 'agent'
  is_active: boolean
}

function otpSecret(): string {
  // WHY: secret dédié recommandé ; à défaut la clé service_role (déjà secrète,
  // jamais exposée) évite qu'une config incomplète désactive la connexion.
  const secret = process.env.COLLAB_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('COLLAB_OTP_SECRET manquant')
  return secret
}

/** Clé de quota sans donnée personnelle en clair (la table rate_limits est en base). */
function identifierKey(kind: string, value: string): string {
  return `staff-otp-id:${createHash('sha256').update(`${kind}:${value}`).digest('hex').slice(0, 32)}`
}

/**
 * Demande un code de connexion. Réponse identique que le compte existe ou
 * non (pas d'énumération des membres de l'équipe) : un identifiant de défi
 * est toujours renvoyé.
 */
export async function requestLoginCode(identifierRaw: string): Promise<RequestCodeResult> {
  const ip = await currentClientIp()
  if (!(await consumeRateLimit(`staff-otp-ip:${ip}`, RATE_LIMITS.staffOtpRequestPerIp))) {
    return { ok: false, error: TOO_MANY }
  }

  const identifier = parseLoginIdentifier(identifierRaw)
  if (!identifier) return { ok: false, error: 'Saisissez un email ou un numéro WhatsApp valide.' }

  if (!(await consumeRateLimit(identifierKey(identifier.kind, identifier.value), RATE_LIMITS.staffOtpRequestPerIdentifier))) {
    return { ok: false, error: TOO_MANY }
  }

  const challengeId = randomUUID()
  const admin = createAdminClient()
  const { data: collab, error } = await admin
    .from('collaborators')
    .select('id, full_name, email, whatsapp_phone, is_active')
    .eq(identifier.kind === 'email' ? 'email' : 'whatsapp_phone', identifier.value)
    .maybeSingle()
  if (error) {
    console.error('[collab-login] lecture collaborateur impossible:', error.code)
    return { ok: false, error: 'Service indisponible. Réessayez plus tard.' }
  }
  if (!collab || !collab.is_active) return { ok: true, challengeId }

  // Un seul code valide à la fois : les précédents sont annulés.
  await admin
    .from('collaborator_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('collaborator_id', collab.id)
    .is('consumed_at', null)

  const code = generateOtpCode()
  const channel = await deliverOtp(
    collab,
    code,
    { brandName: getAppConfig().brand.name, ttlMinutes: Math.round(OTP_TTL_MS / 60_000) },
    {
      sendWhatsApp,
      sendEmail,
      // WHY: jamais en production — un code journalisé serait lisible dans les logs.
      logToConsole: process.env.NODE_ENV === 'development' ? (line) => console.info(line) : undefined,
    },
  )
  if (!channel) {
    console.error('[collab-login] aucun canal d\'envoi disponible')
    return { ok: false, error: "Le code n'a pas pu être envoyé. Contactez un administrateur." }
  }

  const { error: insertError } = await admin.from('collaborator_otps').insert({
    id: challengeId,
    collaborator_id: collab.id,
    code_hash: hashOtp(code, challengeId, otpSecret()),
    channel,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    max_attempts: OTP_MAX_ATTEMPTS,
  })
  if (insertError) {
    console.error('[collab-login] enregistrement du code impossible:', insertError.code)
    return { ok: false, error: 'Service indisponible. Réessayez plus tard.' }
  }
  return { ok: true, challengeId }
}

/**
 * Compte de connexion du collaborateur : existant, retrouvé par email, ou
 * créé (adresse technique non routable si le collaborateur n'a pas d'email).
 * Retourne l'email du compte, nécessaire au lien magique.
 */
async function ensureAuthUser(collab: CollaboratorRow): Promise<string | null> {
  const admin = createAdminClient()

  if (collab.user_id) {
    const { data } = await admin.auth.admin.getUserById(collab.user_id)
    if (data.user?.email) return data.user.email
  }

  let userId: string | null = null
  let email = collab.email ?? `collab-${collab.id}@equipe.invalid`

  if (collab.email) {
    const { data: existing } = await admin.from('profiles').select('id').eq('email', collab.email).maybeSingle()
    if (existing?.id) userId = existing.id as string
  }

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: collab.full_name },
    })
    if (error || !data.user) {
      console.error('[collab-login] création du compte impossible:', error?.status)
      return null
    }
    userId = data.user.id
    email = data.user.email ?? email
  }

  const { error: linkError } = await admin.from('collaborators').update({ user_id: userId }).eq('id', collab.id)
  if (linkError) {
    console.error('[collab-login] liaison du compte impossible:', linkError.code)
    return null
  }
  return email
}

/**
 * Vérifie le code puis ouvre la session (cookies posés sur la réponse).
 * Chaque essai faux consomme une tentative ; la mise à jour est
 * conditionnelle pour qu'une rafale parallèle ne dépasse pas le plafond.
 */
export async function verifyLoginCode(challengeId: string, codeRaw: string, next: string | null): Promise<VerifyCodeResult> {
  const ip = await currentClientIp()
  if (!(await consumeRateLimit(`staff-otp-verify:${ip}`, RATE_LIMITS.staffOtpVerifyPerIp))) {
    return { ok: false, error: TOO_MANY }
  }

  const code = normalizeOtpInput(codeRaw)
  if (!code) return { ok: false, error: 'Le code contient 6 chiffres.' }
  if (!UUID_RE.test(challengeId)) return { ok: false, error: GENERIC_INVALID }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('collaborator_otps')
    .select('id, collaborator_id, code_hash, expires_at, attempts, max_attempts, consumed_at')
    .eq('id', challengeId)
    .maybeSingle()
  // Défi inconnu (identifiant sans compte) : même réponse qu'un code faux.
  if (!row) return { ok: false, error: GENERIC_INVALID }

  const decision = evaluateOtpAttempt(row as OtpRow, hashOtp(code, challengeId, otpSecret()))
  if (decision.kind === 'invalid') {
    await admin
      .from('collaborator_otps')
      .update({ attempts: row.attempts + 1 })
      .eq('id', row.id)
      .eq('attempts', row.attempts)
      .is('consumed_at', null)
    return {
      ok: false,
      error: decision.remaining > 0 ? `Code incorrect. ${decision.remaining} essai(s) restant(s).` : GENERIC_INVALID,
    }
  }
  if (decision.kind !== 'ok') return { ok: false, error: GENERIC_INVALID }

  // Usage unique, même en cas de double soumission.
  const { data: claimed } = await admin
    .from('collaborator_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('attempts', row.attempts)
    .is('consumed_at', null)
    .select('id')
  if (!claimed || claimed.length === 0) return { ok: false, error: GENERIC_INVALID }

  const { data: collab } = await admin
    .from('collaborators')
    .select('id, user_id, full_name, email, whatsapp_phone, role, is_active')
    .eq('id', row.collaborator_id)
    .maybeSingle()
  if (!collab || !collab.is_active) return { ok: false, error: 'Compte désactivé. Contactez un administrateur.' }

  const email = await ensureAuthUser(collab as CollaboratorRow)
  if (!email) return { ok: false, error: 'Connexion impossible. Contactez un administrateur.' }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = link?.properties?.hashed_token
  if (linkError || !tokenHash) {
    console.error('[collab-login] lien de session impossible:', linkError?.status)
    return { ok: false, error: 'Connexion impossible. Réessayez.' }
  }

  const supabase = await createClient()
  const { error: sessionError } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
  if (sessionError) {
    console.error('[collab-login] ouverture de session impossible:', sessionError.status)
    return { ok: false, error: 'Connexion impossible. Réessayez.' }
  }

  await admin.from('collaborators').update({ last_login_at: new Date().toISOString() }).eq('id', collab.id)

  const { data: effective } = await supabase.rpc('current_staff_role')
  const role: StaffRole | null = parseStaffRole(effective)
  return { ok: true, redirectTo: safeNextPath(next, role) }
}
