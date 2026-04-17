/* eslint-disable @next/next/no-img-element */

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import Avatar from '../../../components/ui/Avatar'
import Card from '../../../components/ui/Card'
import Cover from '../../../components/ui/Cover'
import PostCard from '../../../components/posts/PostCard'
import AboutMeForm from '../../../components/profile/AboutMeForm'
import LocationForm from '../../../components/profile/LocationForm'
import FriendList from '../../../components/profile/FriendList'
import UserPhotos from '../../../components/profile/UserPhotos'

const tabClasses = 'flex gap-1 md:px-3 py-1 items-center border-b-4 border-b-white cursor-pointer'
const activeTabClasses = 'flex gap-1 md:px-3 py-1 items-center border-blue-500 border-b-4 text-blue-500 font-bold cursor-pointer'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('posts')
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState(null)

  // Récupérer les informations utilisateur
  useEffect(() => {
    if (user) {
      fetchUserInfo()
      fetchUserPosts()
    }
  }, [user])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${user?.id}/info`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/user/${user?.id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUserPosts(data)
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const currentPath = pathname.split('/').pop()
    if (['posts', 'about', 'friends', 'photos'].includes(currentPath)) {
      setActiveTab(currentPath)
    } else {
      setActiveTab('posts')
    }
  }, [pathname])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    window.history.pushState(null, '', `/home/profile/${tab}`)
  }

  const handlePostDeleted = (postId) => {
    setUserPosts(userPosts.filter(post => post.id !== postId))
  }

  if (authLoading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    )
  }

  return (
    <div>
      <Card noPadding>
        <div className="relative overflow-hidden rounded-md">
          <Cover editable={true} />
          <div className="relative">
            <div className="absolute bottom-2 top-0 left-6">
              <Avatar size="lg" editable={true} />
            </div>
            <div className="p-4 pt-0 md:pt-4 pb-8">
              <div className="ml-24 md:ml-40">
                <h1 className="text-2xl font-bold">{user?.username || 'Chargement...'}</h1>
                <div className="text-gray-500 text-sm">
                  {user?.email}
                </div>
                <div className="text-gray-500 text-sm">
                  Membre depuis {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : '...'}
                </div>
              </div>
              <div className="mt-4 md:mt-10 flex gap-5 text-sm">
                <button onClick={() => handleTabChange('posts')} className={activeTab === 'posts' ? activeTabClasses : tabClasses}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span className="hidden sm:block">Posts</span>
                </button>
                <button onClick={() => handleTabChange('about')} className={activeTab === 'about' ? activeTabClasses : tabClasses}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  <span className="hidden sm:block">À propos</span>
                </button>
                <button onClick={() => handleTabChange('friends')} className={activeTab === 'friends' ? activeTabClasses : tabClasses}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                  <span className="hidden sm:block">Amis</span>
                </button>
                <button onClick={() => handleTabChange('photos')} className={activeTab === 'photos' ? activeTabClasses : tabClasses}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                  </svg>
                  <span className="hidden sm:block">Médias</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'posts' && (
        <div className="space-y-5 mt-5">
          {loading ? (
            <div className="text-center py-10">Chargement des publications...</div>
          ) : userPosts.length > 0 ? (
            userPosts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
            ))
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-5">Aucune publication pour le moment</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="mt-5">
          <Card>
            <h2 className="font-bold text-2xl mb-4">À propos de moi</h2>
            <AboutMeForm userId={user?.id} />
          </Card>
          <Card>
            <h2 className="font-bold text-2xl mb-4">Localisation</h2>
            <LocationForm userId={user?.id} />
          </Card>
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="mt-5">
          <Card>
            <h2 className="font-bold text-2xl mb-4">Mes amis</h2>
            <FriendList userId={user?.id} />
          </Card>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="mt-5">
          <Card>
            <h2 className="font-bold text-2xl mb-4">Mes fichiers</h2>
            <UserPhotos userId={user?.id} />
          </Card>
        </div>
      )}
    </div>
  )
}