'use client'

import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'

export default function PostFormCard({ onPostCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ((!content.trim() && !image) || !user) return

    setIsSubmitting(true)
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
        removeImage()
        setShowUpload(false)
        onPostCreated?.(newPost)
      } else {
        const error = await response.json()
        alert(error.message || 'Erreur lors de la publication')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar userId={user.id} size="md" />
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setShowUpload(true)}
              placeholder="Quoi de neuf ?"
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            
            {/* Upload d'image */}
            {showUpload && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-500 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  Ajouter une photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-24 rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !image)}
            className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </form>
    </Card>
  )
}