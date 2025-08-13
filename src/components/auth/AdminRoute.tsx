import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface AdminRouteProps {
  children: ReactNode
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, isAdmin, isLoading, token, checkAuth, user } = useAuthStore()

  // Ensure we validate token on hard refresh before deciding
  useEffect(() => {
    if (token && !isAuthenticated && !isLoading) {
      checkAuth()
    }
  }, [token, isAuthenticated, isLoading, checkAuth])

  // Show loading if we're still authenticating OR if we have a token but no user data yet
  if (isLoading || (token && isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-400 text-sm">Authenticating…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}