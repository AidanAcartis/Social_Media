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
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full p-3.5 h-32 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 resize-none transition-all duration-150 placeholder:text-gray-400"
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
              className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5 shadow-sm"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Enregistrer
                </>
              )}
            </button>
          </div>
        )}
      </form>
      
      {!isOwnProfile && (
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          {description ? (
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs">Aucune description</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}