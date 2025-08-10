import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { AppNavbar } from '../components/ui/AppNavbar'
import { adminService } from '../services/adminService'

interface Card {
  id: number;
  card_number: string;
  card_type: string;
  title: string | null;
  subset: string | null;
  notes: string | null;
  is_rookie: boolean;
  is_first: boolean;
  is_autograph: boolean;
  created_at: string;
  updated_at: string;
  card_set: {
    id: number;
    name: string;
    year: number;
    sport: string;
    release_date: string | null;
    brand: {
      id: number;
      name: string;
    };
  };
  players: Array<{
    id: number;
    full_name: string;
    sport: string;
    team_name: string;
  }>;
  teams: Array<{
    id: number;
    name: string;
    sport: string;
  }>;
  parallels: Array<any>;
}

interface CardFormData {
  set_id: number;
  card_number: string;
  card_type: string;
  title: string;
  is_rookie: boolean;
  subset?: string;
  notes?: string;
  is_first?: boolean;
  is_autograph?: boolean;
}

export const AdminCardsPage = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCards, setSelectedCards] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  
  const pageSize = 20
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CardFormData>()

  useEffect(() => {
    loadCards()
  }, [currentPage])

  const loadCards = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await adminService.getCards(currentPage * pageSize, pageSize)
      
      if (result.error) {
        setError(`Failed to load cards: ${result.error}`)
        setCards([])
      } else if (result.data && 'items' in result.data) {
        // Proper paginated response
        const paginatedData = result.data as any
        setCards(paginatedData.items || [])
        setTotalItems(paginatedData.total || 0)
        setTotalPages(Math.ceil((paginatedData.total || 0) / pageSize))
      } else {
        setError('Server returned unexpected data format. Please ensure pagination is properly implemented.')
        setCards([])
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (cardId: number) => {
    try {
      const result = await adminService.getCardForEdit(cardId)
      if (result.error) {
        setError(`Failed to load card for editing: ${result.error}`)
      } else if (result.data && typeof result.data === 'object') {
        setEditingCard(result.data as Card)
      } else {
        setError('Unable to load card data')
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const handleDelete = async (cardId: number) => {
    if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return
    }
    
    try {
      const result = await adminService.deleteCard(cardId)
      if (result.error) {
        setError(`Failed to delete card: ${result.error}`)
      } else {
        setError(null)
        loadCards()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const handleDuplicate = async (cardId: number) => {
    const newCardNumber = prompt('Enter new card number for the duplicate:')
    if (!newCardNumber || newCardNumber.trim() === '') {
      return
    }
    
    try {
      const result = await adminService.duplicateCard(cardId, newCardNumber.trim())
      if (result.error) {
        setError(`Failed to duplicate card: ${result.error}`)
      } else {
        setError(null)
        loadCards()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedCards.length === 0) {
      setError('Please select cards to update')
      return
    }
    
    const rookieUpdate = confirm('Mark selected cards as rookie cards?')
    const updates: any = { is_rookie: rookieUpdate }
    
    const subset = prompt('Enter subset (optional):')
    if (subset && subset.trim()) {
      updates.subset = subset.trim()
    }
    
    try {
      const result = await adminService.bulkUpdateCards(selectedCards, updates)
      if (result.error) {
        setError(`Bulk update failed: ${result.error}`)
      } else {
        setError(null)
        setSelectedCards([])
        loadCards()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const onSubmit = async (data: CardFormData) => {
    setError(null)
    
    try {
      let result
      if (editingCard) {
        result = await adminService.updateCard(editingCard.id, data)
      } else {
        result = await adminService.createCard(data)
      }
      
      if (result.error) {
        setError(`Failed to ${editingCard ? 'update' : 'create'} card: ${result.error}`)
      } else {
        setEditingCard(null)
        setShowCreateForm(false)
        reset()
        loadCards()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const toggleCardSelection = (cardId: number) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    )
  }

  const toggleAllCards = () => {
    setSelectedCards(
      selectedCards.length === cards.length 
        ? [] 
        : cards.map(card => card.id)
    )
  }

  if (loading && cards.length === 0) {
    return (
      <div className="dashboard-container">
        <AppNavbar title="Admin - Manage Cards" subtitle="Create, edit, and manage individual cards" />
        <div className="dashboard-main">
          <div style={{ marginBottom: '24px' }}>
            <Link to="/admin" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              ← Back to Admin Dashboard
            </Link>
          </div>
          <div className="loading">
            <div style={{ textAlign: 'center', padding: '64px' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Loading cards...
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Please wait while we fetch your card data
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Admin - Manage Cards" subtitle="Create, edit, and manage individual cards" />
      <div className="dashboard-main">
        <div style={{ marginBottom: '24px' }}>
          <Link to="/admin" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Admin Dashboard
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Card Management
            </h2>
            {loading && <div className="loading-spinner"></div>}
            {totalItems > 0 && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems.toLocaleString()} cards
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {selectedCards.length > 0 && (
              <button onClick={handleBulkUpdate} className="btn-secondary">
                Bulk Update ({selectedCards.length})
              </button>
            )}
            <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
              Add New Card
            </button>
          </div>
        </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button 
            onClick={() => {
              setError(null)
              loadCards()
            }} 
            className="error-retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {(showCreateForm || editingCard) && (
        <div className="admin-form" style={{ marginBottom: '24px' }}>
          <h2>{editingCard ? 'Edit Card' : 'Create New Card'}</h2>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Set ID</label>
              <input
                type="number"
                className="form-input"
                {...register('set_id', { required: 'Set ID is required', valueAsNumber: true })}
                defaultValue={editingCard?.card_set?.id}
              />
              {errors.set_id && <div className="form-error">{errors.set_id.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input
                type="text"
                className="form-input"
                {...register('card_number', { required: 'Card number is required' })}
                defaultValue={editingCard?.card_number}
              />
              {errors.card_number && <div className="form-error">{errors.card_number.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Card Type</label>
              <input
                type="text"
                className="form-input"
                {...register('card_type', { required: 'Card type is required' })}
                defaultValue={editingCard?.card_type || 'Base Card'}
              />
              {errors.card_type && <div className="form-error">{errors.card_type.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-input"
                {...register('title', { required: 'Title is required' })}
                defaultValue={editingCard?.title || ''}
              />
              {errors.title && <div className="form-error">{errors.title.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Subset (optional)</label>
              <input
                type="text"
                className="form-input"
                {...register('subset')}
                defaultValue={editingCard?.subset || ''}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-input"
                {...register('notes')}
                defaultValue={editingCard?.notes || ''}
                rows={3}
                placeholder="Additional notes about this card"
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    {...register('is_rookie')}
                    defaultChecked={editingCard?.is_rookie}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Rookie Card</span>
                </label>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    {...register('is_first')}
                    defaultChecked={editingCard?.is_first}
                  />
                  <span className="form-label" style={{ margin: 0 }}>First Card</span>
                </label>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    {...register('is_autograph')}
                    defaultChecked={editingCard?.is_autograph}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Autograph Card</span>
                </label>
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : editingCard ? 'Update Card' : 'Create Card'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setEditingCard(null)
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
              <th>
                <input
                  type="checkbox"
                  checked={selectedCards.length === cards.length && cards.length > 0}
                  onChange={toggleAllCards}
                />
              </th>
              <th>ID</th>
              <th>Set</th>
              <th>Card #</th>
              <th>Title/Player</th>
              <th>Type</th>
              <th>Special</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedCards.includes(card.id)}
                    onChange={() => toggleCardSelection(card.id)}
                  />
                </td>
                <td>{card.id}</td>
                <td>{card.card_set?.brand?.name} {card.card_set?.name} {card.card_set?.year}</td>
                <td>{card.card_number}</td>
                <td>{card.title || card.players.map(p => p.full_name).join(', ') || 'Untitled'}</td>
                <td>{card.card_type}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', fontSize: '12px' }}>
                    {card.is_rookie && <span style={{ background: 'var(--accent-primary)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>R</span>}
                    {card.is_first && <span style={{ background: 'var(--accent-success)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>1st</span>}
                    {card.is_autograph && <span style={{ background: 'var(--accent-warning)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>AU</span>}
                  </div>
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(card.id)} className="btn-small btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDuplicate(card.id)} className="btn-small btn-duplicate">
                      Duplicate
                    </button>
                    <button onClick={() => handleDelete(card.id)} className="btn-small btn-delete">
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
            Page {currentPage + 1} of {totalPages} ({totalItems.toLocaleString()} total cards)
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