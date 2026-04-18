'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import CommentCard from '../comments/CommentCard'

export default function PostCard({ post, onDelete, onReaction, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [userReaction, setUserReaction] = useState(post.userReaction)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const reactionEmojis = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    sad: '😢',
    angry: '😡'
  }
  
  const handleReaction = async (type) => {
    const response = await fetch(`http://localhost:5000/api/posts/${post.id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type })
    })
    
    if (response.ok) {
      setUserReaction(type)
      onReaction?.(post.id, type)
    }
    setShowReactions(false)
  }
  
  const handleDelete = async () => {
    if (confirm('Voulez-vous vraiment supprimer ce post ?')) {
      const response = await fetch(`http://localhost:5000/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        onDelete?.(post.id)
      }
    }
    setMenuOpen(false)
  }

  const fetchComments = async () => {
    setCommentsLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/comments/post/${post.id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    setSubmitting(true)
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment.trim() })
      })
      
      if (response.ok) {
        const comment = await response.json()
        setComments([comment, ...comments])
        setNewComment('')
        onCommentAdded?.(comment)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Supprimer ce commentaire ?')) return
    
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        onCommentDeleted?.(commentId)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const toggleComments = () => {
    if (!showComments) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  return (
    <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl transition-all duration-200 hover:shadow-md">
      {/* En-tête du post */}
      <div className="flex gap-3 px-4 pt-4 pb-2">
        <Link href={`/home/followedPage/${post.user.id}`} className="shrink-0">
          <Avatar userId={post.user.id} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/home/followedPage/${post.user.id}`} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors text-sm">
              {post.user.username}
            </Link>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
        </div>
        
        {/* Menu dropdown */}
        {user?.id === post.user.id && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Contenu du post */}
      <div className="px-4 pb-2">
        <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
        
        {/* Image du post */}
        {post.image && !imageError && (
          <div className="mt-3">
            {!imageLoaded && (
              <div className="w-full bg-gray-100 rounded-xl animate-pulse" style={{ height: '200px' }}>
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            )}
            <img 
              src={`http://localhost:5000${post.image}`}
              alt="Post image"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full rounded-xl object-contain max-h-100 bg-gray-50 ${imageLoaded ? 'opacity-100' : 'opacity-0 hidden'}`}
            />
          </div>
        )}
      </div>
      
      {/* Actions du post */}
      <div className="px-4 py-2 flex items-center gap-4 border-t border-gray-100">
        {/* Bouton de réaction */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            onClick={() => handleReaction('like')}
            className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors text-xs"
          >
            <span className="text-base">{userReaction ? reactionEmojis[userReaction] : '👍'}</span>
            {post.reactionCount > 0 && <span className="text-xs">{post.reactionCount}</span>}
          </button>
          
          {showReactions && (
            <div 
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              className="absolute bottom-full left-0 mb-2 flex gap-1.5 bg-white rounded-full shadow-lg border border-gray-100 p-1.5 z-10"
            >
              {Object.entries(reactionEmojis).map(([type, emoji]) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className="text-xl hover:scale-110 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Bouton commentaire */}
        <button
          onClick={toggleComments}
          className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <span className="text-xs">{post.commentCount || comments.length}</span>
        </button>

        {/* Bouton partager */}
        <button className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
        </button>
      </div>

      {/* Section commentaires */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50/30 px-4 py-3">
          {/* Formulaire d'ajout */}
          <form onSubmit={handleSubmitComment} className="flex gap-2 mb-3">
            <Avatar userId={user?.id} size="sm" />
            <div className="flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrire un commentaire..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-700 disabled:opacity-40 transition-all"
            >
              {submitting ? '...' : 'Envoyer'}
            </button>
          </form>

          {/* Liste des commentaires */}
          {commentsLoading ? (
            <div className="flex justify-center py-3">
              <div className="animate-spin rounded-full h-4 w-4 border border-gray-300 border-t-gray-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-3">Aucun commentaire</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <CommentCard 
                  key={comment.id} 
                  comment={comment} 
                  onDelete={handleDeleteComment}
                  onReaction={(commentId, type, count) => {
                    setComments(comments.map(c => 
                      c.id === commentId 
                        ? { ...c, userReaction: type, reactionCount: count }
                        : c
                    ))
                  }}
                />
              ))}
            </div>
          )}
          
          <button
            onClick={() => window.location.href = `/home/comments/${post.id}`}
            className="w-full mt-3 text-center text-xs text-blue-500 hover:text-blue-600 transition-colors"
          >
            Voir tous les commentaires →
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Card>
  )
}