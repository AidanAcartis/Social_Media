'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import io from 'socket.io-client'

let socket = null

export default function PrivateChat({ friend, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user || !friend) return

    socket = io('http://localhost:5000', {
      withCredentials: true
    })

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join', user.id)
    })

    socket.on('newPrivateMessage', (message) => {
      if (message.senderId === friend.id || message.receiverId === friend.id) {
        setMessages((prev) => [...prev, message])
      }
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    fetchMessages()

    return () => {
      socket.disconnect()
    }
  }, [user, friend])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${friend.id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !friend) return

    const messageData = {
      senderId: user.id,
      receiverId: friend.id,
      content: newMessage.trim(),
      createdAt: new Date().toISOString()
    }

    setMessages((prev) => [...prev, messageData])
    setNewMessage('')

    if (socket && isConnected) {
      socket.emit('sendPrivateMessage', messageData)
    }

    try {
      await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(messageData)
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  if (!friend) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Avatar userId={friend.id} size="md" />
          <div>
            <h3 className="font-semibold">{friend.username}</h3>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Aucun message. Commencez la conversation !
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.senderId !== user?.id && (
                <Avatar userId={msg.senderId} size="sm" className="mr-2" />
              )}
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.senderId === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border shadow-sm'
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 transition"
        >
          Envoyer
        </button>
      </form>
    </div>
  )
}