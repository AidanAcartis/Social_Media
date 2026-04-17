const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }))
    throw new Error(error.message || 'Une erreur est survenue')
  }
  
  return response.json()
}

// Fonction pour les uploads de fichiers (FormData)
async function uploadAPI(endpoint, formData) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erreur lors de l\'upload' }))
    throw new Error(error.message || 'Erreur lors de l\'upload')
  }
  
  return response.json()
}

export const api = {
  // ========== AUTH ==========
  auth: {
    login: (email, password) => fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    
    register: (username, email, password) => fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),
    
    logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
    
    getMe: () => fetchAPI('/auth/me'),
  },

  // ========== POSTS ==========
  posts: {
    getAll: () => fetchAPI('/posts'),
    
    getFeed: () => fetchAPI('/posts/feed'),
    
    getUserPosts: (userId) => fetchAPI(`/posts/user/${userId}`),
    
    getOne: (postId) => fetchAPI(`/posts/${postId}`),
    
    create: (content, image) => {
      const formData = new FormData()
      formData.append('content', content)
      if (image) formData.append('image', image)
      return uploadAPI('/posts', formData)
    },
    
    update: (postId, content) => fetchAPI(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
    
    delete: (postId) => fetchAPI(`/posts/${postId}`, { method: 'DELETE' }),
  },

  // ========== REACTIONS ==========
  reactions: {
    add: (postId, type) => fetchAPI(`/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
    
    remove: (postId) => fetchAPI(`/posts/${postId}/reactions`, { method: 'DELETE' }),
    
    getUserReaction: (postId) => fetchAPI(`/posts/${postId}/reactions/user`),
    
    getCount: (postId) => fetchAPI(`/posts/${postId}/reactions/count`),
  },

  // ========== COMMENTS ==========
  comments: {
    getByPost: (postId) => fetchAPI(`/posts/${postId}/comments`),
    
    add: (postId, content) => fetchAPI(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
    
    delete: (commentId) => fetchAPI(`/comments/${commentId}`, { method: 'DELETE' }),
    
    addReaction: (commentId, type) => fetchAPI(`/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  },

  // ========== USERS ==========
  users: {
    getProfile: (userId) => fetchAPI(`/users/${userId}`),
    
    getUsername: (userId) => fetchAPI(`/users/${userId}/username`),
    
    getAvatar: (userId) => fetchAPI(`/users/${userId}/avatar`),
    
    updateAvatar: (file) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return uploadAPI('/users/avatar', formData)
    },
    
    updateCover: (file) => {
      const formData = new FormData()
      formData.append('cover', file)
      return uploadAPI('/users/cover', formData)
    },
    
    search: (username) => fetchAPI(`/users/search?username=${encodeURIComponent(username)}`),
    
    getUserFiles: (userId) => fetchAPI(`/users/${userId}/files`),
  },

  // ========== FOLLOWERS ==========
  followers: {
    getAll: () => fetchAPI('/friends'),
    
    follow: (followedId) => fetchAPI('/friends/follow', {
      method: 'POST',
      body: JSON.stringify({ followed_id: followedId }),
    }),
    
    unfollow: (followedId) => fetchAPI('/friends/unfollow', {
      method: 'POST',
      body: JSON.stringify({ followed_id: followedId }),
    }),
    
    checkStatus: (userId) => fetchAPI(`/friends/check?userId=${userId}`),
  },

  // ========== NOTIFICATIONS ==========
  notifications: {
    getAll: () => fetchAPI('/notifications'),
    
    markAsRead: () => fetchAPI('/notifications/read', { method: 'PUT' }),
  },

  // ========== MESSAGES ==========
  messages: {
    getWithUser: (userId) => fetchAPI(`/messages/${userId}`),
    
    send: (receiverId, content) => fetchAPI('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    }),
    
    markAsRead: (senderId) => fetchAPI('/messages/read', {
      method: 'PUT',
      body: JSON.stringify({ senderId }),
    }),
  },

  // ========== ABOUT ==========
  about: {
    get: (userId) => fetchAPI(`/about?userId=${userId}`),
    
    save: (userId, description) => fetchAPI('/about', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, description }),
    }),
  },

  // ========== LOCATION ==========
  location: {
    get: (userId) => fetchAPI(`/location?userId=${userId}`),
    
    save: (userId, country, city) => fetchAPI('/location', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, country, city }),
    }),
  },
}

export default api