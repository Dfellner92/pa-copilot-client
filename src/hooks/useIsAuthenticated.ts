'use client'
import { useState, useEffect } from 'react'

export function useIsAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check authentication status on client side
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/validate')
        setIsAuthenticated(response.ok)
      } catch {
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  return isAuthenticated
}
