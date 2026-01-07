'use client'

import { useActionState } from 'react'
import { signup, AuthState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import Link from 'next/link'
import { useEffect } from 'react'

const initialState: AuthState = {
  error: '',
  success: false,
  message: '',
}

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
    if (state.success && state.message) {
      toast.success(state.message)
    }
  }, [state])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Inscription</CardTitle>
          <CardDescription className="text-center">
            Créez votre compte Studia Academy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jean Dupont"
                required
              />
            </div>
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
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Vous êtes</Label>
              <Select name="role" required defaultValue="individual">
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre profil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Particulier</SelectItem>
                  <SelectItem value="student">Étudiant</SelectItem>
                  <SelectItem value="professional">Professionnel</SelectItem>
                  <SelectItem value="company">Entreprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? 'Inscription en cours...' : "S'inscrire"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Déjà un compte?{' '}
            <Link href="/login" className="underline hover:text-primary">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
