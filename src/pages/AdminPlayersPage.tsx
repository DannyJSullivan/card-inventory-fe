import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { AppNavbar } from '../components/ui/AppNavbar'
import { adminService } from '../services/adminService'

interface Player {
  id: number;
  sport: string;
  full_name: string;
  aliases: string[];
  card_count?: number;
}

interface PlayerFormData {
  sport: string;
  full_name: string;
  aliases: string;
}

export const AdminPlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedSport, setSelectedSport] = useState<string>('')
  
  const pageSize = 20
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PlayerFormData>()

  const sports = [
    'Baseball', 'Basketball', 'Football', 'Hockey', 
    'Soccer', 'Golf', 'Tennis', 'Multi-Sport'
  ]

  useEffect(() => {
    loadPlayers()
  }, [currentPage, selectedSport])

  const loadPlayers = async () => {
    setLoading(true)
    const result = await adminService.getPlayers(
      selectedSport || undefined, 
      currentPage * pageSize, 
      pageSize
    )
    
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setPlayers(result.data.items || [])
      setTotalPages(Math.ceil((result.data.total || 0) / pageSize))
    }
    
    setLoading(false)
  }

  const handleEdit = (player: Player) => {
    setEditingPlayer(player)
  }

  const handleSportFilter = (sport: string) => {
    setSelectedSport(sport)
    setCurrentPage(0)
  }

  const onSubmit = async (data: PlayerFormData) => {
    const playerData = {
      sport: data.sport,
      full_name: data.full_name,
      aliases: data.aliases ? data.aliases.split(',').map(alias => alias.trim()).filter(Boolean) : []
    }
    
    let result
    
    if (editingPlayer) {
      result = await adminService.updatePlayer(editingPlayer.id, playerData)
    } else {
      result = await adminService.createPlayer(playerData)
    }
    
    if (result.error) {
      setError(result.error)
    } else {
      setEditingPlayer(null)
      setShowCreateForm(false)
      reset()
      loadPlayers()
    }
  }

  if (loading && players.length === 0) {
    return <div className="loading">Loading players...</div>
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin - Manage Players" subtitle="Create and manage athletes across all sports" />
      <div className="dashboard-main">
        <div style={{ marginBottom: '24px' }}>
          <Link to="/admin" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Admin Dashboard
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Player Management
          </h2>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
            Add New Player
          </button>
        </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Filter by Sport:</span>
        <button
          onClick={() => handleSportFilter('')}
          className={`btn-secondary ${selectedSport === '' ? 'active' : ''}`}
          style={{ padding: '6px 12px', fontSize: '14px' }}
        >
          All Sports
        </button>
        {sports.map(sport => (
          <button
            key={sport}
            onClick={() => handleSportFilter(sport)}
            className={`btn-secondary ${selectedSport === sport ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '14px' }}
          >
            {sport}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {(showCreateForm || editingPlayer) && (
        <div className="admin-form" style={{ marginBottom: '24px' }}>
          <h2>{editingPlayer ? 'Edit Player' : 'Create New Player'}</h2>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Sport</label>
              <select
                className="form-input"
                {...register('sport', { required: 'Sport is required' })}
                defaultValue={editingPlayer?.sport}
              >
                <option value="">Select a sport</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
              {errors.sport && <div className="form-error">{errors.sport.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                {...register('full_name', { required: 'Full name is required' })}
                defaultValue={editingPlayer?.full_name}
                placeholder="e.g., Mike Trout, LeBron James"
              />
              {errors.full_name && <div className="form-error">{errors.full_name.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Aliases (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                {...register('aliases')}
                defaultValue={editingPlayer?.aliases?.join(', ')}
                placeholder="e.g., M. Trout, Michael Trout, Millville Meteor"
              />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Optional: Enter alternative names or nicknames, separated by commas
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : editingPlayer ? 'Update Player' : 'Create Player'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setEditingPlayer(null)
                  setShowCreateForm(false)
                  reset()
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sport</th>
              <th>Full Name</th>
              <th>Aliases</th>
              <th>Cards</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.id}>
                <td>{player.id}</td>
                <td>{player.sport}</td>
                <td>{player.full_name}</td>
                <td>
                  {player.aliases?.length > 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {player.aliases.join(', ')}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None</span>
                  )}
                </td>
                <td>{player.card_count?.toLocaleString() || 0}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(player)} className="btn-small btn-edit">
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {players.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          {selectedSport 
            ? `No ${selectedSport.toLowerCase()} players found.` 
            : 'No players found. Create your first player to get started.'
          }
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0}
            className="pagination-button"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
            className="pagination-button"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            className="pagination-button"
          >
            Last
          </button>
        </div>
      )}
      </div>
    </div>
  )
}