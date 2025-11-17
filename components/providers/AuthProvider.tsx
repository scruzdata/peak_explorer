'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga de sesión desde localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Error parsing user data', e)
      }
    }
    setLoading(false)
  }, [])

  const signIn = async () => {
    // Simulación de autenticación - en producción usar NextAuth o Firebase Auth
    const mockUser: User = {
      id: '1',
      email: 'usuario@example.com',
      name: 'Usuario Demo',
      role: 'user',
      createdAt: new Date().toISOString(),
    }
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('userProgress')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

