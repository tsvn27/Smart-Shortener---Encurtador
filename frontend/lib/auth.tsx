"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { api, User } from "./api"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, twoFACode?: string) => Promise<{ requires2FA?: boolean }>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = api.getToken()
    if (token) {
      api.getMe()
        .then((res) => setUser(res.data))
        .catch(() => api.clearToken())
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, twoFACode?: string) => {
    const res = await api.login(email, password, twoFACode)
    
    if (res.data.requires2FA) {
      return { requires2FA: true }
    }
    
    if (res.data.token && res.data.user) {
      api.setToken(res.data.token)
      setUser(res.data.user)
    }
    
    return {}
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password)
    api.setToken(res.data.token)
    setUser(res.data.user)
  }

  const logout = () => {
    api.clearToken()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const res = await api.getMe()
      setUser(res.data)
    } catch (err) {
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
