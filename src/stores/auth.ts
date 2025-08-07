import { create } from 'zustand'
import { authService } from '../services/auth'
import type { AuthStore, LoginRequest, RegisterRequest } from '../types/auth'

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: authService.getToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,

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
      authService.removeToken()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: 'Session expired. Please login again.',
      })
      return
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
      authService.removeToken()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication failed. Please login again.',
      })
    }
  },
}))

if (typeof window !== 'undefined') {
  const token = authService.getToken()
  if (token && !authService.isTokenExpired(token)) {
    useAuthStore.getState().checkAuth()
  }
}