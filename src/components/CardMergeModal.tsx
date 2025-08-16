import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importService } from '../services/imports'
import type { CardRow, MergeCardsRequest, ImportPlayerRef } from '../types/imports'
import './CardEditModal.css'

interface CardMergeModalProps {
  batchId: number
  selectedCards: CardRow[]
  onClose: () => void
  onSuccess: () => void
}

export const CardMergeModal = ({ batchId, selectedCards, onClose, onSuccess }: CardMergeModalProps) => {
  const queryClient = useQueryClient()
  const [targetCardId, setTargetCardId] = useState<number>(selectedCards[0]?.row_id || 0)
  const [mergedCardData, setMergedCardData] = useState({
    card_number: '',
    title: '',
    players: [] as ImportPlayerRef[]
  })

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  // Initialize merged card data when target changes
  useEffect(() => {
    const targetCard = selectedCards.find(c => c.row_id === targetCardId)
    if (targetCard) {
      setMergedCardData({
        card_number: targetCard.data.card_number || '',
        title: targetCard.data.title || '',
        players: [...(targetCard.data.players || [])]
      })
    }
  }, [targetCardId, selectedCards])

  const mergeMutation = useMutation({
    mutationFn: async () => {
      const sourceCardIds = selectedCards
        .filter(card => card.row_id !== targetCardId)
        .map(card => card.row_id)

      const request: MergeCardsRequest = {
        target_row_id: targetCardId,
        source_row_ids: sourceCardIds,
        merged_card_data: mergedCardData
      }

      return importService.mergeCards(batchId, request)
    },
    onSuccess: () => {
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', batchId] })
      onSuccess()
      onClose()
    },
    onError: (error) => {
      console.error('Card merge failed:', error)
      alert(`Card merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const addAllPlayersToMerged = () => {
    const allPlayers: ImportPlayerRef[] = []
    const seenPlayers = new Set<string>()
    
    selectedCards.forEach(card => {
      (card.data.players || []).forEach(player => {
        const key = `${player.name}|${player.team_name}`
        if (!seenPlayers.has(key)) {
          seenPlayers.add(key)
          allPlayers.push({ ...player })
        }
      })
    })
    
    setMergedCardData(prev => ({
      ...prev,
      players: allPlayers
    }))
  }

  const addPlayer = () => {
    setMergedCardData(prev => ({
      ...prev,
      players: [...prev.players, { name: '', team_name: '' }]
    }))
  }

  const updatePlayer = (index: number, field: keyof ImportPlayerRef, value: string) => {
    setMergedCardData(prev => ({
      ...prev,
      players: prev.players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }))
  }

  const removePlayer = (index: number) => {
    setMergedCardData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }))
  }

  const canMerge = selectedCards.length >= 2 && 
                  mergedCardData.card_number.trim() !== '' &&
                  mergedCardData.players.length > 0

  return (
    <div className="card-edit-modal-backdrop" onClick={onClose}>
      <div className="card-edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="card-edit-modal-header">
          <h2 className="card-edit-modal-title">
            🔗 Merge {selectedCards.length} Cards
          </h2>
          <button onClick={onClose} className="card-edit-modal-close-button">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="card-edit-modal-content">
          {/* Source Cards Preview */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Cards to Merge
            </h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {selectedCards.map(card => (
                <div key={card.row_id} style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-card)',
                  border: `2px solid ${card.row_id === targetCardId ? '#4f46e5' : 'var(--border-primary)'}`,
                  borderRadius: '6px',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    #{card.data.card_number || card.row_index}
                    {card.row_id === targetCardId && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '10px', 
                        padding: '2px 6px', 
                        backgroundColor: '#4f46e5', 
                        color: 'white', 
                        borderRadius: '10px' 
                      }}>
                        TARGET
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {(card.data.players || []).map(p => p.name).join(', ') || 'No players'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-edit-modal-grid">
            {/* Left Column - Target Selection */}
            <div className="card-edit-modal-column">
              <h3 className="card-edit-modal-section-title">
                🎯 Target Card
              </h3>
              
              <div className="card-edit-modal-field">
                <label className="card-edit-modal-label">
                  Choose which card to keep as the base
                </label>
                <select
                  value={targetCardId}
                  onChange={(e) => setTargetCardId(Number(e.target.value))}
                  className="card-edit-modal-input"
                >
                  {selectedCards.map(card => (
                    <option key={card.row_id} value={card.row_id}>
                      #{card.data.card_number || card.row_index} - {(card.data.players || []).map(p => p.name).join(', ') || 'No players'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="card-edit-modal-field">
                <label className="card-edit-modal-label">
                  Card Number *
                </label>
                <input
                  type="text"
                  value={mergedCardData.card_number}
                  onChange={(e) => setMergedCardData(prev => ({ ...prev, card_number: e.target.value }))}
                  className="card-edit-modal-input"
                  placeholder="Enter card number"
                />
              </div>

              <div className="card-edit-modal-field">
                <label className="card-edit-modal-label">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={mergedCardData.title}
                  onChange={(e) => setMergedCardData(prev => ({ ...prev, title: e.target.value }))}
                  className="card-edit-modal-input"
                  placeholder="Enter card title"
                />
              </div>

              <div style={{ 
                padding: '12px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>What happens:</strong>
                </p>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li>Target card will be updated with merged data</li>
                  <li>Source cards will be deleted</li>
                  <li>All attributes from target card are preserved</li>
                  <li>Players can be combined or customized</li>
                </ul>
              </div>
            </div>

            {/* Right Column - Players */}
            <div className="card-edit-modal-column">
              <h3 className="card-edit-modal-section-title">
                👥 Merged Players
              </h3>
              
              <div className="card-edit-modal-player-header">
                <button
                  onClick={addAllPlayersToMerged}
                  className="card-edit-modal-create-button"
                >
                  📥 Add All Players
                </button>
                <button
                  onClick={addPlayer}
                  className="card-edit-modal-add-button card-edit-modal-add-player"
                >
                  + Add Player
                </button>
              </div>

              <div className="card-edit-modal-player-list">
                {mergedCardData.players.map((player, idx) => (
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
                {mergedCardData.players.length === 0 && (
                  <div className="card-edit-modal-empty-state">
                    No players assigned - add at least one player
                  </div>
                )}
              </div>

              {selectedCards.length < 2 && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#fbbf24', 
                  color: '#92400e', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginTop: '12px'
                }}>
                  ⚠️ At least 2 cards are required for merging
                </div>
              )}

              {mergedCardData.card_number.trim() === '' && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#fbbf24', 
                  color: '#92400e', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginTop: '12px'
                }}>
                  ⚠️ Card number is required
                </div>
              )}

              {mergedCardData.players.length === 0 && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#fbbf24', 
                  color: '#92400e', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginTop: '12px'
                }}>
                  ⚠️ At least one player is required
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
            disabled={mergeMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={() => mergeMutation.mutate()}
            className="card-edit-modal-save-button"
            disabled={!canMerge || mergeMutation.isPending}
            style={{
              backgroundColor: canMerge ? '#4f46e5' : 'var(--text-secondary)'
            }}
          >
            {mergeMutation.isPending ? 'Merging...' : `🔗 Merge ${selectedCards.length} Cards`}
          </button>
        </div>
      </div>
    </div>
  )
}
