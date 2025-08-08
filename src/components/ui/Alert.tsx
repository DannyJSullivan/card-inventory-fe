import type { ReactNode } from 'react'

interface AlertProps {
  children: ReactNode
  variant?: 'success' | 'error' | 'warning' | 'info'
  className?: string
}

export const Alert = ({ children, variant = 'info', className = '' }: AlertProps) => {
  return (
    <div className={`alert alert-${variant} ${className}`}>
      {children}
    </div>
  )
}