'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../../context/AuthContext'
import Card from '../../../../components/ui/Card'
import Avatar from '../../../../components/ui/Avatar'

export default function CommentsPage() {
  const { postId } = useParams()
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
        fetch(`http://localhost:5000/api/posts/${postId}/comments`, { credentials: 'include' })
      ])
      
      if (postRes.ok) {
        const postData = await postRes.json()
        setPost(postData)
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
        body: JSON.stringify({ content: newComment })
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

  if (loading) return <div className="text-center py-10">Chargement...</div>

  return (
    <div>
      <Card>
        <div className="flex gap-3">
          <Link href={`/home/followedPage/${post?.user?.id}`}>
            <Avatar userId={post?.user?.id} size="md" />
          </Link>
          <div className="grow">
            <p>
              <Link href={`/home/followedPage/${post?.user?.id}`} className="font-semibold hover:underline">
                {post?.user?.username}
              </Link>
            </p>
            <p className="whitespace-pre-wrap">{post?.content}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4">Commentaires ({comments.length})</h2>
        
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Écrire un commentaire..."
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? 'Envoi...' : 'Commenter'}
          </button>
        </form>

        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="border-b pb-3">
              <div className="flex items-center gap-2">
                <Avatar userId={comment.user?.id} size="sm" />
                <span className="font-semibold">{comment.user?.username}</span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 ml-10">{comment.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-gray-500 text-center">Aucun commentaire pour le moment.</p>
          )}
        </div>
      </Card>
    </div>
  )
}