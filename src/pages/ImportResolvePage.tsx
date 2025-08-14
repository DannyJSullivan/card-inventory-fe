import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { importService } from '../services/imports'
import { useImportResolutionStore } from '../stores/importResolution'
import type { CardRow, CardEditPayload, ImportPlayerRef, ImportParallelRef, CardTypeInfo } from '../types/imports'
import { AppNavbar } from '../components/ui/AppNavbar'
import { Pagination } from '../components/ui/Pagination'
import '../components/CardEditModal.css'
import '../components/CollapsibleCard.css'

// Helper: format score without trailing zeros
const formatScore = (score: number): string => {
  return parseFloat(score.toFixed(2)).toString()
}

// Merge Cards Modal Component
interface MergeCardsModalProps {
  selectedCardIds: number[]
  selectedCards: CardRow[]
  batchId: number
  onClose: () => void
  onMerge: (request: any) => void
  isPending: boolean
}

const MergeCardsModal = ({ selectedCardIds, selectedCards, batchId, onClose, onMerge, isPending }: MergeCardsModalProps) => {
  const [targetCardId, setTargetCardId] = useState<number>(selectedCardIds[0] || 0)
  const [mergedCardNumber, setMergedCardNumber] = useState('')
  const [mergedTitle, setMergedTitle] = useState('')

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  const handleMerge = () => {
    const sourceCardIds = selectedCardIds.filter(id => id !== targetCardId)
    
    // Collect all unique players from all selected cards
    const allPlayersMap = new Map<string, any>()
    selectedCards.forEach(card => {
      card.data.players?.forEach(player => {
        const key = `${player.name}|${player.team_name}`
        allPlayersMap.set(key, player)
      })
    })
    
    const allPlayers = Array.from(allPlayersMap.values())
    
    const request = {
      target_row_id: targetCardId,
      source_row_ids: sourceCardIds,
      merged_card_data: {
        card_number: mergedCardNumber || `merged-${targetCardId}`, // card_number is required
        ...(mergedTitle && { title: mergedTitle }),
        players: allPlayers // Include all players from selected cards
      }
    }
    
    onMerge(request)
  }

  return (
    <div className="card-edit-modal-backdrop" onClick={onClose}>
      <div className="card-edit-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="card-edit-modal-header">
          <h2 className="card-edit-modal-title">🔗 Merge Cards</h2>
          <button onClick={onClose} className="card-edit-modal-close-button">✕</button>
        </div>

        <div className="card-edit-modal-content">
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Merge {selectedCardIds.length} cards into a single card. All players and teams will be combined.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label className="card-edit-modal-label">Target Card (keep this one)</label>
            <select
              value={targetCardId}
              onChange={(e) => setTargetCardId(Number(e.target.value))}
              className="card-edit-modal-input"
            >
              {selectedCardIds.map(id => (
                <option key={id} value={id}>Card ID: {id}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="card-edit-modal-label">Merged Card Number (required)</label>
            <input
              type="text"
              value={mergedCardNumber}
              onChange={(e) => setMergedCardNumber(e.target.value)}
              className="card-edit-modal-input"
              placeholder="Enter card number for merged card"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="card-edit-modal-label">Merged Title (optional)</label>
            <input
              type="text"
              value={mergedTitle}
              onChange={(e) => setMergedTitle(e.target.value)}
              className="card-edit-modal-input"
              placeholder="Leave blank to keep target card title"
            />
          </div>
        </div>

        <div className="card-edit-modal-footer">
          <button
            onClick={onClose}
            className="card-edit-modal-cancel-button"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            className="card-edit-modal-save-button"
            disabled={isPending || !mergedCardNumber.trim()}
          >
            {isPending ? 'Merging...' : '🔗 Merge Cards'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Split Card Modal Component
interface SplitCardModalProps {
  cardRow: CardRow
  batchId: number
  onClose: () => void
  onSplit: (request: any) => void
  isPending: boolean
}

const SplitCardModal = ({ cardRow, batchId, onClose, onSplit, isPending }: SplitCardModalProps) => {
  const [splitCards, setSplitCards] = useState(() => {
    return cardRow.data.players?.map((player, idx) => ({
      card_number: `${cardRow.data.card_number || cardRow.row_index}${String.fromCharCode(97 + idx)}`, // 1a, 1b, etc
      players: [player],
      inherit_attributes: true
    })) || []
  })

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  const handleSplit = () => {
    const request = {
      source_row_id: cardRow.row_id,
      split_cards: splitCards
    }
    
    onSplit(request)
  }

  const updateSplitCard = (index: number, field: string, value: any) => {
    setSplitCards(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  return (
    <div className="card-edit-modal-backdrop" onClick={onClose}>
      <div className="card-edit-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="card-edit-modal-header">
          <h2 className="card-edit-modal-title">✂️ Split Card</h2>
          <button onClick={onClose} className="card-edit-modal-close-button">✕</button>
        </div>

        <div className="card-edit-modal-content">
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Split "{cardRow.data.title || cardRow.data.card_number}" into {splitCards.length} separate cards.
          </p>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {splitCards.map((splitCard, index) => (
              <div key={index} style={{
                padding: '12px',
                marginBottom: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  Card {index + 1}: {splitCard.players[0]?.name || 'Unknown'}
                </h4>
                
                <div style={{ marginBottom: '12px' }}>
                  <label className="card-edit-modal-label">Card Number</label>
                  <input
                    type="text"
                    value={splitCard.card_number}
                    onChange={(e) => updateSplitCard(index, 'card_number', e.target.value)}
                    className="card-edit-modal-input"
                  />
                </div>


                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Player: {splitCard.players[0]?.name} ({splitCard.players[0]?.team_name})
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-edit-modal-footer">
          <button
            onClick={onClose}
            className="card-edit-modal-cancel-button"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSplit}
            className="card-edit-modal-save-button"
            disabled={isPending || splitCards.length === 0}
          >
            {isPending ? 'Splitting...' : '✂️ Split Card'}
          </button>
        </div>
      </div>
    </div>
  )
}


// Card Edit Modal
interface CardModalProps { 
  row: CardRow
  groups: any
  onClose: () => void
  existingEdit?: CardEditPayload
  saveEdit: (edit: CardEditPayload | null) => void
}

const CardEditModal = ({ row, groups, onClose, existingEdit, saveEdit, allRows }: CardModalProps & { allRows: CardRow[] }) => {
  
  const base = row.data
  const { players, teams, select, clear } = useImportResolutionStore()
  const [cardNumber, setCardNumber] = useState(existingEdit?.card_number ?? base.card_number ?? '')
  const [cardType, setCardType] = useState(existingEdit?.card_type ?? base.card_type ?? '')
  const [isRookie, setIsRookie] = useState(existingEdit?.is_rookie ?? base.is_rookie)
  const [isFirst, setIsFirst] = useState(existingEdit?.is_first ?? base.is_first)
  const [isAutograph, setIsAutograph] = useState(existingEdit?.is_autograph ?? base.is_autograph)
  const [cardPlayers, setCardPlayers] = useState<ImportPlayerRef[]>(existingEdit?.players ?? base.players ?? [])

  const playerNames = Array.from(new Set((cardPlayers||[]).map(p=>p.name).filter(Boolean)))
  const teamNames = Array.from(new Set((cardPlayers||[]).map(p=>p.team_name).filter(Boolean)))
  
  // Get all unique card types from the actual data
  const availableCardTypes = useMemo(() => {
    const types = new Set<string>()
    allRows.forEach(r => {
      if (r.data.card_type) types.add(r.data.card_type)
    })
    return Array.from(types).sort()
  }, [allRows])

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  const buildEdit = (): CardEditPayload | null => { 
    const e: CardEditPayload = { row_id: row.row_id }; 
    if (cardNumber !== (base.card_number||'')) e.card_number = cardNumber || undefined; 
    if (cardType !== (base.card_type||'')) e.card_type = cardType || undefined; 
    if (isRookie !== base.is_rookie) e.is_rookie = isRookie; 
    if (isFirst !== base.is_first) e.is_first = isFirst; 
    if (isAutograph !== base.is_autograph) e.is_autograph = isAutograph; 
    if (JSON.stringify(cardPlayers) !== JSON.stringify(base.players)) e.players = cardPlayers;
    return Object.keys(e).length===1? null : e 
  }

  const save = () => { 
    console.log('Save clicked')
    const edit = buildEdit()
    console.log('Edit to save:', edit)
    saveEdit(edit)
    onClose() 
  }

  return (
    <div className="card-edit-modal-backdrop" onClick={onClose}>
      <div className="card-edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="card-edit-modal-header">
          <h2 className="card-edit-modal-title">
            ✏️ Edit Card #{row.data.card_number || row.row_index}
          </h2>
          <button onClick={onClose} className="card-edit-modal-close-button">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="card-edit-modal-content">
          <div className="card-edit-modal-grid">
            
            {/* Left Column - Card Fields */}
            <div className="card-edit-modal-column">
              <h3 className="card-edit-modal-section-title">
                📝 Card Information
              </h3>
              
              {/* Basic Fields Grid */}
              <div className="card-edit-modal-fields-grid">
                <div className="card-edit-modal-field">
                  <label className="card-edit-modal-label">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="card-edit-modal-input"
                  />
                </div>
                
                <div className="card-edit-modal-field">
                  <label className="card-edit-modal-label">
                    Card Type
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    className="card-edit-modal-input"
                  >
                    <option value="">Select Type</option>
                    {availableCardTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="card-edit-modal-checkboxes">
                <label className="card-edit-modal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isRookie || false}
                    onChange={(e) => setIsRookie(e.target.checked)}
                    className="card-edit-modal-checkbox"
                  />
                  <span className="card-edit-modal-checkbox-text">🌟 Rookie</span>
                </label>
                <label className="card-edit-modal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isFirst || false}
                    onChange={(e) => setIsFirst(e.target.checked)}
                    className="card-edit-modal-checkbox"
                  />
                  <span className="card-edit-modal-checkbox-text">🥇 First</span>
                </label>
                <label className="card-edit-modal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isAutograph || false}
                    onChange={(e) => setIsAutograph(e.target.checked)}
                    className="card-edit-modal-checkbox"
                  />
                  <span className="card-edit-modal-checkbox-text">✍️ Autograph</span>
                </label>
              </div>
            </div>

            {/* Right Column - Resolution & Data */}
            <div className="card-edit-modal-column">
              <h3 className="card-edit-modal-section-title">
                🔗 Entity Resolution & Data
              </h3>
              
              {/* Player Management */}
              <div>
                <div className="card-edit-modal-player-header">
                  <label className="card-edit-modal-label">
                    Players
                  </label>
                  <button
                    onClick={() => setCardPlayers([...cardPlayers, {name: '', team_name: ''}])}
                    className="card-edit-modal-add-button card-edit-modal-add-player"
                  >
                    + Add Player
                  </button>
                </div>
                <div className="card-edit-modal-player-list">
                  {cardPlayers.map((player, idx) => (
                    <div key={idx} className="card-edit-modal-player-row">
                      <input
                        placeholder="Player name"
                        value={player.name}
                        onChange={(e) => {
                          const updated = [...cardPlayers]
                          updated[idx].name = e.target.value
                          setCardPlayers(updated)
                        }}
                        className="card-edit-modal-player-input"
                      />
                      <input
                        placeholder="Team"
                        value={player.team_name}
                        onChange={(e) => {
                          const updated = [...cardPlayers]
                          updated[idx].team_name = e.target.value
                          setCardPlayers(updated)
                        }}
                        className="card-edit-modal-player-input"
                      />
                      <button
                        onClick={() => setCardPlayers(cardPlayers.filter((_, i) => i !== idx))}
                        className="card-edit-modal-remove-button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {cardPlayers.length === 0 && (
                    <div className="card-edit-modal-empty-state">
                      No players assigned
                    </div>
                  )}
                </div>
              </div>

              {/* Player Resolution */}
              <div>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  margin: '0 0 12px 0',
                  color: 'var(--text-tertiary)'
                }}>
                  👤 Player Resolution
                </h4>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px', 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  padding: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '8px'
                }}>
                  {playerNames.map(raw => {
                    const st = players[raw]
                    const candidates = groups.player_candidates[raw] || []
                    const unresolved = !st?.selection
                    return (
                      <div key={raw} style={{ 
                        padding: '12px', 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-primary)', 
                        borderRadius: '8px' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{raw}</span>
                          {st?.selection && 'existingId' in st.selection && (
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '4px 8px', 
                              borderRadius: '12px', 
                              backgroundColor: '#059669', 
                              color: 'white', 
                              fontWeight: '500' 
                            }}>
                              ✅ Linked
                            </span>
                          )}
                          {st?.selection && 'create' in st.selection && (
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '4px 8px', 
                              borderRadius: '12px', 
                              backgroundColor: '#2563eb', 
                              color: 'white', 
                              fontWeight: '500' 
                            }}>
                              🆕 New
                            </span>
                          )}
                          {unresolved && (
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '4px 8px', 
                              borderRadius: '12px', 
                              backgroundColor: '#d97706', 
                              color: 'white', 
                              fontWeight: '500' 
                            }}>
                              ⚠️ Pending
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                          {candidates.slice(0,6).map((c: any) => {
                            const selected = st?.selection && 'existingId' in st.selection && st.selection.existingId === c.id
                            return (
                              <button 
                                key={c.id} 
                                onClick={() => select('player', raw, { kind:'player', raw, existingId: c.id, canonical: c.name })} 
                                style={{
                                  padding: '4px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '11px', 
                                  border: '1px solid var(--border-secondary)',
                                  backgroundColor: selected ? '#4f46e5' : 'var(--button-bg)',
                                  color: selected ? 'white' : 'var(--text-tertiary)',
                                  cursor: 'pointer'
                                }}
                              >
                                {c.name} <span style={{ opacity: 0.7 }}>({formatScore(c.score)})</span>
                              </button>
                            )
                          })}
                          {candidates.length === 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              No candidates
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => select('player', raw, { kind:'player', raw, create: raw })} 
                            style={{
                              fontSize: '11px', 
                              padding: '6px 12px', 
                              borderRadius: '6px', 
                              backgroundColor: '#2563eb', 
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            🆕 Create New
                          </button>
                          {st?.selection && (
                            <button 
                              onClick={() => clear('player', raw)} 
                              style={{
                                fontSize: '11px', 
                                padding: '6px 12px', 
                                borderRadius: '6px', 
                                backgroundColor: 'var(--button-bg)', 
                                color: 'var(--text-tertiary)',
                                border: '1px solid var(--border-secondary)',
                                cursor: 'pointer'
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {playerNames.length === 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)', 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: '20px'
                    }}>
                      No players listed on this card
                    </div>
                  )}
                </div>
              </div>

              {/* Team Resolution */}
              <div>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  margin: '0 0 12px 0',
                  color: 'var(--text-tertiary)'
                }}>
                  🏟️ Team Resolution
                </h4>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px', 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  padding: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '8px'
                }}>
                  {teamNames.map(raw => {
                    const st = teams[raw]
                    const candidates = groups.team_candidates[raw] || []
                    const unresolved = !st?.selection
                    return (
                      <div key={raw} style={{ 
                        padding: '12px', 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-primary)', 
                        borderRadius: '8px' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{raw}</span>
                          {st?.selection && 'existingId' in st.selection && (
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '4px 8px', 
                              borderRadius: '12px', 
                              backgroundColor: '#059669', 
                              color: 'white', 
                              fontWeight: '500' 
                            }}>
                              ✅ Linked
                            </span>
                          )}
                          {st?.selection && 'create' in st.selection && (
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '4px 8px', 
                              borderRadius: '12px', 
                              backgroundColor: '#2563eb', 
                              color: 'white', 
                              fontWeight: '500' 
                            }}>
                              🆕 New
                            </span>
                          )}
                          {unresolved && (
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '4px 8px', 
                              borderRadius: '12px', 
                              backgroundColor: '#d97706', 
                              color: 'white', 
                              fontWeight: '500' 
                            }}>
                              ⚠️ Pending
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                          {candidates.slice(0,6).map((c: any) => {
                            const selected = st?.selection && 'existingId' in st.selection && st.selection.existingId === c.id
                            return (
                              <button 
                                key={c.id} 
                                onClick={() => select('team', raw, { kind:'team', raw, existingId: c.id, canonical: c.name })} 
                                style={{
                                  padding: '4px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '11px', 
                                  border: '1px solid var(--border-secondary)',
                                  backgroundColor: selected ? '#4f46e5' : 'var(--button-bg)',
                                  color: selected ? 'white' : 'var(--text-tertiary)',
                                  cursor: 'pointer'
                                }}
                              >
                                {c.name} <span style={{ opacity: 0.7 }}>({formatScore(c.score)})</span>
                              </button>
                            )
                          })}
                          {candidates.length === 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              No candidates
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => select('team', raw, { kind:'team', raw, create: raw })} 
                            style={{
                              fontSize: '11px', 
                              padding: '6px 12px', 
                              borderRadius: '6px', 
                              backgroundColor: '#2563eb', 
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            🆕 Create New
                          </button>
                          {st?.selection && (
                            <button 
                              onClick={() => clear('team', raw)} 
                              style={{
                                fontSize: '11px', 
                                padding: '6px 12px', 
                                borderRadius: '6px', 
                                backgroundColor: 'var(--button-bg)', 
                                color: 'var(--text-tertiary)',
                                border: '1px solid var(--border-secondary)',
                                cursor: 'pointer'
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {teamNames.length === 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)', 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: '20px'
                    }}>
                      No teams listed on this card
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card-edit-modal-footer">
          <button
            onClick={onClose}
            className="card-edit-modal-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="card-edit-modal-save-button"
          >
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// Parallel Edit Modal
interface ParallelModalProps {
  cardType: string
  parallels: ImportParallelRef[]
  onSave: (parallels: ImportParallelRef[]) => void
  onClose: () => void
}

const ParallelEditModal = ({ cardType, parallels, onSave, onClose }: ParallelModalProps) => {
  const [localParallels, setLocalParallels] = useState<ImportParallelRef[]>(parallels)

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  useEffect(() => {
    setLocalParallels(parallels)
  }, [parallels])

  const addParallel = () => {
    const newParallel = { name: '', print_run: null, original_print_run_text: null }
    setLocalParallels([...localParallels, newParallel])
  }

  const updateParallel = (index: number, field: keyof ImportParallelRef, value: any) => {
    const updated = [...localParallels]
    updated[index] = { ...updated[index], [field]: value }
    setLocalParallels(updated)
  }

  const removeParallel = (index: number) => {
    setLocalParallels(localParallels.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave(localParallels)
    onClose()
  }

  const handleCancel = () => {
    setLocalParallels(parallels)
    onClose()
  }

  return (
    <div className="card-edit-modal-backdrop">
      <div className="card-edit-modal-container">
        {/* Header */}
        <div className="card-edit-modal-header">
          <h2 className="card-edit-modal-title">
            ⚡ Edit Parallels - {cardType}
          </h2>
          <button
            onClick={handleCancel}
            className="card-edit-modal-close-button"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="card-edit-modal-content">
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-4">
              Parallels defined here will be applied to all cards of type "{cardType}". 
              Common examples: Refractor, Gold, Prizm, etc.
            </p>
            
            <button
              onClick={addParallel}
              className="card-edit-modal-add-button card-edit-modal-add-parallel"
            >
              + Add Parallel
            </button>
          </div>

          <div className="card-edit-modal-player-list" style={{ maxHeight: '300px' }}>
            {localParallels.map((parallel, index) => (
              <div key={index} className="card-edit-modal-parallel-row">
                <input
                  placeholder="Parallel name (e.g., Refractor, Gold)"
                  value={parallel.name}
                  onChange={(e) => updateParallel(index, 'name', e.target.value)}
                  className="card-edit-modal-player-input card-edit-modal-parallel-name"
                />
                <input
                  type="number"
                  placeholder="Print run (optional)"
                  value={parallel.print_run || ''}
                  onChange={(e) => updateParallel(index, 'print_run', e.target.value ? parseInt(e.target.value) : null)}
                  className="card-edit-modal-player-input card-edit-modal-parallel-print-run"
                />
                <button
                  onClick={() => removeParallel(index)}
                  className="card-edit-modal-remove-button"
                >
                  ✕
                </button>
              </div>
            ))}
            {localParallels.length === 0 && (
              <div className="card-edit-modal-empty-state">
                No parallels defined for this card type
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="card-edit-modal-footer">
          <button
            onClick={handleCancel}
            className="card-edit-modal-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="card-edit-modal-save-button"
          >
            ⚡ Save Parallels
          </button>
        </div>
      </div>
    </div>
  )
}

// Card Type Section Component - Handles one card type with pagination
interface CardTypeSectionProps {
  batchId: number
  cardTypeInfo: CardTypeInfo
  groups: any
  onCardEdit: (row: CardRow) => void
  onParallelEdit: (cardType: string) => void
  cardEdits: Record<number, CardEditPayload>
  isCollapsed: boolean
  onToggleCollapse: () => void
  // Bulk selection props
  selectedCards: Set<number>
  onCardSelect: (rowId: number, checked: boolean, cardRow?: CardRow) => void
  onSelectAll: (rows: CardRow[], checked: boolean) => void
  onBulkToggle: (field: 'is_rookie' | 'is_first' | 'is_autograph', value: boolean) => void
  onMergeCards: () => void
  onSplitCard: (row: CardRow) => void
  bulkEditPending: boolean
  mergeCardsPending: boolean
  onDeleteSection: (cardType: string) => void
  deleteSectionPending: boolean
}

const CardTypeSection = ({ 
  batchId, 
  cardTypeInfo, 
  groups, 
  onCardEdit, 
  onParallelEdit,
  cardEdits,
  isCollapsed,
  onToggleCollapse,
  selectedCards,
  onCardSelect,
  onSelectAll,
  onBulkToggle,
  onMergeCards,
  onSplitCard,
  bulkEditPending,
  mergeCardsPending,
  onDeleteSection,
  deleteSectionPending
}: CardTypeSectionProps) => {
  const cardType = cardTypeInfo.card_type || 'Unknown Card Type'
  const [page, setPage] = useState(1)
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false)
  const perPage = 100
  const { players, teams, select } = useImportResolutionStore()
  const [autoThreshold] = useState(98)

  // Query for this card type's rows
  const rowsQuery = useQuery({
    queryKey: ['import', 'batch', batchId, 'rows', cardType, page, showUnresolvedOnly ? 'unresolved' : 'all'],
    queryFn: () => importService.getBatchRows(batchId, {
      page,
      perPage,
      cardType,
      ...(showUnresolvedOnly && { resolutionStatus: 'unresolved' })
    }),
    enabled: !isCollapsed
  })

  const rows = rowsQuery.data?.rows || []
  const pagination = rowsQuery.data?.pagination

  const approveCardRow = (row: CardRow) => {
    const store = useImportResolutionStore.getState()
    const playerNames = Array.from(new Set((row.data.players||[]).map(p=>p.name).filter(Boolean)))
    const teamNames = Array.from(new Set((row.data.players||[]).map(p=>p.team_name).filter(Boolean)))
    
    // Resolve players
    playerNames.forEach(raw => {
      if (!store.players[raw]?.selection) {
        const candidates = groups?.player_candidates?.[raw] || []
        const best = candidates.slice().sort((a: any, b: any) => b.score - a.score)[0]
        if (best && best.score >= autoThreshold) {
          store.select('player', raw, { kind:'player', raw, existingId: best.id, canonical: best.name })
        } else {
          store.select('player', raw, { kind:'player', raw, create: raw })
        }
      }
    })
    
    // Resolve teams
    teamNames.forEach(raw => {
      if (!store.teams[raw]?.selection) {
        const candidates = groups?.team_candidates?.[raw] || []
        const best = candidates.slice().sort((a: any, b: any) => b.score - a.score)[0]
        if (best && best.score >= autoThreshold) {
          store.select('team', raw, { kind:'team', raw, existingId: best.id, canonical: best.name })
        } else {
          store.select('team', raw, { kind:'team', raw, create: raw })
        }
      }
    })
  }

  const approveAllInSection = () => {
    rows.forEach(row => approveCardRow(row))
  }

  const autoResolveSection = () => {
    rows.forEach(row => {
      const playerNames = Array.from(new Set((row.data.players||[]).map(p=>p.name).filter(Boolean)))
      const teamNames = Array.from(new Set((row.data.players||[]).map(p=>p.team_name).filter(Boolean)))
      
      // Auto-resolve players with high confidence
      playerNames.forEach(raw => {
        if (!players[raw]?.selection) {
          const candidates = groups?.player_candidates?.[raw] || []
          const best = candidates.slice().sort((a: any, b: any) => b.score - a.score)[0]
          if (best && best.score >= autoThreshold) {
            select('player', raw, { kind:'player', raw, existingId: best.id, canonical: best.name })
          }
        }
      })
      
      // Auto-resolve teams with high confidence
      teamNames.forEach(raw => {
        if (!teams[raw]?.selection) {
          const candidates = groups?.team_candidates?.[raw] || []
          const best = candidates.slice().sort((a: any, b: any) => b.score - a.score)[0]
          if (best && best.score >= autoThreshold) {
            select('team', raw, { kind:'team', raw, existingId: best.id, canonical: best.name })
          }
        }
      })
    })
  }

  if (rowsQuery.isLoading && !isCollapsed) {
    return (
      <div className="collapsible-card">
        <div className="collapsible-card-header">
          <div className="collapsible-card-left">
            <button onClick={onToggleCollapse} className="collapsible-card-toggle">
              <span className="collapsible-card-toggle-icon">▸</span>
            </button>
            <div className="collapsible-card-title-row">
              <h2 className="collapsible-card-title">{cardType}</h2>
              <span className="collapsible-card-badge">Loading...</span>
            </div>
          </div>
        </div>
        {!isCollapsed && (
          <div className="collapsible-card-collapsible">
            <div className="collapsible-card-inner">
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
                <span className="ml-2 text-gray-400">Loading cards...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (rowsQuery.error) {
    return (
      <div className="collapsible-card">
        <div className="collapsible-card-header">
          <div className="collapsible-card-left">
            <button onClick={onToggleCollapse} className="collapsible-card-toggle">
              <span className="collapsible-card-toggle-icon">▸</span>
            </button>
            <div className="collapsible-card-title-row">
              <h2 className="collapsible-card-title">{cardType}</h2>
              <span className="collapsible-card-badge error">Error</span>
            </div>
          </div>
        </div>
        {!isCollapsed && (
          <div className="collapsible-card-collapsible">
            <div className="collapsible-card-inner">
              <div className="text-center py-8 text-red-400">
                Error loading cards for {cardType}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`collapsible-card ${!isCollapsed ? 'open' : ''}`}>
      <div className="collapsible-card-header">
        <div className="collapsible-card-left" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* Top row: Toggle button + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={onToggleCollapse}
              className="collapsible-card-toggle"
              aria-expanded={!isCollapsed}
            >
              <span className="collapsible-card-toggle-icon">▸</span>
            </button>
            <h2 className="collapsible-card-title">{cardType}</h2>
          </div>
          
          {/* Bottom row: Status badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: '32px' }}>
            <span className="collapsible-card-badge">
              {cardTypeInfo.total_cards || 0} cards
            </span>
            <span className={`collapsible-card-badge ${(cardTypeInfo.unresolved_cards || 0) > 0 ? 'unresolved' : 'resolved'}`}>
              {(cardTypeInfo.unresolved_cards || 0) > 0 ? `${cardTypeInfo.unresolved_cards} unresolved` : 'All resolved'}
            </span>
            <span className="collapsible-card-badge" style={{ 
              backgroundColor: (cardTypeInfo.resolution_percentage || 0) >= 100 ? '#059669' : 
                              (cardTypeInfo.resolution_percentage || 0) >= 75 ? '#d97706' : '#dc2626',
              color: 'white'
            }}>
              {(cardTypeInfo.resolution_percentage || 0).toFixed(0)}% complete
            </span>
            <span className="collapsible-card-badge parallels">
              {(cardTypeInfo.parallels || []).length} parallels
            </span>
          </div>
        </div>
        
        <div className="collapsible-card-actions" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <button
            onClick={() => onParallelEdit(cardType)}
            className="dashboard-card-button small gradient-indigo"
          >
            ⚡ Parallels
          </button>
          <button
            onClick={autoResolveSection}
            className="dashboard-card-button small gradient-blue"
            disabled={rows.length === 0}
            title="Auto-resolve entities with high confidence matches (≥98%)"
          >
            🎯 Auto Resolve
          </button>
          <button
            onClick={approveAllInSection}
            className="dashboard-card-button small gradient-emerald"
            disabled={rows.length === 0}
          >
            ✓ Approve All
          </button>
          <button
            onClick={() => onDeleteSection(cardType)}
            className="dashboard-card-button small"
            disabled={deleteSectionPending}
            title="Delete all cards in this section"
            style={{ 
              backgroundColor: '#dc2626',
              borderColor: '#dc2626',
              color: 'white'
            }}
          >
            {deleteSectionPending ? 'Deleting...' : '🗑️ Delete Section'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="collapsible-card-collapsible">
          <div className="collapsible-card-inner">
            {/* Section Controls */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={showUnresolvedOnly} 
                    onChange={e => {
                      setShowUnresolvedOnly(e.target.checked)
                      setPage(1) // Reset to first page when filter changes
                    }}
                    className="accent-blue-600" 
                  />
                  <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                    Show unresolved only
                  </span>
                </label>
                {pagination && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Page {pagination.page} of {pagination.total_pages} • {pagination.total_items} total
                  </span>
                )}
              </div>
              
              {pagination && pagination.total_pages > 1 && (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                />
              )}
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedCards.size > 0 && (
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  {selectedCards.size} card{selectedCards.size !== 1 ? 's' : ''} selected
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onBulkToggle('is_rookie', true)}
                    className="btn-small btn-edit"
                    disabled={bulkEditPending}
                  >
                    🌟 Mark Rookie
                  </button>
                  <button
                    onClick={() => onBulkToggle('is_rookie', false)}
                    className="btn-small btn-edit"
                    disabled={bulkEditPending}
                  >
                    ❌ Unmark Rookie
                  </button>
                  <button
                    onClick={() => onBulkToggle('is_first', true)}
                    className="btn-small btn-edit"
                    disabled={bulkEditPending}
                  >
                    🥇 Mark First
                  </button>
                  <button
                    onClick={() => onBulkToggle('is_first', false)}
                    className="btn-small btn-edit"
                    disabled={bulkEditPending}
                  >
                    ❌ Unmark First
                  </button>
                  <button
                    onClick={() => onBulkToggle('is_autograph', true)}
                    className="btn-small btn-edit"
                    disabled={bulkEditPending}
                  >
                    ✍️ Mark Auto
                  </button>
                  <button
                    onClick={() => onBulkToggle('is_autograph', false)}
                    className="btn-small btn-edit"
                    disabled={bulkEditPending}
                  >
                    ❌ Unmark Auto
                  </button>
                  <button
                    onClick={onMergeCards}
                    className="btn-small btn-edit"
                    disabled={selectedCards.size < 2 || mergeCardsPending}
                    style={{ backgroundColor: '#3b82f6' }}
                  >
                    🔗 Merge Cards
                  </button>
                </div>
              </div>
            )}

            {/* Cards Table */}
            {rows.length > 0 ? (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={rows.length > 0 && rows.every(row => selectedCards.has(row.row_id))}
                          onChange={(e) => onSelectAll(rows, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th>Card #</th>
                      <th>Player(s)</th>
                      <th>Team(s)</th>
                      <th>Attributes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => {
                      // Merge original data with any edits for display
                      const edit = cardEdits[row.row_id]
                      const base = edit ? {
                        ...row.data,
                        ...(edit.card_number !== undefined && { card_number: edit.card_number }),
                        ...(edit.card_type !== undefined && { card_type: edit.card_type }),
                        ...(edit.is_rookie !== undefined && { is_rookie: edit.is_rookie }),
                        ...(edit.is_first !== undefined && { is_first: edit.is_first }),
                        ...(edit.is_autograph !== undefined && { is_autograph: edit.is_autograph }),
                        ...(edit.players !== undefined && { players: edit.players })
                      } : row.data
                      
                      const playerNames = Array.from(new Set((base.players||[]).map(p => p.name).filter(Boolean)))
                      const teamNames = Array.from(new Set((base.players||[]).map(p => p.team_name).filter(Boolean)))
                      const unresolvedPlayers = playerNames.filter(n => !players[n]?.selection).length
                      const unresolvedTeams = teamNames.filter(n => !teams[n]?.selection).length
                      const totalUnresolved = unresolvedPlayers + unresolvedTeams
                      
                      return (
                        <tr key={row.row_id} className={cardEdits[row.row_id] ? 'edited-row' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedCards.has(row.row_id)}
                              onChange={(e) => onCardSelect(row.row_id, e.target.checked, row)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: '500' }}>
                              {base.card_number || row.row_index}
                            </div>
                            {(base.title || base.subset) && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {[base.title, base.subset].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </td>
                          <td>
                            {playerNames.length > 0 ? (
                              <div style={{ fontSize: '12px' }}>
                                {playerNames.slice(0,2).join(', ')}{playerNames.length > 2 && ` +${playerNames.length-2} more`}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '12px' }}>None</span>
                            )}
                          </td>
                          <td>
                            {teamNames.length > 0 ? (
                              <div style={{ fontSize: '12px' }}>
                                {teamNames.slice(0,2).join(', ')}{teamNames.length > 2 && ` +${teamNames.length-2} more`}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '12px' }}>None</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {base.is_rookie && (
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '10px', 
                                  backgroundColor: '#2563eb', 
                                  color: 'white' 
                                }}>Rookie</span>
                              )}
                              {base.is_first && (
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '10px', 
                                  backgroundColor: '#4f46e5', 
                                  color: 'white' 
                                }}>First</span>
                              )}
                              {base.is_autograph && (
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '10px', 
                                  backgroundColor: '#db2777', 
                                  color: 'white' 
                                }}>Auto</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {cardEdits[row.row_id] && (
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '10px', 
                                  backgroundColor: '#3b82f6', 
                                  color: 'white' 
                                }}>EDITED</span>
                              )}
                              {totalUnresolved > 0 ? (
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '10px', 
                                  backgroundColor: '#d97706', 
                                  color: 'white' 
                                }}>{totalUnresolved} unresolved</span>
                              ) : (
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '10px', 
                                  backgroundColor: '#059669', 
                                  color: 'white' 
                                }}>Resolved</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="admin-table-actions">
                              <button
                                onClick={() => approveCardRow(row)}
                                className="btn-small btn-edit"
                                title="Auto-approve with high-confidence matches"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => onCardEdit(row)}
                                className="btn-small btn-edit"
                                title="Edit card details and resolve entities"
                              >
                                Edit
                              </button>
                              {(base.players?.length || 0) > 1 && (
                                <button
                                  onClick={() => onSplitCard(row)}
                                  className="btn-small btn-edit"
                                  title="Split multi-player card into separate cards"
                                  style={{ backgroundColor: '#f59e0b' }}
                                >
                                  ✂️ Split
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                {showUnresolvedOnly ? 'No unresolved cards in this section' : 'No cards found'}
              </div>
            )}

            {/* Bottom Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: '20px',
                padding: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px'
              }}>
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export const ImportResolvePage = () => {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const idNum = Number(batchId)
  const { initialize, unresolvedCount, buildResolveRequest, setErrors, unresolvedByKind, cardEdits, setCardEdit, removeCardEdit } = useImportResolutionStore()
  const [activeRow, setActiveRow] = useState<CardRow | null>(null)
  const [cardTypeParallels, setCardTypeParallels] = useState<Record<string, ImportParallelRef[]>>({})
  const [parallelModalCardType, setParallelModalCardType] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Multi-select state
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set())
  const [selectedCardsData, setSelectedCardsData] = useState<CardRow[]>([])
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [splitCardRow, setSplitCardRow] = useState<CardRow | null>(null)
  const [showDeleteSectionConfirm, setShowDeleteSectionConfirm] = useState(false)
  const [deleteSectionCardType, setDeleteSectionCardType] = useState<string | null>(null)

  // Get the preview groups for metadata and candidates
  const groupsQuery = useQuery({ 
    queryKey: ['import','batch',idNum,'groups'], 
    queryFn: async () => {
      try {
        return await importService.getPreviewGroupsEnhanced(idNum)
      } catch {
        return await importService.getPreviewGroups(idNum)
      }
    }, 
    enabled: !!idNum 
  })

  // Get card types with metadata using the new dedicated endpoint
  const cardTypesQuery = useQuery({
    queryKey: ['import', 'batch', idNum, 'card-types'],
    queryFn: () => importService.getBatchCardTypes(idNum),
    enabled: !!idNum
  })

  const cardTypes = cardTypesQuery.data?.card_types || []

  useEffect(() => {
    if (groupsQuery.data) {
      initialize(idNum, groupsQuery.data.player_names, groupsQuery.data.team_names)
    }
  }, [groupsQuery.data, idNum, initialize])

  // Initialize card type parallels from the new card types endpoint
  useEffect(() => {
    if (cardTypesQuery.data?.card_types) {
      const initialParallels: Record<string, ImportParallelRef[]> = {}
      cardTypesQuery.data.card_types.forEach((ct: CardTypeInfo) => {
        initialParallels[ct.card_type] = ct.parallels || []
      })
      setCardTypeParallels(initialParallels)
    }
  }, [cardTypesQuery.data])

  // Legacy fallback for groups data
  useEffect(() => {
    const g: any = groupsQuery.data
    if (!g || cardTypesQuery.data) return // Skip if we have card types data
    
    if (Array.isArray(g.card_types) && g.card_types.length > 0) {
      const initialParallels: Record<string, ImportParallelRef[]> = {}
      g.card_types.forEach((ct: any) => {
        if (!ct?.name || !Array.isArray(ct?.parallels)) return
        initialParallels[ct.name] = ct.parallels.map((p: any) => ({
          name: p.name,
          print_run: p.print_run ?? null,
          original_print_run_text: p.original_print_run_text ?? null,
          odds: p.odds ?? null,
        }))
      })
      setCardTypeParallels(initialParallels)
      return
    }
    if (g?.parallels_by_card_type) {
      const initialParallels: Record<string, ImportParallelRef[]> = {}
      Object.entries(g.parallels_by_card_type as Record<string, any[]>).forEach(([cardType, parallelInfos]) => {
        initialParallels[cardType] = (parallelInfos || []).map((info: any) => ({
          name: info.name,
          print_run: info.print_run ?? null,
          original_print_run_text: info.original_print_run_text ?? null,
          odds: info.odds ?? null,
        }))
      })
      setCardTypeParallels(initialParallels)
    }
  }, [groupsQuery.data, cardTypesQuery.data])

  const resolveMutation = useMutation({
    mutationFn: async () => { 
      const body = buildResolveRequest()
      if (!body.players && !body.teams && !body.card_edits) throw new Error('No pending changes')
      return importService.resolve(idNum, body) 
    },
    onSuccess: () => { 
      const { players, teams } = useImportResolutionStore.getState()
      const dirtyPlayers = Object.values(players).filter(p=>p.dirty).map(p=>p.raw)
      const dirtyTeams = Object.values(teams).filter(t=>t.dirty).map(t=>t.raw)
      useImportResolutionStore.getState().markClean('player', dirtyPlayers)
      useImportResolutionStore.getState().markClean('team', dirtyTeams)
      // Invalidate all row queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'rows'] })
    }
  })

  const commitMutation = useMutation({
    mutationFn: () => importService.commit(idNum),
    onSuccess: () => { 
      alert('Commit successful')
      navigate('/admin/imports/batches')
    },
    onError: (e: any) => { 
      const msg = e.message||'Commit failed'
      if (/unresolved/i.test(msg)) { 
        const names = msg.match(/\[(.*?)\]/)?.[1]?.split(',').map((s: string)=>s.replace(/['"\s]/g,''))||[]
        setErrors('player', names)
        setErrors('team', names) 
      } 
      alert(msg) 
    }
  })

  const bulkEditMutation = useMutation({
    mutationFn: async (edits: any[]) => {
      return importService.bulkEditCards(idNum, edits)
    },
    onSuccess: () => {
      setSelectedCards(new Set())
      setSelectedCardsData([])
      // Invalidate all queries that start with ['import', 'batch', idNum, 'rows']
      queryClient.invalidateQueries({ 
        queryKey: ['import', 'batch', idNum, 'rows'],
        exact: false 
      })
      // Also invalidate card types data
      queryClient.invalidateQueries({ 
        queryKey: ['import', 'batch', idNum, 'card-types'] 
      })
    },
    onError: (e: any) => {
      alert(`Bulk edit failed: ${e.message}`)
    }
  })

  const mergeCardsMutation = useMutation({
    mutationFn: async (request: any) => {
      return importService.mergeCards(idNum, request)
    },
    onSuccess: () => {
      setSelectedCards(new Set())
      setSelectedCardsData([])
      setShowMergeModal(false)
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'rows'] })
    },
    onError: (e: any) => {
      alert(`Merge cards failed: ${e.message}`)
    }
  })

  const splitCardMutation = useMutation({
    mutationFn: async (request: any) => {
      return importService.splitCard(idNum, request)
    },
    onSuccess: () => {
      setShowSplitModal(false)
      setSplitCardRow(null)
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'rows'] })
    },
    onError: (e: any) => {
      alert(`Split card failed: ${e.message}`)
    }
  })

  const deleteSectionMutation = useMutation({
    mutationFn: async (cardType: string) => {
      return importService.deleteCardSection(idNum, cardType)
    },
    onSuccess: (data) => {
      setShowDeleteSectionConfirm(false)
      setDeleteSectionCardType(null)
      alert(`Successfully deleted ${data.deleted_count} cards from section`)
      // Clear selected cards since they might have been deleted
      setSelectedCards(new Set())
      setSelectedCardsData([])
      // Invalidate all related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'card-types'] })
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'rows'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'groups'] })
      // Force refetch to ensure immediate UI update
      queryClient.refetchQueries({ queryKey: ['import', 'batch', idNum, 'card-types'] })
    },
    onError: (e: any) => {
      alert(`Delete section failed: ${e.message}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => importService.deleteBatch(idNum),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import','pending-batches'] })
      navigate('/admin/imports/batches')
    },
    onError: (error) => {
      console.error('Delete failed:', error)
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  if (groupsQuery.isLoading || cardTypesQuery.isLoading) return (
    <div className="dashboard-container min-h-screen flex flex-col">
      <AppNavbar title="Resolve Import" subtitle="Loading batch…" />
      <div className="dashboard-main" style={{ paddingTop:'32px' }}>
        <div className="flex items-center justify-center h-64 flex-col gap-4 text-sm text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" aria-label="Loading spinner" />
          <span>Loading batch data…</span>
        </div>
      </div>
    </div>
  )

  if (groupsQuery.error || cardTypesQuery.error) return <div className="p-6 text-red-500 text-sm">Error loading batch</div>
  if (!groupsQuery.data || !cardTypesQuery.data) return <div className="p-6 text-gray-500 text-sm">No batch data found</div>

  const groups: any = groupsQuery.data
  const batchTotals = cardTypesQuery.data?.totals
  const unresolved = unresolvedCount()
  const playerUnresolved = unresolvedByKind('player')
  const teamUnresolved = unresolvedByKind('team')

  const toggleSection = (cardType: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [cardType]: !(prev[cardType] ?? true)
    }))
  }
  
  const updateCardTypeParallels = (cardType: string, parallels: ImportParallelRef[]) => {
    setCardTypeParallels(prev => ({
      ...prev,
      [cardType]: parallels
    }))
    
    // Apply these parallels to all cards of this type
    // Note: This would require a separate API call to bulk update cards
    // For now, we'll just update the local state
  }

  // Bulk action functions
  const handleBulkToggle = (field: 'is_rookie' | 'is_first' | 'is_autograph', value: boolean) => {
    if (selectedCards.size === 0) return
    
    const edits = Array.from(selectedCards).map(rowId => ({
      row_id: rowId,
      [field]: value
    }))
    
    bulkEditMutation.mutate(edits)
  }

  const handleSelectAll = (rows: CardRow[], checked: boolean) => {
    if (checked) {
      setSelectedCards(prev => {
        const newSelected = new Set(prev)
        rows.forEach(row => newSelected.add(row.row_id))
        return newSelected
      })
      setSelectedCardsData(prev => {
        const existingIds = new Set(prev.map(card => card.row_id))
        const newCards = rows.filter(row => !existingIds.has(row.row_id))
        return [...prev, ...newCards]
      })
    } else {
      setSelectedCards(prev => {
        const newSelected = new Set(prev)
        rows.forEach(row => newSelected.delete(row.row_id))
        return newSelected
      })
      const rowIds = new Set(rows.map(row => row.row_id))
      setSelectedCardsData(prev => prev.filter(card => !rowIds.has(card.row_id)))
    }
  }

  const handleCardSelect = (rowId: number, checked: boolean, cardRow?: CardRow) => {
    setSelectedCards(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(rowId)
      } else {
        newSelected.delete(rowId)
      }
      return newSelected
    })
    
    if (checked && cardRow) {
      setSelectedCardsData(prev => {
        const exists = prev.some(card => card.row_id === rowId)
        return exists ? prev : [...prev, cardRow]
      })
    } else {
      setSelectedCardsData(prev => prev.filter(card => card.row_id !== rowId))
    }
  }

  const handleMergeCards = () => {
    if (selectedCards.size < 2) {
      alert('Please select at least 2 cards to merge')
      return
    }
    setShowMergeModal(true)
  }

  const handleSplitCard = (row: CardRow) => {
    setSplitCardRow(row)
    setShowSplitModal(true)
  }

  const handleDeleteSection = (cardType: string) => {
    setDeleteSectionCardType(cardType)
    setShowDeleteSectionConfirm(true)
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Resolve Import" subtitle={`Batch ${idNum} • Paginated card resolution`} />
      <div className="dashboard-main" style={{ paddingTop:'32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {groups?.metadata?.brand || ''} {groups?.metadata?.set_name || ''} {groups?.metadata?.year || ''}
            </h2>
            {(resolveMutation.isPending || commitMutation.isPending || deleteMutation.isPending) && <div className="loading-spinner"></div>}
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {batchTotals ? (
                `${batchTotals.total_cards.toLocaleString()} cards • ${batchTotals.total_unresolved} unresolved • ${cardTypes.length} types`
              ) : (
                `${unresolved} unresolved • ${cardTypes.length} card types`
              )}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={()=>resolveMutation.mutate()} 
              disabled={resolveMutation.isPending} 
              className="btn-primary"
              style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
            >
              {resolveMutation.isPending ? 'Applying...' : 'Apply Changes'}
            </button>
            <button 
              onClick={()=>commitMutation.mutate()} 
              disabled={commitMutation.isPending || unresolved>0} 
              className="btn-primary"
              style={{ padding: '8px 16px', whiteSpace: 'nowrap', backgroundColor: unresolved > 0 ? 'var(--text-secondary)' : 'var(--accent-success)' }}
            >
              {commitMutation.isPending ? 'Committing...' : `Commit (${unresolved})`}
            </button>
            <button 
              onClick={()=>setShowDeleteConfirm(true)} 
              disabled={deleteMutation.isPending} 
              className="btn-primary"
              style={{ padding: '8px 16px', whiteSpace: 'nowrap', backgroundColor: 'var(--accent-error)', borderColor: 'var(--accent-error)' }}
            >
              Delete Batch
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Players: {playerUnresolved} unresolved</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Teams: {teamUnresolved} unresolved</span>
        </div>

        {/* Card Type Sections */}
        <div className="space-y-6">
          {cardTypes.filter(cardTypeInfo => (cardTypeInfo.total_cards || 0) > 0).map((cardTypeInfo: CardTypeInfo, index: number) => (
            <CardTypeSection
              key={cardTypeInfo.card_type || `card-type-${index}`}
              batchId={idNum}
              cardTypeInfo={cardTypeInfo}
              groups={groups}
              onCardEdit={setActiveRow}
              onParallelEdit={setParallelModalCardType}
              cardEdits={cardEdits}
              isCollapsed={collapsedSections[cardTypeInfo.card_type] ?? true}
              onToggleCollapse={() => toggleSection(cardTypeInfo.card_type)}
              selectedCards={selectedCards}
              onCardSelect={handleCardSelect}
              onSelectAll={handleSelectAll}
              onBulkToggle={handleBulkToggle}
              onMergeCards={handleMergeCards}
              onSplitCard={handleSplitCard}
              bulkEditPending={bulkEditMutation.isPending}
              mergeCardsPending={mergeCardsMutation.isPending}
              onDeleteSection={handleDeleteSection}
              deleteSectionPending={deleteSectionMutation.isPending}
            />
          ))}
          {cardTypes.filter(cardTypeInfo => (cardTypeInfo.total_cards || 0) > 0).length === 0 && (
            <div className="text-sm text-gray-400 text-center py-20 border border-dashed border-gray-700 rounded-lg">
              No card types found in this batch.
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {activeRow && (
          <CardEditModal
            row={activeRow}
            groups={groups}
            allRows={cardTypes.reduce((acc: CardRow[], ct: CardTypeInfo) => {
              // Get card types for dropdown options
              const mockRow: CardRow = {
                row_id: -1,
                row_index: 0,
                data: {
                  card_number: '',
                  card_type: ct.card_type,
                  title: '',
                  subset: '',
                  notes: '',
                  is_rookie: false,
                  is_first: false,
                  is_autograph: false,
                  players: [],
                  parallel_names: []
                },
                resolution_status: 'unresolved'
              }
              return [...acc, mockRow]
            }, [])}
            existingEdit={cardEdits[activeRow.row_id]}
            saveEdit={(edit) => { 
              if (edit) {
                setCardEdit(activeRow.row_id, edit)
              } else {
                removeCardEdit(activeRow.row_id)
              }
              setActiveRow(null)
              // Invalidate queries to refresh the data without full page reload
              queryClient.invalidateQueries({ 
                queryKey: ['import', 'batch', idNum, 'rows'] 
              })
            }}
            onClose={() => setActiveRow(null)}
          />
        )}

        {/* Parallel Modal */}
        {parallelModalCardType && (
          <ParallelEditModal
            cardType={parallelModalCardType}
            parallels={cardTypeParallels[parallelModalCardType] || []}
            onSave={(parallels) => updateCardTypeParallels(parallelModalCardType, parallels)}
            onClose={() => setParallelModalCardType(null)}
          />
        )}

        {/* Merge Cards Modal */}
        {showMergeModal && (
          <MergeCardsModal
            selectedCardIds={Array.from(selectedCards)}
            selectedCards={selectedCardsData}
            batchId={idNum}
            onClose={() => setShowMergeModal(false)}
            onMerge={(request) => mergeCardsMutation.mutate(request)}
            isPending={mergeCardsMutation.isPending}
          />
        )}

        {/* Split Card Modal */}
        {showSplitModal && splitCardRow && (
          <SplitCardModal
            cardRow={splitCardRow}
            batchId={idNum}
            onClose={() => {
              setShowSplitModal(false)
              setSplitCardRow(null)
            }}
            onSplit={(request) => splitCardMutation.mutate(request)}
            isPending={splitCardMutation.isPending}
          />
        )}

        {/* Delete Section Confirmation Modal */}
        {showDeleteSectionConfirm && deleteSectionCardType && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteSectionConfirm(false)
              setDeleteSectionCardType(null)
            }
          }}>
            <div className="modal-content">
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Delete Card Section
              </h2>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Are you sure you want to delete ALL cards in this section? This action cannot be undone.
                </p>
                
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  <div><strong>Card Type:</strong> {deleteSectionCardType}</div>
                  <div style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    All cards of this type will be permanently deleted
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    setShowDeleteSectionConfirm(false)
                    setDeleteSectionCardType(null)
                  }}
                  className="btn-secondary"
                  disabled={deleteSectionMutation.isPending}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteSectionMutation.mutate(deleteSectionCardType)}
                  className="btn-primary"
                  disabled={deleteSectionMutation.isPending}
                  style={{ 
                    backgroundColor: '#dc2626',
                    borderColor: '#dc2626'
                  }}
                >
                  {deleteSectionMutation.isPending ? 'Deleting...' : 'Delete Section'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Batch Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(false)
            }
          }}>
            <div className="modal-content">
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Delete Import Batch
              </h2>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Are you sure you want to delete this import batch? This action cannot be undone.
                </p>
                
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  <div><strong>{groups?.metadata?.brand} {groups?.metadata?.set_name}</strong></div>
                  <div style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {groups?.metadata?.year} • Batch #{idNum}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteMutation.mutate()}
                  className="btn-primary"
                  disabled={deleteMutation.isPending}
                  style={{ 
                    backgroundColor: '#dc2626',
                    borderColor: '#dc2626'
                  }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Batch'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
