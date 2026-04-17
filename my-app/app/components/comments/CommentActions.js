'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function CommentActions({ commentId, onReaction }) {
  const { user } = useAuth()
  const [userReaction, setUserReaction] = useState(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const [reactionCount, setReactionCount] = useState(0)

  const reactionEmojis = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    sad: '😢',
    angry: '😡'
  }

  useEffect(() => {
    fetchUserReaction()
    fetchReactionCount()
  }, [commentId])

  const fetchUserReaction = async () => {
    if (!user) return
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}/reaction`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUserReaction(data.reaction)
      }
    } catch (error) {
      console.error('Error fetching user reaction:', error)
    }
  }

  const fetchReactionCount = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}/reactions/count`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setReactionCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching reaction count:', error)
    }
  }

  const handleReaction = async (type) => {
    if (!user) return

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
        onReaction?.(commentId, data.reaction, data.count)
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
    setShowEmojis(false)
  }

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowEmojis(true)}
        onMouseLeave={() => setShowEmojis(false)}
        onClick={() => handleReaction('like')}
        className="flex items-center gap-1 text-gray-500 hover:text-blue-500 text-sm"
      >
        <span className="text-base">{userReaction ? reactionEmojis[userReaction] : '👍'}</span>
        {reactionCount > 0 && <span>{reactionCount}</span>}
      </button>

      {showEmojis && (
        <div
          onMouseEnter={() => setShowEmojis(true)}
          onMouseLeave={() => setShowEmojis(false)}
          className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white rounded-full shadow-lg p-2 z-10"
        >
          <button onClick={() => handleReaction('like')} className="text-xl hover:scale-125 transition">👍</button>
          <button onClick={() => handleReaction('love')} className="text-xl hover:scale-125 transition">❤️</button>
          <button onClick={() => handleReaction('haha')} className="text-xl hover:scale-125 transition">😂</button>
          <button onClick={() => handleReaction('sad')} className="text-xl hover:scale-125 transition">😢</button>
          <button onClick={() => handleReaction('angry')} className="text-xl hover:scale-125 transition">😡</button>
        </div>
      )}
    </div>
  )
}