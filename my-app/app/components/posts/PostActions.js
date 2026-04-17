'use client'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export function usePostActions() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleDeletePost = async (postId, onSuccess) => {
    if (!confirm('Voulez-vous vraiment supprimer ce post ?')) return

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        onSuccess?.(postId)
      } else {
        const error = await response.json()
        alert(error.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (postId, reactionType, onSuccess) => {
    if (!user) return

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: reactionType })
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess?.(postId, data.reaction, data.count)
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const handleShare = async (postId, onSuccess) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/share`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        onSuccess?.()
      }
    } catch (error) {
      console.error('Error sharing post:', error)
    }
  }

  return { handleDeletePost, handleReaction, handleShare, loading }
}