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

const tabClasses = 'flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200'
const activeTabClasses = 'flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md shadow-blue-200'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('posts')
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState(null)

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
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Carte de profil */}
      <Card noPadding className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <Cover editable={true} />
        <div className="relative px-6 pb-6">
          <div className="absolute -top-12 left-6">
            <Avatar size="lg" editable={true} />
          </div>
          <div className="pt-14 pl-28 md:pl-36">
            <h1 className="text-2xl font-bold text-gray-900">{user?.username || 'Chargement...'}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user?.email}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Membre depuis {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : '...'}
              </span>
            </div>
          </div>

          {/* Navigation des onglets */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => handleTabChange('posts')} className={activeTab === 'posts' ? activeTabClasses : tabClasses}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Publications
            </button>
            <button onClick={() => handleTabChange('about')} className={activeTab === 'about' ? activeTabClasses : tabClasses}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              À propos
            </button>
            <button onClick={() => handleTabChange('friends')} className={activeTab === 'friends' ? activeTabClasses : tabClasses}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM6 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Amis
            </button>
            <button onClick={() => handleTabChange('photos')} className={activeTab === 'photos' ? activeTabClasses : tabClasses}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              Médias
            </button>
          </div>
        </div>
      </Card>

      {/* Contenu des onglets avec animations */}
      <div className="animate-fade-in">
        {activeTab === 'posts' && (
          <div className="space-y-5">
            {loading ? (
              <Card className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </Card>
            ) : userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
              ))
            ) : (
              <Card className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-gray-500">Aucune publication pour le moment</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-5">
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">À propos de moi</h2>
              </div>
              <AboutMeForm userId={user?.id} />
            </Card>
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-linear-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Localisation</h2>
              </div>
              <LocationForm userId={user?.id} />
            </Card>
          </div>
        )}

        {activeTab === 'friends' && (
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM6 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Mes amis</h2>
            </div>
            <FriendList userId={user?.id} />
          </Card>
        )}

        {activeTab === 'photos' && (
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-linear-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Mes fichiers</h2>
            </div>
            <UserPhotos userId={user?.id} />
          </Card>
        )}
      </div>
    </div>
  )
}