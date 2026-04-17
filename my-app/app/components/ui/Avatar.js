'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Avatar({ userId, size = 'md', editable = false, onUpdate }) {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)

  // Si userId n'est pas fourni, utiliser l'utilisateur connecté
  const targetUserId = userId || user?.id
  const isOwnProfile = user?.id === targetUserId
  // Forcer editable à true si c'est le profil de l'utilisateur connecté
  const showEditButton = editable && isOwnProfile

  // Tailles agrandies
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24 md:w-32 md:h-32'
  }

  useEffect(() => {
    if (targetUserId) {
      fetchAvatar()
    }
  }, [targetUserId])

  const fetchAvatar = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${targetUserId}/avatar`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.photo_path) {
          setAvatarUrl(`http://localhost:5000${data.photo_path}`)
        }
      }
    } catch (error) {
      console.error('Error fetching avatar:', error)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch('http://localhost:5000/api/users/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setAvatarUrl(`http://localhost:5000${data.photo_path}`)
        onUpdate?.(data.photo_path)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setError('Erreur de connexion')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-200 shrink-0 shadow-lg group`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-semibold">
          {targetUserId ? String(targetUserId).slice(-2) : '?'}
        </div>
      )}

      {/* Bouton appareil photo - visible seulement sur son propre profil */}
      {showEditButton && (
        <label className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-2 shadow-lg cursor-pointer hover:bg-blue-600 transition-all duration-200 hover:scale-110">
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
            disabled={isUploading}
          />
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </label>
      )}

      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-red-500 bg-white px-2 py-1 rounded shadow whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  )
}