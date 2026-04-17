'use client'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'

export default function CommentForm({ postId, onCommentAdded }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || !user) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: content.trim() })
      })

      if (response.ok) {
        const newComment = await response.json()
        setContent('')
        onCommentAdded?.(newComment)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 mt-4">
      <Avatar userId={user.id} size="sm" />
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrire un commentaire..."
          className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Envoi...' : 'Commenter'}
          </button>
        </div>
      </div>
    </form>
  )
}