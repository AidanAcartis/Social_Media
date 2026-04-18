'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import CommentActions from './CommentActions'

export default function CommentCard({ comment, onDelete, onReaction }) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [userReaction, setUserReaction] = useState(comment.userReaction)
  const [reactionCount, setReactionCount] = useState(comment.reactionCount || 0)
  const [isDeleted, setIsDeleted] = useState(false)

  const isOwnComment = user?.id === comment.user_id

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${comment.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setIsDeleted(true)
        onDelete?.(comment.id)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  const handleReaction = (type, count) => {
    setUserReaction(type)
    setReactionCount(count)
    onReaction?.(comment.id, type, count)
  }

  // Cache le commentaire immédiatement après suppression
  if (isDeleted) return null

  return (
    <div className="flex gap-2 py-2 border-b border-gray-100 last:border-b-0 group">
      <Link href={`/home/followedPage/${comment.user_id}`} className="shrink-0">
        <Avatar userId={comment.user_id} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/home/followedPage/${comment.user_id}`} className="font-semibold text-gray-800 text-xs hover:underline">
              {comment.username}
            </Link>
            <span className="text-[10px] text-gray-400">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
            </span>
          </div>
          {isOwnComment && (
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-0.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full text-left px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors rounded-md"
                  >
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-gray-600 text-xs mt-0.5 wrap-break-words">{comment.content}</p>
        <div className="mt-1">
          <CommentActions 
            commentId={comment.id} 
            onReaction={handleReaction}
            initialReaction={userReaction}
            initialCount={reactionCount}
          />
        </div>
      </div>
    </div>
  )
}