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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4 p-5">
          <Avatar userId={user.id} size="md" />
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setShowUpload(true)}
              placeholder="Quoi de neuf ?"
              className="w-full p-4 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50/50 transition-all duration-200"
              rows={3}
            />
            
            {/* Upload d'image avec animation */}
            {showUpload && (
              <div className="mt-3 animate-fade-in">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 hover:text-blue-600 transition-all duration-200 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
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
                  <div className="mt-3 relative inline-block group/preview">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-28 w-auto rounded-xl object-cover shadow-md border border-gray-200 transition-all duration-300 group-hover/preview:scale-105"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-all duration-200 shadow-md"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end px-5 pb-5 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !image)}
            className="px-6 py-2.5 bg-linear-to-r from-blue-500 to-blue-600 text-white font-medium rounded-full shadow-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Publication...
              </span>
            ) : (
              'Publier'
            )}
          </button>
        </div>
      </form>
    </Card>
  )
}