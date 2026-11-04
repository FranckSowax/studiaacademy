import { describe, expect, it, vi } from 'vitest'
import { deliverOtp, type OtpDeliveryDeps } from './delivery'
import { parseCollaboratorInput } from './input'
import {
  OTP_LENGTH,
  evaluateOtpAttempt,
  generateOtpCode,
  hashOtp,
  maskEmail,
  maskPhone,
  normalizeOtpInput,
  parseLoginIdentifier,
  type OtpRow,
} from './otp'
import {
  canAccessAdmin,
  canAccessInbox,
  homeForRole,
  isSelfLockout,
  parseStaffRole,
  safeNextPath,
} from './roles'

const SECRET = 'test-secret'
const CHALLENGE = '11111111-1111-4111-8111-111111111111'
const NOW = new Date('2026-11-04T10:00:00Z')

function row(overrides: Partial<OtpRow> = {}): OtpRow {
  return {
    code_hash: hashOtp('123456', CHALLENGE, SECRET),
    expires_at: new Date(NOW.getTime() + 60_000).toISOString(),
    attempts: 0,
    max_attempts: 5,
    consumed_at: null,
    ...overrides,
  }
}

// ── Génération et empreinte ───────────────────
describe('code OTP', () => {
  it('fait toujours 6 chiffres, zéros initiaux compris', () => {
    for (let i = 0; i < 200; i++) expect(generateOtpCode()).toMatch(new RegExp(`^\\d{${OTP_LENGTH}}$`))
  })

  it("l'empreinte dépend du code, du défi et du secret, jamais du code seul", () => {
    const h = hashOtp('123456', CHALLENGE, SECRET)
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(h).not.toContain('123456')
    expect(hashOtp('123457', CHALLENGE, SECRET)).not.toBe(h)
    expect(hashOtp('123456', '22222222-2222-4222-8222-222222222222', SECRET)).not.toBe(h)
    expect(hashOtp('123456', CHALLENGE, 'autre')).not.toBe(h)
  })

  it('refuse un secret vide', () => {
    expect(() => hashOtp('123456', CHALLENGE, '')).toThrow()
  })

  it('nettoie la saisie (espaces, tirets) et exige 6 chiffres', () => {
    expect(normalizeOtpInput(' 123 456 ')).toBe('123456')
    expect(normalizeOtpInput('123-456')).toBe('123456')
    expect(normalizeOtpInput('12345')).toBeNull()
    expect(normalizeOtpInput('1234567')).toBeNull()
  })
})

// ── Vérification ───────────────────────────
describe('evaluateOtpAttempt', () => {
  const good = hashOtp('123456', CHALLENGE, SECRET)
  const bad = hashOtp('000000', CHALLENGE, SECRET)

  it('accepte le bon code dans le délai', () => {
    expect(evaluateOtpAttempt(row(), good, NOW)).toEqual({ kind: 'ok' })
  })

  it('compte les essais restants sur un code faux', () => {
    expect(evaluateOtpAttempt(row(), bad, NOW)).toEqual({ kind: 'invalid', remaining: 4 })
    expect(evaluateOtpAttempt(row({ attempts: 4 }), bad, NOW)).toEqual({ kind: 'invalid', remaining: 0 })
  })

  it('verrouille après le nombre maximal de tentatives, même avec le bon code', () => {
    expect(evaluateOtpAttempt(row({ attempts: 5 }), good, NOW)).toEqual({ kind: 'locked' })
  })

  it('refuse un code expiré (limite incluse), même bon', () => {
    expect(evaluateOtpAttempt(row({ expires_at: NOW.toISOString() }), good, NOW)).toEqual({ kind: 'expired' })
  })

  it('refuse un code déjà utilisé (usage unique)', () => {
    expect(evaluateOtpAttempt(row({ consumed_at: NOW.toISOString() }), good, NOW)).toEqual({ kind: 'used' })
  })

  it("ne plante pas sur une empreinte de longueur différente", () => {
    expect(evaluateOtpAttempt(row(), 'abcd', NOW).kind).toBe('invalid')
    expect(evaluateOtpAttempt(row(), '', NOW).kind).toBe('invalid')
  })
})

