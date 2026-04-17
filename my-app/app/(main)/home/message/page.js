'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Avatar from '../../../components/ui/Avatar'
import io from 'socket.io-client'

let socket = null

export default function MessagePage() {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
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

    socket.on('newPrivateMessage', (message) => {
      if (selectedFriend && message.senderId === selectedFriend.id) {
        setMessages((prev) => [...prev, message])
      }
      setFriends(prev => prev.map(friend =>
        friend.id === message.senderId
          ? { ...friend, lastMessage: message.content, lastMessageTime: message.createdAt }
          : friend
      ))
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [user])

  useEffect(() => {
    fetchFriends()
  }, [user])

  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/friends', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const followers = data.data?.filter(f => f.follower_id === user?.id) || []
        const friendIds = followers.map(f => f.followed_id)

        const friendsData = await Promise.all(
          friendIds.map(async (id) => {
            const userRes = await fetch(`http://localhost:5000/api/users/${id}`, {
              credentials: 'include'
            })
            if (userRes.ok) return await userRes.json()
            return null
          })
        )
        setFriends(friendsData.filter(f => f))
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedFriend && user) fetchMessages()
  }, [selectedFriend])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${selectedFriend.id}`, {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedFriend || !user) return

    const messageData = {
      senderId: user.id,
      receiverId: selectedFriend.id,
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

  if (loading) {
    return <div className="text-center py-10 text-sm text-gray-400">Chargement...</div>
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <Card noPadding className="h-full flex flex-col overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
        <div className="flex h-full">

          {/* Liste des conversations */}
          <div className="w-72 border-r border-gray-100 flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="text-center text-gray-300 text-sm py-12">
                  Aucun ami pour le moment
                </div>
              ) : (
                friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors duration-100 ${
                      selectedFriend?.id === friend.id
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Avatar userId={friend.id} size="md" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-800">{friend.username}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {friend.lastMessage || 'Commencer à discuter'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Zone de chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedFriend ? (
              <>
                {/* En-tête */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
                  <Avatar userId={selectedFriend.id} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{selectedFriend.username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-300'}`}></div>
                      <span className="text-xs text-gray-400">
                        {isConnected ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50/50 flex flex-col gap-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-300 text-sm py-12">
                      Aucun message. Commencez la conversation !
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex items-end gap-2 ${msg.senderId === user?.id ? 'flex-row-reverse' : ''}`}
                      >
                        {msg.senderId !== user?.id && (
                          <Avatar userId={msg.senderId} size="sm" />
                        )}
                        <div
                          className={`max-w-[68%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                            msg.senderId === user?.id
                              ? 'bg-gray-900 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.senderId === user?.id ? 'text-gray-400' : 'text-gray-300'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
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
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            )}
          </div>

        </div>
      </Card>
    </div>
  )
}