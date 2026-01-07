'use client'

import { useState } from 'react'
import { MessageSquare, Search, Send, MoreVertical, Phone, Video } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const conversations = [
  {
    id: 1,
    name: 'Support Studia',
    avatar: '🎓',
    lastMessage: 'Votre demande a été traitée avec succès.',
    time: '10:30',
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: 'Marie Nguema',
    avatar: '👩‍🏫',
    lastMessage: 'Merci pour votre participation au cours !',
    time: 'Hier',
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: 'Patrick Mba',
    avatar: '👨‍💻',
    lastMessage: 'Le nouveau module est disponible.',
    time: 'Lun',
    unread: 1,
    online: true,
  },
]

const messages = [
  { id: 1, sender: 'support', text: 'Bonjour ! Comment puis-je vous aider ?', time: '10:25' },
  { id: 2, sender: 'me', text: "J'ai une question concernant mon abonnement.", time: '10:27' },
  { id: 3, sender: 'support', text: 'Bien sûr, je suis là pour vous aider. Quelle est votre question ?', time: '10:28' },
  { id: 4, sender: 'me', text: 'Comment puis-je passer à la formule Premium ?', time: '10:29' },
  { id: 5, sender: 'support', text: 'Votre demande a été traitée avec succès.', time: '10:30' },
]

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState('')

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <p className="text-gray-500">Communiquez avec les formateurs et le support</p>
        </div>
      </div>

      <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] h-[calc(100%-5rem)] flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-[#f0ebe3] flex flex-col">
          <div className="p-4 border-b border-[#f0ebe3]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-[#fbf8f3] transition-colors ${
                  selectedConversation.id === conv.id ? 'bg-[#fff7ed]' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-[#fbf8f3] rounded-full flex items-center justify-center text-2xl">
                    {conv.avatar}
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{conv.name}</span>
                    <span className="text-xs text-gray-400">{conv.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 bg-[#e97e42] text-white text-xs rounded-full flex items-center justify-center">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#f0ebe3] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#fbf8f3] rounded-full flex items-center justify-center text-xl">
                {selectedConversation.avatar}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{selectedConversation.name}</h3>
                <p className="text-xs text-green-500">
                  {selectedConversation.online ? 'En ligne' : 'Hors ligne'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#e97e42]">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#e97e42]">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#e97e42]">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    msg.sender === 'me'
                      ? 'bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white'
                      : 'bg-[#fbf8f3] text-gray-800'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-white/70' : 'text-gray-400'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#f0ebe3]">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Écrivez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border-[#e5e5e5] focus:border-[#e97e42] focus:ring-[#e97e42]"
              />
              <Button className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
