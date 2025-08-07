import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/auth'
import { authService } from '../services/auth'

const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000 // 25 minutes (tokens expire in 30)

export const useTokenRefresh = () => {
  const { token, logout, isAuthenticated } = useAuthStore()
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const checkTokenExpiry = () => {
      if (!token) return

      if (authService.isTokenExpired(token)) {
        console.warn('Token expired, logging out...')
        logout()
        return
      }

      const payload = JSON.parse(atob(token.split('.')[1]))
      const timeUntilExpiry = (payload.exp * 1000) - Date.now()
      
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.warn('Token expiring soon, logging out...')
        logout()
      }
    }

    checkTokenExpiry()
    intervalRef.current = setInterval(checkTokenExpiry, TOKEN_REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [token, isAuthenticated, logout])
}