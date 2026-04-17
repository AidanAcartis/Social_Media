'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Card from '../ui/Card'

export default function LocationForm({ userId, onUpdate }) {
  const { user } = useAuth()
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isOwnProfile = user?.id === userId

  useEffect(() => {
    if (userId) {
      fetchLocation()
    }
  }, [userId])

  const fetchLocation = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/location?userId=${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const userLocation = data.data?.find(item => item.user_id === userId)
        if (userLocation) {
          setCountry(userLocation.country || '')
          setCity(userLocation.city || '')
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error)
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
      const response = await fetch('http://localhost:5000/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, country, city })
      })
      if (response.ok) {
        onUpdate?.({ country, city })
      } else {
        const data = await response.json()
        setError(data.message || 'Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Error saving location:', error)
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pays
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Votre pays"
            disabled={!isOwnProfile || saving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Votre ville"
            disabled={!isOwnProfile || saving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
        {isOwnProfile && (
          <div className="flex justify-end">
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
      {!isOwnProfile && (country || city) && (
        <p className="text-gray-600 mt-2">
          {[city, country].filter(Boolean).join(', ')}
        </p>
      )}
    </div>
  )
}