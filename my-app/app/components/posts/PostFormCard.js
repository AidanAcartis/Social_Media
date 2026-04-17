'use client'

import { useState, useRef } from 'react'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

export default function PostFormCard({ onPostCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const fileInputRef = useRef(null)
  
  const handleSubmit = async () => {
    if (!content.trim() && !image) return
    
    setIsLoading(true)
    const formData = new FormData()
    formData.append('content', content)
    if (image) formData.append('image', image)
    
    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (response.ok) {
        const newPost = await response.json()
        setContent('')
        setImage(null)
        setShowUpload(false)
        onPostCreated?.(newPost)
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
    }
  }
  
  return (
    <Card>
      <div className="flex gap-3">
        <Avatar userId={user?.id} size="md" />
        <div className="flex-1">
          <textarea
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Quoi de neuf ?"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setShowUpload(true)}
          />
          
          {showUpload && (
            <div className="mt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                Ajouter une photo
              </button>
              {image && (
                <div className="mt-2 relative inline-block">
                  <img src={URL.createObjectURL(image)} alt="Preview" className="h-20 rounded" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!content.trim() && !image)}
              className="bg-blue-500 text-white px-6 py-2 rounded-full disabled:opacity-50 hover:bg-blue-600 transition"
            >
              {isLoading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}