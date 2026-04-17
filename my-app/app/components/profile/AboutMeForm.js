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
    return <div className="text-center py-4 text-gray-500">Chargement...</div>
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-3 h-32 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Parlez-nous de vous..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isOwnProfile || saving}
        />
        {isOwnProfile && (
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </form>
      {!isOwnProfile && description && (
        <p className="text-gray-700 mt-2">{description}</p>
      )}
      {!isOwnProfile && !description && (
        <p className="text-gray-500 italic">Cet utilisateur n'a pas encore de description.</p>
      )}
    </div>
  )
}