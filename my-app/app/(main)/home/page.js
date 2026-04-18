'use client'

import { useState, useEffect } from 'react'
import PostFormCard from '../../components/posts/PostFormCard'
import PostCard from '../../components/posts/PostCard'
import { useAuth } from '../../context/AuthContext'

export default function HomePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Vérifier si un post a moins de 24h
  const isLessThan24Hours = (createdAt) => {
    const postDate = new Date(createdAt)
    const now = new Date()
    const hoursDiff = (now - postDate) / (1000 * 60 * 60)
    return hoursDiff < 24
  }
  
  useEffect(() => {
    fetchPosts()
  }, [])
  
  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/posts/feed', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // Filtrer : TOUS les posts (les miens ET ceux des amis) âgés de moins de 24h
        const filteredPosts = data.filter(post => 
          isLessThan24Hours(post.createdAt) // Seulement les posts de moins de 24h
        )
        setPosts(filteredPosts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePostCreated = (newPost) => {
    // N'ajouter le nouveau post que s'il a moins de 24h
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Aucune publication récente</h3>
          <p className="text-xs text-gray-400">
            Les publications de moins de 24h apparaîtront ici
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