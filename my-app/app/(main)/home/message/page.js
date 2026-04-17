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

  // Initialiser Socket.IO
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
      // Mettre à jour l'aperçu dans la liste des amis
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

  // Charger la liste des amis
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
        // Filtrer pour n'avoir que les utilisateurs suivis
        const followers = data.data?.filter(f => f.follower_id === user?.id) || []
        const friendIds = followers.map(f => f.followed_id)
        
        // Récupérer les infos des amis
        const friendsData = await Promise.all(
          friendIds.map(async (id) => {
            const userRes = await fetch(`http://localhost:5000/api/users/${id}`, {
              credentials: 'include'
            })
            if (userRes.ok) {
              return await userRes.json()
            }
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

  // Charger les messages quand un ami est sélectionné
  useEffect(() => {
    if (selectedFriend && user) {
      fetchMessages()
    }
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

  // Auto-scroll
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

    // Optimistic update
    setMessages((prev) => [...prev, messageData])
    setNewMessage('')

    // Envoyer via WebSocket
    if (socket && isConnected) {
      socket.emit('sendPrivateMessage', messageData)
    }

    // Sauvegarder dans la base de données
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
    return <div className="text-center py-10">Chargement...</div>
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <Card noPadding className="h-full flex flex-col overflow-hidden">
        <div className="flex h-full">
          {/* Liste des conversations */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-bold text-lg">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  Aucun ami pour le moment
                </div>
              ) : (
                friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition ${
                      selectedFriend?.id === friend.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Avatar userId={friend.id} size="md" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{friend.username}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {friend.lastMessage || 'Cliquez pour commencer à discuter'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Zone de chat */}
          <div className="flex-1 flex flex-col">
            {selectedFriend ? (
              <>
                {/* En-tête */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Avatar userId={selectedFriend.id} size="md" />
                  <div>
                    <h2 className="font-bold">{selectedFriend.username}</h2>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-xs text-gray-500">
                        {isConnected ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      Aucun message. Commencez la conversation !
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex mb-4 ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
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
                          <p className="overflow-wrap-break-word">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Formulaire */}
                <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Sélectionnez une conversation pour commencer
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}