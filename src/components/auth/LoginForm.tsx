import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { Alert } from '../ui/Alert'
import { useAuthStore } from '../../stores/auth'
import type { LoginRequest } from '../../types/auth'

export const LoginForm = () => {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    try {
      clearError()
      await login(data)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Welcome back</p>
        </div>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="form-input"
                {...register('username', { required: 'Username is required' })}
              />
              {errors.username && (
                <p className="form-error">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="form-input form-input-password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
  )
}