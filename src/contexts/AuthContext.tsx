'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { Profile, Wallet } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  wallet: Wallet | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ data: { url: string | null; provider: string } | null; error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ data: object | null; error: AuthError | null }>
  updatePassword: (newPassword: string) => Promise<{ data: { user: User | null } | null; error: AuthError | null }>
  refreshProfile: () => Promise<void>
  refreshWallet: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// Re-export for convenience
export { AuthContext }
