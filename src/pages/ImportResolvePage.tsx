import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { importService } from '../services/imports'
import { useImportResolutionStore } from '../stores/importResolution'
import type { CardRow, CardEditPayload, ImportPlayerRef, CardTypeInfo, Candidate } from '../types/imports'
import { AppNavbar } from '../components/ui/AppNavbar'
import { Pagination } from '../components/ui/Pagination'
import '../components/CardEditModal.css'
import '../components/CollapsibleCard.css'

// Helper: format score without trailing zeros
const formatScore = (score: number): string => {
  return parseFloat(score.toFixed(2)).toString()
}

// Helper: format parallel name with print run (e.g., "Sky Blue /499")
const formatParallelName = (name: string, printRun?: number | null): string => {
  if (printRun) {
    return `${name} /${printRun}`
  }
  return name
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

const ParallelResolutionModal = ({ cardType, groups, onSave, onClose }: { cardType: string; groups: any; onSave: () => void; onClose: () => void }) => {
  const { parallels, select, clear } = useImportResolutionStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Candidate[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchingFor, setSearchingFor] = useState<string | null>(null)
  
  // Editing state for creating new parallels
  const [editingParallel, setEditingParallel] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrintRun, setEditPrintRun] = useState<string>('')
  
  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  // Get parallels for this specific card type
  const cardTypeParallels = Object.values(parallels).filter(p => p.cardType === cardType)
  const candidates = groups?.parallel_candidates?.[cardType] || []
  
  // Get the original parallel data with print runs from groups
  const originalParallels = groups?.parallel_groups?.[cardType] || []
  

  // Search functionality
  const performSearch = async (query: string, printRun?: number | null) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    setSearchingFor(query)
    try {
      const results = await importService.searchParallelCandidates(query, printRun)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
      setSearchingFor(null)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        performSearch(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSave = () => {
    onSave()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  // Editing functions for creating new parallels
  const startEditing = (parallelKey: string, originalName: string, originalPrintRun?: number | null) => {
    setEditingParallel(parallelKey)
    setEditName(originalName)
    setEditPrintRun(originalPrintRun ? String(originalPrintRun) : '')
  }

  const cancelEditing = () => {
    setEditingParallel(null)
    setEditName('')
    setEditPrintRun('')
  }

  const saveEditing = (parallelKey: string, parallelName: string) => {
    const finalName = editName.trim() || parallelName
    const finalPrintRun = editPrintRun.trim() ? parseInt(editPrintRun) : null
    const formattedName = formatParallelName(finalName, finalPrintRun)
    
    select('parallel', parallelKey, {
      kind: 'parallel',
      cardType,
      parallelName,
      create: formattedName
    })
    
    cancelEditing()
  }

  return (
    <div className="card-edit-modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) {
        handleCancel()
      }
    }}>
      <div className="card-edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="card-edit-modal-header">
          <h2 className="card-edit-modal-title">
            🎯 Resolve Parallels - {cardType}
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
              Resolve each parallel for "{cardType}" to existing parallel types or create new ones.
            </p>
            
            {/* Search Input */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="🔍 Search for parallel types (e.g., Refractor, Gold, etc.)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-secondary)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
              {isSearching && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Searching for "{searchingFor}"...
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '6px',
                border: '1px solid var(--border-primary)'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                  Search Results (click to apply to the first unresolved parallel):
                </h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {searchResults.map((result, index) => {
                    // Temporary: Backend may not have print_run field yet, so fallback to matching original
                    const matchingOriginal = originalParallels.find((op: any) => op.name === result.name)
                    const printRun = result.print_run || matchingOriginal?.print_run || null
                    const resultName = formatParallelName(result.name, printRun)
                    
                    return (
                      <button
                        key={`search-${result.id}-${index}-${result.name}`}
                        onClick={() => {
                          // For search results, we'll apply to the first unresolved parallel
                          const firstUnresolved = cardTypeParallels.find(p => !p.selection)
                          if (firstUnresolved) {
                            select('parallel', firstUnresolved.key, {
                              kind: 'parallel',
                              cardType,
                              parallelName: firstUnresolved.parallelName,
                              existingId: result.id,
                              canonical: resultName
                            })
                            // Clear search to show the resolution
                            setSearchTerm('')
                            setSearchResults([])
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          border: '1px solid var(--border-secondary)',
                          backgroundColor: 'var(--button-bg)',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer'
                        }}
                      >
                        {resultName} <span style={{ opacity: 0.7 }}>({formatScore(result.score)})</span>
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Or scroll down to apply to a specific parallel manually.
                </div>
              </div>
            )}
          </div>

          <div className="card-edit-modal-player-list" style={{ maxHeight: '400px' }}>
            {cardTypeParallels.map((parallel) => {
              const resolved = !!parallel.selection
              
              // Find the original parallel data to get print run
              const originalParallel = originalParallels.find((op: any) => op.name === parallel.parallelName)
              const printRun = originalParallel?.print_run
              
              return (
                <div key={parallel.key} style={{
                  padding: '16px',
                  marginBottom: '12px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: `1px solid ${resolved ? 'var(--accent-success)' : 'var(--border-secondary)'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        margin: '0 0 4px 0',
                        color: 'var(--text-primary)'
                      }}>
                        {formatParallelName(parallel.parallelName, printRun)}
                      </h4>
                      {resolved && parallel.selection && (
                        <span style={{ 
                          fontSize: '12px',
                          color: 'var(--accent-success)',
                          fontWeight: '500'
                        }}>
                          ✅ Resolved to: {'existingId' in parallel.selection ? parallel.selection.canonical : parallel.selection.create}
                        </span>
                      )}
                    </div>
                    {resolved && (
                      <button
                        onClick={() => clear('parallel', parallel.key)}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          backgroundColor: 'var(--button-bg)',
                          color: 'var(--text-tertiary)',
                          border: '1px solid var(--border-secondary)',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {!resolved && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {candidates
                          .sort((a: Candidate, b: Candidate) => b.score - a.score) // Sort by highest score first
                          .map((candidate: Candidate, index: number) => {
                            // Temporary: Get print run from original parallels until backend fully implements print_run field
                            const matchingOriginal = originalParallels.find((op: any) => op.name === candidate.name)
                            const printRun = candidate.print_run || matchingOriginal?.print_run || null
                            const candidateName = formatParallelName(candidate.name, printRun)
                            
                            return (
                              <button
                                key={`${candidate.id}-${index}-${parallel.key}`}
                                onClick={() => select('parallel', parallel.key, {
                                  kind: 'parallel',
                                  cardType,
                                  parallelName: parallel.parallelName,
                                  existingId: candidate.id,
                                  canonical: candidateName
                                })}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  border: '1px solid var(--border-secondary)',
                                  backgroundColor: 'var(--button-bg)',
                                  color: 'var(--text-tertiary)',
                                  cursor: 'pointer'
                                }}
                              >
                                {candidateName} <span style={{ opacity: 0.7 }}>({formatScore(candidate.score)})</span>
                              </button>
                            )
                          })}
                        {candidates.length === 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No matching parallel types found
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            // Search for better matches with print run
                            performSearch(parallel.parallelName, printRun)
                            setSearchTerm(parallel.parallelName)
                          }}
                          style={{
                            fontSize: '11px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--accent-info)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          🔍 Search Better Matches
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {editingParallel === parallel.key ? (
                          // Editing form
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder="Parallel name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-secondary)',
                                  backgroundColor: 'var(--bg-card)',
                                  color: 'var(--text-primary)',
                                  fontSize: '12px'
                                }}
                              />
                              <input
                                type="number"
                                placeholder="Print run"
                                value={editPrintRun}
                                onChange={(e) => setEditPrintRun(e.target.value)}
                                style={{
                                  width: '80px',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-secondary)',
                                  backgroundColor: 'var(--bg-card)',
                                  color: 'var(--text-primary)',
                                  fontSize: '12px'
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => saveEditing(parallel.key, parallel.parallelName)}
                                style={{
                                  fontSize: '11px',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  backgroundColor: '#22c55e',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: '500'
                                }}
                              >
                                ✅ Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                style={{
                                  fontSize: '11px',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--button-bg)',
                                  color: 'var(--text-tertiary)',
                                  border: '1px solid var(--border-secondary)',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Create New button
                          <button
                            onClick={() => startEditing(parallel.key, parallel.parallelName, printRun)}
                            style={{
                              fontSize: '12px',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            🆕 Create New "{formatParallelName(parallel.parallelName, printRun)}"
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {cardTypeParallels.length === 0 && (
              <div className="card-edit-modal-empty-state">
                No parallels found for this card type
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
            💾 Save Progress
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
  onSaveResolutions: () => Promise<void>
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
  onSaveResolutions
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

            {/* Cards Table */}
            {rows.length > 0 ? (
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
  const { initialize, unresolvedCount, buildResolveRequest, setErrors, unresolvedByKind, cardEdits, setCardEdit, removeCardEdit } = useImportResolutionStore()
  const [activeRow, setActiveRow] = useState<CardRow | null>(null)
  const [parallelModalCardType, setParallelModalCardType] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      // Extract parallels from parallel_groups if available
      const parallels: { cardType: string; parallelName: string }[] = []
      
      console.log('Groups data:', groupsQuery.data)
      
      if ('parallel_groups' in groupsQuery.data && groupsQuery.data.parallel_groups) {
        console.log('Found parallel_groups:', groupsQuery.data.parallel_groups)
        Object.entries(groupsQuery.data.parallel_groups).forEach(([cardType, parallelList]) => {
          (parallelList as any[]).forEach((parallel: any) => {
            parallels.push({ cardType, parallelName: parallel.name })
          })
        })
      } else {
        console.log('No parallel_groups found in data')
      }
      
      console.log('Initializing with parallels:', parallels)
      initialize(idNum, groupsQuery.data.player_names, groupsQuery.data.team_names, parallels)
    }
  }, [groupsQuery.data, idNum, initialize])

  // Initialize card type parallels from the new card types endpoint
  useEffect(() => {
    if (cardTypesQuery.data?.card_types) {
      // Extract parallels for resolution if not already initialized
      const parallelsForResolution: { cardType: string; parallelName: string }[] = []
      
      cardTypesQuery.data.card_types.forEach((ct: CardTypeInfo) => {
        // Extract parallels for the resolution store if we haven't already
        if (ct.parallels && ct.parallels.length > 0) {
          ct.parallels.forEach(parallel => {
            parallelsForResolution.push({ cardType: ct.card_type, parallelName: parallel.name })
          })
        }
      })
      
      // If we have parallels from card types but haven't initialized them yet, do so now
      const store = useImportResolutionStore.getState()
      const hasParallels = Object.keys(store.parallels).length > 0
      if (parallelsForResolution.length > 0 && !hasParallels) {
        console.log('Initializing parallels from card types endpoint:', parallelsForResolution)
        // Re-initialize with the parallels from card types
        const groups = groupsQuery.data
        if (groups) {
          initialize(idNum, groups.player_names, groups.team_names, parallelsForResolution)
        }
      }
    }
  }, [cardTypesQuery.data, groupsQuery.data, idNum, initialize])

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
              cardEdits={cardEdits}
              isCollapsed={collapsedSections[cardTypeInfo.card_type] ?? false}
              onToggleCollapse={() => toggleSection(cardTypeInfo.card_type)}
              onSaveResolutions={async () => {
                await resolveMutation.mutateAsync()
                queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'card-types'] })
              }}
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

        {/* Parallel Resolution Modal */}
        {parallelModalCardType && (
          <ParallelResolutionModal
            cardType={parallelModalCardType}
            groups={groups}
            onSave={async () => {
              await resolveMutation.mutateAsync()
              queryClient.invalidateQueries({ queryKey: ['import', 'batch', idNum, 'card-types'] })
            }}
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
