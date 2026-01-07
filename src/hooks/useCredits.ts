'use client'

import { useState, useCallback } from 'react'
import { checkCredits, deductCredits, getCreditPacks } from '@/lib/supabase/api'
import type { CreditPack } from '@/types/database'

interface UseCreditsOptions {
  userId: string
  onInsufficientCredits?: () => void
}

export function useCredits({ userId, onInsufficientCredits }: UseCreditsOptions) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([])
  const [isLoadingPacks, setIsLoadingPacks] = useState(false)

  const canAfford = useCallback(
    async (requiredCredits: number): Promise<boolean> => {
      return checkCredits(userId, requiredCredits)
    },
    [userId]
  )

  const spend = useCallback(
    async (
      credits: number,
      description: string,
      serviceId?: string
    ): Promise<boolean> => {
      setIsProcessing(true)
      try {
        const hasEnough = await checkCredits(userId, credits)
        if (!hasEnough) {
          onInsufficientCredits?.()
          return false
        }

        const success = await deductCredits(userId, credits, description, serviceId)
        return success
      } finally {
        setIsProcessing(false)
      }
    },
    [userId, onInsufficientCredits]
  )

  const loadCreditPacks = useCallback(async () => {
    setIsLoadingPacks(true)
    try {
      const packs = await getCreditPacks()
      setCreditPacks(packs)
    } finally {
      setIsLoadingPacks(false)
    }
  }, [])

  return {
    canAfford,
    spend,
    isProcessing,
    creditPacks,
    isLoadingPacks,
    loadCreditPacks,
  }
}
