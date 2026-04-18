'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const reactionEmojis = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  sad: '😢',
  angry: '😡'
}

export default function CommentActions({ commentId, onReaction, initialReaction, initialCount }) {
  const { user } = useAuth()
  const [userReaction, setUserReaction] = useState(initialReaction || null)
  const [showEmojis, setShowEmojis] = useState(false)
  const [reactionCount, setReactionCount] = useState(initialCount || 0)
  const [topReactions, setTopReactions] = useState([])
  const timeoutRef = useRef(null)

  // Récupérer les réactions les plus populaires
  const fetchTopReactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}/reactions/top`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setTopReactions(data)
      }
    } catch (error) {
      console.error('Error fetching top reactions:', error)
    }
  }

  useEffect(() => {
    fetchTopReactions()
  }, [commentId, reactionCount])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setShowEmojis(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowEmojis(false)
    }, 200)
  }

  const handleReaction = async (type) => {
    if (!user) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setShowEmojis(false)

    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        const data = await response.json()
        setUserReaction(data.reaction)
        setReactionCount(data.count)
        onReaction?.(data.reaction, data.count)
        fetchTopReactions() // Rafraîchir les top réactions
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  // Obtenir l'emoji à afficher sur le bouton
  const getDisplayEmoji = () => {
    if (userReaction) {
      return reactionEmojis[userReaction]
    }
    if (topReactions.length > 0) {
      return reactionEmojis[topReactions[0].type]
    }
    return '👍'
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
      >
        <span className="text-sm">{getDisplayEmoji()}</span>
        {reactionCount > 0 && <span>{reactionCount}</span>}
      </button>

      {showEmojis && (
        <div className="absolute bottom-full left-0 mb-2 flex gap-1.5 bg-white rounded-full shadow-lg border border-gray-100 p-1.5 z-10 whitespace-nowrap">
          {Object.entries(reactionEmojis).map(([type, emoji]) => (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              className={`text-lg hover:scale-110 transition-transform px-0.5 ${
                userReaction === type ? 'bg-blue-50 rounded-full' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}