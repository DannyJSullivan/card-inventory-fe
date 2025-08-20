import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { importService } from '../services/imports'
import { useImportResolutionStore } from '../stores/importResolution'
import type { CardRow, CardEditPayload, ImportPlayerRef, ImportParallelRef, CardTypeInfo } from '../types/imports'
import { AppNavbar } from '../components/ui/AppNavbar'
import { Pagination } from '../components/ui/Pagination'
import { BulkEditModal } from '../components/BulkEditModal'
import { CardMergeModal } from '../components/CardMergeModal'
import { CardSplitModal } from '../components/CardSplitModal'
import '../components/CardEditModal.css'
import '../components/CollapsibleCard.css'

// Helper: format score without trailing zeros
const formatScore = (score: number): string => {
  return parseFloat(score.toFixed(2)).toString()
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

// Parallel Resolution Modal
interface ParallelResolutionModalProps {
  cardType: string
  onClose: () => void
  groups: any
  onSaveResolutions: () => Promise<void>
}

const ParallelResolutionModal = ({ cardType, onClose, groups, onSaveResolutions }: ParallelResolutionModalProps) => {
  const { parallels, select, clear } = useImportResolutionStore()
  
  // Filter parallels for this card type
  const cardTypeParallels = Object.entries(parallels).filter(([_, entry]) => entry.cardType === cardType)
  const unresolvedParallels = cardTypeParallels.filter(([_, entry]) => !entry.selection)
  const resolvedParallels = cardTypeParallels.filter(([_, entry]) => entry.selection)

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  const autoResolveAll = () => {
    const parallelCandidates = groups?.parallel_candidates || {}
    let resolved = 0
    
    unresolvedParallels.forEach(([key, entry]) => {
      // Candidates are grouped by card type, then filter by parallel name
      const cardTypeCandidates = parallelCandidates[entry.cardType] || []
      const candidates = cardTypeCandidates.filter((candidate: any) => 
        candidate.parallel_name === entry.parallelName
      )
      
      if (candidates.length > 0) {
        const bestCandidate = candidates.slice().sort((a: any, b: any) => b.score - a.score)[0]
        if (bestCandidate && bestCandidate.score >= 98) {
          select('parallel', key, { 
            kind: 'parallel', 
            cardType: entry.cardType, 
            parallelName: entry.parallelName, 
            existingId: bestCandidate.id, 
            canonical: bestCandidate.name 
          })
          resolved++
        }
      }
    })
    
    return resolved
  }

  return (
    <div className="card-edit-modal-backdrop" onClick={onClose}>
      <div className="card-edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="card-edit-modal-header">
          <h2 className="card-edit-modal-title">
            ⚡ Parallel Resolution - {cardType}
          </h2>
          <button onClick={onClose} className="card-edit-modal-close-button">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="card-edit-modal-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Status Summary */}
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              <span style={{ fontWeight: '500' }}>{cardTypeParallels.length}</span> parallels total • 
              <span style={{ color: '#059669', marginLeft: '8px' }}>{resolvedParallels.length} resolved</span> • 
              <span style={{ color: '#d97706', marginLeft: '8px' }}>{unresolvedParallels.length} unresolved</span>
            </div>
            {unresolvedParallels.length > 0 && (
              <button
                onClick={autoResolveAll}
                className="dashboard-card-button small gradient-blue"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                🎯 Auto Resolve All
              </button>
            )}
          </div>

          {/* Unresolved Parallels */}
          {unresolvedParallels.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--text-primary)', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ Unresolved Parallels ({unresolvedParallels.length})
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {unresolvedParallels.map(([key, entry]) => {
                  // Candidates are grouped by card type, then filter by parallel name
                  const cardTypeCandidates = groups?.parallel_candidates?.[entry.cardType] || []
                  const candidates = cardTypeCandidates.filter((candidate: any) => 
                    candidate.parallel_name === entry.parallelName
                  )
                  
                  console.log('Parallel resolution debug:', {
                    key,
                    parallelName: entry.parallelName,
                    cardType: entry.cardType,
                    candidatesFound: candidates.length,
                    availableCardTypes: Object.keys(groups?.parallel_candidates || {}),
                    cardTypeCandidatesCount: cardTypeCandidates.length,
                    candidates: candidates.slice(0, 3) // Show first 3 for debugging
                  })
                  
                  return (
                    <div key={key} style={{ 
                      padding: '16px', 
                      backgroundColor: 'var(--bg-card)', 
                      border: '1px solid var(--border-primary)', 
                      borderRadius: '8px' 
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        marginBottom: '12px' 
                      }}>
                        <div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: 'var(--text-primary)' 
                          }}>
                            {(() => {
                              // Look for print run info in card type parallels or candidates
                              const cardTypeParallels = groups?.parallels_by_card_type?.[entry.cardType] || []
                              const parallelInfo = cardTypeParallels.find((p: any) => p.name === entry.parallelName)
                              
                              // Also check if any candidate has original_text info
                              const firstCandidate = candidates[0]
                              const originalText = firstCandidate?.original_text || parallelInfo?.original_print_run_text
                              const printRun = parallelInfo?.print_run
                              
                              let displayName = entry.parallelName
                              
                              // Add print run to the name if available
                              if (originalText) {
                                // Use the original text which likely already has the format we want
                                displayName = `${entry.parallelName} ${originalText}`
                              } else if (printRun) {
                                displayName = `${entry.parallelName} /${printRun}`
                              }
                              
                              return displayName
                            })()}
                          </div>
                        </div>
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          backgroundColor: '#d97706', 
                          color: 'white', 
                          fontWeight: '500' 
                        }}>
                          ⚠️ Unresolved
                        </span>
                      </div>
                      
                      {/* Candidates */}
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap',
                        gap: '8px', 
                        marginBottom: '12px' 
                      }}>
                        {candidates.slice(0, 6).map((candidate: any) => {
                          // Score-based styling per backend spec
                          const score = candidate.score
                          let scoreColor, scoreIcon, confidenceText
                          
                          if (score >= 90) {
                            scoreColor = '#059669'  // Green - high confidence
                            scoreIcon = '✅'
                            confidenceText = 'High confidence'
                          } else if (score >= 80) {
                            scoreColor = '#d97706'  // Yellow - good match  
                            scoreIcon = '⚠️'
                            confidenceText = 'Good match'
                          } else if (score >= 75) {
                            scoreColor = '#f59e0b'  // Orange - review needed
                            scoreIcon = '⚠️'
                            confidenceText = 'Review needed'
                          } else {
                            scoreColor = '#dc2626'  // Red - low confidence
                            scoreIcon = '❌'
                            confidenceText = 'Low confidence'
                          }
                          
                          // Check for print run conflicts
                          const cardTypeParallels = groups?.parallels_by_card_type?.[entry.cardType] || []
                          const parallelInfo = cardTypeParallels.find((p: any) => p.name === entry.parallelName)
                          const importPrintRun = parallelInfo?.print_run
                          const candidatePrintRun = candidate.print_run
                          const printRunConflict = importPrintRun && candidatePrintRun && importPrintRun !== candidatePrintRun
                          
                          return (
                            <button 
                              key={candidate.id} 
                              onClick={() => select('parallel', key, { 
                                kind: 'parallel', 
                                cardType: entry.cardType, 
                                parallelName: entry.parallelName, 
                                existingId: candidate.id, 
                                canonical: candidate.name 
                              })} 
                              style={{
                                padding: '8px 12px', 
                                borderRadius: '6px', 
                                fontSize: '11px', 
                                border: `2px solid ${scoreColor}`,
                                backgroundColor: 'var(--button-bg)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = scoreColor
                                e.currentTarget.style.color = 'white'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--button-bg)'
                                e.currentTarget.style.color = 'var(--text-primary)'
                              }}
                              title={`${confidenceText} - ${formatScore(score)}%`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                                <span>{scoreIcon}</span>
                                <span style={{ fontWeight: '500' }}>
                                  {(() => {
                                    // Format candidate name with print run inline
                                    let displayName = candidate.name
                                    
                                    if (candidatePrintRun) {
                                      displayName = `${candidate.name} /${candidatePrintRun}`
                                      if (printRunConflict) {
                                        displayName += ' ⚠️'
                                      }
                                    }
                                    
                                    return displayName
                                  })()}
                                </span>
                                <span style={{ 
                                  opacity: 0.7, 
                                  marginLeft: 'auto',
                                  fontSize: '10px',
                                  fontWeight: '600'
                                }}>
                                  {formatScore(score)}%
                                </span>
                              </div>
                              
                              {/* Original text info if different from print run */}
                              {candidate.original_text && candidate.original_text !== `/${candidatePrintRun}` && (
                                <div style={{ 
                                  fontSize: '10px', 
                                  opacity: 0.7, 
                                  marginTop: '4px',
                                  fontStyle: 'italic'
                                }}>
                                  Original: "{candidate.original_text}"
                                </div>
                              )}
                            </button>
                          )
                        })}
                        {candidates.length === 0 && (
                          <span style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-secondary)', 
                            fontStyle: 'italic' 
                          }}>
                            No candidates found
                          </span>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => select('parallel', key, { 
                            kind: 'parallel', 
                            cardType: entry.cardType, 
                            parallelName: entry.parallelName, 
                            create: entry.parallelName 
                          })} 
                          style={{
                            fontSize: '11px', 
                            padding: '8px 12px', 
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
                        {candidates.length > 0 && (
                          <button 
                            onClick={() => {
                              const bestCandidate = candidates
                                .slice()
                                .sort((a: any, b: any) => b.score - a.score)[0]
                              if (bestCandidate && bestCandidate.score >= 75) {
                                select('parallel', key, { 
                                  kind: 'parallel', 
                                  cardType: entry.cardType, 
                                  parallelName: entry.parallelName, 
                                  existingId: bestCandidate.id, 
                                  canonical: bestCandidate.name 
                                })
                              }
                            }}
                            disabled={candidates.length === 0 || candidates[0]?.score < 75}
                            style={{
                              fontSize: '11px', 
                              padding: '8px 12px', 
                              borderRadius: '6px', 
                              backgroundColor: candidates.length > 0 && candidates[0]?.score >= 75 ? '#059669' : 'var(--button-bg)', 
                              color: candidates.length > 0 && candidates[0]?.score >= 75 ? 'white' : 'var(--text-tertiary)',
                              border: '1px solid var(--border-secondary)',
                              cursor: candidates.length > 0 && candidates[0]?.score >= 75 ? 'pointer' : 'not-allowed',
                              opacity: candidates.length > 0 && candidates[0]?.score >= 75 ? 1 : 0.6
                            }}
                            title={`Auto-select best match (${candidates[0] ? formatScore(candidates[0].score) : 'N/A'}%)`}
                          >
                            ✨ Best Match
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Resolved Parallels */}
          {resolvedParallels.length > 0 && (
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--text-primary)', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✅ Resolved Parallels ({resolvedParallels.length})
              </h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {resolvedParallels.map(([key, entry]) => (
                  <div key={key} style={{ 
                    padding: '12px', 
                    backgroundColor: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border-secondary)', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {entry.parallelName}
                      </div>
                      {entry.selection && 'canonical' in entry.selection && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          → {entry.selection.canonical}
                        </div>
                      )}
                      {entry.selection && 'create' in entry.selection && (
                        <div style={{ fontSize: '11px', color: '#2563eb' }}>
                          → Create: {entry.selection.create}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        backgroundColor: '#059669', 
                        color: 'white', 
                        fontWeight: '500' 
                      }}>
                        ✅ Resolved
                      </span>
                      <button
                        onClick={() => clear('parallel', key)}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--button-bg)',
                          border: '1px solid var(--border-secondary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                        title="Clear resolution"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cardTypeParallels.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              color: 'var(--text-secondary)', 
              fontSize: '14px',
              fontStyle: 'italic',
              padding: '40px 20px'
            }}>
              No parallels found for "{cardType}" card type.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="card-edit-modal-footer">
          <button
            onClick={onClose}
            className="card-edit-modal-cancel-button"
          >
            Close
          </button>
          <button
            onClick={async () => {
              try {
                await onSaveResolutions()
                onClose()
              } catch (error) {
                console.error('Failed to save resolutions:', error)
              }
            }}
            className="card-edit-modal-save-button"
            disabled={resolvedParallels.filter(([_, entry]) => entry.dirty).length === 0}
          >
            💾 Apply Changes
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
  onParallelResolve: (cardType: string) => void
  cardEdits: Record<number, CardEditPayload>
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSaveResolutions: () => Promise<void>
  // Bulk selection props
  selectedCards: Record<number, boolean>
  onToggleCardSelection: (cardId: number, cardData?: CardRow) => void
  onSelectAll: (cardRows: CardRow[]) => void
  onBulkEdit: () => void
  onMergeCards: () => void
  onSplitCard: (card: CardRow) => void
  onDeleteSection?: (cardType: string) => void
}

const CardTypeSection = ({ 
  batchId, 
  cardTypeInfo, 
  groups, 
  onCardEdit, 
  onParallelEdit,
  onParallelResolve,
  cardEdits,
  isCollapsed,
  onToggleCollapse,
  onSaveResolutions,
  selectedCards,
  onToggleCardSelection,
  onSelectAll,
  onBulkEdit,
  onMergeCards,
  onSplitCard,
  onDeleteSection
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

  // Calculate selection statistics for this section
  const sectionCardIds = rows.map(row => row.row_id)
  const selectedInSection = sectionCardIds.filter(id => selectedCards[id])
  const allSelectedInSection = sectionCardIds.length > 0 && selectedInSection.length === sectionCardIds.length

  const handleSelectAll = () => {
    if (allSelectedInSection) {
      // Deselect all in this section by calling the parent toggle function for each card
      sectionCardIds.forEach(id => {
        if (selectedCards[id]) {
          onToggleCardSelection(id)
        }
      })
    } else {
      // Select all in this section
      onSelectAll(rows)
    }
  }

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

  const approveAllInSection = async () => {
    // First, approve all rows locally
    rows.forEach(row => approveCardRow(row))
    
    // Then save the changes to the database
    try {
      await onSaveResolutions()
    } catch (error) {
      console.error('Failed to save approvals:', error)
      // Error will be shown in the UI via the mutation's error state
    }
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
        <div className="collapsible-card-left">
          <button
            onClick={onToggleCollapse}
            className="collapsible-card-toggle"
            aria-expanded={!isCollapsed}
          >
            <span className="collapsible-card-toggle-icon">▸</span>
          </button>
          <div className="collapsible-card-title-row">
            <h2 className="collapsible-card-title">{cardType}</h2>
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
        <div className="collapsible-card-actions">
          <button
            onClick={() => onParallelResolve(cardType)}
            className="dashboard-card-button small gradient-indigo"
          >
            ⚡ Resolve Parallels
          </button>
          <button
            onClick={() => onParallelEdit(cardType)}
            className="dashboard-card-button small gradient-indigo"
            style={{ opacity: 0.8, fontSize: '11px' }}
          >
            ✏️ Edit Parallels
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
          {onDeleteSection && (
            <button
              onClick={() => onDeleteSection(cardType)}
              className="dashboard-card-button small"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white'
              }}
              title="Delete all cards in this section"
            >
              🗑️ Delete Section
            </button>
          )}
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
              
              {/* Bulk Actions */}
              {selectedInSection.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedInSection.length} selected
                  </span>
                  <button
                    onClick={onBulkEdit}
                    className="btn-small"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none' }}
                  >
                    ✏️ Bulk Edit
                  </button>
                  {selectedInSection.length >= 2 && (
                    <button
                      onClick={onMergeCards}
                      className="btn-small"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none' }}
                    >
                      🔗 Merge
                    </button>
                  )}
                  {selectedInSection.length === 1 && (
                    <button
                      onClick={() => {
                        const selectedRow = rows.find(row => selectedCards[row.row_id])
                        if (selectedRow) onSplitCard(selectedRow)
                      }}
                      className="btn-small"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none' }}
                    >
                      ✂️ Split
                    </button>
                  )}
                </div>
              )}
              
              {pagination && pagination.total_pages > 1 && (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                />
              )}
            </div>

            {/* Cards Table */}
            {rows.length > 0 ? (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={allSelectedInSection}
                          onChange={handleSelectAll}
                          style={{ cursor: 'pointer' }}
                          title={allSelectedInSection ? 'Deselect all' : 'Select all'}
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
                              checked={selectedCards[row.row_id] || false}
                              onChange={() => onToggleCardSelection(row.row_id, row)}
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
  const { initialize, unresolvedCount, buildResolveRequest, setErrors, unresolvedByKind, cardEdits, setCardEdit, removeCardEdit, parallels, select, clear } = useImportResolutionStore()
  const [activeRow, setActiveRow] = useState<CardRow | null>(null)
  const [cardTypeParallels, setCardTypeParallels] = useState<Record<string, ImportParallelRef[]>>({})
  const [parallelModalCardType, setParallelModalCardType] = useState<string | null>(null)
  const [parallelResolutionModal, setParallelResolutionModal] = useState<string | null>(null) // cardType for parallel resolution modal
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Bulk operation state
  const [selectedCards, setSelectedCards] = useState<Record<number, boolean>>({})
  const [selectedCardData, setSelectedCardData] = useState<Record<number, CardRow>>({})
  const [bulkEditModal, setBulkEditModal] = useState(false)
  const [mergeModal, setMergeModal] = useState(false)
  const [splitModal, setSplitModal] = useState<CardRow | null>(null)

  // Helper functions for bulk selection
  const getSelectedCardRows = (): CardRow[] => {
    const selectedIds = Object.keys(selectedCards).filter(id => selectedCards[Number(id)]).map(Number)
    return selectedIds.map(id => selectedCardData[id]).filter(Boolean)
  }

  const toggleCardSelection = (cardId: number, cardData?: CardRow) => {
    setSelectedCards(prev => {
      const newState = { ...prev, [cardId]: !prev[cardId] }
      
      // Update card data cache
      if (newState[cardId] && cardData) {
        setSelectedCardData(prevData => ({ ...prevData, [cardId]: cardData }))
      } else if (!newState[cardId]) {
        setSelectedCardData(prevData => {
          const newData = { ...prevData }
          delete newData[cardId]
          return newData
        })
      }
      
      return newState
    })
  }

  const selectAllInType = (cardRows: CardRow[]) => {
    const newSelections = { ...selectedCards }
    const newCardData = { ...selectedCardData }
    
    cardRows.forEach(row => {
      newSelections[row.row_id] = true
      newCardData[row.row_id] = row
    })
    
    setSelectedCards(newSelections)
    setSelectedCardData(newCardData)
  }

  const clearAllSelections = () => {
    setSelectedCards({})
    setSelectedCardData({})
  }

  const getSelectedCount = (): number => {
    return Object.values(selectedCards).filter(Boolean).length
  }

  // Delete entire card type section
  const deleteSection = async (cardType: string) => {
    if (!confirm(`Are you sure you want to delete all "${cardType}" cards? This action cannot be undone.`)) {
      return
    }
    
    try {
      await importService.deleteCardSection(idNum, cardType)
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum] })
      // Clear any selections in the deleted section
      const sectionCardIds = Object.keys(selectedCardData)
        .filter(id => selectedCardData[Number(id)].data.card_type === cardType)
        .map(Number)
      
      if (sectionCardIds.length > 0) {
        const newSelections = { ...selectedCards }
        const newCardData = { ...selectedCardData }
        sectionCardIds.forEach(id => {
          delete newSelections[id]
          delete newCardData[id]
        })
        setSelectedCards(newSelections)
        setSelectedCardData(newCardData)
      }
    } catch (error) {
      console.error('Delete section failed:', error)
      alert(`Delete section failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

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
      // Extract parallel names for resolution
      const parallels: { cardType: string; parallelName: string }[] = []
      
      // Handle new grouped structure
      const groupedData = groupsQuery.data as any
      if (groupedData.parallel_groups) {
        Object.entries(groupedData.parallel_groups).forEach(([cardType, parallelList]) => {
          (parallelList as any[]).forEach((parallel: any) => {
            parallels.push({ cardType, parallelName: parallel.name })
          })
        })
      }
      
      // Handle legacy structure
      else if (groupedData.parallels_by_card_type) {
        Object.entries(groupedData.parallels_by_card_type).forEach(([cardType, parallelList]) => {
          (parallelList as any[]).forEach((parallel: any) => {
            parallels.push({ cardType, parallelName: parallel.name })
          })
        })
      }
      
      // Handle card types structure from cardTypesQuery fallback
      if (cardTypesQuery.data?.card_types) {
        cardTypesQuery.data.card_types.forEach((ct: CardTypeInfo) => {
          (ct.parallels || []).forEach((parallel) => {
            parallels.push({ cardType: ct.card_type, parallelName: parallel.name })
          })
        })
      }
      
      // Extract parallel names from parallel_candidates if available
      if (groupedData.parallel_candidates) {
        Object.entries(groupedData.parallel_candidates).forEach(([cardType, candidateList]) => {
          // Get unique parallel names from candidates
          const uniqueParallelNames = new Set()
          ;(candidateList as any[]).forEach((candidate: any) => {
            if (candidate.parallel_name && !uniqueParallelNames.has(candidate.parallel_name)) {
              uniqueParallelNames.add(candidate.parallel_name)
              parallels.push({ cardType, parallelName: candidate.parallel_name })
            }
          })
        })
      }
      
      console.log('Initialized parallels for resolution:', parallels)
      
      initialize(idNum, groupsQuery.data.player_names, groupsQuery.data.team_names, parallels)
    }
  }, [groupsQuery.data, cardTypesQuery.data, idNum, initialize])

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
      if (!body.players && !body.teams && !body.parallels && !body.card_edits) throw new Error('No pending changes')
      return importService.resolve(idNum, body) 
    },
    onSuccess: () => { 
      const { players, teams, parallels } = useImportResolutionStore.getState()
      const dirtyPlayers = Object.values(players).filter(p=>p.dirty).map(p=>p.raw)
      const dirtyTeams = Object.values(teams).filter(t=>t.dirty).map(t=>t.raw)
      const dirtyParallels = Object.values(parallels).filter(p=>p.dirty).map(p=>p.key)
      useImportResolutionStore.getState().markClean('player', dirtyPlayers)
      useImportResolutionStore.getState().markClean('team', dirtyTeams)
      useImportResolutionStore.getState().markClean('parallel', dirtyParallels)
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
  const parallelUnresolved = unresolvedByKind('parallel')

  const toggleSection = (cardType: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [cardType]: !(prev[cardType] ?? false)
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
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Parallels: {parallelUnresolved} unresolved</span>
          {getSelectedCount() > 0 && (
            <>
              <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                • {getSelectedCount()} cards selected
              </span>
              <button
                onClick={clearAllSelections}
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            </>
          )}
        </div>

        {/* Card Type Sections */}
        <div className="space-y-6">
          {cardTypes.map((cardTypeInfo: CardTypeInfo, index: number) => (
            <CardTypeSection
              key={cardTypeInfo.card_type || `card-type-${index}`}
              batchId={idNum}
              cardTypeInfo={cardTypeInfo}
              groups={groups}
              onCardEdit={setActiveRow}
              onParallelEdit={setParallelModalCardType}
              onParallelResolve={setParallelResolutionModal}
              cardEdits={cardEdits}
              isCollapsed={collapsedSections[cardTypeInfo.card_type] ?? false}
              onToggleCollapse={() => toggleSection(cardTypeInfo.card_type)}
              onSaveResolutions={async () => {
                await resolveMutation.mutateAsync()
                queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'card-types'] })
              }}
              selectedCards={selectedCards}
              onToggleCardSelection={toggleCardSelection}
              onSelectAll={selectAllInType}
              onBulkEdit={() => setBulkEditModal(true)}
              onMergeCards={() => setMergeModal(true)}
              onSplitCard={(card) => setSplitModal(card)}
              onDeleteSection={deleteSection}
            />
          ))}
          {cardTypes.length === 0 && (
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

        {/* Parallel Edit Modal */}
        {parallelModalCardType && (
          <ParallelEditModal
            cardType={parallelModalCardType}
            parallels={cardTypeParallels[parallelModalCardType] || []}
            onSave={(parallels) => updateCardTypeParallels(parallelModalCardType, parallels)}
            onClose={() => setParallelModalCardType(null)}
          />
        )}

        {/* Parallel Resolution Modal */}
        {parallelResolutionModal && (
          <ParallelResolutionModal
            cardType={parallelResolutionModal}
            groups={groups}
            onSaveResolutions={async () => {
              await resolveMutation.mutateAsync()
              queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'card-types'] })
            }}
            onClose={() => setParallelResolutionModal(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
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

        {/* Bulk Edit Modal */}
        {bulkEditModal && (
          <BulkEditModal
            batchId={idNum}
            selectedCards={getSelectedCardRows()}
            onClose={() => setBulkEditModal(false)}
            onSuccess={() => {
              // Clear selections after successful bulk edit
              setSelectedCards({})
            }}
          />
        )}

        {/* Card Merge Modal */}
        {mergeModal && (
          <CardMergeModal
            batchId={idNum}
            selectedCards={getSelectedCardRows()}
            onClose={() => setMergeModal(false)}
            onSuccess={() => {
              // Clear selections after successful merge
              setSelectedCards({})
            }}
          />
        )}

        {/* Card Split Modal */}
        {splitModal && (
          <CardSplitModal
            batchId={idNum}
            sourceCard={splitModal}
            onClose={() => setSplitModal(null)}
            onSuccess={() => {
              // Clear selections after successful split
              setSelectedCards({})
            }}
          />
        )}
      </div>
    </div>
  )
}
