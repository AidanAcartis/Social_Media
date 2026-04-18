'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Card from '../ui/Card'

export default function UserPhotos({ userId }) {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [videos, setVideos] = useState([])
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('photos')

  const isOwnProfile = user?.id === userId

  useEffect(() => {
    if (userId) {
      fetchUserFiles()
    }
  }, [userId])

  const fetchUserFiles = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/files`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      const processedFiles = data.map(file => ({
        ...file,
        doc_type: file.doc_type || detectFileTypeFromUrl(file.doc_url)
      }))
      
      setPhotos(processedFiles.filter(f => f.doc_type === 'photo'))
      setVideos(processedFiles.filter(f => f.doc_type === 'video'))
      setPdfs(processedFiles.filter(f => f.doc_type === 'pdf'))
    } catch (error) {
      console.error('Error fetching user files:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const detectFileTypeFromUrl = (url) => {
    if (!url) return null
    
    const extension = url.split('.').pop().toLowerCase()
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx']
    
    if (imageExtensions.includes(extension)) return 'photo'
    if (videoExtensions.includes(extension)) return 'video'
    if (documentExtensions.includes(extension)) return 'pdf'
    
    return 'other'
  }

  const tabs = [
    { id: 'photos', label: 'Photos', count: photos.length, icon: '📷' },
    { id: 'videos', label: 'Vidéos', count: videos.length, icon: '🎬' },
    { id: 'pdfs', label: 'Documents', count: pdfs.length, icon: '📄' }
  ]

  const extractFileName = (url) => {
    if (!url) return 'Fichier'
    const name = url.split('/').pop()
    return name.length > 30 ? name.substring(0, 27) + '...' : name
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-2">⚠️ Erreur</div>
        <div className="text-sm text-gray-500">{error}</div>
        <button 
          onClick={fetchUserFiles} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
        >
          Réessayer
        </button>
      </div>
    )
  }

  const hasNoFiles = photos.length === 0 && videos.length === 0 && pdfs.length === 0

  if (hasNoFiles) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">
          {isOwnProfile 
            ? "Vous n'avez pas encore partagé de fichiers."
            : "Cet utilisateur n'a pas encore partagé de fichiers."}
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-800">Médias</h1>
          <p className="text-xs text-gray-400">Photos, vidéos et documents</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-gray-100 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-150 rounded-t-xl ${
              activeTab === tab.id
                ? 'bg-gray-100 text-gray-800'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Photos */}
      {activeTab === 'photos' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.length > 0 ? (
            photos.map((photo, index) => (
              <div 
                key={photo.id || index} 
                className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100 aspect-square"
                onClick={() => window.open(`http://localhost:5000${photo.doc_url}`, '_blank')}
              >
                <img
                  src={`http://localhost:5000${photo.doc_url}`}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%239ca3af"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Aucune photo</p>
            </div>
          )}
        </div>
      )}

      {/* Vidéos */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.length > 0 ? (
            videos.map((video, index) => (
              <div key={video.id || index} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <video controls className="w-full aspect-video bg-black" preload="metadata">
                  <source src={`http://localhost:5000${video.doc_url}`} type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture des vidéos.
                </video>
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-500 truncate">{extractFileName(video.doc_url)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Aucune vidéo</p>
            </div>
          )}
        </div>
      )}

      {/* PDFs */}
      {activeTab === 'pdfs' && (
        <div className="space-y-2">
          {pdfs.length > 0 ? (
            pdfs.map((pdf, index) => (
              <a
                key={pdf.id || index}
                href={`http://localhost:5000${pdf.doc_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all duration-150 group"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{extractFileName(pdf.doc_url)}</p>
                  <p className="text-xs text-gray-400">Document PDF</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm">Aucun document</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}