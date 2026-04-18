'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [backendError, setBackendError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Vérifier d'abord si le backend est accessible
      const healthCheck = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      }).catch(() => null)
      
      if (!healthCheck || !healthCheck.ok) {
        console.error('Backend non accessible')
        setBackendError(true)
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:5000/api/auth/me', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setBackendError(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setBackendError(true)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        router.push('/home')
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }

  const signup = async (username, email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        router.push('/home')
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }

  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
    router.push('/login')
  }

  const updateUser = async (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  const deleteAccount = async () => {
    setUser(null)
    router.push('/login')
  }

  // Afficher une erreur si le backend n'est pas accessible
  if (backendError && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Erreur de connexion</h2>
          <p className="text-sm text-gray-500 mb-4">
            Impossible de se connecter au serveur. Veuillez vérifier que le backend est démarré sur http://localhost:5000
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      updateUser, 
      deleteAccount 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)