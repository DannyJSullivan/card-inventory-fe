import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/Button'

export const DashboardPage = () => {
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold text-white">Card Inventory Manager</h1>
              <p className="text-gray-400">Welcome back, {user?.username}!</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Collections</h2>
            <p className="text-gray-400 mb-4">Manage your card collections</p>
            <Button className="w-full">View Collections</Button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Cards</h2>
            <p className="text-gray-400 mb-4">Browse and search cards</p>
            <Button className="w-full">Browse Cards</Button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Analytics</h2>
            <p className="text-gray-400 mb-4">View collection statistics</p>
            <Button className="w-full">View Analytics</Button>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <p className="text-gray-400">No recent activity to display.</p>
        </div>
      </div>
    </div>
  )
}