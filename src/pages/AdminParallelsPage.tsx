import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AppNavbar } from '../components/ui/AppNavbar'
import { adminService } from '../services/adminService'
import { useModalScrollLock } from '../hooks/useModalScrollLock'
import { BulkCreateParallels } from '../components/BulkCreateParallels'

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

interface Parallel {
  id: number;
  name: string;
  description?: string;
  print_run?: number;
  original_print_run_text?: string;
  rarity_level?: 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Ultra Rare';
  is_serial_numbered: boolean;
  card_count?: number;
  created_at: string;
  updated_at: string;
}

interface ParallelFormData {
  name: string;
  description?: string;
  print_run?: number;
  original_print_run_text?: string;
  rarity_level?: 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Ultra Rare';
  is_serial_numbered: boolean;
}

export const AdminParallelsPage = () => {
  const [parallels, setParallels] = useState<Parallel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingParallel, setEditingParallel] = useState<Parallel | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showBulkCreate, setShowBulkCreate] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<string>('')
  const [modalError, setModalError] = useState<string | null>(null)
  
  // Debounce the search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  const pageSize = 20
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setFocus,
    formState: { errors, isSubmitting }
  } = useForm<ParallelFormData>()

  const rarityLevels = [
    'Common', 'Uncommon', 'Rare', 'Super Rare', 'Ultra Rare'
  ]

  useEffect(() => {
    loadParallels()
  }, [currentPage, debouncedSearchTerm, selectedRarity])

  // Reset to first page when search or filter changes
  useEffect(() => {
    if (currentPage > 0) {
      setCurrentPage(0)
    }
  }, [debouncedSearchTerm, selectedRarity])

  useEffect(() => {
    if (showCreateForm) {
      setTimeout(() => setFocus('name'), 0)
    }
  }, [showCreateForm, setFocus])

  // Prevent body scroll when modal is open
  useModalScrollLock(showCreateForm || !!editingParallel)

  // Watch print_run field and auto-fill rarity and serial numbered
  const printRun = watch('print_run')
  useEffect(() => {
    // Only auto-fill if there's a print run value and we're not editing an existing parallel
    // (to avoid overriding existing data)
    if (printRun && printRun > 0 && !editingParallel) {
      setValue('is_serial_numbered', true)
      
      // Auto-fill rarity based on print run
      let rarity: string
      if (printRun === 1) {
        rarity = 'Ultra Rare'
      } else if (printRun <= 50) {
        rarity = 'Super Rare'
      } else if (printRun <= 150) {
        rarity = 'Rare'
      } else if (printRun <= 500) {
        rarity = 'Uncommon'
      } else {
        rarity = 'Common'
      }
      setValue('rarity_level', rarity as 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Ultra Rare')
    }
  }, [printRun, editingParallel, setValue])

  const loadParallels = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await adminService.getParallels(
        currentPage * pageSize, 
        pageSize,
        debouncedSearchTerm.trim() || undefined,
        selectedRarity || undefined
      )
      
      if (result.error) {
        setError(`Failed to load parallels: ${result.error}`)
        setParallels([])
      } else if (result.data && 'items' in result.data) {
        const paginatedData = result.data as any
        setParallels(paginatedData.items || [])
        setTotalItems(paginatedData.total || 0)
        setTotalPages(Math.ceil((paginatedData.total || 0) / pageSize))
      } else {
        setError('Server returned unexpected data format.')
        setParallels([])
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
      setParallels([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (parallel: Parallel) => {
    setEditingParallel(parallel)
  }

  const handleRarityFilter = (rarity: string) => {
    setSelectedRarity(rarity)
    setCurrentPage(0)
  }

  const handleDelete = async (parallelId: number) => {
    const parallel = parallels.find(p => p.id === parallelId)
    
    // Show appropriate confirmation message
    let confirmMessage = 'Are you sure you want to delete this parallel? This action cannot be undone.'
    if (parallel?.card_count && parallel.card_count > 0) {
      confirmMessage = `This will delete the "${parallel.name}" parallel and remove it from ${parallel.card_count} cards. The cards themselves will remain intact. Are you sure you want to continue?`
    }

    if (!confirm(confirmMessage)) {
      return
    }
    
    try {
      const result = await adminService.deleteParallel(parallelId)
      
      if (result.error) {
        setError(`Failed to delete parallel: ${result.error}`)
      } else {
        setError(null)
        loadParallels()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const onSubmit = async (data: ParallelFormData) => {
    setError(null)
    setModalError(null)
    
    const parallelData = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      original_print_run_text: data.original_print_run_text?.trim() || null,
      print_run: data.print_run || null,
    }
    
    try {
      let result
      if (editingParallel) {
        result = await adminService.updateParallel(editingParallel.id, parallelData)
      } else {
        result = await adminService.createParallel(parallelData)
      }
      
      if (result.error) {
        if (result.details && result.details.status === 409) {
          setModalError(result.error)
        } else {
          setModalError(`Failed to ${editingParallel ? 'update' : 'create'} parallel: ${result.error}`)
        }
      } else {
        setEditingParallel(null)
        setShowCreateForm(false)
        reset()
        loadParallels()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  if (loading && parallels.length === 0) {
    return (
      <div className="dashboard-container">
        <AppNavbar title="Admin - Manage Parallels" subtitle="Create and manage parallel card types with print runs" />
        <div className="dashboard-main">
          <div className="loading">
            <div style={{ textAlign: 'center', padding: '64px' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Loading parallels...
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Please wait while we fetch your parallel data
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin - Manage Parallels" subtitle="Create and manage parallel card types with print runs" />
      <div className="dashboard-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Parallel Management
            </h2>
            {loading && <div className="loading-spinner"></div>}
            {totalItems > 0 && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems.toLocaleString()} parallels
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowBulkCreate(true)} 
              className="btn-secondary" 
              style={{ 
                padding: '8px 16px', 
                whiteSpace: 'nowrap', 
                width: 'auto', 
                margin: 0, 
                borderRadius: '6px' 
              }}
            >
              Bulk Add
            </button>
            <button 
              onClick={() => setShowCreateForm(true)} 
              className="btn-primary" 
              style={{ 
                padding: '8px 16px', 
                whiteSpace: 'nowrap', 
                width: 'auto', 
                margin: 0 
              }}
            >
              Add New Parallel
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ flex: '1', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search parallels..."
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
        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Filter by Rarity:</span>
        <button
          onClick={() => handleRarityFilter('')}
          className={`btn-secondary ${selectedRarity === '' ? 'active' : ''}`}
          style={{ padding: '6px 12px', fontSize: '14px' }}
        >
          All Rarities
        </button>
        {rarityLevels.map(rarity => (
          <button
            key={rarity}
            onClick={() => handleRarityFilter(rarity)}
            className={`btn-secondary ${selectedRarity === rarity ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '14px' }}
          >
            {rarity}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button 
            onClick={() => {
              setError(null)
              loadParallels()
            }} 
            className="error-retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {(showCreateForm || editingParallel) && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setEditingParallel(null)
            setShowCreateForm(false)
            reset()
            setModalError(null)
          }
        }}>
          <div className="modal-content">
            <h2>{editingParallel ? 'Edit Parallel' : 'Create New Parallel'}</h2>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Parallel Name *</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('name', { required: 'Parallel name is required' })}
                  defaultValue={editingParallel?.name}
                  placeholder="e.g., Refractor, Gold, Rainbow Foil, Black"
                />
                {errors.name && <div className="form-error">{errors.name.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Print Run</label>
                <input
                  type="number"
                  className="form-input"
                  {...register('print_run', { 
                    valueAsNumber: true,
                    min: { value: 1, message: 'Print run must be at least 1' }
                  })}
                  defaultValue={editingParallel?.print_run || ''}
                  placeholder="e.g., 99, 250, 1000"
                  min="1"
                />
                {errors.print_run && <div className="form-error">{errors.print_run.message}</div>}
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Auto-fills rarity: 1=Ultra Rare, ≤50=Super Rare, ≤150=Rare, ≤500=Uncommon, &gt;500=Common
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rarity Level</label>
                <select
                  className="form-input"
                  {...register('rarity_level')}
                  defaultValue={editingParallel?.rarity_level || ''}
                >
                  <option value="">None</option>
                  {rarityLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Automatically set based on print run, but can be manually overridden
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  {...register('description')}
                  defaultValue={editingParallel?.description}
                  placeholder="Optional description of this parallel type..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Original Print Run Text</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('original_print_run_text')}
                  defaultValue={editingParallel?.original_print_run_text || ''}
                  placeholder="e.g., /99, #d/250, Limited Edition"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Original text representation of the print run (if different from numeric value)
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    {...register('is_serial_numbered')}
                    defaultChecked={editingParallel?.is_serial_numbered}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Serial Numbered</span>
                </label>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '28px' }}>
                  Check if this parallel type typically has serial numbers
                </div>
              </div>

              {modalError && <div className="form-error" style={{ marginBottom: '16px' }}>{modalError}</div>}

              <div className="admin-form-actions">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Saving...' : editingParallel ? 'Update Parallel' : 'Create Parallel'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingParallel(null)
                    setShowCreateForm(false)
                    reset()
                    setModalError(null)
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

      {showBulkCreate && (
        <BulkCreateParallels 
          onClose={() => setShowBulkCreate(false)} 
          onComplete={() => {
            setShowBulkCreate(false);
            loadParallels();
          }}
        />
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rarity</th>
              <th>Print Run</th>
              <th>Serial #</th>
              <th>Cards</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parallels.map(parallel => (
              <tr key={parallel.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{parallel.name}</div>
                    {parallel.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {parallel.description}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {parallel.rarity_level ? (
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: getRarityColor(parallel.rarity_level),
                      color: 'white'
                    }}>
                      {parallel.rarity_level}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not set</span>
                  )}
                </td>
                <td>
                  {parallel.print_run ? (
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{parallel.print_run.toLocaleString()}</div>
                      {parallel.original_print_run_text && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {parallel.original_print_run_text}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unlimited</span>
                  )}
                </td>
                <td>
                  {parallel.is_serial_numbered ? (
                    <span style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>Yes</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>No</span>
                  )}
                </td>
                <td>{parallel.card_count?.toLocaleString() || '0'}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(parallel)} className="btn-small btn-edit">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(parallel.id)} 
                      className="btn-small btn-delete"
                      title={parallel.card_count && parallel.card_count > 0 ? `Delete parallel (used by ${parallel.card_count} cards)` : 'Delete parallel'}
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

      {parallels.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          {selectedRarity 
            ? `No ${selectedRarity.toLowerCase()} parallels found.` 
            : 'No parallels found. Create your first parallel to get started.'
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
            Page {currentPage + 1} of {totalPages} ({totalItems.toLocaleString()} total parallels)
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

// Helper function for rarity colors
function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'Common': return '#6b7280'
    case 'Uncommon': return '#10b981'
    case 'Rare': return '#3b82f6'
    case 'Super Rare': return '#8b5cf6'
    case 'Ultra Rare': return '#f59e0b'
    default: return '#6b7280'
  }
}