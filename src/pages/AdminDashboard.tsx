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
        
        {/* Data Import Section */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: 'var(--text-primary)', 
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Data Import
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
              Import and process card data from external sources
            </p>
          </div>
          <div className="dashboard-grid">
            {/* Upload & Import Card */}
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

            {/* Batch Resolution Card */}
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
          </div>
        </div>
        
        {/* Data Management Section */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: 'var(--text-primary)', 
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              Data Management
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
              Manage cards, sets, brands, players, teams, and parallel types
            </p>
          </div>
          <div className="dashboard-grid">
            {/* Manage Cards Card */}
            <div className="dashboard-card">
              <div
                className="dashboard-card-icon"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
              >
                <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m-15 0A2.25 2.25 0 004.5 12v6a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 18v-6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 12v6z" />
                </svg>
              </div>
              <h2 className="dashboard-card-title">Manage Cards</h2>
              <p className="dashboard-card-description">
                Create, edit, and delete individual cards with full details
              </p>
              <button
                className="dashboard-card-button"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #15803d, #16a34a)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a, #22c55e)'
                }}
                onClick={() => navigate('/admin/cards')}
              >
                Manage Cards
              </button>
            </div>

            {/* Manage Sets Card */}
            <div className="dashboard-card">
              <div
                className="dashboard-card-icon"
                style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
              >
                <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h2 className="dashboard-card-title">Manage Sets</h2>
              <p className="dashboard-card-description">
                Create and manage card sets with brands, years, and release dates
              </p>
              <button
                className="dashboard-card-button"
                style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #c2410c, #ea580c)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ea580c, #f97316)'
                }}
                onClick={() => navigate('/admin/sets')}
              >
                Manage Sets
              </button>
            </div>

            {/* Manage Brands Card */}
            <div className="dashboard-card">
              <div
                className="dashboard-card-icon"
                style={{ background: 'linear-gradient(135deg, #9333ea, #a855f7)' }}
              >
                <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <h2 className="dashboard-card-title">Manage Brands</h2>
              <p className="dashboard-card-description">
                Create and manage card manufacturers (Topps, Panini, Upper Deck, etc.)
              </p>
              <button
                className="dashboard-card-button"
                style={{ background: 'linear-gradient(135deg, #9333ea, #a855f7)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #9333ea)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #9333ea, #a855f7)'
                }}
                onClick={() => navigate('/admin/brands')}
              >
                Manage Brands
              </button>
            </div>

            {/* Manage Players Card */}
            <div className="dashboard-card">
              <div
                className="dashboard-card-icon"
                style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
              >
                <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="dashboard-card-title">Manage Players</h2>
              <p className="dashboard-card-description">
                Create and manage athletes across all sports with aliases
              </p>
              <button
                className="dashboard-card-button"
                style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0f766e, #0d9488)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0d9488, #14b8a6)'
                }}
                onClick={() => navigate('/admin/players')}
              >
                Manage Players
              </button>
            </div>

            {/* Manage Teams Card */}
            <div className="dashboard-card">
              <div
                className="dashboard-card-icon"
                style={{ background: 'linear-gradient(135deg, #be185d, #ec4899)' }}
              >
                <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h2 className="dashboard-card-title">Manage Teams</h2>
              <p className="dashboard-card-description">
                Create and manage sports teams across all leagues
              </p>
              <button
                className="dashboard-card-button"
                style={{ background: 'linear-gradient(135deg, #be185d, #ec4899)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #9d174d, #be185d)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #be185d, #ec4899)'
                }}
                onClick={() => navigate('/admin/teams')}
              >
                Manage Teams
              </button>
            </div>

            {/* Manage Parallels Card */}
            <div className="dashboard-card">
              <div
                className="dashboard-card-icon"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
              >
                <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h2 className="dashboard-card-title">Manage Parallels</h2>
              <p className="dashboard-card-description">
                Create and manage parallel card types with print runs and rarity levels
              </p>
              <button
                className="dashboard-card-button"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                }}
                onClick={() => navigate('/admin/parallels')}
              >
                Manage Parallels
              </button>
            </div>
          </div>
        </div>
        
        {/* System Management Section */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: 'var(--text-primary)', 
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              System Management
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
              User administration, system settings, and application statistics
            </p>
          </div>
          <div className="dashboard-grid">
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

            {/* System Statistics Card */}
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

            {/* System Settings Card */}
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