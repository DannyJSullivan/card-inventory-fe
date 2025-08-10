import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { AppNavbar } from '../components/ui/AppNavbar'
import { adminService } from '../services/adminService'

interface Set {
  id: number;
  brand_id: number;
  brand_name: string;
  name: string;
  year: number;
  sport: string;
  release_date?: string;
  card_count: number;
}

interface SetFormData {
  brand_id: number;
  name: string;
  year: number;
  sport: string;
  release_date?: string;
}

interface Brand {
  id: number;
  name: string;
}

export const AdminSetsPage = () => {
  const [sets, setSets] = useState<Set[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSet, setEditingSet] = useState<Set | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState<string>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const pageSize = 20
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SetFormData>()

  useEffect(() => {
    loadSets()
    loadBrands()
  }, [currentPage, sortBy, sortOrder])

  const loadSets = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await adminService.getSets(
        currentPage * pageSize, 
        pageSize,
        sortBy,
        sortOrder
      )
      
      if (result.error) {
        setError(`Failed to load sets: ${result.error}`)
        setSets([])
      } else if (result.data && 'items' in result.data) {
        const paginatedData = result.data as any
        setSets(paginatedData.items || [])
        setTotalPages(Math.ceil((paginatedData.total || 0) / pageSize))
      } else {
        setError('Server returned unexpected data format. Please ensure pagination is properly implemented.')
        setSets([])
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
      setSets([])
    } finally {
      setLoading(false)
    }
  }

  const loadBrands = async () => {
    try {
      const result = await adminService.getBrands(0, 100)
      if (result.error) {
        console.warn('Failed to load brands for dropdown:', result.error)
      } else if (result.data && 'items' in result.data) {
        const paginatedData = result.data as any
        setBrands(paginatedData.items || [])
      }
    } catch (err) {
      console.warn('Network error loading brands:', err)
    }
  }

  const handleEdit = (set: Set) => {
    setEditingSet(set)
  }

  const handleDelete = async (setId: number) => {
    if (!confirm('Are you sure you want to delete this set? This will also delete all cards in the set. This action cannot be undone.')) {
      return
    }
    
    try {
      const result = await adminService.deleteSet(setId)
      if (result.error) {
        setError(`Failed to delete set: ${result.error}`)
      } else {
        setError(null)
        loadSets()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const onSubmit = async (data: SetFormData) => {
    setError(null)
    
    try {
      let result
      if (editingSet) {
        result = await adminService.updateSet(editingSet.id, data)
      } else {
        result = await adminService.createSet(data)
      }
      
      if (result.error) {
        setError(`Failed to ${editingSet ? 'update' : 'create'} set: ${result.error}`)
      } else {
        setEditingSet(null)
        setShowCreateForm(false)
        reset()
        loadSets()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  if (loading && sets.length === 0) {
    return (
      <div className="dashboard-container">
        <AppNavbar title="Admin - Manage Sets" subtitle="Create and manage card sets with release dates" />
        <div className="dashboard-main">
          <div style={{ marginBottom: '24px' }}>
            <Link to="/admin" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              ← Back to Admin Dashboard
            </Link>
          </div>
          <div className="loading">
            <div style={{ textAlign: 'center', padding: '64px' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Loading sets...
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Please wait while we fetch your set data
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin - Manage Sets" subtitle="Create and manage card sets with release dates" />
      <div className="dashboard-main">
        <div style={{ marginBottom: '24px' }}>
          <Link to="/admin" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Admin Dashboard
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Set Management
          </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '14px' }}
            >
              <option value="id">ID</option>
              <option value="name">Name</option>
              <option value="year">Year</option>
              <option value="release_date">Release Date</option>
              <option value="brand_name">Brand</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '14px' }}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
            Add New Set
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button 
            onClick={() => {
              setError(null)
              loadSets()
            }} 
            className="error-retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {(showCreateForm || editingSet) && (
        <div className="admin-form" style={{ marginBottom: '24px' }}>
          <h2>{editingSet ? 'Edit Set' : 'Create New Set'}</h2>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <select
                className="form-input"
                {...register('brand_id', { required: 'Brand is required', valueAsNumber: true })}
                defaultValue={editingSet?.brand_id}
              >
                <option value="">Select a brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
              {errors.brand_id && <div className="form-error">{errors.brand_id.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                {...register('name', { required: 'Name is required' })}
                defaultValue={editingSet?.name}
                placeholder="e.g., Chrome, Prizm, Bowman"
              />
              {errors.name && <div className="form-error">{errors.name.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Year</label>
              <input
                type="number"
                className="form-input"
                {...register('year', { 
                  required: 'Year is required', 
                  valueAsNumber: true,
                  min: { value: 1800, message: 'Year must be after 1800' },
                  max: { value: new Date().getFullYear() + 2, message: 'Year cannot be more than 2 years in the future' }
                })}
                defaultValue={editingSet?.year}
                min="1800"
                max={new Date().getFullYear() + 2}
              />
              {errors.year && <div className="form-error">{errors.year.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Sport</label>
              <select
                className="form-input"
                {...register('sport', { required: 'Sport is required' })}
                defaultValue={editingSet?.sport}
              >
                <option value="">Select a sport</option>
                <option value="Baseball">Baseball</option>
                <option value="Basketball">Basketball</option>
                <option value="Football">Football</option>
                <option value="Hockey">Hockey</option>
                <option value="Soccer">Soccer</option>
                <option value="Golf">Golf</option>
                <option value="Tennis">Tennis</option>
                <option value="Multi-Sport">Multi-Sport</option>
                <option value="Non-Sport">Non-Sport</option>
              </select>
              {errors.sport && <div className="form-error">{errors.sport.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Release Date (optional)</label>
              <input
                type="date"
                className="form-input"
                {...register('release_date')}
                defaultValue={editingSet?.release_date}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                The actual release date of this set (if known)
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : editingSet ? 'Update Set' : 'Create Set'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setEditingSet(null)
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
              <th>Brand</th>
              <th>Name</th>
              <th>Year</th>
              <th>Release Date</th>
              <th>Sport</th>
              <th>Cards</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sets.map(set => (
              <tr key={set.id}>
                <td>{set.id}</td>
                <td>{set.brand_name}</td>
                <td>{set.name}</td>
                <td>{set.year}</td>
                <td>
                  {set.release_date ? (
                    new Date(set.release_date).toLocaleDateString()
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not set</span>
                  )}
                </td>
                <td>{set.sport}</td>
                <td>{set.card_count?.toLocaleString() || 0}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(set)} className="btn-small btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(set.id)} className="btn-small btn-delete">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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