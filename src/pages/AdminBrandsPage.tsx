import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { AppNavbar } from '../components/ui/AppNavbar'
import { adminService } from '../services/adminService'

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
  
  const pageSize = 20
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BrandFormData>()

  useEffect(() => {
    loadBrands()
  }, [currentPage])

  const loadBrands = async () => {
    setLoading(true)
    const result = await adminService.getBrands(currentPage * pageSize, pageSize)
    
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setBrands(result.data.items || [])
      setTotalPages(Math.ceil((result.data.total || 0) / pageSize))
    }
    
    setLoading(false)
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
    
    const result = await adminService.deleteBrand(brandId)
    if (result.error) {
      setError(result.error)
    } else {
      loadBrands()
    }
  }

  const onSubmit = async (data: BrandFormData) => {
    let result
    
    if (editingBrand) {
      result = await adminService.updateBrand(editingBrand.id, data)
    } else {
      result = await adminService.createBrand(data)
    }
    
    if (result.error) {
      setError(result.error)
    } else {
      setEditingBrand(null)
      setShowCreateForm(false)
      reset()
      loadBrands()
    }
  }

  if (loading && brands.length === 0) {
    return <div className="loading">Loading brands...</div>
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin - Manage Brands" subtitle="Create and manage card manufacturers" />
      <div className="dashboard-main">
        <div style={{ marginBottom: '24px' }}>
          <Link to="/admin" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Admin Dashboard
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Brand Management
          </h2>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
            Add New Brand
          </button>
        </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {(showCreateForm || editingBrand) && (
        <div className="admin-form" style={{ marginBottom: '24px' }}>
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
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Brand Name</th>
              <th>Sets Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map(brand => (
              <tr key={brand.id}>
                <td>{brand.id}</td>
                <td>{brand.name}</td>
                <td>{brand.set_count?.toLocaleString() || 0}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(brand)} className="btn-small btn-edit">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(brand.id)} 
                      className="btn-small btn-delete"
                      disabled={brand.set_count && brand.set_count > 0}
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