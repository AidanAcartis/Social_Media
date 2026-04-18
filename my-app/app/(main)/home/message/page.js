'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Avatar from '../../../components/ui/Avatar'
import PrivateChat from '../../../components/chat/PrivateChat'

export default function MessagePage() {
  const { user, loading: authLoading } = useAuth()
  const [friends, setFriends] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Attendre que l'authentification soit chargée
  useEffect(() => {
    if (!authLoading && user) {
      fetchFriends()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  const fetchFriends = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:5000/api/friends', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const friendsList = data.data || []
      
      const friendsData = await Promise.all(
        friendsList.map(async (friend) => {
          try {
            const userRes = await fetch(`http://localhost:5000/api/users/${friend.id}`, {
              credentials: 'include'
            })
            if (userRes.ok) {
              const userData = await userRes.json()
              return { ...userData, lastMessage: null, lastMessageTime: null }
            }
            return friend
          } catch (err) {
            console.error(`Erreur pour l'ami ${friend.id}:`, err)
            return friend
          }
        })
      )
      setFriends(friendsData)
    } catch (error) {
      console.error('Error fetching friends:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <div className="text-center py-10 text-sm text-gray-400">Authentification...</div>
  }

  if (!user) {
    return <div className="text-center py-10 text-sm text-gray-400">Veuillez vous connecter</div>
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-2">Erreur de connexion</div>
        <div className="text-sm text-gray-500">Vérifiez que le backend est démarré sur http://localhost:5000</div>
        <button 
          onClick={() => fetchFriends()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-10 text-sm text-gray-400">Chargement des amis...</div>
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
              <PrivateChat friend={selectedFriend} onClose={() => setSelectedFriend(null)} />
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