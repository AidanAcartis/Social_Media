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
      // Dans handleSubmit, assure-toi que l'URL est correcte
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
    <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl transition-all duration-200 hover:shadow-md">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 px-5 pt-5 pb-2">
          <Avatar userId={user.id} size="sm" />
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setShowUpload(true)}
              placeholder="Quoi de neuf ?"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all duration-150"
              rows={2}
            />
            
            {/* Upload d'image */}
            {showUpload && (
              <div className="mt-2 animate-fade-in">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-all duration-150 group"
                >
                  <svg className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                  </svg>
                  Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                {imagePreview && (
                  <div className="mt-2 relative inline-block group/preview">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="h-20 w-auto rounded-lg object-cover shadow-sm border border-gray-200 transition-all duration-200 group-hover/preview:scale-105"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-all duration-150 shadow-sm"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end px-5 pb-4 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !image)}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5 shadow-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Publication...
              </span>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Publier
              </>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
      `}</style>
    </Card>
  )
}