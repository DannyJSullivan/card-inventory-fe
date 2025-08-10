import { useNavigate } from 'react-router-dom'
import { SettingsDropdown } from './SettingsDropdown'
import { useAuthStore } from '../../stores/auth'
import type { ReactNode } from 'react'

interface AppNavbarProps {
  title: string
  subtitle?: string
  rightExtra?: ReactNode
}

export const AppNavbar = ({ title, subtitle, rightExtra }: AppNavbarProps) => {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin } = useAuthStore()

  return (
    <div className="dashboard-header">
      <div className="dashboard-header-content" style={{ paddingTop: '18px', paddingBottom: '18px' }}>
        <div>
          <h1 className="dashboard-title" style={{ fontSize: '26px', marginBottom: subtitle ? '4px' : 0 }}>{title}</h1>
          {subtitle && <p className="dashboard-welcome" style={{ fontSize: '15px' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            aria-label="Home"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9"/><path d="M5 10v11h14V10"/></svg>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Home</span>
          </button>
          {isAuthenticated && isAdmin() && (
            <button
              onClick={() => navigate('/admin')}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l9 6v6c0 5-4 7-9 9-5-2-9-4-9-9V9l9-6z"/></svg>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Admin</span>
            </button>
          )}
          {rightExtra}
          {isAuthenticated && <SettingsDropdown />}
        </div>
      </div>
    </div>
  )
}
