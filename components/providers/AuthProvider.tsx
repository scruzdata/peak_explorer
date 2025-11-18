'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  signInAsAdmin: () => Promise<void>
  signInAsUser: () => Promise<void>
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
    // Para desarrollo, crear usuario admin por defecto
    const mockUser: User = {
      id: '1',
      email: 'admin@peak-explorer.com',
      name: 'Administrador',
      role: 'admin', // Cambiado a admin para desarrollo
      createdAt: new Date().toISOString(),
    }
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
  }
  
  // Función para iniciar sesión como admin (solo desarrollo)
  const signInAsAdmin = async () => {
    const adminUser: User = {
      id: 'admin-1',
      email: 'admin@peak-explorer.com',
      name: 'Administrador',
      role: 'admin',
      createdAt: new Date().toISOString(),
    }
    setUser(adminUser)
    localStorage.setItem('user', JSON.stringify(adminUser))
  }
  
  // Función para iniciar sesión como usuario normal
  const signInAsUser = async () => {
    const normalUser: User = {
      id: 'user-1',
      email: 'usuario@peak-explorer.com',
      name: 'Usuario',
      role: 'user',
      createdAt: new Date().toISOString(),
    }
    setUser(normalUser)
    localStorage.setItem('user', JSON.stringify(normalUser))
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('userProgress')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signInAsAdmin, signInAsUser }}>
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

