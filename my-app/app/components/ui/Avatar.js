'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '../../context/AuthContext'

export default function Avatar({ userId, size = 'md', editable = false, onUpdate }) {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)

  const isOwnProfile = user?.id === userId

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16 md:w-24 md:h-24'
  }

  useEffect(() => {
    if (userId) {
      fetchAvatar()
    }
  }, [userId])

  const fetchAvatar = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/avatar`, {
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
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-200 shrink-0`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-lg font-semibold">
          {userId ? String(userId).slice(-2) : '?'}
        </div>
      )}

      {editable && isOwnProfile && (
        <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer hover:bg-gray-100 transition">
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
            disabled={isUploading}
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </label>
      )}

      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="absolute -bottom-8 left-0 text-xs text-red-500 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}