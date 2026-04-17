'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const sizeMap = {
  sm: { outer: 'w-8 h-8',  text: 'text-[11px]', btn: 'w-5 h-5',  icon: 'w-2.5 h-2.5' },
  md: { outer: 'w-10 h-10', text: 'text-[13px]', btn: 'w-5 h-5',  icon: 'w-3 h-3'   },
  lg: { outer: 'w-20 h-20 md:w-24 md:h-24', text: 'text-xl md:text-2xl', btn: 'w-6 h-6', icon: 'w-3.5 h-3.5' },
}

export default function Avatar({ userId, size = 'md', editable = false, onUpdate }) {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl]   = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError]           = useState(null)
  const isOwnProfile = user?.id === userId
  const s = sizeMap[size]

  useEffect(() => { if (userId) fetchAvatar() }, [userId])

  const fetchAvatar = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/avatar`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.photo_path) setAvatarUrl(`http://localhost:5000${data.photo_path}`)
      }
    } catch (e) { console.error(e) }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Veuillez sélectionner une image')
    if (file.size > 5 * 1024 * 1024) return setError("L'image ne doit pas dépasser 5 MB")
    setIsUploading(true); setError(null)
    const form = new FormData()
    form.append('avatar', file)
    try {
      const res = await fetch('http://localhost:5000/api/users/avatar', {
        method: 'POST', credentials: 'include', body: form,
      })
      if (res.ok) {
        const data = await res.json()
        setAvatarUrl(`http://localhost:5000${data.photo_path}`)
        onUpdate?.(data.photo_path)
      } else {
        const err = await res.json()
        setError(err.message || 'Erreur lors du téléchargement')
      }
    } catch { setError('Erreur de connexion') }
    finally { setIsUploading(false) }
  }

  return (
    <div className="relative inline-flex shrink-0">
      <div className={`${s.outer} relative rounded-full overflow-hidden ring-2 ring-white`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-medium tracking-wide ${s.text}`}>
            {userId ? String(userId).slice(-2).toUpperCase() : '?'}
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>

      {editable && isOwnProfile && (
        <label className={`absolute -bottom-0.5 -right-0.5 ${s.btn} rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all`}>
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${s.icon} text-blue-500`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </label>
      )}

      {error && (
        <p className="absolute -bottom-6 left-0 text-[11px] text-red-500 whitespace-nowrap">{error}</p>
      )}
    </div>
  )
}