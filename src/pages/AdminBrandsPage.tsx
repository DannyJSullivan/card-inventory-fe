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

interface Brand {
  id: number;
  name: string;
  set_count?: number;
}

interface BrandFormData {
  name: string;
}

export const AdminBrandsPage = () => {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Debounce the search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  const pageSize = 20
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BrandFormData>()

  useEffect(() => {
    loadBrands()
  }, [currentPage, debouncedSearchTerm])

  // Reset to first page when search changes
  useEffect(() => {
    if (currentPage > 0) {
      setCurrentPage(0)
    }
  }, [debouncedSearchTerm])

  const loadBrands = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await adminService.getBrands(
        currentPage * pageSize, 
        pageSize,
        debouncedSearchTerm.trim() || undefined
      )
      
      if (result.error) {
        setError(`Failed to load brands: ${result.error}`)
        setBrands([])
      } else if (result.data && 'items' in result.data) {
        const paginatedData = result.data as any
        setBrands(paginatedData.items || [])
        setTotalItems(paginatedData.total || 0)
        setTotalPages(Math.ceil((paginatedData.total || 0) / pageSize))
      } else {
        setError('Server returned unexpected data format.')
        setBrands([])
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
      setBrands([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
  }

  const handleDelete = async (brandId: number) => {
    const brand = brands.find(b => b.id === brandId)
    if (brand?.set_count && brand.set_count > 0) {
      alert(`Cannot delete brand "${brand.name}" because it has ${brand.set_count} sets. Delete all sets first.`)
      return
    }

    if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      return
    }
    
    try {
      const result = await adminService.deleteBrand(brandId)
      if (result.error) {
        setError(`Failed to delete brand: ${result.error}`)
      } else {
        setError(null)
        loadBrands()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const onSubmit = async (data: BrandFormData) => {
    setError(null)
    
    try {
      let result
      if (editingBrand) {
        result = await adminService.updateBrand(editingBrand.id, data)
      } else {
        result = await adminService.createBrand(data)
      }
      
      if (result.error) {
        setError(`Failed to ${editingBrand ? 'update' : 'create'} brand: ${result.error}`)
      } else {
        setEditingBrand(null)
        setShowCreateForm(false)
        reset()
        loadBrands()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  if (loading && brands.length === 0) {
    return (
      <div className="dashboard-container">
        <AppNavbar title="Admin - Manage Brands" subtitle="Create and manage card manufacturers" />
        <div className="dashboard-main">
          <div className="loading">
            <div style={{ textAlign: 'center', padding: '64px' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Loading brands...
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Please wait while we fetch your brand data
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin - Manage Brands" subtitle="Create and manage card manufacturers" />
      <div className="dashboard-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Brand Management
            </h2>
            {loading && <div className="loading-spinner"></div>}
            {totalItems > 0 && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems.toLocaleString()} brands
              </span>
            )}
          </div>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
            Add New Brand
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ flex: '1', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search brands..."
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

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button 
            onClick={() => {
              setError(null)
              loadBrands()
            }} 
            className="error-retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {(showCreateForm || editingBrand) && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setEditingBrand(null)
            setShowCreateForm(false)
            reset()
          }
        }}>
          <div className="modal-content">
            <h2>{editingBrand ? 'Edit Brand' : 'Create New Brand'}</h2>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Brand Name</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('name', { required: 'Brand name is required' })}
                  defaultValue={editingBrand?.name}
                  placeholder="e.g., Topps, Panini, Upper Deck"
                />
                {errors.name && <div className="form-error">{errors.name.message}</div>}
              </div>

              <div className="admin-form-actions">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Saving...' : editingBrand ? 'Update Brand' : 'Create Brand'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingBrand(null)
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
              <th>Brand Name</th>
              <th>Sets</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map(brand => (
              <tr key={brand.id}>
                <td>{brand.name}</td>
                <td>{brand.set_count?.toLocaleString() || '0'}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(brand)} className="btn-small btn-edit">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(brand.id)} 
                      className="btn-small btn-delete"
                      disabled={!!(brand.set_count && brand.set_count > 0)}
                      title={brand.set_count && brand.set_count > 0 ? 'Cannot delete brand with sets' : 'Delete brand'}
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

      {brands.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          No brands found. Create your first brand to get started.
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
            Page {currentPage + 1} of {totalPages} ({totalItems.toLocaleString()} total brands)
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