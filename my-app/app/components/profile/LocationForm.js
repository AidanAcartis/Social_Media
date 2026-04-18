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
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Pays
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Votre pays"
            disabled={!isOwnProfile || saving}
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all duration-150 disabled:opacity-60 disabled:bg-gray-100 placeholder:text-gray-400"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Ville
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Votre ville"
            disabled={!isOwnProfile || saving}
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all duration-150 disabled:opacity-60 disabled:bg-gray-100 placeholder:text-gray-400"
          />
        </div>
        
        {isOwnProfile && (
          <div className="flex justify-end pt-2">
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
      
      {!isOwnProfile && (country || city) && (
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>Localisation</span>
          </div>
          <p className="text-sm text-gray-600">
            {[city, country].filter(Boolean).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}