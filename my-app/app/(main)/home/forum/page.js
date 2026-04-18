'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Avatar from '../../../components/ui/Avatar'
import io from 'socket.io-client'

let socket = null

export default function ForumPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    socket = io('http://localhost:5000', {
      withCredentials: true
    })

    socket.on('connect', () => {
      console.log('Connecté au serveur WebSocket')
      setIsConnected(true)
      if (user) {
        socket.emit('join', user.id)
      }
    })

    socket.on('forumMessages', (fetchedMessages) => {
      setMessages(fetchedMessages)
    })

    socket.on('newForumMessage', (message) => {
      setMessages((prev) => [...prev, message])
    })

    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur WebSocket')
      setIsConnected(false)
    })

    socket.emit('getForumMessages')

    return () => {
      socket.disconnect()
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    socket.emit('sendForumMessage', {
      senderId: user.id,
      username: user.username,
      content: newMessage.trim()
    })
    setNewMessage('')
  }

  return (
    <div className="animate-fade-in">
      <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-800">Forum de discussion</h1>
                <p className="text-xs text-gray-400">Échangez avec la communauté</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400">
                {isConnected ? 'Connecté' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>

        <div className="h-125 overflow-y-auto p-5 bg-gray-50/50 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-300">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-gray-400">Aucun message pour le moment.</p>
              <p className="text-xs text-gray-300 mt-0.5">Soyez le premier à écrire !</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                // Utilisez sender_id pour identifier l'expéditeur
                const senderId = msg.sender_id || msg.user_id
                const isOwn = senderId === user?.id
                
                return (
                  <div
                    key={index}
                    className={`flex gap-2.5 items-start ${isOwn ? 'flex-row-reverse' : ''}`}
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    {/* Avatar de l'expéditeur */}
                    <Avatar userId={senderId} size="sm" />
                    
                    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`flex items-baseline gap-1.5 mb-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[11px] font-medium text-gray-500">
                          {isOwn ? 'Vous' : msg.username || `Utilisateur ${senderId}`}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`px-3.5 py-2 text-sm leading-relaxed wrap-break-words ${
                          isOwn
                            ? 'bg-gray-900 text-white rounded-2xl rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-white px-4 py-3">
          <form onSubmit={sendMessage} className="flex gap-2.5 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isConnected ? "Écrivez votre message..." : "Connexion en cours..."}
                disabled={!isConnected}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all duration-150 disabled:opacity-40 placeholder:text-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={!isConnected || !newMessage.trim()}
              className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5 shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Envoyer
            </button>
          </form>
        </div>
      </Card>

      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.15s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}