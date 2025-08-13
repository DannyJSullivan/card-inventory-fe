import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface AdminRouteProps {
  children: ReactNode
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, isAdmin, isLoading, token, checkAuth } = useAuthStore()

  // Ensure we validate token on hard refresh before deciding
  useEffect(() => {
    if (token && !isAuthenticated && !isLoading) {
      checkAuth()
    }
  }, [token, isAuthenticated, isLoading, checkAuth])

  // Always show loading if we have a token but are not authenticated (regardless of isLoading state)
  // This handles the case where checkAuth() is running but isLoading isn't set properly
  if (token && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-400 text-sm">Authenticating…</p>
        </div>
      </div>
    )
  }

  // Also show loading if explicitly loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}