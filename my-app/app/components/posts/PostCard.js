'use client'

import { useState } from 'react'
import Link from 'next/link'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function PostCard({ post, onDelete, onReaction }) {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [userReaction, setUserReaction] = useState(post.userReaction)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
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
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* En-tête du post */}
      <div className="flex gap-4 p-5 pb-2">
        <Link href={`/home/followedPage/${post.user.id}`} className="shrink-0">
          <Avatar userId={post.user.id} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/home/followedPage/${post.user.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {post.user.username}
            </Link>
            <span className="text-gray-400 text-sm">·</span>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">a partagé une publication</p>
        </div>
        
        {/* Menu dropdown */}
        {user?.id === post.user.id && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-fade-in">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Contenu du post */}
      <div className="px-5 pb-3">
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        
        {/* Conteneur d'image responsive */}
        {post.image && !imageError && (
          <div className="mt-4 relative">
            {/* Skeleton loader pendant le chargement */}
            {!imageLoaded && (
              <div className="w-full bg-gray-200 rounded-xl animate-pulse" style={{ aspectRatio: '16/9' }}>
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Image avec ratio d'aspect maintenu */}
            <img 
              src={`http://localhost:5000${post.image}`}
              alt="Post image"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`
                w-full rounded-xl object-contain bg-gray-50 transition-all duration-500
                ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}
              `}
              style={{ 
                aspectRatio: 'auto',
                maxHeight: '600px'
              }}
            />
          </div>
        )}
        
        {/* Message d'erreur si l'image ne charge pas */}
        {imageError && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm">L'image n'a pas pu être chargée</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Actions du post */}
      <div className="px-5 pb-4 pt-2 flex items-center gap-6 border-t border-gray-100">
        {/* Bouton de réaction */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            onClick={() => handleReaction('like')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors group"
          >
            <span className="text-xl transition-transform group-hover:scale-110">
              {userReaction ? reactionEmojis[userReaction] : '👍'}
            </span>
            <span className="text-sm font-medium">{post.reactionCount || 0}</span>
          </button>
          
          {showReactions && (
            <div 
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              className="absolute bottom-full left-0 mb-2 flex gap-2 bg-white rounded-full shadow-lg border border-gray-100 p-2 z-10 animate-slide-up"
            >
              {Object.entries(reactionEmojis).map(([type, emoji]) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className="text-2xl hover:scale-125 transition-transform duration-200"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Bouton commentaire */}
        <Link
          href={`/home/comments/${post.id}`}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <span className="text-sm font-medium">{post.commentCount || 0}</span>
        </Link>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </Card>
  )
}