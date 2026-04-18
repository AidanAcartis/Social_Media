'use client'

import { useState, useEffect } from 'react'
import PostFormCard from '../../components/posts/PostFormCard'
import PostCard from '../../components/posts/PostCard'
import { useAuth } from '../../context/AuthContext'

export default function HomePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  
  const isLessThan24Hours = (createdAt) => {
    const postDate = new Date(createdAt)
    const now = new Date()
    const hoursDiff = (now - postDate) / (1000 * 60 * 60)
    return hoursDiff < 24
  }
  
  useEffect(() => {
    if (user) {
      fetchFeed()
    }
  }, [user])
  
  const fetchFeed = async () => {
    setLoading(true)
    try {
      // Récupérer d'abord la liste des amis
      const friendsRes = await fetch('http://localhost:5000/api/friends', {
        credentials: 'include'
      })
      
      let friendIds = []
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json()
        friendIds = (friendsData.data || []).map(f => f.id)
      }
      
      // Ajouter l'utilisateur lui-même pour voir ses propres posts
      if (user?.id) {
        friendIds.push(user.id)
      }
      
      // Récupérer tous les posts
      const postsRes = await fetch('http://localhost:5000/api/posts/feed', {
        credentials: 'include'
      })
      
      if (postsRes.ok) {
        const allPosts = await postsRes.json()
        
        // Filtrer : seulement les posts des amis + l'utilisateur, et de moins de 24h
        const filteredPosts = allPosts.filter(post => {
          const postUserId = post.user?.id || post.user_id
          return friendIds.includes(postUserId) && isLessThan24Hours(post.createdAt)
        })
        
        setPosts(filteredPosts)
      }
    } catch (error) {
      console.error('Error fetching feed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePostCreated = (newPost) => {
    if (isLessThan24Hours(newPost.createdAt)) {
      setPosts([newPost, ...posts])
    }
  }
  
  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p.id !== postId))
  }
  
  const handleReaction = (postId, reactionType) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, userReaction: reactionType, reactionCount: (post.reactionCount || 0) + 1 }
        : post
    ))
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }
  
  return (
    <div className="animate-fade-in space-y-5">
      <PostFormCard onPostCreated={handlePostCreated} />
      
      {posts.length > 0 ? (
        <div className="space-y-5">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handlePostDeleted}
              onReaction={handleReaction}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Aucune publication</h3>
          <p className="text-xs text-gray-400">
            Ajoutez des amis pour voir leurs publications ici
          </p>
        </div>
      )}
      
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