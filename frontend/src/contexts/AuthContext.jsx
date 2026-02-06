import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      // Verify token is still valid
      authAPI.getCurrentUser()
        .then((response) => {
          setUser(response.data.user)
          localStorage.setItem('user', JSON.stringify(response.data.user))
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { user, session } = response.data
      
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
        return { success: true }
      }
      return { success: false, error: 'No token received' }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      }
    }
  }

  const register = async (email, password) => {
    try {
      const response = await authAPI.register(email, password)
      const { user } = response.data
      return { success: true, user }
    } catch (error) {
      // Handle different error status codes
      if (error.response?.status === 429) {
        return {
          success: false,
          error: error.response?.data?.error || 'Too many registration attempts. Please wait a few minutes and try again.',
        }
      }
      if (error.response?.status === 409) {
        return {
          success: false,
          error: error.response?.data?.error || 'This email is already registered. Please login instead.',
        }
      }
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed. Please try again.',
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      const updatedUser = response.data.user
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return updatedUser
    } catch (error) {
      console.error('Refresh user error:', error)
      return null
    }
  }

  const updateUser = (updatedUser) => {
    if (updatedUser) {
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
    loading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
