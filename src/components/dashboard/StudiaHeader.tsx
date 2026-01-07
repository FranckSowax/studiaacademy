'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Bell, MessageSquare } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'

interface StudiaHeaderProps {
  onProfileToggle?: () => void
}

export function StudiaHeader({ onProfileToggle }: StudiaHeaderProps) {
  const { profile, isLoading } = useAuthContext()
  const [searchQuery, setSearchQuery] = useState('')

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">
          {isLoading ? (
            'Chargement...'
          ) : (
            <>Bienvenue, {profile?.full_name || 'Utilisateur'} 👋</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-72 pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-orange-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
            ⌘K
          </span>
        </div>

        {/* Messages */}
        <Link
          href="/dashboard/messages"
          className="relative p-3 bg-white/80 backdrop-blur-sm rounded-2xl hover:bg-white transition-colors border border-orange-100"
        >
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Link>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl hover:bg-white transition-colors border border-orange-100"
        >
          <Bell className="w-5 h-5 text-gray-600" />
        </Link>

        {/* User Avatar */}
        <button
          onClick={onProfileToggle}
          className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200 hover:shadow-xl transition-shadow"
        >
          {isLoading ? '...' : getInitials(profile?.full_name)}
        </button>
      </div>
    </header>
  )
}
