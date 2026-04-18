'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../../context/AuthContext'
import Card from '../../../../components/ui/Card'
import Avatar from '../../../../components/ui/Avatar'
import PostCard from '../../../../components/posts/PostCard'

export default function FollowedPage() {
  const { userId } = useParams()
  const { user } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [friendStatus, setFriendStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      fetchUserPosts()
      checkFriendStatus()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setProfileUser(data)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/user/${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const checkFriendStatus = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      const response = await fetch(`http://localhost:5000/api/friends/check?userId=${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setFriendStatus(data)
      }
    } catch (error) {
      console.error('Error checking friend status:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ followed_id: parseInt(userId) })
      })
      if (response.ok) {
        setFriendStatus({ status: 'pending', requestSent: true })
      } else {
        const error = await response.json()
        alert(error.message || 'Erreur')
      }
    } catch (error) {
      console.error('Error sending request:', error)
      alert('Une erreur est survenue')
    } finally {
      setActionLoading(false)
    }
  }

  const cancelRequest = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/friends/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ followed_id: parseInt(userId) })
      })
      if (response.ok) {
        setFriendStatus({ status: 'none', isFollowing: false })
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const removeFriend = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friend_id: parseInt(userId) })
      })
      if (response.ok) {
        setFriendStatus({ status: 'none', isFollowing: false })
      }
    } catch (error) {
      console.error('Error removing friend:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getButtonConfig = () => {
    if (!user) return null
    if (user.id === parseInt(userId)) return null
    
    switch (friendStatus?.status) {
      case 'accepted':
        return {
          text: 'Amis',
          action: removeFriend,
          className: 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600',
          loadingText: 'Suppression...'
        }
      case 'pending':
        return {
          text: 'Demande envoyée',
          action: cancelRequest,
          className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
          loadingText: 'Annulation...'
        }
      default:
        return {
          text: 'Ajouter en ami',
          action: sendFriendRequest,
          className: 'bg-blue-500 text-white hover:bg-blue-600',
          loadingText: 'Envoi...'
        }
    }
  }

  const buttonConfig = getButtonConfig()

  if (loading) return <div className="text-center py-10">Chargement...</div>

  const isOwnProfile = user?.id === parseInt(userId)

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="p-5 flex gap-4 items-center">
          <Avatar userId={userId} size="lg" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">{profileUser?.username}</h1>
            <p className="text-sm text-gray-500">{profileUser?.email}</p>
            <p className="text-xs text-gray-400">
              Membre depuis {profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : '...'}
            </p>
          </div>
          {buttonConfig && !isOwnProfile && (
            <button
              onClick={buttonConfig.action}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${buttonConfig.className} disabled:opacity-50`}
            >
              {actionLoading ? buttonConfig.loadingText : buttonConfig.text}
            </button>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold px-1">Publications</h2>
        {posts.length > 0 ? (
          posts.map(post => <PostCard key={post.id} post={post} />)
        ) : (
          <Card>
            <p className="text-center text-gray-500 py-8">Aucune publication</p>
          </Card>
        )}
      </div>
    </div>
  )
}