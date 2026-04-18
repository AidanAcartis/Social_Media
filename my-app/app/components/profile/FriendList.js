'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'

export default function FriendList({ onSelectFriend, selectedFriendId }) {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('friends')

  useEffect(() => {
    if (user) {
      fetchFriends()
      fetchPendingRequests()
    }
  }, [user])

  // Recherche d'utilisateurs
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/friends', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setFriends(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/pending', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPendingRequests(data)
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    setSearching(true)
    try {
      const response = await fetch(`http://localhost:5000/api/search/users?q=${searchTerm}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const sendFriendRequest = async (userId) => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ followed_id: userId })
      })
      if (response.ok) {
        // Mettre à jour le statut dans les résultats de recherche
        setSearchResults(prev => prev.map(u => 
          u.id === userId ? { ...u, requestSent: true, status: 'pending' } : u
        ))
        alert('Demande d\'ami envoyée !')
      } else {
        const error = await response.json()
        alert(error.message || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      alert('Une erreur est survenue')
    }
  }

  const acceptRequest = async (requestId) => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ request_id: requestId })
      })
      if (response.ok) {
        fetchPendingRequests()
        fetchFriends()
      }
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const rejectRequest = async (requestId) => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ request_id: requestId })
      })
      if (response.ok) {
        fetchPendingRequests()
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Chargement...</div>
  }

  return (
    <div>
      {/* Barre de recherche */}
      <div className="mb-4 px-1">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher des utilisateurs..."
            className="w-full px-4 py-2 pl-10 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchTerm.length >= 2 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 mb-2 px-1">
            RÉSULTATS DE RECHERCHE
          </h3>
          <div className="divide-y border rounded-lg overflow-hidden">
            {searching ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                Recherche...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map(result => (
                <div key={result.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar userId={result.id} size="md" />
                    <div>
                      <p className="font-semibold text-sm">{result.username}</p>
                      <p className="text-xs text-gray-500">{result.email}</p>
                      {result.isFollowing === 1 && (
                        <span className="text-xs text-green-600">✓ Ami</span>
                      )}
                      {result.requestSent && (
                        <span className="text-xs text-yellow-600">Demande envoyée</span>
                      )}
                    </div>
                  </div>
                  {result.id !== user?.id && !result.isFollowing && !result.requestSent && (
                    <button
                      onClick={() => sendFriendRequest(result.id)}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition"
                    >
                      Ajouter
                    </button>
                  )}
                  {result.requestSent && (
                    <button
                      disabled
                      className="px-3 py-1 bg-gray-300 text-gray-500 text-xs rounded-full cursor-not-allowed"
                    >
                      En attente
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm">
                Aucun utilisateur trouvé
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onglets (amis et demandes) */}
      {(searchTerm.length === 0 || searchTerm.length < 2) && (
        <>
          <div className="flex border-b mb-3">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 text-sm font-medium transition ${
                activeTab === 'friends'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              Amis ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 text-sm font-medium transition ${
                activeTab === 'requests'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              Demandes ({pendingRequests.length})
            </button>
          </div>

          {/* Liste des amis */}
          {activeTab === 'friends' && (
            <div className="divide-y">
              {friends.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Aucun ami pour le moment
                </div>
              ) : (
                friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => onSelectFriend(friend)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition ${
                      selectedFriendId === friend.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Avatar userId={friend.id} size="md" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">{friend.username}</p>
                      <p className="text-xs text-gray-500">{friend.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Demandes en attente */}
          {activeTab === 'requests' && (
            <div className="divide-y">
              {pendingRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Aucune demande en attente
                </div>
              ) : (
                pendingRequests.map(request => (
                  <div key={request.request_id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Avatar userId={request.id} size="md" />
                      <div>
                        <p className="font-semibold text-sm">{request.username}</p>
                        <p className="text-xs text-gray-500">Demande d'ami</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(request.request_id)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => rejectRequest(request.request_id)}
                        className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-400"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}