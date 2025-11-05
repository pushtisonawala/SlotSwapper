"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiService, type User as ApiUser, type AuthResponse } from "@/lib/api/api-service"

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  created_at: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, firstName: string, lastName: string, username: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("auth_token")
      const userData = localStorage.getItem("user_data")
      
      if (token) {
        try {
          console.log('Verifying stored token...')
          
          // First try to use stored user data if available
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData)
              console.log('Using cached user data:', parsedUser)
              setUser(parsedUser)
              setIsLoading(false)
              
              // Verify token in background, but don't block the UI
              apiService.getProfile().then(response => {
                if (response.data) {
                  console.log('Token verified, updating user data')
                  setUser(response.data)
                  localStorage.setItem("user_data", JSON.stringify(response.data))
                } else {
                  console.log('Token expired, will need to re-login')
                  // Only clear auth if we're sure the token is invalid
                  localStorage.removeItem("auth_token")
                  localStorage.removeItem("user_data")
                  setUser(null)
                }
              }).catch(error => {
                console.error("Background token verification failed:", error)
                // Don't immediately logout on network errors
                if (error.message && error.message.includes('401')) {
                  localStorage.removeItem("auth_token")
                  localStorage.removeItem("user_data")
                  setUser(null)
                }
              })
              return
            } catch (parseError) {
              console.error('Failed to parse user data:', parseError)
            }
          }
          
          // If no cached data, verify token
          const response = await apiService.getProfile()
          if (response.data) {
            console.log('Token valid, user:', response.data)
            setUser(response.data)
            localStorage.setItem("user_data", JSON.stringify(response.data))
          } else {
            console.log('Token invalid, error:', response.error)
            localStorage.removeItem("auth_token")
            localStorage.removeItem("user_data")
          }
        } catch (error) {
          console.error("Failed to verify token:", error)
          // Only clear auth on authentication errors, not network errors
          if (error instanceof Error && error.message.includes('401')) {
            localStorage.removeItem("auth_token")
            localStorage.removeItem("user_data")
          }
        }
      } else {
        console.log('No token found')
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiService.login({ email, password })
      
      if (response.data) {
        const { user: userData, tokens } = response.data
        localStorage.setItem("auth_token", tokens.access_token)
        localStorage.setItem("refresh_token", tokens.refresh_token)
        localStorage.setItem("user_data", JSON.stringify(userData))
        setUser(userData)
      } else {
        throw new Error(response.error || "Login failed")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, firstName: string, lastName: string, username: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiService.register({
        email,
        password,
        password_confirm: password,
        first_name: firstName,
        last_name: lastName,
        username,
      })
      
      if (response.data) {
        const { user: userData, tokens } = response.data
        localStorage.setItem("auth_token", tokens.access_token)
        localStorage.setItem("refresh_token", tokens.refresh_token)
        localStorage.setItem("user_data", JSON.stringify(userData))
        setUser(userData)
      } else {
        // Handle detailed validation errors
        if (response.error && typeof response.error === 'object') {
          const errors = []
          for (const [field, messages] of Object.entries(response.error)) {
            if (Array.isArray(messages)) {
              errors.push(...messages)
            } else {
              errors.push(messages)
            }
          }
          throw new Error(errors.join('. '))
        }
        throw new Error(response.error || "Registration failed")
      }
    } catch (error) {
      let errorMessage = "Registration failed"
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Handle API response errors
        const errorObj = error as any
        if (errorObj.response && errorObj.response.data) {
          const data = errorObj.response.data
          if (typeof data === 'object') {
            const errors = []
            for (const [field, messages] of Object.entries(data)) {
              if (Array.isArray(messages)) {
                errors.push(...messages)
              } else {
                errors.push(messages as string)
              }
            }
            if (errors.length > 0) {
              errorMessage = errors.join('. ')
            }
          } else if (typeof data === 'string') {
            errorMessage = data
          }
        }
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_data")
    setUser(null)
    setError(null)
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user, 
      login, 
      signup, 
      logout, 
      error, 
      clearError 
    }}>
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
