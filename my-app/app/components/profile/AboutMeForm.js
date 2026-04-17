'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Card from '../ui/Card'

export default function AboutMeForm({ userId, onUpdate }) {
  const { user } = useAuth()
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isOwnProfile = user?.id === userId

  useEffect(() => {
    if (userId) {
      fetchAbout()
    }
  }, [userId])

  const fetchAbout = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/about?userId=${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const userAbout = data.data?.find(item => item.user_id === userId)
        if (userAbout) {
          setDescription(userAbout.description)
        }
      }
    } catch (error) {
      console.error('Error fetching about:', error)
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isOwnProfile) return

    setSaving(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:5000/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, description })
      })
      if (response.ok) {
        onUpdate?.(description)
      } else {
        const data = await response.json()
        setError(data.message || 'Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Error saving about:', error)
      setError('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full p-4 h-36 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-gray-50/50 transition-all duration-200"
          placeholder="Parlez-nous de vous..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isOwnProfile || saving}
        />
        {isOwnProfile && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        )}
      </form>
      {!isOwnProfile && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          {description ? (
            <p className="text-gray-700 leading-relaxed">{description}</p>
          ) : (
            <p className="text-gray-400 italic">Cet utilisateur n'a pas encore de description.</p>
          )}
        </div>
      )}
    </div>
  )
}