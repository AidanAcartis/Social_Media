'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import { useNotifications } from '../../../context/NotificationContext'
import Card from '../../../components/ui/Card'
import Avatar from '../../../components/ui/Avatar'

export default function NotificationsPage() {
  const { user } = useAuth()
  const { notifications, loading, markAllAsRead, deleteNotification, fetchAllNotifications } = useNotifications()

  useEffect(() => {
    if (user) {
      // D'abord charger les notifications
      fetchAllNotifications()
      // Ensuite marquer toutes comme lues (pour le badge)
      markAllAsRead()
    }
  }, [user])

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'friend_request':
        return `vous a envoyé une demande d'ami`;
      case 'friend_accepted':
        return `a accepté votre demande d'ami`;
      case 'reaction':
        return `a réagi à votre publication`;
      case 'comment':
        return `a commenté votre publication`;
      case 'private_message':  // <-- AJOUTEZ CE CAS
        return `vous a envoyé un message privé`;
      case 'forum_message':
        return `a publié un message dans le forum`;
      default:
        return `a interagi avec vous`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-800">Notifications</h1>
            <p className="text-xs text-gray-400">Restez informé de vos interactions</p>
          </div>
        </div>
      </div>

      {/* Liste des notifications */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`flex items-start gap-3 px-5 py-4 transition-colors duration-150 group ${
                  !notif.is_read ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50/50'
                }`}
              >
                <Link href={`/home/followedPage/${notif.actor_id}`} className="shrink-0">
                  <Avatar userId={notif.actor_id} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-1">
                    <Link 
                      href={`/home/followedPage/${notif.actor_id}`} 
                      className="text-sm font-semibold text-gray-800 hover:text-gray-600 transition-colors"
                    >
                      {notif.username}
                    </Link>
                    <span className="text-sm text-gray-500">{getNotificationMessage(notif)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleString([], { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  {/* Bouton supprimer */}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500"
                    title="Supprimer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <p className="text-sm">Aucune notification</p>
            <p className="text-xs text-gray-300 mt-0.5">Vous serez alerté lorsqu'il y aura du nouveau</p>
          </div>
        )}
      </Card>

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