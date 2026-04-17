'use client'

import { useState, useEffect } from 'react'

export default function AboutMeForm({ userId }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('http://localhost:5000/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, description })
      })
      if (response.ok) {
        alert('Description mise à jour avec succès')
      }
    } catch (error) {
      console.error('Error saving about:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Chargement...</div>

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        className="w-full p-3 h-32 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Parlez-nous de vous..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}