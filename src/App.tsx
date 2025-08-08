import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuthStore } from './stores/auth'
import { useTokenRefresh } from './hooks/useTokenRefresh'

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()
  
  useTokenRefresh()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" replace />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
