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
    <div className="relative h-40 md:h-56 bg-linear-to-r from-blue-400 to-purple-500 overflow-hidden">
      {coverUrl && (
        <img
          src={coverUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      )}

      {editable && (
        <label className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-xs cursor-pointer hover:bg-opacity-70 transition">
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
        <div className="absolute bottom-2 left-2 text-xs text-red-500 bg-black bg-opacity-50 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  )
}