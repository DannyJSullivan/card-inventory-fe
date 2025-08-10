import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'
import type { ReactNode } from 'react'

interface AdminRouteProps {
  children: ReactNode
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, isAdmin } = useAuthStore()

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If authenticated but not admin, redirect to regular dashboard
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  // If authenticated and admin, render the admin content
  return <>{children}</>
}