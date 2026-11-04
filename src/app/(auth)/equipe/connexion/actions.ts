'use server'

import { requestLoginCode, verifyLoginCode, type RequestCodeResult, type VerifyCodeResult } from '@/lib/collaborators/login'

/** Étape 1 : envoi du code (WhatsApp, email en repli). */
export async function requestCodeAction(identifier: string): Promise<RequestCodeResult> {
  return requestLoginCode(String(identifier ?? ''))
}

/** Étape 2 : vérification du code et ouverture de session. */
export async function verifyCodeAction(challengeId: string, code: string, next: string | null): Promise<VerifyCodeResult> {
  return verifyLoginCode(String(challengeId ?? ''), String(code ?? ''), typeof next === 'string' ? next : null)
}
