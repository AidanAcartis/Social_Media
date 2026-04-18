'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import Avatar from '../ui/Avatar'

export default function PrivateChat({ friend, onClose }) {
  const { user } = useAuth()
  const { getSocket, getIsConnected } = useNotifications()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const messageIdsRef = useRef(new Set())

  useEffect(() => {
    if (!user || !friend) return

    const socket = getSocket()

    if (socket) {
      const handleNewMessage = (message) => {
        const senderId = message.sender_id || message.senderId
        const receiverId = message.receiver_id || message.receiverId
        
        // Ne pas ajouter le message si c'est l'expéditeur (déjà ajouté via l'envoi)
        if (senderId === user.id) {
          console.log('Message ignoré (c\'est moi qui l\'ai envoyé)')
          return
        }
        
        // Vérifier si le message concerne cette conversation
        if ((senderId === friend.id && receiverId === user.id)) {
          const messageId = message.id
          // Éviter les doublons
          if (!messageIdsRef.current.has(messageId)) {
            messageIdsRef.current.add(messageId)
            setMessages((prev) => [...prev, message])
          }
        }
      }
      
      socket.on('newPrivateMessage', handleNewMessage)
      
      return () => {
        socket.off('newPrivateMessage', handleNewMessage)
      }
    }
  }, [user, friend, getSocket])

  useEffect(() => {
    if (user && friend) {
      fetchMessages()
    }
  }, [user, friend])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${friend.id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        messageIdsRef.current.clear()
        data.forEach(msg => messageIdsRef.current.add(msg.id))
        setMessages(data)
      } else {
        console.error('Erreur fetch messages:', response.status)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !friend) return

    const messageContent = newMessage.trim()
    const tempId = `temp_${Date.now()}`

    const tempMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: friend.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      is_read: 0
    }

    messageIdsRef.current.add(tempId)
    setMessages((prev) => [...prev, tempMessage])
    setNewMessage('')

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: friend.id, content: messageContent })
      })

      if (response.ok) {
        const savedMessage = await response.json()
        messageIdsRef.current.delete(tempId)
        messageIdsRef.current.add(savedMessage.id)

        setMessages(prev => {
          // Supprimer le message temporaire
          const filtered = prev.filter(msg => msg.id !== tempId)
          // Vérifier si le message sauvegardé n'existe pas déjà
          if (!filtered.some(msg => msg.id === savedMessage.id)) {
            return [...filtered, savedMessage]
          }
          return filtered
        })
      }
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  if (!friend) return null

  return (
    <div className="flex flex-col h-full bg-white">
      {/* En-tête */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <Avatar userId={friend.id} size="md" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{friend.username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${getIsConnected() ? 'bg-emerald-400' : 'bg-gray-300'}`}></div>
              <span className="text-xs text-gray-400">
                {getIsConnected() ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50/50 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Aucun message</p>
            <p className="text-xs">Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderId = msg.sender_id || msg.senderId
            const isOwn = senderId === user?.id
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} animate-slide-in`}
              >
                {!isOwn && (
                  <Avatar userId={senderId} size="sm" />
                )}
                <div
                  className={`max-w-[68%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isOwn
                      ? 'bg-gray-900 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-gray-400' : 'text-gray-300'}`}>
                    {new Date(msg.created_at || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulaire */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <form onSubmit={sendMessage} className="flex gap-2.5 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all duration-150 placeholder:text-gray-300"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Envoyer
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  )
}