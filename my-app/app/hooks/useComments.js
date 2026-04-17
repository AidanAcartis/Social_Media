'use client'

import { useState } from 'react'

export function useComments(postId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError('Erreur lors du chargement des commentaires')
    } finally {
      setLoading(false)
    }
  }

  const addComment = async (content) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      })
      if (response.ok) {
        const newComment = await response.json()
        setComments([newComment, ...comments])
        return { success: true, comment: newComment }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  const deleteComment = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  const addCommentReaction = async (commentId, type) => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type })
      })
      if (response.ok) {
        const data = await response.json()
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, userReaction: data.reaction, reactionCount: data.count }
            : comment
        ))
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Error adding comment reaction:', error)
      return { success: false }
    }
  }

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    deleteComment,
    addCommentReaction
  }
}