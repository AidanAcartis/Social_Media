'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function CommentCard({ comment, onDelete }) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const isOwnComment = user?.id === comment.user?.id

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${comment.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        onDelete?.(comment.id)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  return (
    <div className="flex gap-3 py-3 border-b last:border-b-0">
      <Link href={`/home/followedPage/${comment.user?.id}`}>
        <Avatar userId={comment.user?.id} size="sm" />
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/home/followedPage/${comment.user?.id}`} className="font-semibold hover:underline text-sm">
            {comment.user?.username}
          </Link>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
          </span>
          {isOwnComment && (
            <div className="relative ml-auto">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border z-10">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-gray-700 mt-1 text-sm">{comment.content}</p>
      </div>
    </div>
  )
}