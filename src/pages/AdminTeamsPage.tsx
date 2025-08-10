import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { AppNavbar } from '../components/ui/AppNavbar'
import { adminService } from '../services/adminService'

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
  const [selectedSport, setSelectedSport] = useState<string>('')
  
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
  }, [currentPage, selectedSport])

  const loadTeams = async () => {
    setLoading(true)
    const result = await adminService.getTeams(
      selectedSport || undefined, 
      currentPage * pageSize, 
      pageSize
    )
    
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setTeams(result.data.items || [])
      setTotalPages(Math.ceil((result.data.total || 0) / pageSize))
    }
    
    setLoading(false)
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
  }

  const handleSportFilter = (sport: string) => {
    setSelectedSport(sport)
    setCurrentPage(0)
  }

  const onSubmit = async (data: TeamFormData) => {
    const teamData = {
      sport: data.sport,
      name: data.name,
      aliases: data.aliases ? data.aliases.split(',').map(alias => alias.trim()).filter(Boolean) : []
    }
    
    let result
    
    if (editingTeam) {
      result = await adminService.updateTeam(editingTeam.id, teamData)
    } else {
      result = await adminService.createTeam(teamData)
    }
    
    if (result.error) {
      setError(result.error)
    } else {
      setEditingTeam(null)
      setShowCreateForm(false)
      reset()
      loadTeams()
    }
  }

  if (loading && teams.length === 0) {
    return <div className="loading">Loading teams...</div>
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin - Manage Teams" subtitle="Create and manage sports teams across all leagues" />
      <div className="dashboard-main">
        <div style={{ marginBottom: '24px' }}>
          <Link to="/admin" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Admin Dashboard
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Team Management
          </h2>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
            Add New Team
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

      {(showCreateForm || editingTeam) && (
        <div className="admin-form" style={{ marginBottom: '24px' }}>
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
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
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
                <td>{team.id}</td>
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
                <td>{team.card_count?.toLocaleString() || 0}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(team)} className="btn-small btn-edit">
                      Edit
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