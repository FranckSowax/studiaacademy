'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Sparkles, ArrowLeft, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) { toast.error(error.message); return }
      setSent(true)
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
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
          <CardTitle className="text-2xl font-bold text-center text-gray-800">Mot de passe oublié</CardTitle>
          <CardDescription className="text-center text-gray-600">
            {sent ? 'Vérifiez votre boîte mail' : 'Recevez un lien pour réinitialiser votre mot de passe'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto"><MailCheck className="w-7 h-7 text-green-500" /></div>
              <p className="text-sm text-gray-600">Si un compte existe pour <strong>{email}</strong>, un e-mail avec un lien de réinitialisation vient d&apos;être envoyé.</p>
              <Link href="/login" className="inline-flex items-center gap-2 text-[#e97e42] hover:text-[#d56a2e] font-medium text-sm"><ArrowLeft className="w-4 h-4" />Retour à la connexion</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input id="email" type="email" placeholder="nom@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42]" />
              </div>
              <Button className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white shadow-lg shadow-[#e97e42]/30" type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi…</> : 'Envoyer le lien'}
              </Button>
              <div className="text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42]"><ArrowLeft className="w-4 h-4" />Retour à la connexion</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
