'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import io from 'socket.io-client'

const NotificationContext = createContext()

let socket = null

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!user) return

    // Initialiser Socket.IO une seule fois
    if (!socket) {
      socket = io('http://localhost:5000', {
        withCredentials: true
      })

      socket.on('connect', () => {
        console.log('Socket.IO connecté (global)')
        setIsConnected(true)
        socket.emit('join', user.id)
        socket.emit('getNotifications', user.id)
      })

      socket.on('newNotification', (notification) => {
        // IGNORER TOUTES LES NOTIFICATIONS QUI NE SONT PAS POUR L'UTILISATEUR CONNECTÉ
        if (notification.user_id !== user.id) {
            return;
        }
        
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
        })

        socket.on('notificationUpdate', (data) => {
        // Ne mettre à jour que si c'est pour l'utilisateur connecté
        setUnreadCount(data.unreadCount || 0);
        if (data.notifications) {
            const userNotifications = data.notifications.filter(n => n.user_id === user.id);
            setNotifications(userNotifications);
        }
        })

      socket.on('disconnect', () => {
        console.log('Socket.IO déconnecté')
        setIsConnected(false)
      })
    }

    fetchAllNotifications()
    fetchUnreadCount()

    return () => {
      // Ne pas déconnecter le socket global
    }
  }, [user])

  const fetchAllNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/unread/count', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/read', {
        method: 'PUT',
        credentials: 'include'
      })
      if (response.ok) {
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const markOneAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/read/${notificationId}`, {
        method: 'PUT',
        credentials: 'include'
      })
      if (response.ok) {
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: 1 } : n
        ))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        const deletedNotif = notifications.find(n => n.id === notificationId)
        if (deletedNotif && !deletedNotif.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Exposer le socket et isConnected pour les autres composants
  const getSocket = () => socket
  const getIsConnected = () => isConnected

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAllAsRead,
      markOneAsRead,
      deleteNotification,
      fetchAllNotifications,
      fetchUnreadCount,
      getSocket,      // Ajouté
      getIsConnected  // Ajouté
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}