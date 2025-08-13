import { authService } from '../services/auth'

// Global fetch wrapper with auth handling
export const apiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = authService.getToken()
  
  // Check if token is expired
  if (token && authService.isTokenExpired(token)) {
    authService.handleAuthError()
    throw new Error('Session expired')
  }

  // Check if token is expiring soon and refresh if needed
  if (token && authService.isTokenExpiringSoon(token, 60)) {
    try {
      const refreshData = await authService.refresh()
      authService.saveToken(refreshData.access_token)
      token = refreshData.access_token
    } catch (error) {
      console.warn('Token refresh failed, logging out:', error)
      authService.handleAuthError()
      throw new Error('Session expired')
    }
  }

  // Add auth headers if token exists
  const headers = {
    // Only set Content-Type if not FormData (FormData sets its own boundary)
    ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` })
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  // Handle 401 responses
  if (response.status === 401) {
    authService.handleAuthError()
    throw new Error('Authentication failed')
  }

  return response
}

// Helper for JSON responses
export const apiRequestJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await apiRequest(url, options)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}