'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
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
import { Eye, EyeOff, Loader2, CheckCircle, Sparkles } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('individual')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        setIsSuccess(true)
        toast.success('Compte créé! Vérifiez votre email pour confirmer.')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf8f3] px-4 py-12">
        <Card className="w-full max-w-md shadow-xl border-[#f0ebe3] bg-white">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Inscription réussie!</h2>
              <p className="text-gray-600 mb-6">
                Un email de confirmation a été envoyé à <span className="font-semibold text-[#e97e42]">{email}</span>.
                Veuillez cliquer sur le lien pour activer votre compte.
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white shadow-lg shadow-[#e97e42]/30"
                  onClick={() => router.push('/login')}
                >
                  Aller à la connexion
                </Button>
                <p className="text-sm text-gray-500">
                  Vous n'avez pas reçu l'email?{' '}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-[#e97e42] hover:text-[#d56a2e] font-medium"
                  >
                    Réessayer
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbf8f3] px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-[#f0ebe3] bg-white">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-2xl flex items-center justify-center shadow-lg shadow-[#e97e42]/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Inscription
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Créez votre compte Studia Academy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-700">Nom complet</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#e97e42]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Minimum 6 caractères</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-700">Vous êtes</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42]">
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
            <Button
              className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white shadow-lg shadow-[#e97e42]/30"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e5e5e5]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">ou continuer avec</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-[#e5e5e5] hover:bg-[#fbf8f3] hover:border-[#e97e42] hover:text-[#e97e42]"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          <div className="mt-6 text-center text-sm text-gray-600">
            Déjà un compte?{' '}
            <Link href="/login" className="text-[#e97e42] hover:text-[#d56a2e] font-medium">
              Se connecter
            </Link>
          </div>

          <p className="mt-4 text-xs text-center text-gray-500">
            En vous inscrivant, vous acceptez nos{' '}
            <Link href="/terms" className="text-[#e97e42] hover:underline">
              Conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/privacy" className="text-[#e97e42] hover:underline">
              Politique de confidentialité
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
