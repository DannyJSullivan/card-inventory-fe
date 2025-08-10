import { useAuthStore } from '../stores/auth'
import { AppNavbar } from '../components/ui/AppNavbar'

export const DashboardPage = () => {
  const { user } = useAuthStore()

  return (
    <div className="dashboard-container">
      <AppNavbar title="Card Inventory" subtitle={`Welcome back, ${user?.username || ''}!`} />
      {/* Main Content */}
      <div className="dashboard-main">
        {/* Cards Grid */}
        <div className="dashboard-grid">
          {/* Collections Card */}
          <div className="dashboard-card">
            <div 
              className="dashboard-card-icon"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
            >
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="dashboard-card-title">
              Collections
            </h2>
            <p className="dashboard-card-description">
              Manage your card collections
            </p>
            <button
              className="dashboard-card-button"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8, #6d28d9)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)'
              }}
            >
              View Collections
            </button>
          </div>

          {/* Browse Cards */}
          <div className="dashboard-card">
            <div 
              className="dashboard-card-icon"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
            >
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h2 className="dashboard-card-title">
              Browse Cards
            </h2>
            <p className="dashboard-card-description">
              Search and discover cards
            </p>
            <button
              className="dashboard-card-button"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #047857, #0f766e)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #0d9488)'
              }}
            >
              Browse Cards
            </button>
          </div>

          {/* Analytics Card */}
          <div className="dashboard-card">
            <div 
              className="dashboard-card-icon"
              style={{ background: 'linear-gradient(135deg, #ea580c, #dc2626)' }}
            >
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h2 className="dashboard-card-title">
              Analytics
            </h2>
            <p className="dashboard-card-description">
              View collection insights
            </p>
            <button
              className="dashboard-card-button"
              style={{ background: 'linear-gradient(135deg, #ea580c, #dc2626)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #c2410c, #b91c1c)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ea580c, #dc2626)'
              }}
            >
              View Analytics
            </button>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">
            Recent Activity
          </h2>
          <p className="dashboard-card-description">
            No recent activity to display.
          </p>
        </div>
      </div>
    </div>
  )
}