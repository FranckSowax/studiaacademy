'use client'

import { useState } from 'react'
import { Bell, Check, Trash2, Settings, Gift, BookOpen, Trophy, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const notifications = [
  {
    id: 1,
    type: 'achievement',
    icon: Trophy,
    title: 'Nouveau badge obtenu !',
    message: 'Vous avez obtenu le badge "Apprenant Assidu" pour 7 jours consécutifs de connexion.',
    time: 'Il y a 2 heures',
    read: false,
    color: '#e97e42',
  },
  {
    id: 2,
    type: 'course',
    icon: BookOpen,
    title: 'Nouvelle formation disponible',
    message: 'La formation "Excel Avancé : Tableaux Croisés Dynamiques" est maintenant disponible.',
    time: 'Il y a 5 heures',
    read: false,
    color: '#8B5CF6',
  },
  {
    id: 3,
    type: 'promo',
    icon: Gift,
    title: 'Offre spéciale !',
    message: 'Profitez de -30% sur tous les micro-services ce weekend.',
    time: 'Hier',
    read: true,
    color: '#10B981',
  },
  {
    id: 4,
    type: 'system',
    icon: AlertCircle,
    title: 'Mise à jour du système',
    message: 'De nouvelles fonctionnalités ont été ajoutées à votre espace de formation.',
    time: 'Il y a 2 jours',
    read: true,
    color: '#3B82F6',
  },
  {
    id: 5,
    type: 'achievement',
    icon: Trophy,
    title: 'Félicitations !',
    message: 'Vous avez complété 50% de la formation "WordPress & Création de Sites Web".',
    time: 'Il y a 3 jours',
    read: true,
    color: '#e97e42',
  },
]

export default function NotificationsPage() {
  const [notificationsList, setNotificationsList] = useState(notifications)

  const markAllAsRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: number) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const deleteNotification = (id: number) => {
    setNotificationsList((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notificationsList.filter((n) => !n.read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-500">
            Vous avez {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={markAllAsRead}
            className="border-[#e97e42] text-[#e97e42] hover:bg-[#fff7ed]"
          >
            <Check className="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </Button>
          <Button variant="ghost" className="text-gray-400 hover:text-[#e97e42]">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] overflow-hidden">
        {notificationsList.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune notification</h3>
            <p className="text-gray-400">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ebe3]">
            {notificationsList.map((notification) => {
              const Icon = notification.icon
              return (
                <div
                  key={notification.id}
                  className={`p-4 flex items-start gap-4 hover:bg-white transition-colors ${
                    !notification.read ? 'bg-white' : ''
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${notification.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: notification.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-[#e97e42] rounded-full" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-1">{notification.message}</p>
                    <p className="text-xs text-gray-400">{notification.time}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-[#e97e42]"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
