import { useAuthStore } from '../stores/auth'
import { useNavigate } from 'react-router-dom'
import { AppNavbar } from '../components/ui/AppNavbar'

export const AdminDashboard = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin Dashboard" subtitle={`Admin panel for ${user?.username || ''}`} />
      {/* Main Content */}
      <div className="dashboard-main">
        {/* Admin Cards Grid */}
        <div className="dashboard-grid">
          {/* Data Import Card */}
          <div className="dashboard-card">
            <div
              className="dashboard-card-icon"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
            >
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <h2 className="dashboard-card-title">Data Import</h2>
            <p className="dashboard-card-description">
              Upload, stage, resolve, and commit new set & card data batches
            </p>
            <button
              className="dashboard-card-button"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8, #4338ca)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #4f46e5)'
              }}
              onClick={() => navigate('/admin/imports/upload')}
            >
              Import Cards
            </button>
          </div>

          {/* Unresolved Resolutions Card */}
          <div className="dashboard-card">
            <div
              className="dashboard-card-icon"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.008v.008H3.75V6.75zm0 5.25h.008v.008H3.75V12zm0 5.25h.008v.008H3.75v-.008z" />
              </svg>
            </div>
            <h2 className="dashboard-card-title">Resolve Batches</h2>
            <p className="dashboard-card-description">
              Continue resolving staged import batches (names & card edits)
            </p>
            <button
              className="dashboard-card-button"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #047857, #059669)' }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #10b981)' }}
              onClick={() => navigate('/admin/imports/batches')}
            >
              View Batches
            </button>
          </div>

          {/* User Management Card */}
          <div className="dashboard-card">
            <div 
              className="dashboard-card-icon"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #c084fc)' }}
            >
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h2 className="dashboard-card-title">
              User Management
            </h2>
            <p className="dashboard-card-description">
              Manage user accounts, permissions, and admin status
            </p>
            <button
              className="dashboard-card-button"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #c084fc)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #6d28d9, #a855f7)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #c084fc)'
              }}
            >
              Manage Users
            </button>
          </div>

          {/* System Stats Card */}
          <div className="dashboard-card">
            <div 
              className="dashboard-card-icon"
              style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
            >
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h2 className="dashboard-card-title">
              System Statistics
            </h2>
            <p className="dashboard-card-description">
              View application usage stats and performance metrics
            </p>
            <button
              className="dashboard-card-button"
              style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0e7490, #0891b2)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0891b2, #06b6d4)'
              }}
            >
              View Statistics
            </button>
          </div>

          {/* Settings Management Card */}
          <div className="dashboard-card">
            <div 
              className="dashboard-card-icon"
              style={{ background: 'linear-gradient(135deg, #dc2626, #f59e0b)' }}
            >
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="dashboard-card-title">
              System Settings
            </h2>
            <p className="dashboard-card-description">
              Configure application settings and preferences
            </p>
            <button
              className="dashboard-card-button"
              style={{ background: 'linear-gradient(135deg, #dc2626, #f59e0b)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c, #d97706)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #f59e0b)'
              }}
            >
              System Settings
            </button>
          </div>
        </div>

        {/* Admin Info Card */}
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">
            Administrator Information
          </h2>
          <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="dashboard-card-description">Admin User:</span>
              <span style={{ 
                fontWeight: '500', 
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px'
              }}>
                {user?.username}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="dashboard-card-description">Email:</span>
              <span style={{ 
                fontWeight: '500', 
                color: 'var(--text-primary)'
              }}>
                {user?.email}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="dashboard-card-description">Admin Status:</span>
              <span style={{ 
                fontWeight: '500', 
                color: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px'
              }}>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}