'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../../context/AuthContext'
import Card from '../../../../components/ui/Card'
import Avatar from '../../../../components/ui/Avatar'
import CommentCard from '../../../../components/comments/CommentCard'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function CommentsPage() {
  const { postId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (postId) {
      fetchPostAndComments()
    }
  }, [postId])

  const fetchPostAndComments = async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/posts/${postId}`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/comments/post/${postId}`, { credentials: 'include' })
      ])
      
      if (postRes.ok) {
        const postData = await postRes.json()
        setPost({
          ...postData,
          createdAt: postData.created_at || postData.createdAt,
          user: {
            id: postData.user_id || postData.user?.id,
            username: postData.username || postData.user?.username
          }
        })
      }
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json()
        setComments(commentsData)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    setSubmitting(true)
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment.trim() })
      })
      
      if (response.ok) {
        const comment = await response.json()
        setComments([comment, ...comments])
        setNewComment('')
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
      // Filtre les commentaires pour retirer celui supprimé
      setComments(prevComments => prevComments.filter(c => c.id !== commentId))
    }
  } catch (error) {
    console.error('Error deleting comment:', error)
  }
}

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Publication non trouvée</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-500 hover:underline">
          Retour
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-sm font-semibold text-gray-800">Commentaires</h1>
          <p className="text-xs text-gray-400">Réagissez et échangez</p>
        </div>
      </div>

      {/* Publication originale */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
        <div className="p-4">
          <div className="flex gap-3">
            <Link href={`/home/followedPage/${post.user?.id}`}>
              <Avatar userId={post.user?.id} size="md" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/home/followedPage/${post.user?.id}`} className="font-semibold text-gray-800 text-sm hover:underline">
                  {post.user?.username}
                </Link>
                <span className="text-xs text-gray-400">
                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr }) : 'Récemment'}
                </span>
              </div>
              <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
              {post.image && (
                <img 
                  src={`http://localhost:5000${post.image}`} 
                  alt="Post" 
                  className="mt-2 rounded-xl max-h-64 object-contain bg-gray-50"
                />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Formulaire d'ajout */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Commentaires</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </div>
          
          <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
            <Avatar userId={user?.id} size="sm" />
            <div className="flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrire un commentaire..."
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 disabled:opacity-40 transition"
            >
              {submitting ? '...' : 'Envoyer'}
            </button>
          </form>

          {/* Liste des commentaires avec CommentCard */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                <p className="text-sm">Aucun commentaire</p>
                <p className="text-xs mt-0.5">Soyez le premier à commenter !</p>
              </div>
            ) : (
              comments.map((comment) => (
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
              ))
            )}
          </div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}