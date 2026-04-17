'use client'

import { useState, useEffect } from 'react'
import PostFormCard from '../../components/posts/PostFormCard'
import PostCard from '../../components/posts/PostCard'
import { useAuth } from '../../context/AuthContext'

export default function HomePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchPosts()
  }, [])
  
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts/feed', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts])
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
    return <div className="text-center py-10">Chargement...</div>
  }
  
  return (
    <div>
      <PostFormCard onPostCreated={handlePostCreated} />
      <div className="space-y-5">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={handlePostDeleted}
            onReaction={handleReaction}
          />
        ))}
        {posts.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            Aucun post à afficher. Commencez à suivre des utilisateurs !
          </div>
        )}
      </div>
    </div>
  )
}