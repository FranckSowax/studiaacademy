'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getProfile, getWallet } from '@/lib/supabase/api'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, Wallet } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  wallet: Wallet | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    wallet: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const supabase = createClient()

  const fetchUserData = useCallback(async (userId: string) => {
    const [profile, wallet] = await Promise.all([
      getProfile(userId),
      getWallet(userId),
    ])
    return { profile, wallet }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return
    const profile = await getProfile(state.user.id)
    setState(prev => ({ ...prev, profile }))
  }, [state.user])

  const refreshWallet = useCallback(async () => {
    if (!state.user) return
    const wallet = await getWallet(state.user.id)
    setState(prev => ({ ...prev, wallet }))
  }, [state.user])

  useEffect(() => {
    let mounted = true

    // Filet de sécurité : ne jamais rester bloqué sur le spinner même si
    // une requête réseau (getSession / profil / wallet) ne répond pas.
    const safety = setTimeout(() => {
      if (mounted) setState(prev => (prev.isLoading ? { ...prev, isLoading: false } : prev))
    }, 6000)

    // Charge profil + wallet en arrière-plan (ne bloque PAS l'auth).
    const loadUserDataInBackground = (userId: string) => {
      fetchUserData(userId)
        .then(({ profile, wallet }) => {
          if (mounted) setState(prev => ({ ...prev, profile, wallet }))
        })
        .catch(() => { /* profil/wallet optionnels pour l'affichage */ })
    }

    // Get initial session — débloque dès qu'on connaît l'état de session.
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session?.user) {
          setState({
            user: session.user,
            session,
            profile: null,
            wallet: null,
            isLoading: false,
            isAuthenticated: true,
          })
          loadUserDataInBackground(session.user.id)
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            wallet: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setState({
            user: session.user,
            session,
            profile: null,
            wallet: null,
            isLoading: false,
            isAuthenticated: true,
          })
          loadUserDataInBackground(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            profile: null,
            wallet: null,
            isLoading: false,
            isAuthenticated: false,
          })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({
            ...prev,
            session,
            user: session.user,
          }))
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safety)
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchUserData])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { data, error }
  }

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    refreshProfile,
    refreshWallet,
  }
}
