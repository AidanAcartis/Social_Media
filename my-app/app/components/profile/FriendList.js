'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'

export default function FriendList({ userId }) {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchFriends()
    }
  }, [userId])

  const fetchFriends = async () => {
    try {
      // Récupérer la liste des followers/following
      const response = await fetch('http://localhost:5000/api/friends', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        
        // Filtrer les amis de l'utilisateur
        const userFriends = data.data?.filter(
          f => f.follower_id === userId || f.followed_id === userId
        ) || []
        
        // Récupérer les IDs uniques des amis
        const friendIds = new Set()
        userFriends.forEach(f => {
          if (f.follower_id === userId) friendIds.add(f.followed_id)
          if (f.followed_id === userId) friendIds.add(f.follower_id)
        })
        
        // Récupérer les détails des amis
        const friendsData = await Promise.all(
          Array.from(friendIds).map(async (id) => {
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
    return <div className="text-center py-4 text-gray-500">Chargement des amis...</div>
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {userId === user?.id 
          ? "Vous n'avez pas encore d'amis. Commencez à suivre des utilisateurs !"
          : "Cet utilisateur n'a pas encore d'amis."}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => (
        <Link
          key={friend.id}
          href={`/home/followedPage/${friend.id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
        >
          <Avatar userId={friend.id} size="md" />
          <div>
            <p className="font-semibold">{friend.username}</p>
            <p className="text-sm text-gray-500">{friend.email}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}