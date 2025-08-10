import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminCardsPage } from './pages/AdminCardsPage'
import { AdminSetsPage } from './pages/AdminSetsPage'
import { AdminBrandsPage } from './pages/AdminBrandsPage'
import { AdminPlayersPage } from './pages/AdminPlayersPage'
import { AdminTeamsPage } from './pages/AdminTeamsPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminRoute } from './components/auth/AdminRoute'
import { useAuthStore } from './stores/auth'
import { ImportUploadPage } from './pages/ImportUploadPage'
import { ImportResolvePage } from './pages/ImportResolvePage'
import { PendingBatchesPage } from './pages/PendingBatchesPage'
import CardSearchPage from './pages/CardSearchPage'

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()
  
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
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/cards" 
            element={
              <AdminRoute>
                <AdminCardsPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/sets" 
            element={
              <AdminRoute>
                <AdminSetsPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/brands" 
            element={
              <AdminRoute>
                <AdminBrandsPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/players" 
            element={
              <AdminRoute>
                <AdminPlayersPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/teams" 
            element={
              <AdminRoute>
                <AdminTeamsPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/imports/upload" 
            element={
              <AdminRoute>
                <ImportUploadPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/imports/:batchId/resolve" 
            element={
              <AdminRoute>
                <ImportResolvePage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/imports/batches" 
            element={
              <AdminRoute>
                <PendingBatchesPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/cards/search" 
            element={
              <ProtectedRoute>
                <CardSearchPage />
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
