import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { importService } from '../services/imports'
import { useImportResolutionStore } from '../stores/importResolution'
import type { Candidate, CardRow, CardEditPayload, ImportPlayerRef, ImportParallelRef, GroupedPreviewResponse } from '../types/imports'
import { AppNavbar } from '../components/ui/AppNavbar'
import '../components/CardEditModal.css'
import '../components/CollapsibleCard.css'

// Helper: parse card number for ordering
const parseCardNum = (val: string | null | undefined): number => {
  if (!val) return Number.MAX_SAFE_INTEGER
  const m = String(val).match(/\d+/)
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER
}

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

export const ImportResolvePage = () => {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const idNum = Number(batchId)
  const { initialize, unresolvedCount, buildResolveRequest, markClean, setErrors, unresolvedByKind, autoSelectTop, setCardEdit, removeCardEdit, cardEdits, players, teams } = useImportResolutionStore()
  const [autoThreshold, setAutoThreshold] = useState(98)
  const [search, setSearch] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false)
  const [activeRow, setActiveRow] = useState<CardRow | null>(null)
  const [cardTypeParallels, setCardTypeParallels] = useState<Record<string, ImportParallelRef[]>>({})
  const [parallelModalCardType, setParallelModalCardType] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [totalItems, setTotalItems] = useState(0)

  // Try enhanced preview groups first, fallback to legacy if not available
  const groupsQuery = useQuery({ 
    queryKey: ['import','batch',idNum,'groups'], 
    queryFn: async () => {
      try {
        return await importService.getPreviewGroupsEnhanced(idNum)
      } catch {
        // Fallback to legacy endpoint
        return await importService.getPreviewGroups(idNum)
      }
    }, 
    enabled: !!idNum 
  })
  const rowsQuery = useQuery({ queryKey: ['import','batch',idNum,'rows'], queryFn: () => importService.getCardRows(idNum), enabled: !!idNum })

  useEffect(()=>{ if (groupsQuery.data) initialize(idNum, groupsQuery.data.player_names, groupsQuery.data.team_names) }, [groupsQuery.data, idNum, initialize])

  // derive filtered rows grouped by card type
  const filteredByType = useMemo(() => {
    if (!rowsQuery.data) return {}
    
    const rows = rowsQuery.data.rows.slice().sort((a,b) => parseCardNum(a.data.card_number) - parseCardNum(b.data.card_number))
    const term = search.trim().toLowerCase()
    
    const filtered = rows.filter(r => {
      const num = r.data.card_number || ''
      const title = r.data.title || ''
      const subset = r.data.subset || ''
      const cardType = r.data.card_type || 'Other'
      const unresolvedPlayers = Array.from(new Set((r.data.players||[]).map(p=>p.name).filter(Boolean))).filter(n=>!players[n]?.selection).length
      const unresolvedTeams = Array.from(new Set((r.data.players||[]).map(p=>p.team_name).filter(Boolean))).filter(n=>!teams[n]?.selection).length
      const unresolvedTotal = unresolvedPlayers + unresolvedTeams
      if (showUnresolvedOnly && unresolvedTotal === 0) return false
      if (!term) return true
      return [num,title,subset,cardType].some(v => v.toLowerCase().includes(term))
    })
    
    // Group by card type
    const byType: Record<string, CardRow[]> = {}
    filtered.forEach(r => {
      const ct = r.data.card_type || 'Other'
      if (!byType[ct]) byType[ct] = []
      byType[ct].push(r)
    })
    
    // Update total items for info display
    const newTotalItems = filtered.length
    if (newTotalItems !== totalItems) {
      setTotalItems(newTotalItems)
    }
    
    return byType
  }, [rowsQuery.data, search, showUnresolvedOnly, players, teams, totalItems])
  
  // Initialize card type parallels from the groups data
  useEffect(() => {
    const g: any = groupsQuery.data
    if (!g) return
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

  const deleteMutation = useMutation({
    mutationFn: () => importService.deleteBatch(idNum),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import','pending-batches'] })
      navigate('/admin/imports')
    },
    onError: (error) => {
      console.error('Delete failed:', error)
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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

  const groups: any = groupsQuery.data
  const rows = rowsQuery.data?.rows?.slice().sort((a,b) => parseCardNum(a.data.card_number) - parseCardNum(b.data.card_number)) || []
  const playerCandidatesMap: Record<string, Candidate[]> = groups?.player_candidates || {}
  const teamCandidatesMap: Record<string, Candidate[]> = groups?.team_candidates || {}

  const unresolved = unresolvedCount()
  const playerUnresolved = unresolvedByKind('player')
  const teamUnresolved = unresolvedByKind('team')


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
  const onApprove = (row: CardRow) => approveCardRow(row, playerCandidatesMap, teamCandidatesMap)
  
  const approveAllInSection = (cardType: string, rows: CardRow[]) => {
    rows.forEach(row => approveCardRow(row, playerCandidatesMap, teamCandidatesMap))
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


  return (
    <div className="dashboard-container">
      <AppNavbar title="Resolve Import" subtitle={`Batch ${idNum} • Card-focused resolution`} />
      <div className="dashboard-main" style={{ paddingTop:'32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {groups?.metadata?.brand || ''} {groups?.metadata?.set_name || ''} {groups?.metadata?.year || ''}
            </h2>
            {(resolveMutation.isPending || commitMutation.isPending || deleteMutation.isPending) && <div className="loading-spinner"></div>}
            {totalItems > 0 && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {totalItems.toLocaleString()} cards • {unresolved} unresolved
              </span>
            )}
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ flex: '1', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search card #, title, subset, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Auto ≥</span>
              <input 
                type="number" 
                min={50} 
                max={100} 
                value={autoThreshold} 
                onChange={e=>setAutoThreshold(Number(e.target.value))} 
                style={{ width: '60px', padding: '2px 4px', border: '1px solid var(--border-secondary)', borderRadius: '4px', backgroundColor: 'var(--input-bg)', fontSize: '12px' }}
              />
              <button 
                onClick={()=>{ const p = autoSelectTop('player', playerCandidatesMap, autoThreshold); const t = autoSelectTop('team', teamCandidatesMap, autoThreshold); if(!p && !t) alert('No matches met threshold')}} 
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                Run
              </button>
            </div>
            {search && (
              <button 
                onClick={() => setSearch('')}
                style={{
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
        </div>
        
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showUnresolvedOnly} 
              onChange={e=>setShowUnresolvedOnly(e.target.checked)} 
              className="accent-blue-600" 
            />
            <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Show unresolved only</span>
          </label>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Players: {playerUnresolved} unresolved</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Teams: {teamUnresolved} unresolved</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Edits: {Object.keys(cardEdits).length}</span>
        </div>
        {/* Card Type Sections */}
        <div className="space-y-10">
          {Object.entries(filteredByType).map(([cardType, list]) => {
            const isCollapsed = collapsedSections[cardType]
            const editCount = list.reduce((acc, r) => acc + (cardEdits[r.row_id] ? 1 : 0), 0)
            const unresolvedCount = list.reduce((acc, r) => {
              const playerNames = Array.from(new Set((r.data.players||[]).map(p=>p.name).filter(Boolean)))
              const teamNames = Array.from(new Set((r.data.players||[]).map(p=>p.team_name).filter(Boolean)))
              const unresolvedPlayers = playerNames.filter(n => !players[n]?.selection).length
              const unresolvedTeams = teamNames.filter(n => !teams[n]?.selection).length
              return acc + unresolvedPlayers + unresolvedTeams
            }, 0)
            
            return (
              <div key={cardType} className={`collapsible-card ${!isCollapsed ? 'open' : ''}`}>
                <div className="collapsible-card-header">
                  <div className="collapsible-card-left">
                    <button
                      type="button"
                      onClick={() => toggleSection(cardType)}
                      aria-expanded={!isCollapsed}
                      aria-controls={`section-${cardType}`}
                      className="collapsible-card-toggle"
                      title={isCollapsed ? `Expand ${cardType}` : `Collapse ${cardType}`}
                    >
                      <span className="collapsible-card-toggle-icon">▸</span>
                    </button>
                    <div className="collapsible-card-title-row">
                      <h2 className="collapsible-card-title">{cardType}</h2>
                      <span className="collapsible-card-badge">{list.length} cards</span>
                      <span className="collapsible-card-badge edits">{editCount} edits</span>
                      <span className={`collapsible-card-badge ${unresolvedCount>0 ? 'unresolved' : 'resolved'}`}>
                        {unresolvedCount>0 ? `${unresolvedCount} unresolved` : 'All resolved'}
                      </span>
                      <span className="collapsible-card-badge parallels">
                        {(cardTypeParallels[cardType] || []).length} parallels
                      </span>
                    </div>
                  </div>
                  <div className="collapsible-card-actions">
                    <button
                      onClick={() => setParallelModalCardType(cardType)}
                      className="dashboard-card-button small gradient-indigo"
                    >
                      ⚡ Parallels
                    </button>
                    <button
                      onClick={() => approveAllInSection(cardType, list)}
                      className="dashboard-card-button small gradient-emerald"
                    >
                      ✓ Approve All
                    </button>
                  </div>
                </div>
                {!isCollapsed && (
                  <div
                    id={`section-${cardType}`}
                    className="collapsible-card-collapsible"
                    role="region"
                    aria-label={`${cardType} cards`}
                  >
                    <div className="collapsible-card-inner">
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Card #</th>
                              <th>Player(s)</th>
                              <th>Team(s)</th>
                              <th>Attributes</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map(row => {
                              const base = row.data
                              const playerNames = Array.from(new Set((base.players||[]).map(p => p.name).filter(Boolean)))
                              const teamNames = Array.from(new Set((base.players||[]).map(p => p.team_name).filter(Boolean)))
                              const unresolvedPlayers = playerNames.filter(n => !players[n]?.selection).length
                              const unresolvedTeams = teamNames.filter(n => !teams[n]?.selection).length
                              const totalUnresolved = unresolvedPlayers + unresolvedTeams
                              const existingEdit = cardEdits[row.row_id]
                              
                              return (
                                <tr key={row.row_id}>
                                  <td>
                                    <div style={{ fontWeight: '500' }}>{base.card_number || row.row_index}</div>
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
                                      {existingEdit && (
                                        <span style={{ 
                                          fontSize: '10px', 
                                          padding: '2px 6px', 
                                          borderRadius: '10px', 
                                          backgroundColor: '#4f46e5', 
                                          color: 'white' 
                                        }}>Edited</span>
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
                                        onClick={() => onApprove(row)}
                                        className="btn-small btn-edit"
                                        title="Auto-approve with high-confidence matches"
                                      >
                                        ✓ Approve
                                      </button>
                                      <button
                                        onClick={() => setActiveRow(row)}
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
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {Object.keys(filteredByType).length === 0 && (
            <div className="text-sm text-gray-400 text-center py-20 border border-dashed border-gray-700 rounded-lg">
              No cards match your filters.
            </div>
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
                  <div style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {rows?.length || 0} cards • {unresolved} unresolved
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