// ── Identifiant de connexion ─────────────────
describe('parseLoginIdentifier', () => {
  it('reconnaît un email (minuscules)', () => {
    expect(parseLoginIdentifier(' Awa@Studia.GA ')).toEqual({ kind: 'email', value: 'awa@studia.ga' })
  })
  it('reconnaît un numéro gabonais et le normalise', () => {
    expect(parseLoginIdentifier('07 67 01 58')).toEqual({ kind: 'phone', value: '24107670158' })
    expect(parseLoginIdentifier('+241 07 67 01 58')).toEqual({ kind: 'phone', value: '24107670158' })
  })
  it('rejette le reste', () => {
    expect(parseLoginIdentifier('')).toBeNull()
    expect(parseLoginIdentifier('awa@')).toBeNull()
    expect(parseLoginIdentifier('bonjour')).toBeNull()
  })
  it('masque les destinations', () => {
    expect(maskEmail('awa.ndong@studia.ga')).toBe('aw***@studia.ga')
    expect(maskPhone('24107670158')).toBe('+241 ••• 58')
  })
})

// ── Envoi : WhatsApp d'abord, email en repli ──────
describe('deliverOtp', () => {
  const opts = { brandName: 'Studia', ttlMinutes: 5 }
  const deps = (o: Partial<OtpDeliveryDeps> = {}): OtpDeliveryDeps => ({
    sendWhatsApp: vi.fn(async () => true),
    sendEmail: vi.fn(async () => true),
    ...o,
  })

  it('envoie par WhatsApp quand un numéro existe', async () => {
    const d = deps()
    const channel = await deliverOtp({ full_name: 'Awa', whatsapp_phone: '24107670158', email: 'a@b.ga' }, '123456', opts, d)
    expect(channel).toBe('whatsapp')
    expect(d.sendWhatsApp).toHaveBeenCalledWith('24107670158', expect.stringContaining('123456'))
    expect(d.sendEmail).not.toHaveBeenCalled()
  })

  it("se replie sur l'email si WhatsApp échoue ou lève", async () => {
    for (const sendWhatsApp of [vi.fn(async () => false), vi.fn(async () => Promise.reject(new Error('down')))]) {
      const d = deps({ sendWhatsApp })
      const channel = await deliverOtp({ full_name: 'Awa', whatsapp_phone: '24107670158', email: 'a@b.ga' }, '123456', opts, d)
      expect(channel).toBe('email')
      expect(d.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.ga', text: expect.stringContaining('123456') }))
    }
  })

  it("utilise l'email directement sans numéro WhatsApp", async () => {
    const d = deps()
    expect(await deliverOtp({ full_name: 'Awa', whatsapp_phone: null, email: 'a@b.ga' }, '123456', opts, d)).toBe('email')
    expect(d.sendWhatsApp).not.toHaveBeenCalled()
  })

  it('retourne null si aucun canal ne passe (sans console)', async () => {
    const d = deps({ sendWhatsApp: vi.fn(async () => false), sendEmail: vi.fn(async () => false) })
    expect(await deliverOtp({ full_name: 'Awa', whatsapp_phone: '24107670158', email: 'a@b.ga' }, '123456', opts, d)).toBeNull()
  })

  it('console en dernier recours seulement si fournie (développement)', async () => {
    const logToConsole = vi.fn()
    const d = deps({ sendEmail: vi.fn(async () => false), logToConsole })
    expect(await deliverOtp({ full_name: 'Awa', whatsapp_phone: null, email: 'a@b.ga' }, '123456', opts, d)).toBe('console')
    expect(logToConsole).toHaveBeenCalledWith(expect.stringContaining('123456'))
  })
})

// ── Rôles et accès ─────────────────────────
describe('rôles', () => {
  it('lit uniquement les rôles connus', () => {
    expect(parseStaffRole('agent')).toBe('agent')
    expect(parseStaffRole('user')).toBeNull()
    expect(parseStaffRole(null)).toBeNull()
  })

  it("un agent n'a que la messagerie ; un admin a tout", () => {
    expect(canAccessInbox('agent')).toBe(true)
    expect(canAccessAdmin('agent')).toBe(false)
    expect(canAccessAdmin('admin')).toBe(true)
    expect(canAccessAdmin('super_admin')).toBe(true)
    expect(canAccessInbox(null)).toBe(false)
  })

  it("page d'arrivée selon le rôle", () => {
    expect(homeForRole('admin')).toBe('/admin')
    expect(homeForRole('agent')).toBe('/messagerie')
    expect(homeForRole(null)).toBe('/dashboard')
  })

  it('next : chemin interne autorisé seulement (pas de redirection ouverte)', () => {
    expect(safeNextPath('/messagerie?c=abc', 'agent')).toBe('/messagerie?c=abc')
    expect(safeNextPath('/admin/formations', 'admin')).toBe('/admin/formations')
    expect(safeNextPath('/admin', 'agent')).toBe('/messagerie')
    expect(safeNextPath('//evil.example', 'admin')).toBe('/admin')
    expect(safeNextPath('https://evil.example', 'admin')).toBe('/admin')
    expect(safeNextPath('/\\evil.example', 'admin')).toBe('/admin')
    expect(safeNextPath(null, 'agent')).toBe('/messagerie')
  })

  it("un admin ne peut ni se désactiver ni se rétrograder", () => {
    const me = 'u1'
    expect(isSelfLockout(me, { user_id: me }, { is_active: false })).toBe(true)
    expect(isSelfLockout(me, { user_id: me }, { role: 'agent' })).toBe(true)
    expect(isSelfLockout(me, { user_id: me }, { role: 'admin', is_active: true })).toBe(false)
    expect(isSelfLockout(me, { user_id: 'u2' }, { is_active: false })).toBe(false)
    expect(isSelfLockout(me, { user_id: null }, { is_active: false })).toBe(false)
  })
})

// ── Fiche collaborateur ─────────────────────
describe('parseCollaboratorInput', () => {
  it('normalise email et numéro', () => {
    expect(
      parseCollaboratorInput({ full_name: ' Awa Ndong ', email: 'Awa@Studia.GA', whatsapp_phone: '07 67 01 58', role: 'agent' }),
    ).toEqual({
      ok: true,
      value: { full_name: 'Awa Ndong', email: 'awa@studia.ga', whatsapp_phone: '24107670158', role: 'agent' },
    })
  })

  it('accepte un collaborateur sans WhatsApp (email seul) ou sans email', () => {
    expect(parseCollaboratorInput({ full_name: 'Paul', email: 'paul@x.ga', role: 'admin' }).ok).toBe(true)
    expect(parseCollaboratorInput({ full_name: 'Paul', whatsapp_phone: '06 12 34 56', role: 'agent' }).ok).toBe(true)
  })

  it('exige au moins un moyen de recevoir le code', () => {
    const r = parseCollaboratorInput({ full_name: 'Paul', email: '', whatsapp_phone: '', role: 'agent' })
    expect(r.ok).toBe(false)
  })

  it('rejette rôle inconnu, nom vide, email ou numéro invalides', () => {
    expect(parseCollaboratorInput({ full_name: 'Paul', email: 'paul@x.ga', role: 'super_admin' }).ok).toBe(false)
    expect(parseCollaboratorInput({ full_name: '  ', email: 'paul@x.ga', role: 'agent' }).ok).toBe(false)
    expect(parseCollaboratorInput({ full_name: 'Paul', email: 'paul@', role: 'agent' }).ok).toBe(false)
    expect(parseCollaboratorInput({ full_name: 'Paul', whatsapp_phone: 'abc', role: 'agent' }).ok).toBe(false)
  })
})
