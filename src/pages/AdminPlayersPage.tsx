import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AppNavbar } from '../components/ui/AppNavbar'
import { adminService } from '../services/adminService'

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

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
  const [totalItems, setTotalItems] = useState(0)
  const [selectedSport, setSelectedSport] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Debounce the search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
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
  }, [currentPage, selectedSport, debouncedSearchTerm])

  // Reset to first page when search changes
  useEffect(() => {
    if (currentPage > 0) {
      setCurrentPage(0)
    }
  }, [debouncedSearchTerm, selectedSport])

  const loadPlayers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await adminService.getPlayers(
        selectedSport || undefined, 
        currentPage * pageSize, 
        pageSize,
        debouncedSearchTerm.trim() || undefined
      )
      
      if (result.error) {
        setError(`Failed to load players: ${result.error}`)
        setPlayers([])
      } else if (result.data && typeof result.data === 'object' && 'items' in result.data) {
        const paginatedData = result.data as any
        setPlayers(paginatedData.items || [])
        setTotalItems(paginatedData.total || 0)
        setTotalPages(Math.ceil((paginatedData.total || 0) / pageSize))
      } else {
        setError('Server returned unexpected data format.')
        setPlayers([])
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (player: Player) => {
    setEditingPlayer(player)
  }

  const handleSportFilter = (sport: string) => {
    setSelectedSport(sport)
    setCurrentPage(0)
  }

  const handleDelete = async (playerId: number) => {
    const player = players.find(p => p.id === playerId)
    if (player?.card_count && player.card_count > 0) {
      alert(`Cannot delete player "${player.full_name}" because they have ${player.card_count} cards. Remove all cards first.`)
      return
    }

    if (!confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return
    }
    
    try {
      const result = await adminService.deletePlayer(playerId)
      if (result.error) {
        setError(`Failed to delete player: ${result.error}`)
      } else {
        setError(null)
        loadPlayers()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const onSubmit = async (data: PlayerFormData) => {
    setError(null)
    
    const playerData = {
      sport: data.sport,
      full_name: data.full_name,
      aliases: data.aliases ? data.aliases.split(',').map(alias => alias.trim()).filter(Boolean) : []
    }
    
    try {
      let result
      if (editingPlayer) {
        result = await adminService.updatePlayer(editingPlayer.id, playerData)
      } else {
        result = await adminService.createPlayer(playerData)
      }
      
      if (result.error) {
        setError(`Failed to ${editingPlayer ? 'update' : 'create'} player: ${result.error}`)
      } else {
        setEditingPlayer(null)
        setShowCreateForm(false)
        reset()
        loadPlayers()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  if (loading && players.length === 0) {
    return (
      <div className="dashboard-container">
        <AppNavbar title="Admin - Manage Players" subtitle="Create and manage athletes across all sports" />
        <div className="dashboard-main">
          <div className="loading">
            <div style={{ textAlign: 'center', padding: '64px' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Loading players...
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Please wait while we fetch your player data
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin - Manage Players" subtitle="Create and manage athletes across all sports" />
      <div className="dashboard-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Player Management
            </h2>
            {loading && <div className="loading-spinner"></div>}
            {totalItems > 0 && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems.toLocaleString()} players
              </span>
            )}
          </div>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
            Add New Player
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ flex: '1', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{
                marginLeft: '12px',
                padding: '8px 12px',
                background: 'none',
                border: '1px solid var(--border-primary)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
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
          <span>{error}</span>
          <button 
            onClick={() => {
              setError(null)
              loadPlayers()
            }} 
            className="error-retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {(showCreateForm || editingPlayer) && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setEditingPlayer(null)
            setShowCreateForm(false)
            reset()
          }
        }}>
          <div className="modal-content">
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
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
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
                <td>{player.card_count?.toLocaleString() || '0'}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(player)} className="btn-small btn-edit">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(player.id)} 
                      className="btn-small btn-delete"
                      disabled={!!(player.card_count && player.card_count > 0)}
                      title={player.card_count && player.card_count > 0 ? 'Cannot delete player with cards' : 'Delete player'}
                    >
                      Delete
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
            Page {currentPage + 1} of {totalPages} ({totalItems.toLocaleString()} total players)
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