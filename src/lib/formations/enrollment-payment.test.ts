import { describe, expect, it } from 'vitest'
import {
  canDecide,
  checkProof,
  cleanMessage,
  cleanReference,
  detectProofExtension,
  isPaymentMethod,
  paymentSummary,
  proofPath,
  PROOF_MAX_BYTES,
  submissionBlocker,
} from './enrollment-payment'

const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const WEBP = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ')

describe('mode de paiement', () => {
  it('accepte les deux modes prévus et rien d’autre', () => {
    expect(isPaymentMethod('cash')).toBe(true)
    expect(isPaymentMethod('airtel_money')).toBe(true)
    expect(isPaymentMethod('moov_money')).toBe(false)
    expect(isPaymentMethod(null)).toBe(false)
  })
})

describe('capture d’écran du paiement', () => {
  it('reconnaît JPG, PNG et WebP à leurs premiers octets', () => {
    expect(detectProofExtension(JPG)).toBe('jpg')
    expect(detectProofExtension(PNG)).toBe('png')
    expect(detectProofExtension(WEBP)).toBe('webp')
  })

  it('refuse un fichier qui n’est pas une image, quel que soit son nom', () => {
    expect(detectProofExtension(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull()
    expect(detectProofExtension(new TextEncoder().encode('%PDF-1.7 ......'))).toBeNull()
    expect(checkProof(new TextEncoder().encode('<html></html>'))).toEqual({
      ok: false,
      error: 'Envoyez une image JPG, PNG ou WebP.',
    })
  })

  it('refuse un fichier vide ou trop lourd', () => {
    expect(checkProof(new Uint8Array()).ok).toBe(false)
    const big = new Uint8Array(PROOF_MAX_BYTES + 1)
    big.set(JPG)
    expect(checkProof(big)).toEqual({
      ok: false,
      error: 'La capture d’écran dépasse 5 Mo. Réduisez-la puis réessayez.',
    })
  })

  it('accepte une image valide', () => {
    expect(checkProof(PNG)).toEqual({ ok: true, ext: 'png' })
  })

  it('range la preuve dans le dossier de l’élève', () => {
    expect(proofPath('u1', 'f1', 'png', 1700000000000)).toBe('u1/f1-1700000000000.png')
  })
})

describe('saisies libres', () => {
  it('nettoie la référence de transaction', () => {
    expect(cleanReference('  PP240101.1234.A56789 ')).toBe('PP240101.1234.A56789')
    expect(cleanReference('<script>x</script>')).toBe('scriptxscript')
    expect(cleanReference('   ')).toBeNull()
    expect(cleanReference(42)).toBeNull()
    expect(cleanReference('A'.repeat(200))).toHaveLength(60)
  })

  it('borne le message', () => {
    expect(cleanMessage('  bonjour ')).toBe('bonjour')
    expect(cleanMessage('')).toBeNull()
    expect(cleanMessage('x'.repeat(900))).toHaveLength(500)
  })
})

describe('règles de demande et de décision', () => {
  it('bloque une nouvelle demande si l’accès est ouvert ou si une demande attend', () => {
    expect(submissionBlocker('active')).toBe('Vous avez déjà accès à cette formation.')
    expect(submissionBlocker('completed')).toBe('Vous avez déjà accès à cette formation.')
    expect(submissionBlocker('pending')).toBe('Votre demande est déjà en cours de validation.')
  })

  it('autorise une première demande et une nouvelle demande après un refus', () => {
    expect(submissionBlocker(null)).toBeNull()
    expect(submissionBlocker('rejected')).toBeNull()
  })

  it('ne laisse décider que les demandes en attente, ou rouvrir un refus', () => {
    expect(canDecide('pending', 'active')).toBe(true)
    expect(canDecide('pending', 'rejected')).toBe(true)
    expect(canDecide('rejected', 'active')).toBe(true)
    expect(canDecide('rejected', 'rejected')).toBe(false)
    expect(canDecide('active', 'rejected')).toBe(false)
    expect(canDecide('completed', 'active')).toBe(false)
    expect(canDecide(null, 'active')).toBe(false)
  })
})

describe('résumé du paiement', () => {
  it('donne le mode, le montant et la référence', () => {
    expect(paymentSummary('airtel_money', 25000, 'PP1')).toBe('Paiement : Airtel Money — 25 000 FCFA — réf. PP1')
    expect(paymentSummary('cash', 5000)).toBe('Paiement : Espèces sur place — 5 000 FCFA')
  })
})
