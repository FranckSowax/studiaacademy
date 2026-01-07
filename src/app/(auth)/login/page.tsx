'use client'

import { useActionState } from 'react'
import { login, AuthState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { useEffect } from 'react'

const initialState: AuthState = {
  error: '',
  success: false,
  message: '',
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
          <CardDescription className="text-center">
            Entrez vos identifiants pour accéder à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nom@exemple.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Pas encore de compte?{' '}
            <Link href="/signup" className="underline hover:text-primary">
              S'inscrire
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
