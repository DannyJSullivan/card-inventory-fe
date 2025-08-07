import type { ReactNode } from 'react'

interface AlertProps {
  children: ReactNode
  variant?: 'success' | 'error' | 'warning' | 'info'
  className?: string
}

export const Alert = ({ children, variant = 'info', className = '' }: AlertProps) => {
  const variants = {
    success: 'bg-green-900 border-green-700 text-green-100',
    error: 'bg-red-900 border-red-700 text-red-100', 
    warning: 'bg-yellow-900 border-yellow-700 text-yellow-100',
    info: 'bg-blue-900 border-blue-700 text-blue-100'
  }

  return (
    <div className={`px-4 py-3 border rounded-lg ${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}