'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'

export default function FriendList({ onSelectFriend, selectedFriendId }) {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFriends()
    }
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

  if (loading) {
    return <div className="text-center py-4">Chargement des amis...</div>
  }

  if (friends.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Aucun ami pour le moment. Commencez à suivre des utilisateurs !
      </div>
    )
  }

  return (
    <div className="divide-y">
      {friends.map(friend => (
        <button
          key={friend.id}
          onClick={() => onSelectFriend(friend)}
          className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition ${
            selectedFriendId === friend.id ? 'bg-blue-50' : ''
          }`}
        >
          <Avatar userId={friend.id} size="md" />
          <div className="flex-1 text-left">
            <p className="font-semibold">{friend.username}</p>
            <p className="text-sm text-gray-500">{friend.email}</p>
          </div>
        </button>
      ))}
    </div>
  )
}