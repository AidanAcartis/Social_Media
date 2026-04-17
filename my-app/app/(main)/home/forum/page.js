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

  // Initialiser la connexion Socket.IO
  useEffect(() => {
    socket = io('http://localhost:5000', {
      withCredentials: true
    })

    socket.on('connect', () => {
      console.log('Connecté au serveur WebSocket')
      setIsConnected(true)
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

    // Demander les messages existants
    socket.emit('getForumMessages')

    return () => {
      socket.disconnect()
    }
  }, [])

  // Auto-scroll vers le bas quand un nouveau message arrive
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
    <div>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Forum de discussion</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
        </div>

        {/* Zone des messages */}
        <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              Aucun message pour le moment. Soyez le premier à écrire !
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 mb-4 ${
                  msg.senderId === user?.id ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar userId={msg.senderId} size="sm" />
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.senderId === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <p className={`text-sm font-semibold ${msg.senderId === user?.id ? 'text-blue-100' : 'text-gray-600'}`}>
                    {msg.senderId === user?.id ? 'Moi' : msg.username || `Utilisateur ${msg.senderId}`}
                  </p>
                  <p className="break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Formulaire d'envoi */}
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
      </Card>
    </div>
  )
}