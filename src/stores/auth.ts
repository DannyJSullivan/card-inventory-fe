import { create } from 'zustand'
import { authService } from '../services/auth'
import type { AuthStore, LoginRequest, RegisterRequest } from '../types/auth'

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: authService.getToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setToken: (token: string) => {
    authService.saveToken(token)
    set({ token })
  },
  refreshToken: async () => {
    const current = get().token
    if (!current) return
    try {
      const data = await authService.refresh()
      authService.saveToken(data.access_token)
      set({ token: data.access_token, isAuthenticated: true, error: null })
      // optionally refresh user silently
      try { 
        const user = await authService.getCurrentUser()
        set({ user, isAuthenticated: true, error: null }) 
      } catch (userError) {
        console.warn('Failed to refresh user data after token refresh:', userError)
      }
    } catch (e) {
      console.warn('Token refresh failed, logging out')
      get().logout()
    }
  },

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await authService.login(credentials)
      const token = response.access_token
      
      authService.saveToken(token)
      
      const user = await authService.getCurrentUser()
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })
      authService.removeToken()
      throw error
    }
  },

  register: async (userData: RegisterRequest) => {
    set({ isLoading: true, error: null })
    
    try {
      const user = await authService.register(userData)
      
      const loginResponse = await authService.login({
        username: userData.username,
        password: userData.password,
      })
      
      const token = loginResponse.access_token
      authService.saveToken(token)
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })
      authService.removeToken()
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    
    try {
      await authService.logout()
    } catch (error) {
      console.warn('Logout API call failed:', error)
    } finally {
      authService.removeToken()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },

  checkAuth: async () => {
    const token = get().token
    
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return
    }

    if (authService.isTokenExpired(token)) {
      authService.handleAuthError()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: 'Session expired. Please login again.',
      })
      return
    }

    // Check if token is expiring soon and refresh if needed
    if (authService.isTokenExpiringSoon(token, 60)) {
      try {
        await get().refreshToken()
        return // refreshToken already updates the state
      } catch (error) {
        console.warn('Token refresh failed during checkAuth')
        authService.handleAuthError()
        return
      }
    }

    set({ isLoading: true })
    
    try {
      const user = await authService.getCurrentUser()
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.warn('getCurrentUser failed, likely 401:', error)
      authService.handleAuthError()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication failed. Please login again.',
      })
    }
  },

  isAdmin: () => {
    const { user } = get()
    return user?.is_admin || false
  },
}))

// Background refresh every hour if token close to expiry (2h threshold)
if (typeof window !== 'undefined') {
  const refreshLoop = () => {
    const state = useAuthStore.getState()
    const token = state.token
    if (!token) return
    
    // Use the new isTokenExpiringSoon method with 2 hour threshold
    if (authService.isTokenExpiringSoon(token, 120)) {
      console.log('Token expiring soon, refreshing...')
      state.refreshToken()
    }
  }
  setInterval(refreshLoop, 60 * 60 * 1000) // Check every hour
}

if (typeof window !== 'undefined') {
  const token = authService.getToken()
  if (token && !authService.isTokenExpired(token)) {
    useAuthStore.getState().checkAuth()
  }
}