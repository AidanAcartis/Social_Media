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
  const [coverPhoto, setCoverPhoto] = useState(null)
  const [about, setAbout] = useState(null)
  const [location, setLocation] = useState(null)
  const [friendsCount, setFriendsCount] = useState(0)

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      fetchUserPosts()
      checkFriendStatus()
      fetchCoverPhoto()
      fetchAbout()
      fetchLocation()
      fetchFriendsCount()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // Normaliser les données
        setProfileUser({
          ...data,
          createdAt: data.created_at || data.createdAt
        })
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
        console.log('Friend status reçu:', data) // Pour déboguer
        setFriendStatus(data)
      }
    } catch (error) {
      console.error('Error checking friend status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCoverPhoto = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cover`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCoverPhoto(data.photo_path)
      }
    } catch (error) {
      console.error('Error fetching cover photo:', error)
    }
  }

  const fetchAbout = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/about?userId=${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const userAbout = data.data?.find(a => a.user_id === parseInt(userId))
        setAbout(userAbout?.description || null)
      }
    } catch (error) {
      console.error('Error fetching about:', error)
    }
  }

  const fetchLocation = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/location?userId=${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const userLocation = data.data?.find(l => l.user_id === parseInt(userId))
        if (userLocation) {
          setLocation(`${userLocation.city}, ${userLocation.country}`)
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error)
    }
  }

  const fetchFriendsCount = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/friends/count?userId=${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setFriendsCount(data.friends || 0)
      }
    } catch (error) {
      console.error('Error fetching friends count:', error)
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
    
    // Si déjà ami, ne pas afficher de bouton
    if (friendStatus?.status === 'accepted') {
      return null
    }
    
    if (friendStatus?.status === 'pending') {
      return {
        text: 'Demande envoyée',
        action: cancelRequest,
        className: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
        loadingText: 'Annulation...'
      }
    }
    
    return {
      text: 'Ajouter en ami',
      action: sendFriendRequest,
      className: 'bg-blue-500 text-white hover:bg-blue-600',
      loadingText: 'Envoi...'
    }
  }

  const buttonConfig = getButtonConfig()

  if (loading) return <div className="text-center py-10">Chargement...</div>

  const isOwnProfile = user?.id === parseInt(userId)

  return (
    <div className="animate-fade-in space-y-5">
      {/* Carte de profil */}
      <Card noPadding className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
        {/* Photo de couverture */}
        <div className="relative h-32 bg-linear-to-r from-gray-100 to-gray-200">
          {coverPhoto && (
            <img 
              src={`http://localhost:5000${coverPhoto}`}
              alt="Cover"
              className="w-full h-32 object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}
        </div>
        
        {/* Avatar et infos */}
        <div className="relative px-5 pb-5">
          <div className="absolute -top-10 left-5">
            <Avatar userId={userId} size="lg" className="ring-2 ring-white rounded-2xl" />
          </div>
          <div className="pt-12 pl-24 md:pl-32">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{profileUser?.username}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profileUser?.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Membre depuis {profileUser?.created_at ? new Date(profileUser.created_at).toLocaleDateString() : profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : '...'}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {friendsCount} ami{friendsCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
                {/* Afficher le bouton seulement si l'utilisateur n'est PAS déjà ami */}
                {/* {buttonConfig && !isOwnProfile && (
                  <button
                    onClick={buttonConfig.action}
                    disabled={actionLoading}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${buttonConfig.className} disabled:opacity-50 shadow-sm`}
                  >
                    {actionLoading ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {buttonConfig.loadingText}
                      </span>
                    ) : buttonConfig.text}
                  </button>
                )} */}
            </div>
          </div>
        </div>
      </Card>

      {/* À propos */}
      {about && (
        <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">À propos</h2>
                <p className="text-[11px] text-gray-400">Bio</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600 leading-relaxed">{about}</p>
          </div>
        </Card>
      )}

      {/* Localisation */}
      {location && (
        <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Localisation</h2>
                <p className="text-[11px] text-gray-400">Position</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600">{location}</p>
          </div>
        </Card>
      )}

      {/* Publications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-800">Publications</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {posts.length}
          </span>
        </div>
        
        {posts.length > 0 ? (
          <div className="space-y-5">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <Card>
            <div className="text-center py-8 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm">Aucune publication</p>
            </div>
          </Card>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}