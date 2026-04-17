'use client'

import { useState, useEffect } from 'react'

export default function Avatar({ userId, size = 'md', editable = false, onUpdate }) {
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-12 md:w-24 md:h-24'
  }
  
  useEffect(() => {
    if (userId) {
      fetchAvatar()
    }
  }, [userId])
  
  const fetchAvatar = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/avatar`)
      if (response.ok) {
        const data = await response.json()
        setAvatarUrl(data.avatarUrl)
      }
    } catch (error) {
      console.error('Error fetching avatar:', error)
    }
  }
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setIsUploading(true)
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
        setAvatarUrl(data.avatarUrl)
        onUpdate?.(data.avatarUrl)
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-200`}>
      <img 
        src={avatarUrl || '/default-avatar.png'} 
        alt="Avatar"
        className="w-full h-full object-cover"
      />
      {editable && (
        <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer">
          <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          </svg>
        </label>
      )}
    </div>
  )
}