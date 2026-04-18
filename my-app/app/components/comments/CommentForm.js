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
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar userId={user.id} size="sm" />
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrire un commentaire..."
          className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all duration-150 placeholder:text-gray-300"
          rows={2}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Commenter
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}