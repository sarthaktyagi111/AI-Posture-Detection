import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken, setToken } from '@/lib/api'

interface AuthUser {
  id: number
  username: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(username: string, password: string) {
    const { access_token } = await api.login(username, password)
    setToken(access_token)
    setUser(await api.me())
  }

  async function register(username: string, email: string, password: string) {
    const { access_token } = await api.register(username, email, password)
    setToken(access_token)
    setUser(await api.me())
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
