'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export function usePosts() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      setError('Erreur lors du chargement des posts')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/user/${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        return data
      }
      return []
    } catch (error) {
      console.error('Error fetching user posts:', error)
      return []
    }
  }

  const createPost = async (content, image) => {
    const formData = new FormData()
    formData.append('content', content)
    if (image) formData.append('image', image)

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      if (response.ok) {
        const newPost = await response.json()
        setPosts([newPost, ...posts])
        return { success: true, post: newPost }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error creating post:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  const deletePost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId))
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  const addReaction = async (postId, type) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type })
      })
      if (response.ok) {
        const data = await response.json()
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, userReaction: data.reaction, reactionCount: data.count }
            : post
        ))
        return { success: true, reaction: data.reaction, count: data.count }
      }
      return { success: false }
    } catch (error) {
      console.error('Error adding reaction:', error)
      return { success: false }
    }
  }

  useEffect(() => {
    if (user) {
      fetchPosts()
    }
  }, [user])

  return {
    posts,
    loading,
    error,
    fetchPosts,
    fetchUserPosts,
    createPost,
    deletePost,
    addReaction
  }
}