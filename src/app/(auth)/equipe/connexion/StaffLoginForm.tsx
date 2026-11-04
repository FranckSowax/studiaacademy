'use client'

import { useState, useTransition } from 'react'
import { KeyRound, Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requestCodeAction, verifyCodeAction } from './actions'

export function StaffLoginForm({ next }: { next: string | null }) {
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const requestCode = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await requestCodeAction(identifier)
      if (!res.ok) return setError(res.error)
      setChallengeId(res.challengeId)
      setCode('')
    })
  }

  const verify = (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeId) return
    setError(null)
    startTransition(async () => {
      const res = await verifyCodeAction(challengeId, code, next)
      if (!res.ok) return setError(res.error)
      // Navigation complète : le middleware relit la nouvelle session.
      window.location.assign(res.redirectTo)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbf8f3] px-4 py-12">
      <Card className="w-full max-w-md border-[#f0ebe3] bg-white shadow-xl">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e97e42] to-[#d56a2e] shadow-lg shadow-[#e97e42]/20">
              <KeyRound className="size-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold text-gray-800">Connexion équipe</CardTitle>
          <CardDescription className="text-center text-gray-600">
            {challengeId
              ? 'Si un compte équipe correspond, un code vient de partir par WhatsApp (ou par email à défaut). Il expire dans 5 minutes.'
              : 'Recevez un code de connexion sur votre WhatsApp. Pas de WhatsApp ? Saisissez votre email.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!challengeId ? (
            <form onSubmit={requestCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Numéro WhatsApp ou email</Label>
                <Input
                  id="identifier"
                  autoComplete="username"
                  placeholder="07 67 01 58 ou nom@studia.ga"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full bg-[#e97e42] text-white hover:bg-[#d56a2e]" disabled={pending}>
                {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageCircle className="mr-2 size-4" />}
                Recevoir mon code
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code à 6 chiffres</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={9}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-2xl tracking-[0.4em]"
                  autoFocus
                  required
                />
              </div>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full bg-[#e97e42] text-white hover:bg-[#d56a2e]" disabled={pending}>
                {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Se connecter
              </Button>
              <button
                type="button"
                className="w-full text-sm text-gray-500 hover:text-[#e97e42]"
                onClick={() => {
                  setChallengeId(null)
                  setError(null)
                }}
              >
                Changer d&apos;identifiant ou renvoyer un code
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
