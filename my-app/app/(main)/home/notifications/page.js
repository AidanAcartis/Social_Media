'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Avatar from '../../../components/ui/Avatar'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchNotifications()
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

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'follow':
        return `vous a suivi(e)`
      case 'reaction':
        return `a réagi à votre publication`
      case 'comment':
        return `a commenté votre publication`
      default:
        return `a interagi avec vous`
    }
  }

  if (loading) return <div className="text-center py-10">Chargement...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <Card>
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map(notif => (
              <div key={notif.id} className="flex items-center gap-3 py-3">
                <Link href={`/home/followedPage/${notif.actor_id}`}>
                  <Avatar userId={notif.actor_id} size="md" />
                </Link>
                <div>
                  <Link href={`/home/followedPage/${notif.actor_id}`} className="font-semibold hover:underline">
                    {notif.username}
                  </Link>
                  <span className="ml-1">{getNotificationMessage(notif)}</span>
                  <p className="text-sm text-gray-500">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-5">Aucune notification</p>
        )}
      </Card>
    </div>
  )
}