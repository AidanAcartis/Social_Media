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
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      fetchUserPosts()
      checkFollowStatus()
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

  const checkFollowStatus = async () => {
    if (!user) return
    try {
      const response = await fetch(`http://localhost:5000/api/friends/check?userId=${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.isFollowing)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ followed_id: parseInt(userId) })
      })
      if (response.ok) {
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleUnfollow = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ followed_id: parseInt(userId) })
      })
      if (response.ok) {
        setIsFollowing(false)
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  if (loading) return <div className="text-center py-10">Chargement...</div>

  const isOwnProfile = user?.id === parseInt(userId)

  return (
    <div>
      <Card>
        <div className="flex gap-4 items-center">
          <Avatar userId={userId} size="lg" />
          <div className="grow">
            <h1 className="text-2xl font-bold">{profileUser?.username}</h1>
            <p className="text-gray-500">{profileUser?.email}</p>
            <p className="text-sm text-gray-400">
              Membre depuis {profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : '...'}
            </p>
          </div>
          {!isOwnProfile && (
            <button
              onClick={isFollowing ? handleUnfollow : handleFollow}
              className={`px-4 py-2 rounded-full ${
                isFollowing 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isFollowing ? 'Abonné' : 'S\'abonner'}
            </button>
          )}
        </div>
      </Card>

      <div className="space-y-5 mt-5">
        <h2 className="text-xl font-bold">Publications</h2>
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <Card>
            <p className="text-center text-gray-500 py-5">Aucune publication</p>
          </Card>
        )}
      </div>
    </div>
  )
}