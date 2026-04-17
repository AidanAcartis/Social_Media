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
    const error = await response.json()
    throw new Error(error.message || 'Une erreur est survenue')
  }
  
  return response.json()
}

export const api = {
  // Auth
  login: (email, password) => fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  
  register: (username, email, password) => fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  }),
  
  logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
  
  // Posts
  getPosts: () => fetchAPI('/posts'),
  createPost: (content, image) => {
    const formData = new FormData()
    formData.append('content', content)
    if (image) formData.append('image', image)
    return fetch(`${API_URL}/posts`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(res => res.json())
  },
  
  deletePost: (postId) => fetchAPI(`/posts/${postId}`, { method: 'DELETE' }),
  
  // Reactions
  addReaction: (postId, type) => fetchAPI(`/posts/${postId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  }),
  
  // Comments
  getComments: (postId) => fetchAPI(`/posts/${postId}/comments`),
  addComment: (postId, content) => fetchAPI(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
  deleteComment: (commentId) => fetchAPI(`/comments/${commentId}`, { method: 'DELETE' }),
}