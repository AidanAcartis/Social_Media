'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import io from 'socket.io-client'

let socket = null

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Initialiser Socket.IO
    socket = io('http://localhost:5000', {
      withCredentials: true
    })

    socket.on('connect', () => {
      socket.emit('join', user.id)
      socket.emit('getNotifications', user.id)
    })

    socket.on('notificationUpdate', (data) => {
      setUnreadCount(data.unreadCount || 0)
      // Recharger les notifications si on est sur la page
      if (window.location.pathname.includes('/notifications')) {
        fetchNotifications()
      }
    })

    socket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    fetchNotifications()
    fetchUnreadCount()

    return () => {
      if (socket) socket.disconnect()
    }
  }, [user])

  const fetchNotifications = async () => {
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
        setNotifications(notifications.map(n => ({ ...n, is_read: 1 })))
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
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: 1 } : n
        ))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    markOneAsRead,
    fetchNotifications,
    fetchUnreadCount
  }
}