'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
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
    })

    socket.on('forumMessages', (fetchedMessages) => {
      setMessages(fetchedMessages)
    })

    socket.on('newForumMessage', (message) => {
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
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Aucun message pour le moment. Soyez le premier à écrire !
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
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