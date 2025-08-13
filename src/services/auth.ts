import type { User, LoginRequest, RegisterRequest, LoginResponse, AuthError } from '../types/auth'

const API_BASE_URL = 'http://localhost:8000'

class AuthService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  async refresh(): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', headers: this.getAuthHeaders() })
    if (!response.ok) {
      const errorData: AuthError = await response.json().catch(()=>({detail:'Refresh failed'} as AuthError))
      throw new Error(errorData.detail || 'Refresh failed')
    }
    return response.json()
  }
  async tokenStatus(): Promise<any> { // can refine later
    const response = await fetch(`${API_BASE_URL}/auth/token-status`, { headers: this.getAuthHeaders() })
    if (!response.ok) throw new Error('Token status failed')
    return response.json()
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const formData = new URLSearchParams()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorData: AuthError = await response.json()
      throw new Error(errorData.detail || 'Login failed')
    }

    return response.json()
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData: AuthError = await response.json()
      throw new Error(errorData.detail || 'Registration failed')
    }

    return response.json()
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData: AuthError = await response.json()
      throw new Error(errorData.detail || 'Failed to fetch user data')
    }

    return response.json()
  }

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData: AuthError = await response.json()
      throw new Error(errorData.detail || 'Logout failed')
    }
  }

  saveToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  removeToken(): void {
    localStorage.removeItem('auth_token')
  }

  isTokenExpired(token: string): boolean {
    if (!token) return true
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch {
      return true
    }
  }

  isTokenExpiringSoon(token: string, thresholdMinutes: number = 60): boolean {
    if (!token) return true

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      const timeUntilExpiry = payload.exp - currentTime
      return timeUntilExpiry < (thresholdMinutes * 60)
    } catch {
      return true
    }
  }

  handleAuthError(): void {
    this.removeToken()
    // Clear any auth store state
    window.location.href = '/login'
  }
}

export const authService = new AuthService()