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

interface Team {
  id: number;
  sport: string;
  name: string;
  aliases: string[];
  card_count?: number;
}

interface TeamFormData {
  sport: string;
  name: string;
  aliases: string;
}

export const AdminTeamsPage = () => {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
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
  } = useForm<TeamFormData>()

  const sports = [
    'Baseball', 'Basketball', 'Football', 'Hockey', 
    'Soccer', 'Golf', 'Tennis', 'Multi-Sport'
  ]

  useEffect(() => {
    loadTeams()
  }, [currentPage, selectedSport, debouncedSearchTerm])

  // Reset to first page when search changes
  useEffect(() => {
    if (currentPage > 0) {
      setCurrentPage(0)
    }
  }, [debouncedSearchTerm, selectedSport])

  const loadTeams = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await adminService.getTeams(
        selectedSport || undefined, 
        currentPage * pageSize, 
        pageSize,
        debouncedSearchTerm.trim() || undefined
      )
      
      if (result.error) {
        setError(`Failed to load teams: ${result.error}`)
        setTeams([])
      } else if (result.data && 'items' in result.data) {
        const paginatedData = result.data as any
        setTeams(paginatedData.items || [])
        setTotalItems(paginatedData.total || 0)
        setTotalPages(Math.ceil((paginatedData.total || 0) / pageSize))
      } else {
        setError('Server returned unexpected data format.')
        setTeams([])
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
  }

  const handleSportFilter = (sport: string) => {
    setSelectedSport(sport)
    setCurrentPage(0)
  }

  const handleDelete = async (teamId: number) => {
    const team = teams.find(t => t.id === teamId)
    if (team?.card_count && team.card_count > 0) {
      alert(`Cannot delete team "${team.name}" because they have ${team.card_count} cards. Remove all cards first.`)
      return
    }

    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return
    }
    
    try {
      const result = await adminService.deleteTeam(teamId)
      if (result.error) {
        setError(`Failed to delete team: ${result.error}`)
      } else {
        setError(null)
        loadTeams()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const onSubmit = async (data: TeamFormData) => {
    setError(null)
    
    const teamData = {
      sport: data.sport,
      name: data.name,
      aliases: data.aliases ? data.aliases.split(',').map(alias => alias.trim()).filter(Boolean) : []
    }
    
    try {
      let result
      if (editingTeam) {
        result = await adminService.updateTeam(editingTeam.id, teamData)
      } else {
        result = await adminService.createTeam(teamData)
      }
      
      if (result.error) {
        setError(`Failed to ${editingTeam ? 'update' : 'create'} team: ${result.error}`)
      } else {
        setEditingTeam(null)
        setShowCreateForm(false)
        reset()
        loadTeams()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  if (loading && teams.length === 0) {
    return (
      <div className="dashboard-container">
        <AppNavbar title="Admin - Manage Teams" subtitle="Create and manage sports teams across all leagues" />
        <div className="dashboard-main">
          <div className="loading">
            <div style={{ textAlign: 'center', padding: '64px' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Loading teams...
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Please wait while we fetch your team data
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin - Manage Teams" subtitle="Create and manage sports teams across all leagues" />
      <div className="dashboard-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Team Management
            </h2>
            {loading && <div className="loading-spinner"></div>}
            {totalItems > 0 && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems.toLocaleString()} teams
              </span>
            )}
          </div>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
            Add New Team
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ flex: '1', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search teams..."
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
              loadTeams()
            }} 
            className="error-retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {(showCreateForm || editingTeam) && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setEditingTeam(null)
            setShowCreateForm(false)
            reset()
          }
        }}>
          <div className="modal-content">
            <h2>{editingTeam ? 'Edit Team' : 'Create New Team'}</h2>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Sport</label>
                <select
                  className="form-input"
                  {...register('sport', { required: 'Sport is required' })}
                  defaultValue={editingTeam?.sport}
                >
                  <option value="">Select a sport</option>
                  {sports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                {errors.sport && <div className="form-error">{errors.sport.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('name', { required: 'Team name is required' })}
                  defaultValue={editingTeam?.name}
                  placeholder="e.g., Los Angeles Angels, Boston Celtics, Dallas Cowboys"
                />
                {errors.name && <div className="form-error">{errors.name.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Aliases (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('aliases')}
                  defaultValue={editingTeam?.aliases?.join(', ')}
                  placeholder="e.g., LA Angels, Angels, Halos"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Optional: Enter alternative names or abbreviations, separated by commas
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingTeam(null)
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
              <th>Team Name</th>
              <th>Aliases</th>
              <th>Cards</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id}>
                <td>{team.sport}</td>
                <td>{team.name}</td>
                <td>
                  {team.aliases?.length > 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {team.aliases.join(', ')}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None</span>
                  )}
                </td>
                <td>{team.card_count?.toLocaleString() || '0'}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(team)} className="btn-small btn-edit">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(team.id)} 
                      className="btn-small btn-delete"
                      disabled={team.card_count && team.card_count > 0}
                      title={team.card_count && team.card_count > 0 ? 'Cannot delete team with cards' : 'Delete team'}
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

      {teams.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          {selectedSport 
            ? `No ${selectedSport.toLowerCase()} teams found.` 
            : 'No teams found. Create your first team to get started.'
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
            Page {currentPage + 1} of {totalPages} ({totalItems.toLocaleString()} total teams)
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