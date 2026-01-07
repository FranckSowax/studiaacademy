'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/supabase/api'
import type { Notification } from '@/types/database'

interface UseNotificationsOptions {
  userId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useNotifications({
  userId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    const data = await getNotifications(userId)
    setNotifications(data)
    setUnreadCount(data.filter(n => !n.is_read).length)
    setIsLoading(false)
  }, [userId])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const success = await markNotificationAsRead(notificationId)
      if (success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      return success
    },
    []
  )

  const markAllAsRead = useCallback(async () => {
    const success = await markAllNotificationsAsRead(userId)
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    }
    return success
  }, [userId])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Subscribe to realtime notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchNotifications, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}
