'use client'

import { io } from 'socket.io-client'

let socket = null

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    })
  }
  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initSocket()
  }
  return socket
}

export const connectSocket = (userId) => {
  const socket = getSocket()
  if (!socket.connected) {
    socket.connect()
    socket.on('connect', () => {
      console.log('Socket connected')
      socket.emit('join', userId)
    })
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect()
  }
}

// Événements pour le forum public
export const emitForumMessage = (senderId, username, content) => {
  const socket = getSocket()
  socket.emit('sendForumMessage', { senderId, username, content })
}

export const onForumMessage = (callback) => {
  const socket = getSocket()
  socket.on('newForumMessage', callback)
  socket.on('forumMessages', callback)
  return () => {
    socket.off('newForumMessage', callback)
    socket.off('forumMessages', callback)
  }
}

// Événements pour les messages privés
export const emitPrivateMessage = (senderId, receiverId, content) => {
  const socket = getSocket()
  socket.emit('sendPrivateMessage', { senderId, receiverId, content })
}

export const onPrivateMessage = (callback) => {
  const socket = getSocket()
  socket.on('newPrivateMessage', callback)
  return () => socket.off('newPrivateMessage', callback)
}

// Demander l'historique des messages privés
export const requestMessages = (senderId, receiverId) => {
  const socket = getSocket()
  socket.emit('getMessages', { senderId, receiverId })
}

export const onMessagesHistory = (callback) => {
  const socket = getSocket()
  socket.on('receiveMessages', callback)
  return () => socket.off('receiveMessages', callback)
}

// Notifications de messages non lus
export const requestUnreadMessages = (userId) => {
  const socket = getSocket()
  socket.emit('getUnreadMessages', userId)
}

export const onUnreadMessagesCount = (callback) => {
  const socket = getSocket()
  socket.on('unreadMessagesCount', callback)
  return () => socket.off('unreadMessagesCount', callback)
}

// Notifications générales
export const requestNotifications = (userId) => {
  const socket = getSocket()
  socket.emit('getNotifications', userId)
}

export const onNotificationUpdate = (callback) => {
  const socket = getSocket()
  socket.on('notificationUpdate', callback)
  return () => socket.off('notificationUpdate', callback)
}

export default {
  initSocket,
  getSocket,
  connectSocket,
  disconnectSocket,
  emitForumMessage,
  onForumMessage,
  emitPrivateMessage,
  onPrivateMessage,
  requestMessages,
  onMessagesHistory,
  requestUnreadMessages,
  onUnreadMessagesCount,
  requestNotifications,
  onNotificationUpdate,
}