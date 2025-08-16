import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importService } from '../services/imports'
import type { CardRow, CardEdit, ImportPlayerRef } from '../types/imports'
import './CardEditModal.css'

interface BulkEditModalProps {
  batchId: number
  selectedCards: CardRow[]
  onClose: () => void
  onSuccess: () => void
}

export const BulkEditModal = ({ batchId, selectedCards, onClose, onSuccess }: BulkEditModalProps) => {
  const queryClient = useQueryClient()
  const [edits, setEdits] = useState<Partial<CardEdit>>({})
  const [isFormValid, setIsFormValid] = useState(false)

  // Track which fields are being edited
  const [activeFields, setActiveFields] = useState<Record<string, boolean>>({})

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  // Validate form - at least one field must be active and have a value
  useEffect(() => {
    const hasActiveField = Object.entries(activeFields).some(([field, active]) => {
      if (!active) return false
      const value = edits[field as keyof CardEdit]
      return value !== undefined && value !== '' && value !== null
    })
    setIsFormValid(hasActiveField)
  }, [activeFields, edits])

  const bulkEditMutation = useMutation({
    mutationFn: async () => {
      // Build the edits array for selected cards
      const cardEdits: CardEdit[] = selectedCards.map(card => {
        const edit: CardEdit = { row_id: card.row_id }
        
        // Only include active fields in the edit
        if (activeFields.card_number && edits.card_number) edit.card_number = edits.card_number
        if (activeFields.card_type && edits.card_type) edit.card_type = edits.card_type
        if (activeFields.title && edits.title !== undefined) edit.title = edits.title
        if (activeFields.subset && edits.subset !== undefined) edit.subset = edits.subset
        if (activeFields.notes && edits.notes !== undefined) edit.notes = edits.notes
        if (activeFields.is_rookie && edits.is_rookie !== undefined) edit.is_rookie = edits.is_rookie
        if (activeFields.is_first && edits.is_first !== undefined) edit.is_first = edits.is_first
        if (activeFields.is_autograph && edits.is_autograph !== undefined) edit.is_autograph = edits.is_autograph
        if (activeFields.players && edits.players) edit.players = edits.players

        return edit
      })

      return importService.bulkEditCards(batchId, cardEdits)
    },
    onSuccess: () => {
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', batchId] })
      onSuccess()
      onClose()
    },
    onError: (error) => {
      console.error('Bulk edit failed:', error)
      alert(`Bulk edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const toggleField = (field: string) => {
    setActiveFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const updateEdit = (field: keyof CardEdit, value: any) => {
    setEdits(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addPlayer = () => {
    const currentPlayers = edits.players || []
    updateEdit('players', [...currentPlayers, { name: '', team_name: '' }])
  }

  const updatePlayer = (index: number, field: keyof ImportPlayerRef, value: string) => {
    const currentPlayers = edits.players || []
    const updated = [...currentPlayers]
    updated[index] = { ...updated[index], [field]: value }
    updateEdit('players', updated)
  }

  const removePlayer = (index: number) => {
    const currentPlayers = edits.players || []
    updateEdit('players', currentPlayers.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (isFormValid) {
      bulkEditMutation.mutate()
    }
  }

  return (
    <div className="card-edit-modal-backdrop" onClick={onClose}>
      <div className="card-edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="card-edit-modal-header">
          <h2 className="card-edit-modal-title">
            ✏️ Bulk Edit {selectedCards.length} Cards
          </h2>
          <button onClick={onClose} className="card-edit-modal-close-button">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="card-edit-modal-content">
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Selected Cards
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Changes will be applied to {selectedCards.length} cards. Only check the fields you want to modify.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedCards.slice(0, 10).map(card => (
                <span key={card.row_id} style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)'
                }}>
                  #{card.data.card_number || card.row_index}
                </span>
              ))}
              {selectedCards.length > 10 && (
                <span style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)'
                }}>
                  +{selectedCards.length - 10} more
                </span>
              )}
            </div>
          </div>

          <div className="card-edit-modal-grid">
            {/* Left Column - Basic Fields */}
            <div className="card-edit-modal-column">
              <h3 className="card-edit-modal-section-title">
                📝 Card Fields
              </h3>
              
              <div className="card-edit-modal-fields-grid">
                {/* Card Number */}
                <div className="card-edit-modal-field">
                  <label className="card-edit-modal-checkbox-label">
                    <input
                      type="checkbox"
                      checked={activeFields.card_number || false}
                      onChange={() => toggleField('card_number')}
                      className="card-edit-modal-checkbox"
                    />
                    <span className="card-edit-modal-label">Card Number</span>
                  </label>
                  <input
                    type="text"
                    value={edits.card_number || ''}
                    onChange={(e) => updateEdit('card_number', e.target.value)}
                    disabled={!activeFields.card_number}
                    className="card-edit-modal-input"
                    placeholder="Leave blank to keep existing"
                  />
                </div>

                {/* Card Type */}
                <div className="card-edit-modal-field">
                  <label className="card-edit-modal-checkbox-label">
                    <input
                      type="checkbox"
                      checked={activeFields.card_type || false}
                      onChange={() => toggleField('card_type')}
                      className="card-edit-modal-checkbox"
                    />
                    <span className="card-edit-modal-label">Card Type</span>
                  </label>
                  <input
                    type="text"
                    value={edits.card_type || ''}
                    onChange={(e) => updateEdit('card_type', e.target.value)}
                    disabled={!activeFields.card_type}
                    className="card-edit-modal-input"
                    placeholder="Leave blank to keep existing"
                  />
                </div>

                {/* Title */}
                <div className="card-edit-modal-field">
                  <label className="card-edit-modal-checkbox-label">
                    <input
                      type="checkbox"
                      checked={activeFields.title || false}
                      onChange={() => toggleField('title')}
                      className="card-edit-modal-checkbox"
                    />
                    <span className="card-edit-modal-label">Title</span>
                  </label>
                  <input
                    type="text"
                    value={edits.title || ''}
                    onChange={(e) => updateEdit('title', e.target.value)}
                    disabled={!activeFields.title}
                    className="card-edit-modal-input"
                    placeholder="Leave blank to keep existing"
                  />
                </div>

                {/* Subset */}
                <div className="card-edit-modal-field">
                  <label className="card-edit-modal-checkbox-label">
                    <input
                      type="checkbox"
                      checked={activeFields.subset || false}
                      onChange={() => toggleField('subset')}
                      className="card-edit-modal-checkbox"
                    />
                    <span className="card-edit-modal-label">Subset</span>
                  </label>
                  <input
                    type="text"
                    value={edits.subset || ''}
                    onChange={(e) => updateEdit('subset', e.target.value)}
                    disabled={!activeFields.subset}
                    className="card-edit-modal-input"
                    placeholder="Leave blank to keep existing"
                  />
                </div>

                {/* Notes */}
                <div className="card-edit-modal-field">
                  <label className="card-edit-modal-checkbox-label">
                    <input
                      type="checkbox"
                      checked={activeFields.notes || false}
                      onChange={() => toggleField('notes')}
                      className="card-edit-modal-checkbox"
                    />
                    <span className="card-edit-modal-label">Notes</span>
                  </label>
                  <textarea
                    value={edits.notes || ''}
                    onChange={(e) => updateEdit('notes', e.target.value)}
                    disabled={!activeFields.notes}
                    className="card-edit-modal-input"
                    placeholder="Leave blank to keep existing"
                    rows={3}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="card-edit-modal-checkboxes">
                <label className="card-edit-modal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={activeFields.is_rookie || false}
                    onChange={() => toggleField('is_rookie')}
                    className="card-edit-modal-checkbox"
                  />
                  <span className="card-edit-modal-label">Set Rookie Status</span>
                </label>
                {activeFields.is_rookie && (
                  <label className="card-edit-modal-checkbox-label" style={{ marginLeft: '24px' }}>
                    <input
                      type="checkbox"
                      checked={edits.is_rookie || false}
                      onChange={(e) => updateEdit('is_rookie', e.target.checked)}
                      className="card-edit-modal-checkbox"
                    />
                    <span className="card-edit-modal-checkbox-text">🌟 Rookie Card</span>
                  </label>
                )}

                <label className="card-edit-modal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={activeFields.is_first || false}
                    onChange={() => toggleField('is_first')}
                    className="card-edit-modal-checkbox"
                  />
                  <span className="card-edit-modal-label">Set First Status</span>
                </label>
                {activeFields.is_first && (
                  <label className="card-edit-modal-checkbox-label" style={{ marginLeft: '24px' }}>
                    <input
                      type="checkbox"
                      checked={edits.is_first || false}
                      onChange={(e) => updateEdit('is_first', e.target.checked)}
                      className="card-edit-modal-checkbox"
                    />
                    <span className="card-edit-modal-checkbox-text">🥇 First Card</span>
                  </label>
                )}

                <label className="card-edit-modal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={activeFields.is_autograph || false}
                    onChange={() => toggleField('is_autograph')}
                    className="card-edit-modal-checkbox"
                  />
                  <span className="card-edit-modal-label">Set Autograph Status</span>
                </label>
                {activeFields.is_autograph && (
                  <label className="card-edit-modal-checkbox-label" style={{ marginLeft: '24px' }}>
                    <input
                      type="checkbox"
                      checked={edits.is_autograph || false}
                      onChange={(e) => updateEdit('is_autograph', e.target.checked)}
                      className="card-edit-modal-checkbox"
                    />
                    <span className="card-edit-modal-checkbox-text">✍️ Autograph Card</span>
                  </label>
                )}
              </div>
            </div>

            {/* Right Column - Players */}
            <div className="card-edit-modal-column">
              <h3 className="card-edit-modal-section-title">
                👥 Player Management
              </h3>
              
              <label className="card-edit-modal-checkbox-label">
                <input
                  type="checkbox"
                  checked={activeFields.players || false}
                  onChange={() => toggleField('players')}
                  className="card-edit-modal-checkbox"
                />
                <span className="card-edit-modal-label">Replace Player List</span>
              </label>

              {activeFields.players && (
                <div>
                  <div className="card-edit-modal-player-header">
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      This will replace the entire player list for all selected cards
                    </span>
                    <button
                      onClick={addPlayer}
                      className="card-edit-modal-add-button card-edit-modal-add-player"
                    >
                      + Add Player
                    </button>
                  </div>
                  <div className="card-edit-modal-player-list">
                    {(edits.players || []).map((player, idx) => (
                      <div key={idx} className="card-edit-modal-player-row">
                        <input
                          placeholder="Player name"
                          value={player.name}
                          onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                          className="card-edit-modal-player-input"
                        />
                        <input
                          placeholder="Team"
                          value={player.team_name}
                          onChange={(e) => updatePlayer(idx, 'team_name', e.target.value)}
                          className="card-edit-modal-player-input"
                        />
                        <button
                          onClick={() => removePlayer(idx)}
                          className="card-edit-modal-remove-button"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {(!edits.players || edits.players.length === 0) && (
                      <div className="card-edit-modal-empty-state">
                        No players assigned
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card-edit-modal-footer">
          <button
            onClick={onClose}
            className="card-edit-modal-cancel-button"
            disabled={bulkEditMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="card-edit-modal-save-button"
            disabled={!isFormValid || bulkEditMutation.isPending}
          >
            {bulkEditMutation.isPending ? 'Saving...' : `💾 Save Changes to ${selectedCards.length} Cards`}
          </button>
        </div>
      </div>
    </div>
  )
}
