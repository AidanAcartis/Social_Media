'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import io from 'socket.io-client'

let socket = null

export default function ForumChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user) return

    socket = io('http://localhost:5000', {
      withCredentials: true
    })

    socket.on('connect', () => {
      console.log('Connecté au serveur WebSocket')
      setIsConnected(true)
      socket.emit('join', user.id)
    })

    socket.on('forumMessages', (fetchedMessages) => {
      console.log('Messages reçus:', fetchedMessages) // Pour déboguer
      setMessages(fetchedMessages)
    })

    socket.on('newForumMessage', (message) => {
      console.log('Nouveau message:', message) // Pour déboguer
      setMessages((prev) => [...prev, message])
    })

    socket.on('disconnect', () => {
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
    if (!newMessage.trim() || !user || !isConnected) return

    socket.emit('sendForumMessage', {
      senderId: user.id,
      username: user.username,
      content: newMessage.trim()
    })
    setNewMessage('')
  }

  return (
    <div className="flex flex-col h-125">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Aucun message pour le moment. Soyez le premier à écrire !
          </div>
        ) : (
          messages.map((msg, index) => {
            // Utilisez sender_id ou user_id pour identifier l'expéditeur
            const senderId = msg.sender_id || msg.user_id
            const isOwn = senderId === user?.id
            
            return (
              <div
                key={index}
                className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar de l'expéditeur (pas celui de l'utilisateur courant) */}
                {!isOwn && <Avatar userId={senderId} size="sm" />}
                
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <p className={`text-sm font-semibold ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                    {isOwn ? 'Moi' : msg.username || `Utilisateur ${senderId}`}
                  </p>
                  <p className="wrap-break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
                
                {/* Avatar de l'utilisateur courant pour ses propres messages */}
                {isOwn && <Avatar userId={user.id} size="sm" />}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!isConnected || !newMessage.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 transition"
        >
          Envoyer
        </button>
      </form>
    </div>
  )
}