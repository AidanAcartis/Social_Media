'use client'

import { useState } from 'react'
import { useAuth } from './useAuth'

const reactionEmojis = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  sad: '😢',
  angry: '😡'
}

export function useReactions() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const addReaction = async (postId, type) => {
    if (!user) return { success: false, error: 'Non authentifié' }

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type })
      })
      if (response.ok) {
        const data = await response.json()
        return { success: true, reaction: data.reaction, count: data.count }
      }
      return { success: false }
    } catch (error) {
      console.error('Error adding reaction:', error)
      return { success: false, error: 'Erreur de connexion' }
    } finally {
      setLoading(false)
    }
  }

  const removeReaction = async (postId) => {
    if (!user) return { success: false }

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/reactions`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        return { success: true, count: data.count }
      }
      return { success: false }
    } catch (error) {
      console.error('Error removing reaction:', error)
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const getUserReaction = async (postId) => {
    if (!user) return null

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/reactions/user`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        return data.reaction
      }
      return null
    } catch (error) {
      console.error('Error getting user reaction:', error)
      return null
    }
  }

  const getReactionCount = async (postId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/reactions/count`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        return data.count
      }
      return 0
    } catch (error) {
      console.error('Error getting reaction count:', error)
      return 0
    }
  }

  const getReactionEmoji = (type) => {
    return reactionEmojis[type] || '👍'
  }

  return {
    loading,
    addReaction,
    removeReaction,
    getUserReaction,
    getReactionCount,
    getReactionEmoji,
    reactionEmojis
  }
}