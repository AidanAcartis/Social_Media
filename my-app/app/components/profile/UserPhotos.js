'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

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
      console.log('Fichiers récupérés:', data) // Pour déboguer
      
      // CORRECTION: Détecter le type de fichier basé sur l'extension
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

  // Fonction pour détecter le type de fichier depuis l'URL
  const detectFileTypeFromUrl = (url) => {
    if (!url) return null
    
    const extension = url.split('.').pop().toLowerCase()
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx']
    
    if (imageExtensions.includes(extension)) {
      return 'photo'
    } else if (videoExtensions.includes(extension)) {
      return 'video'
    } else if (documentExtensions.includes(extension)) {
      return 'pdf'
    }
    
    return 'other'
  }

  const tabs = [
    { id: 'photos', label: 'Photos', count: photos.length, icon: '📷' },
    { id: 'videos', label: 'Vidéos', count: videos.length, icon: '🎬' },
    { id: 'pdfs', label: 'Documents', count: pdfs.length, icon: '📄' }
  ]

  const extractFileName = (url) => {
    if (!url) return 'Fichier'
    return url.split('/').pop()
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-500">Chargement des fichiers...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Erreur: {error}</p>
        <button 
          onClick={fetchUserFiles}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Réessayer
        </button>
      </div>
    )
  }

  const hasNoFiles = photos.length === 0 && videos.length === 0 && pdfs.length === 0

  if (hasNoFiles) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isOwnProfile 
          ? "Vous n'avez pas encore partagé de fichiers."
          : "Cet utilisateur n'a pas encore partagé de fichiers."}
      </div>
    )
  }

  return (
    <div>
      {/* Onglets */}
      <div className="flex border-b mb-4 gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
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
                className="relative group cursor-pointer" 
                onClick={() => window.open(`http://localhost:5000${photo.doc_url}`, '_blank')}
              >
                <img
                  src={`http://localhost:5000${photo.doc_url}`}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition"
                  onError={(e) => {
                    console.error('Erreur chargement image:', `http://localhost:5000${photo.doc_url}`)
                    e.target.src = '/placeholder-image.jpg'
                    e.target.onerror = null
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition rounded-lg" />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              Aucune photo
            </div>
          )}
        </div>
      )}

      {/* Vidéos */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.length > 0 ? (
            videos.map((video, index) => (
              <div key={video.id || index} className="border rounded-lg overflow-hidden">
                <video controls className="w-full" preload="metadata">
                  <source src={`http://localhost:5000${video.doc_url}`} type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture des vidéos.
                </video>
                <div className="p-2 text-sm text-gray-600 truncate">
                  {extractFileName(video.doc_url)}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              Aucune vidéo
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
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{extractFileName(pdf.doc_url)}</p>
                  <p className="text-sm text-gray-500">Document PDF</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              Aucun document
            </div>
          )}
        </div>
      )}
    </div>
  )
}