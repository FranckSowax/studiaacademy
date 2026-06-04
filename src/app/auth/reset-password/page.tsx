'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Sparkles, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  // Établit la session de récupération depuis le lien e-mail
  useEffect(() => {
    const init = async () => {
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { setError('Lien invalide ou expiré. Refaites une demande.'); setReady(true); return }
      }
      const { data } = await supabase.auth.getSession()
      if (!data.session && !code) setError('Lien invalide ou expiré. Refaites une demande.')
      setReady(true)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('6 caractères minimum'); return }
    if (password !== confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { toast.error(error.message); return }
      toast.success('Mot de passe mis à jour !')
      router.push('/dashboard')
      router.refresh()
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
          <CardTitle className="text-2xl font-bold text-center text-gray-800">Nouveau mot de passe</CardTitle>
          <CardDescription className="text-center text-gray-600">Choisissez un nouveau mot de passe</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-[#e97e42]" /></div>
          ) : error ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-red-500">{error}</p>
              <Link href="/forgot-password" className="inline-flex items-center gap-2 text-[#e97e42] hover:text-[#d56a2e] font-medium text-sm"><ArrowLeft className="w-4 h-4" />Refaire une demande</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42] pr-10" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#e97e42]">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Confirmer</Label>
                <Input type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42]" />
              </div>
              <Button className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white shadow-lg shadow-[#e97e42]/30" type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mise à jour…</> : 'Mettre à jour'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
