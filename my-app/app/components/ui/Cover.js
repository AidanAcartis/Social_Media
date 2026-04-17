'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Cover({ editable = false, onUpdate }) {
  const { user } = useAuth()
  const [coverUrl, setCoverUrl] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchCover()
    }
  }, [user])

  const fetchCover = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${user?.id}/cover`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.photo_path) {
          setCoverUrl(`http://localhost:5000${data.photo_path}`)
        }
      }
    } catch (error) {
      console.error('Error fetching cover:', error)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 10MB')
      return
    }

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('cover', file)

    try {
      const response = await fetch('http://localhost:5000/api/users/cover', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setCoverUrl(`http://localhost:5000${data.photo_path}`)
        onUpdate?.(data.photo_path)
        // Recharger la page pour voir la mise à jour
        window.location.reload()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Error uploading cover:', error)
      setError('Erreur de connexion')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative h-40 md:h-56 bg-linear-to-r from-gray-200 to-gray-300 overflow-hidden">
      {coverUrl && (
        <img
          src={coverUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      )}

      {editable && (
        <label className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-black/70 transition flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
            disabled={isUploading}
          />
          {isUploading ? 'Chargement...' : 'Changer la couverture'}
        </label>
      )}

      {error && (
        <div className="absolute bottom-2 left-2 text-xs text-red-500 bg-black/50 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  )
}