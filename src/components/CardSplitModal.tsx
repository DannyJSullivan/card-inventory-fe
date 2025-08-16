import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importService } from '../services/imports'
import type { CardRow, SplitCardRequest, SplitCardData, ImportPlayerRef } from '../types/imports'
import './CardEditModal.css'

interface CardSplitModalProps {
  batchId: number
  sourceCard: CardRow
  onClose: () => void
  onSuccess: () => void
}

export const CardSplitModal = ({ batchId, sourceCard, onClose, onSuccess }: CardSplitModalProps) => {
  const queryClient = useQueryClient()
  const [splitCards, setSplitCards] = useState<SplitCardData[]>([])

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  // Initialize split cards based on source card players
  useEffect(() => {
    const sourcePlayers = sourceCard.data.players || []
    if (sourcePlayers.length >= 2) {
      // Create initial split: one card per player
      const initialSplits = sourcePlayers.map((player, index) => ({
        card_number: `${sourceCard.data.card_number || '1'}${String.fromCharCode(97 + index)}`, // 1a, 1b, etc.
        players: [{ ...player }],
        inherit_attributes: true
      }))
      setSplitCards(initialSplits)
    } else {
      // Default: create 2 cards for manual entry
      setSplitCards([
        {
          card_number: `${sourceCard.data.card_number || '1'}a`,
          players: sourcePlayers.length > 0 ? [{ ...sourcePlayers[0] }] : [{ name: '', team_name: '' }],
          inherit_attributes: true
        },
        {
          card_number: `${sourceCard.data.card_number || '1'}b`,
          players: [{ name: '', team_name: '' }],
          inherit_attributes: true
        }
      ])
    }
  }, [sourceCard])

  const splitMutation = useMutation({
    mutationFn: async () => {
      const request: SplitCardRequest = {
        source_row_id: sourceCard.row_id,
        split_cards: splitCards
      }

      return importService.splitCard(batchId, request)
    },
    onSuccess: () => {
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', batchId] })
      onSuccess()
      onClose()
    },
    onError: (error) => {
      console.error('Card split failed:', error)
      alert(`Card split failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const addSplitCard = () => {
    const newCardNumber = `${sourceCard.data.card_number || '1'}${String.fromCharCode(97 + splitCards.length)}`
    setSplitCards(prev => [
      ...prev,
      {
        card_number: newCardNumber,
        players: [{ name: '', team_name: '' }],
        inherit_attributes: true
      }
    ])
  }

  const removeSplitCard = (index: number) => {
    if (splitCards.length > 2) {
      setSplitCards(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateSplitCard = (index: number, field: keyof SplitCardData, value: any) => {
    setSplitCards(prev => prev.map((card, i) => 
      i === index ? { ...card, [field]: value } : card
    ))
  }

  const addPlayerToSplit = (splitIndex: number) => {
    setSplitCards(prev => prev.map((card, i) => 
      i === splitIndex 
        ? { ...card, players: [...card.players, { name: '', team_name: '' }] }
        : card
    ))
  }

  const updatePlayerInSplit = (splitIndex: number, playerIndex: number, field: keyof ImportPlayerRef, value: string) => {
    setSplitCards(prev => prev.map((card, i) => 
      i === splitIndex 
        ? {
            ...card,
            players: card.players.map((player, j) => 
              j === playerIndex ? { ...player, [field]: value } : player
            )
          }
        : card
    ))
  }

  const removePlayerFromSplit = (splitIndex: number, playerIndex: number) => {
    setSplitCards(prev => prev.map((card, i) => 
      i === splitIndex 
        ? { ...card, players: card.players.filter((_, j) => j !== playerIndex) }
        : card
    ))
  }

  const canSplit = splitCards.length >= 2 && 
                  splitCards.every(card => 
                    card.card_number.trim() !== '' && 
                    card.players.length > 0 &&
                    card.players.every(p => p.name.trim() !== '')
                  )

  return (
    <div className="card-edit-modal-backdrop" onClick={onClose}>
      <div className="card-edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="card-edit-modal-header">
          <h2 className="card-edit-modal-title">
            ✂️ Split Card #{sourceCard.data.card_number || sourceCard.row_index}
          </h2>
          <button onClick={onClose} className="card-edit-modal-close-button">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="card-edit-modal-content">
          {/* Source Card Preview */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Source Card
            </h4>
            <div style={{ 
              padding: '12px', 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-primary)', 
              borderRadius: '6px',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                #{sourceCard.data.card_number || sourceCard.row_index}
                {sourceCard.data.title && ` - ${sourceCard.data.title}`}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Players: {(sourceCard.data.players || []).map(p => p.name).join(', ') || 'No players'}
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                Attributes: {[
                  sourceCard.data.is_rookie && '🌟 Rookie',
                  sourceCard.data.is_first && '🥇 First', 
                  sourceCard.data.is_autograph && '✍️ Autograph'
                ].filter(Boolean).join(', ') || 'None'}
              </div>
            </div>
            <div style={{ 
              marginTop: '8px', 
              fontSize: '11px', 
              color: 'var(--text-secondary)'
            }}>
              This card will be deleted and replaced with the split cards below
            </div>
          </div>

          {/* Split Cards */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <h3 className="card-edit-modal-section-title">
                📋 Split Into {splitCards.length} Cards
              </h3>
              <button
                onClick={addSplitCard}
                className="card-edit-modal-add-button"
              >
                + Add Card
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {splitCards.map((splitCard, splitIndex) => (
                <div key={splitIndex} style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-primary)', 
                  borderRadius: '8px' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '12px' 
                  }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)' 
                    }}>
                      Card {String.fromCharCode(65 + splitIndex)}
                    </h4>
                    {splitCards.length > 2 && (
                      <button
                        onClick={() => removeSplitCard(splitIndex)}
                        className="card-edit-modal-remove-button"
                        style={{ fontSize: '12px' }}
                      >
                        Remove Card
                      </button>
                    )}
                  </div>

                  <div className="card-edit-modal-fields-grid">
                    <div className="card-edit-modal-field">
                      <label className="card-edit-modal-label">Card Number *</label>
                      <input
                        type="text"
                        value={splitCard.card_number}
                        onChange={(e) => updateSplitCard(splitIndex, 'card_number', e.target.value)}
                        className="card-edit-modal-input"
                        placeholder="e.g., 1a, 1b"
                      />
                    </div>

                    <div className="card-edit-modal-field">
                      <label className="card-edit-modal-checkbox-label">
                        <input
                          type="checkbox"
                          checked={splitCard.inherit_attributes}
                          onChange={(e) => updateSplitCard(splitIndex, 'inherit_attributes', e.target.checked)}
                          className="card-edit-modal-checkbox"
                        />
                        <span className="card-edit-modal-checkbox-text">
                          Inherit attributes from source card
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="card-edit-modal-player-header">
                      <label className="card-edit-modal-label">Players *</label>
                      <button
                        onClick={() => addPlayerToSplit(splitIndex)}
                        className="card-edit-modal-add-button card-edit-modal-add-player"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        + Player
                      </button>
                    </div>
                    
                    <div>
                      {splitCard.players.map((player, playerIndex) => (
                        <div key={playerIndex} className="card-edit-modal-player-row">
                          <input
                            placeholder="Player name"
                            value={player.name}
                            onChange={(e) => updatePlayerInSplit(splitIndex, playerIndex, 'name', e.target.value)}
                            className="card-edit-modal-player-input"
                          />
                          <input
                            placeholder="Team"
                            value={player.team_name}
                            onChange={(e) => updatePlayerInSplit(splitIndex, playerIndex, 'team_name', e.target.value)}
                            className="card-edit-modal-player-input"
                          />
                          {splitCard.players.length > 1 && (
                            <button
                              onClick={() => removePlayerFromSplit(splitIndex, playerIndex)}
                              className="card-edit-modal-remove-button"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      {splitCard.players.length === 0 && (
                        <div className="card-edit-modal-empty-state">
                          No players - add at least one
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Messages */}
            {splitCards.length < 2 && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fbbf24', 
                color: '#92400e', 
                borderRadius: '8px',
                fontSize: '12px',
                marginTop: '12px'
              }}>
                ⚠️ At least 2 split cards are required
              </div>
            )}

            {splitCards.some(card => card.card_number.trim() === '') && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fbbf24', 
                color: '#92400e', 
                borderRadius: '8px',
                fontSize: '12px',
                marginTop: '12px'
              }}>
                ⚠️ All cards must have a card number
              </div>
            )}

            {splitCards.some(card => card.players.length === 0 || card.players.some(p => p.name.trim() === '')) && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fbbf24', 
                color: '#92400e', 
                borderRadius: '8px',
                fontSize: '12px',
                marginTop: '12px'
              }}>
                ⚠️ All cards must have at least one player with a name
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="card-edit-modal-footer">
          <button
            onClick={onClose}
            className="card-edit-modal-cancel-button"
            disabled={splitMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={() => splitMutation.mutate()}
            className="card-edit-modal-save-button"
            disabled={!canSplit || splitMutation.isPending}
            style={{
              backgroundColor: canSplit ? '#4f46e5' : 'var(--text-secondary)'
            }}
          >
            {splitMutation.isPending ? 'Splitting...' : `✂️ Split into ${splitCards.length} Cards`}
          </button>
        </div>
      </div>
    </div>
  )
}
