import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { importService } from '../services/imports'
import { useImportResolutionStore } from '../stores/importResolution'
import type { Candidate, CardRow, CardEditPayload, ImportPlayerRef, ImportParallelRef } from '../types/imports'
import { AppNavbar } from '../components/ui/AppNavbar'
import '../components/CardEditModal.css'
import '../components/CollapsibleCard.css'

// Helper: parse card number for ordering
const parseCardNum = (val: string | null | undefined): number => {
  if (!val) return Number.MAX_SAFE_INTEGER
  const m = String(val).match(/\d+/)
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER
}

interface CardResolveProps { row: CardRow; existingEdit?: CardEditPayload; onApprove: (row: CardRow) => void; onEdit: (row: CardRow) => void }
const CardResolveCard = ({ row, existingEdit, onApprove, onEdit }: CardResolveProps) => {
  const base = row.data
  const resolutionStore = useImportResolutionStore()
  const playerNames = Array.from(new Set((base.players||[]).map(p => p.name).filter(Boolean)))
  const teamNames = Array.from(new Set((base.players||[]).map(p => p.team_name).filter(Boolean)))
  const unresolvedPlayers = playerNames.filter(n => !resolutionStore.players[n]?.selection).length
  const unresolvedTeams = teamNames.filter(n => !resolutionStore.teams[n]?.selection).length
  const totalUnresolved = unresolvedPlayers + unresolvedTeams
  const isRookie = base.is_rookie
  const isFirst = base.is_first
  const isAutograph = base.is_autograph
  const gradient = (()=>{ const ct = (base.card_type||'').toLowerCase(); if (ct.includes('auto')) return 'linear-gradient(135deg,#db2777,#7c3aed)'; if (ct.includes('rookie')) return 'linear-gradient(135deg,#2563eb,#4f46e5)'; if (ct.includes('parallel')) return 'linear-gradient(135deg,#059669,#10b981)'; return 'linear-gradient(135deg,#374151,#4b5563)'; })()
  return (
    <div className="dashboard-card hover:shadow-xl transition-all duration-300" style={{ padding:'24px', position:'relative' }}>
      <div className="flex items-start gap-6">
        <div className="dashboard-card-icon flex-shrink-0" style={{ background: gradient, width: '56px', height: '56px' }}>
          <span style={{ fontSize:'16px', fontWeight:700, color:'white' }}>{(row.data.card_number || row.row_index || '').toString().slice(0,3)}</span>
        </div>
        <div className="flex-1 min-w-0 space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="dashboard-card-title font-bold text-xl">#{row.data.card_number || row.row_index}</h3>
              {base.card_type && <span className="text-sm px-4 py-1.5 rounded-full bg-gray-700 text-gray-200 font-medium">{base.card_type}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {existingEdit && <span className="text-xs px-3 py-1 rounded-full bg-indigo-500 text-white font-medium">✏️ Edited</span>}
              {totalUnresolved>0 && <span className="text-xs px-3 py-1 rounded-full bg-amber-500 text-white font-medium">⚠️ {totalUnresolved} unresolved</span>}
              {totalUnresolved===0 && <span className="text-xs px-3 py-1 rounded-full bg-emerald-500 text-white font-medium">✅ Resolved</span>}
            </div>
          </div>

          {(base.title || base.subset) && (
            <div className="dashboard-card-description text-sm leading-relaxed" style={{ marginTop:'12px', marginBottom:'12px' }}>
              {[base.title, base.subset].filter(Boolean).join(' • ')}
            </div>
          )}

          <div className="space-y-2">
            {!!playerNames.length && (
              <div className="text-sm text-gray-400">
                <span className="text-gray-500 font-medium">Players:</span> 
                <span className="ml-2">{playerNames.slice(0,3).join(', ')}{playerNames.length>3 && ` +${playerNames.length-3} more`}</span>
              </div>
            )}
            {!!teamNames.length && (
              <div className="text-sm text-gray-400">
                <span className="text-gray-500 font-medium">Teams:</span> 
                <span className="ml-2">{teamNames.slice(0,3).join(', ')}{teamNames.length>3 && ` +${teamNames.length-3} more`}</span>
              </div>
            )}
          </div>

          {(isRookie || isFirst || isAutograph) && (
            <div className="flex flex-wrap gap-3">
              {isRookie && <span className="px-4 py-2 rounded-full bg-blue-500 text-white font-medium text-sm">🌟 Rookie</span>}
              {isFirst && <span className="px-4 py-2 rounded-full bg-indigo-500 text-white font-medium text-sm">🥇 First</span>}
              {isAutograph && <span className="px-4 py-2 rounded-full bg-pink-500 text-white font-medium text-sm">✍️ Auto</span>}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              onClick={()=>onApprove(row)} 
              className="dashboard-card-button flex-1"
              style={{ background:'linear-gradient(135deg, #059669, #10b981)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #047857, #059669)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #10b981)'
              }}
            >
              ✓ Approve
            </button>
            <button 
              onClick={() => onEdit(row)} 
              className="dashboard-card-button flex-1"
              style={{ background:'linear-gradient(135deg, #2563eb, #4f46e5)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8, #4338ca)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #4f46e5)'
              }}
            >
              ✏️ Edit
            </button>
          </div>
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
  const [title, setTitle] = useState(existingEdit?.title ?? base.title ?? '')
  const [subset, setSubset] = useState(existingEdit?.subset ?? base.subset ?? '')
  const [notes, setNotes] = useState(existingEdit?.notes ?? base.notes ?? '')
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
    if (title !== (base.title||'')) e.title = title || null; 
    if (subset !== (base.subset||'')) e.subset = subset || null; 
    if (notes !== (base.notes||'')) e.notes = notes || null; 
    if (cardType !== (base.card_type||'')) e.card_type = cardType || undefined; 
    if (isRookie !== base.is_rookie) e.is_rookie = isRookie; 
    if (isFirst !== base.is_first) e.is_first = isFirst; 
    if (isAutograph !== base.is_autograph) e.is_autograph = isAutograph; 
    if (JSON.stringify(cardPlayers) !== JSON.stringify(base.players)) e.players = cardPlayers;
    return Object.keys(e).length===1? null : e 
  }

  const save = () => { 
    console.log('Save clicked')
    saveEdit(buildEdit())
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

              <div className="card-edit-modal-field">
                <label className="card-edit-modal-label">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="card-edit-modal-input"
                />
              </div>

              <div className="card-edit-modal-field">
                <label className="card-edit-modal-label">
                  Subset
                </label>
                <input
                  type="text"
                  value={subset}
                  onChange={(e) => setSubset(e.target.value)}
                  className="card-edit-modal-input"
                />
              </div>

              <div className="card-edit-modal-field">
                <label className="card-edit-modal-label">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="card-edit-modal-textarea"
                />
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
                                {c.name} <span style={{ opacity: 0.7 }}>({c.score})</span>
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
                              🗑️ Clear
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
                                {c.name} <span style={{ opacity: 0.7 }}>({c.score})</span>
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
                              🗑️ Clear
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

export const ImportResolvePage = () => {
  const { batchId } = useParams<{ batchId: string }>()
  const idNum = Number(batchId)
  const { initialize, unresolvedCount, buildResolveRequest, markClean, setErrors, unresolvedByKind, autoSelectTop, setCardEdit, removeCardEdit, cardEdits, players, teams } = useImportResolutionStore()
  const [autoThreshold, setAutoThreshold] = useState(98)
  const [search, setSearch] = useState('')
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false)
  const [expandAll, setExpandAll] = useState(false)
  const [activeRow, setActiveRow] = useState<CardRow | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [cardTypeParallels, setCardTypeParallels] = useState<Record<string, ImportParallelRef[]>>({})
  const [parallelModalCardType, setParallelModalCardType] = useState<string | null>(null)

  const groupsQuery = useQuery({ queryKey: ['import','batch',idNum,'groups'], queryFn: () => importService.getPreviewGroups(idNum), enabled: !!idNum })
  const rowsQuery = useQuery({ queryKey: ['import','batch',idNum,'rows'], queryFn: () => importService.getCardRows(idNum), enabled: !!idNum })

  useEffect(()=>{ if (groupsQuery.data) initialize(idNum, groupsQuery.data.player_names, groupsQuery.data.team_names) }, [groupsQuery.data, idNum, initialize])

  // derive filtered rows
  const filteredByType = useMemo(()=>{
    if (!rowsQuery.data) return {}
    
    const rows = rowsQuery.data.rows.slice().sort((a,b) => parseCardNum(a.data.card_number) - parseCardNum(b.data.card_number))
    const byType: Record<string, CardRow[]> = {}
    rows.forEach(r => { const ct = r.data.card_type || 'Other'; (byType[ct] ||= []).push(r) })
    
    const term = search.trim().toLowerCase()
    const result: Record<string, CardRow[]> = {}
    Object.entries(byType).forEach(([ct, list]) => {
      const f = list.filter(r => {
        const num = r.data.card_number || ''
        const title = r.data.title || ''
        const subset = r.data.subset || ''
        const unresolvedPlayers = Array.from(new Set((r.data.players||[]).map(p=>p.name).filter(Boolean))).filter(n=>!players[n]?.selection).length
        const unresolvedTeams = Array.from(new Set((r.data.players||[]).map(p=>p.team_name).filter(Boolean))).filter(n=>!teams[n]?.selection).length
        const unresolvedTotal = unresolvedPlayers + unresolvedTeams
        if (showUnresolvedOnly && unresolvedTotal === 0) return false
        if (!term) return true
        return [num,title,subset,ct].some(v => v.toLowerCase().includes(term))
      })
      if (f.length) result[ct] = f
    })
    return result
  }, [rowsQuery.data, search, showUnresolvedOnly, players, teams])
  
  // Initialize card type parallels from the groups data
  useEffect(() => {
    if (groupsQuery.data?.parallels_by_card_type) {
      const initialParallels: Record<string, ImportParallelRef[]> = {}
      Object.entries(groupsQuery.data.parallels_by_card_type).forEach(([cardType, parallelInfos]) => {
        initialParallels[cardType] = parallelInfos.map(info => ({
          name: info.name,
          print_run: info.print_run,
          original_print_run_text: info.original_print_run_text
        }))
      })
      setCardTypeParallels(initialParallels)
    }
  }, [groupsQuery.data])

  const resolveMutation = useMutation({
    mutationFn: async () => { const body = buildResolveRequest(); if (!body.players && !body.teams && !body.card_edits) throw new Error('No pending changes'); return importService.resolve(idNum, body) },
    onSuccess: () => { const dirtyPlayers = Object.values(players).filter(p=>p.dirty).map(p=>p.raw); const dirtyTeams = Object.values(teams).filter(t=>t.dirty).map(t=>t.raw); markClean('player', dirtyPlayers); markClean('team', dirtyTeams) }
  })
  const commitMutation = useMutation({
    mutationFn: () => importService.commit(idNum),
    onSuccess: () => { alert('Commit successful'); },
    onError: (e: any) => { const msg = e.message||'Commit failed'; if (/unresolved/i.test(msg)) { const names = msg.match(/\[(.*?)\]/)?.[1]?.split(',').map((s: string)=>s.replace(/['"\s]/g,''))||[]; setErrors('player', names); setErrors('team', names) } alert(msg) }
  })

  if (groupsQuery.isLoading || rowsQuery.isLoading) return (
    <div className="dashboard-container min-h-screen flex flex-col">
      <AppNavbar title="Resolve Import" subtitle="Loading batch…" />
      <div className="dashboard-main" style={{ paddingTop:'32px' }}>
        <div className="flex items-center justify-center h-64 flex-col gap-4 text-sm text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" aria-label="Loading spinner" />
          <span>Loading data…</span>
        </div>
      </div>
    </div>
  )
  if (groupsQuery.error || rowsQuery.error) return <div className="p-6 text-red-500 text-sm">Error loading batch</div>
  if (!groupsQuery.data || !rowsQuery.data) return (
    <div className="dashboard-container min-h-screen flex flex-col">
      <AppNavbar title="Resolve Import" subtitle="Loading batch…" />
      <div className="dashboard-main" style={{ paddingTop:'32px' }}>
        <div className="flex items-center justify-center h-64 flex-col gap-4 text-sm text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" aria-label="Loading spinner" />
          <span>Loading data…</span>
        </div>
      </div>
    </div>
  )

  const groups = groupsQuery.data
  const rows = rowsQuery.data.rows.slice().sort((a,b) => parseCardNum(a.data.card_number) - parseCardNum(b.data.card_number))

  const unresolved = unresolvedCount()
  const playerUnresolved = unresolvedByKind('player')
  const teamUnresolved = unresolvedByKind('team')

  // auto expand effect
  useEffect(()=>{ if (expandAll) { /* no direct refs; handled by passing prop if needed */ } }, [expandAll])

  const approveCardRow = (row: CardRow, playerCandidates: Record<string, Candidate[]>, teamCandidates: Record<string, Candidate[]>) => {
    const store = useImportResolutionStore.getState()
    const playerNames = Array.from(new Set((row.data.players||[]).map(p=>p.name).filter(Boolean)))
    const teamNames = Array.from(new Set((row.data.players||[]).map(p=>p.team_name).filter(Boolean)))
    const threshold = autoThreshold
    
    // Resolve players - use existing if high confidence, otherwise create new
    playerNames.forEach(raw => {
      if (!store.players[raw]?.selection) {
        const best = (playerCandidates[raw]||[]).slice().sort((a,b)=>b.score-a.score)[0]
        if (best && best.score >= threshold) {
          store.select('player', raw, { kind:'player', raw, existingId: best.id, canonical: best.name })
        } else {
          // Create new player if no high-confidence match
          store.select('player', raw, { kind:'player', raw, create: raw })
        }
      }
    })
    
    // Resolve teams - use existing if high confidence, otherwise create new
    teamNames.forEach(raw => {
      if (!store.teams[raw]?.selection) {
        const best = (teamCandidates[raw]||[]).slice().sort((a,b)=>b.score-a.score)[0]
        if (best && best.score >= threshold) {
          store.select('team', raw, { kind:'team', raw, existingId: best.id, canonical: best.name })
        } else {
          // Create new team if no high-confidence match
          store.select('team', raw, { kind:'team', raw, create: raw })
        }
      }
    })
  }
  const onApprove = (row: CardRow) => approveCardRow(row, groups.player_candidates, groups.team_candidates)
  
  const approveAllInSection = (_cardType: string, rows: CardRow[]) => {
    rows.forEach(row => approveCardRow(row, groups.player_candidates, groups.team_candidates))
  }
  
  const toggleSection = (cardType: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [cardType]: !prev[cardType]
    }))
  }
  
  const updateCardTypeParallels = (cardType: string, parallels: ImportParallelRef[]) => {
    setCardTypeParallels(prev => ({
      ...prev,
      [cardType]: parallels
    }))
    
    // Apply these parallels to all cards of this type
    const cardsOfType = rows.filter(row => (row.data.card_type || 'Other') === cardType)
    cardsOfType.forEach(row => {
      setCardEdit(row.row_id, {
        row_id: row.row_id,
        parallels: parallels
      })
    })
  }
  const onEditRow = (row: CardRow) => {
    setActiveRow(row);
  }

  // Remove old SectionHeader; introduce unified collapsible card component wrapping header + content
  const CollapsibleCard = ({
    cardType,
    count,
    collapsed,
    onToggle,
    onEditParallels,
    onApproveAll,
    parallelsCount,
    editCount,
    unresolvedCount,
    children
  }: {
    cardType: string
    count: number
    collapsed: boolean
    onToggle: () => void
    onEditParallels: () => void
    onApproveAll: () => void
    parallelsCount: number
    editCount: number
    unresolvedCount: number
    children: React.ReactNode
  }) => {

    return (
      <div className={`collapsible-card ${!collapsed ? 'open' : ''}`}>
        <div className="collapsible-card-header">
          <div className="collapsible-card-left">
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={!collapsed}
              aria-controls={`section-${cardType}`}
              className="collapsible-card-toggle"
              title={collapsed ? `Expand ${cardType}` : `Collapse ${cardType}`}
            >
              <span className="collapsible-card-toggle-icon">▸</span>
            </button>
            <div className="collapsible-card-title-row">
              <h2 className="collapsible-card-title">{cardType}</h2>
              <span className="collapsible-card-badge">{count} cards</span>
              <span className="collapsible-card-badge edits">{editCount} edits</span>
              <span className={`collapsible-card-badge ${unresolvedCount>0 ? 'unresolved' : 'resolved'}`}>{unresolvedCount>0 ? `${unresolvedCount} unresolved` : 'All resolved'}</span>
              <span className="collapsible-card-badge parallels">{parallelsCount} parallels</span>
            </div>
          </div>
          <div className="collapsible-card-actions">
            <button
              onClick={onEditParallels}
              className="dashboard-card-button small gradient-indigo"
            >
              ⚡ Parallels
            </button>
            <button
              onClick={onApproveAll}
              className="dashboard-card-button small gradient-emerald"
            >
              ✓ Approve All
            </button>
          </div>
        </div>
        {!collapsed && (
          <div
            id={`section-${cardType}`}
            className="collapsible-card-collapsible"
            role="region"
            aria-label={`${cardType} cards`}
          >
            <div className="collapsible-card-inner">
              {children}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Resolve Import" subtitle={`Batch ${idNum} • Card-focused resolution`} />
      <div className="dashboard-main" style={{ paddingTop:'32px' }}>
        {/* Top Controls */}
        <div className="dashboard-card" style={{ padding:'20px', marginBottom:'32px' }}>
          {/* ...existing header area (brand, buttons)... */}
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <h1 className="dashboard-card-title" style={{ fontSize:'20px' }}>{groups.metadata.brand} {groups.metadata.set_name} {groups.metadata.year}</h1>
              <p className="dashboard-card-description" style={{ marginTop:'4px' }}>Resolve players, teams & metadata directly per card.</p>
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[11px]">
                <span>Auto ≥</span>
                <input type="number" min={50} max={100} value={autoThreshold} onChange={e=>setAutoThreshold(Number(e.target.value))} className="w-16 bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-[11px]" />
                <button onClick={()=>{ const p = autoSelectTop('player', groups.player_candidates, autoThreshold); const t = autoSelectTop('team', groups.team_candidates, autoThreshold); if(!p && !t) alert('No matches met threshold')}} className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px]">Run</button>
              </div>
              <button onClick={()=>resolveMutation.mutate()} disabled={resolveMutation.isPending} className="dashboard-card-button" style={{ background:'linear-gradient(135deg,#2563eb,#4f46e5)', opacity: resolveMutation.isPending ? .6:1 }}>{resolveMutation.isPending ? 'Applying…' : 'Apply Changes'}</button>
              <button onClick={()=>commitMutation.mutate()} disabled={commitMutation.isPending || unresolved>0} className="dashboard-card-button" style={{ background:'linear-gradient(135deg,#059669,#10b981)', opacity: (commitMutation.isPending || unresolved>0)? .6:1 }}>{commitMutation.isPending ? 'Committing…' : `Commit (${unresolved})`}</button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 items-center text-[11px]">
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-2 py-1">
              <input placeholder="Search card # / title / subset / type" value={search} onChange={e=>setSearch(e.target.value)} className="bg-transparent outline-none text-[11px] w-56" />
              {search && <button onClick={()=>setSearch('')} className="text-gray-400 hover:text-gray-200">✕</button>}
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showUnresolvedOnly} onChange={e=>setShowUnresolvedOnly(e.target.checked)} className="accent-blue-600" /><span>Unresolved only</span></label>
            <button onClick={()=>setExpandAll(v=>!v)} className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700">{expandAll ? 'Collapse All' : 'Expand All'}</button>
            <span className="text-gray-500">Players unresolved: {playerUnresolved}</span>
            <span className="text-gray-500">Teams unresolved: {teamUnresolved}</span>
            <span className="text-gray-500">Card edits: {Object.keys(cardEdits).length}</span>
          </div>
        </div>
        {/* Card Groups */}
        <div className="space-y-10">
          {Object.entries(filteredByType).map(([cardType, list]) => {
            const isCollapsed = collapsedSections[cardType]
            // compute per-section edit count
            const editCount = list.reduce((acc, r) => acc + (cardEdits[r.row_id] ? 1 : 0), 0)
            // compute unresolved entities across rows in this section
            const unresolvedCount = list.reduce((acc, r) => {
              const playerNames = Array.from(new Set((r.data.players||[]).map(p=>p.name).filter(Boolean)))
              const teamNames = Array.from(new Set((r.data.players||[]).map(p=>p.team_name).filter(Boolean)))
              const unresolvedPlayers = playerNames.filter(n => !players[n]?.selection).length
              const unresolvedTeams = teamNames.filter(n => !teams[n]?.selection).length
              return acc + unresolvedPlayers + unresolvedTeams
            }, 0)
            return (
              <CollapsibleCard
                key={cardType}
                cardType={cardType}
                count={list.length}
                collapsed={!!isCollapsed}
                parallelsCount={(cardTypeParallels[cardType] || []).length}
                editCount={editCount}
                unresolvedCount={unresolvedCount}
                onToggle={() => toggleSection(cardType)}
                onEditParallels={() => setParallelModalCardType(cardType)}
                onApproveAll={() => approveAllInSection(cardType, list)}
              >
                <div className="dashboard-grid">
                  {list.map(r => (
                    <CardResolveCard
                      key={r.row_id}
                      row={r}
                      existingEdit={cardEdits[r.row_id]}
                      onApprove={onApprove}
                      onEdit={onEditRow}
                    />
                  ))}
                </div>
              </CollapsibleCard>
            )
          })}
          {Object.keys(filteredByType).length===0 && (
            <div className="text-sm text-gray-400 text-center py-20 border border-dashed border-gray-700 rounded-lg">No cards match your filters.</div>
          )}
        </div>
        {activeRow && (
          <CardEditModal
            row={activeRow}
            groups={groups}
            allRows={rows}
            existingEdit={cardEdits[activeRow.row_id]}
            saveEdit={(edit)=>{ if (edit) setCardEdit(activeRow.row_id, edit); else removeCardEdit(activeRow.row_id) }}
            onClose={()=>setActiveRow(null)}
          />
        )}
        {parallelModalCardType && (
          <ParallelEditModal
            cardType={parallelModalCardType}
            parallels={cardTypeParallels[parallelModalCardType] || []}
            onSave={(parallels) => updateCardTypeParallels(parallelModalCardType, parallels)}
            onClose={() => setParallelModalCardType(null)}
          />
        )}
      </div>
    </div>
  )
}
