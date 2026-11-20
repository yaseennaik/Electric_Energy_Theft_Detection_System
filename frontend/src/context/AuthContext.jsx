import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vg_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((response) => setUser(response.data))
      .catch(() => localStorage.removeItem('vg_token'))
      .finally(() => setLoading(false))
  }, [])

  const persist = (data) => {
    localStorage.setItem('vg_token', data.access_token)
    setUser(data.user)
    return data.user
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        return persist(data)
      },
      register: async (payload) => {
        const { data } = await api.post('/auth/register', payload)
        return persist(data)
      },
      demoLogin: async () => {
        const { data } = await api.post('/auth/demo')
        return persist(data)
      },
      logout: () => {
        localStorage.removeItem('vg_token')
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
