import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { AppNavbar } from '../components/ui/AppNavbar'
import { adminService } from '../services/adminService'

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

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
  is_rookie: boolean;
  is_first?: boolean;
  is_autograph?: boolean;
  player_ids?: number[];
  team_ids?: number[];
}

interface BulkEditFormData {
  card_type?: string;
  is_rookie?: boolean;
  is_first?: boolean;
  is_autograph?: boolean;
  player_ids?: number[];
  team_ids?: number[];
}

interface SetOption {
  id: number;
  name: string;
  year: number;
  brand: {
    id: number;
    name: string;
  };
}

interface PlayerOption {
  id: number;
  full_name: string;
  sport: string;
  team_name: string;
}

interface TeamOption {
  id: number;
  name: string;
  sport: string;
}

export const AdminCardsPage = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showBulkEditForm, setShowBulkEditForm] = useState(false)
  const [selectedCards, setSelectedCards] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  
  // Dropdown data
  const [availableSets, setAvailableSets] = useState<SetOption[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<PlayerOption[]>([])
  const [availableTeams, setAvailableTeams] = useState<TeamOption[]>([])
  const [searchedSets, setSearchedSets] = useState<SetOption[]>([])
  const [searchedPlayers, setSearchedPlayers] = useState<PlayerOption[]>([])
  const [searchedTeams, setSearchedTeams] = useState<TeamOption[]>([])
  const [setsLoading, setSetsLoading] = useState(false)
  const [playersLoading, setPlayersLoading] = useState(false)
  const [teamsLoading, setTeamsLoading] = useState(false)
  
  // Selected form values
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([])
  const [setSearchTerm, setSetSearchTerm] = useState('')
  const [playerSearchTerm, setPlayerSearchTerm] = useState('')
  const [teamSearchTerm, setTeamSearchTerm] = useState('')
  const [showSetDropdown, setShowSetDropdown] = useState(false)
  const [cardSearchTerm, setCardSearchTerm] = useState('')
  
  // Debounce the search terms to reduce API calls
  const debouncedCardSearchTerm = useDebounce(cardSearchTerm, 500)
  const debouncedSetSearchTerm = useDebounce(setSearchTerm, 500)
  const debouncedPlayerSearchTerm = useDebounce(playerSearchTerm, 500)
  const debouncedTeamSearchTerm = useDebounce(teamSearchTerm, 500)
  
  const pageSize = 20
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CardFormData>()

  const {
    register: registerBulk,
    handleSubmit: handleSubmitBulk,
    reset: resetBulk,
    formState: { errors: bulkErrors, isSubmitting: isBulkSubmitting }
  } = useForm<BulkEditFormData>()

  useEffect(() => {
    loadCards()
  }, [currentPage, debouncedCardSearchTerm])

  useEffect(() => {
    loadSets()
    loadPlayers()
    loadTeams()
  }, [])

  // Reset to first page when search changes
  useEffect(() => {
    if (currentPage > 0) {
      setCurrentPage(0)
    }
  }, [debouncedCardSearchTerm])

  // Search sets when debounced search term changes
  useEffect(() => {
    if (debouncedSetSearchTerm && debouncedSetSearchTerm.trim()) {
      searchSets(debouncedSetSearchTerm.trim())
    } else {
      setSearchedSets([])
    }
  }, [debouncedSetSearchTerm])

  // Search players when debounced search term changes
  useEffect(() => {
    if (debouncedPlayerSearchTerm && debouncedPlayerSearchTerm.trim()) {
      searchPlayers(debouncedPlayerSearchTerm.trim())
    } else {
      setSearchedPlayers([])
    }
  }, [debouncedPlayerSearchTerm])

  // Search teams when debounced search term changes
  useEffect(() => {
    if (debouncedTeamSearchTerm && debouncedTeamSearchTerm.trim()) {
      searchTeams(debouncedTeamSearchTerm.trim())
    } else {
      setSearchedTeams([])
    }
  }, [debouncedTeamSearchTerm])

  const loadCards = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let result;
      
      if (debouncedCardSearchTerm && debouncedCardSearchTerm.trim()) {
        // Use comprehensive search endpoint when searching
        result = await adminService.searchCards({
          search: debouncedCardSearchTerm.trim(),
          page: currentPage + 1, // Convert 0-based to 1-based
          page_size: pageSize,
          sort_by: 'id',
          sort_order: 'desc'
        })
      } else {
        // Use admin endpoint for browsing all cards
        result = await adminService.getCards(
          currentPage * pageSize, 
          pageSize, 
          'id', 
          'desc'
        )
      }
      
      if (result.error) {
        setError(`Failed to load cards: ${result.error}`)
        setCards([])
      } else if (result.data) {
        const responseData = result.data as any
        
        if ('items' in responseData) {
          // Admin endpoint format: { items: [], total: number }
          setCards(responseData.items || [])
          setTotalItems(responseData.total || 0)
          setTotalPages(Math.ceil((responseData.total || 0) / pageSize))
        } else if ('cards' in responseData) {
          // Search endpoint format: { cards: [], total_count: number }
          setCards(responseData.cards || [])
          setTotalItems(responseData.total_count || 0)
          setTotalPages(Math.ceil((responseData.total_count || 0) / pageSize))
        } else {
          setError('Server returned unexpected data format. Please ensure pagination is properly implemented.')
          setCards([])
        }
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

  const loadSets = async () => {
    setSetsLoading(true)
    try {
      const result = await adminService.getSets(0, 100, 'name', 'asc')
      if (result.error) {
        setError(`Failed to load sets: ${result.error}`)
      } else if (result.data && 'items' in result.data) {
        setAvailableSets(result.data.items || [])
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    } finally {
      setSetsLoading(false)
    }
  }

  const searchSets = async (searchTerm: string) => {
    setSetsLoading(true)
    try {
      const result = await adminService.getSets(0, 20, 'name', 'asc', searchTerm)
      if (result.error) {
        setError(`Failed to search sets: ${result.error}`)
      } else if (result.data && 'items' in result.data) {
        setSearchedSets(result.data.items || [])
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    } finally {
      setSetsLoading(false)
    }
  }

  const loadPlayers = async () => {
    setPlayersLoading(true)
    try {
      const result = await adminService.getPlayers(undefined, 0, 100)
      if (result.error) {
        setError(`Failed to load players: ${result.error}`)
      } else if (result.data) {
        // Handle both paginated and direct array responses
        if ('items' in result.data) {
          setAvailablePlayers(result.data.items || [])
        } else if (Array.isArray(result.data)) {
          setAvailablePlayers(result.data)
        } else {
          setAvailablePlayers([])
        }
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    } finally {
      setPlayersLoading(false)
    }
  }

  const loadTeams = async () => {
    setTeamsLoading(true)
    try {
      const result = await adminService.getTeams(undefined, 0, 100)
      if (result.error) {
        setError(`Failed to load teams: ${result.error}`)
      } else if (result.data) {
        // Handle both paginated and direct array responses
        if ('items' in result.data) {
          setAvailableTeams(result.data.items || [])
        } else if (Array.isArray(result.data)) {
          setAvailableTeams(result.data)
        } else {
          setAvailableTeams([])
        }
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    } finally {
      setTeamsLoading(false)
    }
  }

  const searchPlayers = async (searchTerm: string) => {
    setPlayersLoading(true)
    try {
      const result = await adminService.getPlayers(undefined, 0, 20, searchTerm)
      if (result.error) {
        setError(`Failed to search players: ${result.error}`)
      } else if (result.data) {
        // Handle both paginated and direct array responses
        if ('items' in result.data) {
          setSearchedPlayers(result.data.items || [])
        } else if (Array.isArray(result.data)) {
          setSearchedPlayers(result.data)
        } else {
          setSearchedPlayers([])
        }
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    } finally {
      setPlayersLoading(false)
    }
  }

  const searchTeams = async (searchTerm: string) => {
    setTeamsLoading(true)
    try {
      const result = await adminService.getTeams(undefined, 0, 20, searchTerm)
      if (result.error) {
        setError(`Failed to search teams: ${result.error}`)
      } else if (result.data) {
        // Handle both paginated and direct array responses
        if ('items' in result.data) {
          setSearchedTeams(result.data.items || [])
        } else if (Array.isArray(result.data)) {
          setSearchedTeams(result.data)
        } else {
          setSearchedTeams([])
        }
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    } finally {
      setTeamsLoading(false)
    }
  }

  const handleEdit = async (cardId: number) => {
    try {
      // Ensure dropdown data is loaded first
      if (availableSets.length === 0) await loadSets()
      if (availablePlayers.length === 0) await loadPlayers()
      if (availableTeams.length === 0) await loadTeams()
      
      const result = await adminService.getCardForEdit(cardId)
      if (result.error) {
        setError(`Failed to load card for editing: ${result.error}`)
      } else if (result.data && typeof result.data === 'object') {
        const cardData = result.data as Card
        setEditingCard(cardData)
        
        // Ensure card's set, players and teams are available for display
        if (cardData.card_set) {
          setAvailableSets(prev => {
            const existingIds = prev.map(s => s.id)
            if (!existingIds.includes(cardData.card_set.id)) {
              return [...prev, cardData.card_set]
            }
            return prev
          })
        }
        
        if (cardData.players && cardData.players.length > 0) {
          setAvailablePlayers(prev => {
            const existingIds = prev.map(p => p.id)
            const newPlayers = cardData.players.filter(p => !existingIds.includes(p.id))
            return [...prev, ...newPlayers]
          })
        }
        
        if (cardData.teams && cardData.teams.length > 0) {
          setAvailableTeams(prev => {
            const existingIds = prev.map(t => t.id)
            const newTeams = cardData.teams.filter(t => !existingIds.includes(t.id))
            return [...prev, ...newTeams]
          })
        }
        
        // Populate selected players and teams
        setSelectedPlayerIds(cardData.players?.map(p => p.id) || [])
        setSelectedTeamIds(cardData.teams?.map(t => t.id) || [])
        // Set the search term for the set dropdown
        if (cardData.card_set) {
          setSetSearchTerm(`${cardData.card_set.brand.name} ${cardData.card_set.name} ${cardData.card_set.year}`)
        }
        // Clear other search terms and hide dropdown
        setPlayerSearchTerm('')
        setTeamSearchTerm('')
        setShowSetDropdown(false)
        setSearchedSets([])
        setSearchedPlayers([])
        setSearchedTeams([])
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


  const handleBulkUpdate = () => {
    if (selectedCards.length === 0) {
      setError('Please select cards to update')
      return
    }
    setShowBulkEditForm(true)
  }

  const onSubmit = async (data: CardFormData) => {
    setError(null)
    
    const formData = {
      ...data,
      player_ids: selectedPlayerIds,
      team_ids: selectedTeamIds
    }
    
    try {
      let result
      if (editingCard) {
        result = await adminService.updateCard(editingCard.id, formData)
      } else {
        result = await adminService.createCard(formData)
      }
      
      if (result.error) {
        setError(`Failed to ${editingCard ? 'update' : 'create'} card: ${result.error}`)
      } else {
        setEditingCard(null)
        setShowCreateForm(false)
        setSelectedPlayerIds([])
        setSelectedTeamIds([])
        setSetSearchTerm('')
        setPlayerSearchTerm('')
        setTeamSearchTerm('')
        setShowSetDropdown(false)
        setSearchedSets([])
        setSearchedPlayers([])
        setSearchedTeams([])
        reset()
        loadCards()
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`)
    }
  }

  const onBulkSubmit = async (data: BulkEditFormData) => {
    setError(null)
    
    const updates: any = {}
    
    // Only include fields that have values
    if (data.card_type) updates.card_type = data.card_type
    if (data.is_rookie !== undefined) updates.is_rookie = data.is_rookie
    if (data.is_first !== undefined) updates.is_first = data.is_first
    if (data.is_autograph !== undefined) updates.is_autograph = data.is_autograph
    if (selectedPlayerIds && selectedPlayerIds.length > 0) updates.player_ids = selectedPlayerIds
    if (selectedTeamIds && selectedTeamIds.length > 0) updates.team_ids = selectedTeamIds
    
    try {
      const result = await adminService.bulkUpdateCards(selectedCards, updates)
      if (result.error) {
        setError(`Bulk update failed: ${result.error}`)
      } else {
        setShowBulkEditForm(false)
        setSelectedCards([])
        setSelectedPlayerIds([])
        setSelectedTeamIds([])
        setPlayerSearchTerm('')
        setTeamSearchTerm('')
        setSearchedPlayers([])
        setSearchedTeams([])
        resetBulk()
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

  // Helper functions for multi-select dropdowns
  const filteredSets = setSearchTerm.trim() ? searchedSets : []
  const filteredPlayers = playerSearchTerm.trim() ? searchedPlayers : []
  const filteredTeams = teamSearchTerm.trim() ? searchedTeams : []

  const togglePlayerSelection = (playerId: number) => {
    setSelectedPlayerIds(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const toggleTeamSelection = (teamId: number) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ flex: '1', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search cards by player, team, set, or card number..."
              value={cardSearchTerm}
              onChange={(e) => setCardSearchTerm(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>
          {cardSearchTerm && (
            <button 
              onClick={() => setCardSearchTerm('')}
              style={{
                marginLeft: '12px',
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

      {showBulkEditForm && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowBulkEditForm(false)
            setSelectedPlayerIds([])
            setSelectedTeamIds([])
            setPlayerSearchTerm('')
            setTeamSearchTerm('')
            setSearchedPlayers([])
            setSearchedTeams([])
            resetBulk()
          }
        }}>
          <div className="modal-content">
            <h2>Bulk Edit Cards ({selectedCards.length} selected)</h2>
            
            <form onSubmit={handleSubmitBulk(onBulkSubmit)}>
              <div className="form-group">
                <label className="form-label">Card Type (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  {...registerBulk('card_type')}
                  placeholder="Leave blank to keep existing values"
                />
                {bulkErrors.card_type && <div className="form-error">{bulkErrors.card_type.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Players (optional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search players to add..."
                    value={playerSearchTerm}
                    onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  />
                  {playerSearchTerm && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10
                    }}>
                      {filteredPlayers.length > 0 ? (
                        filteredPlayers.map(player => (
                          <div
                            key={player.id}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-secondary)',
                              backgroundColor: selectedPlayerIds.includes(player.id) ? 'var(--accent-primary-10)' : 'transparent'
                            }}
                            onClick={() => {
                              togglePlayerSelection(player.id)
                              setPlayerSearchTerm('')
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{player.full_name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {player.team_name} • {player.sport}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                          No players found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedPlayerIds.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedPlayerIds.map(playerId => {
                      const player = availablePlayers.find(p => p.id === playerId) || searchedPlayers.find(p => p.id === playerId)
                      return player ? (
                        <span
                          key={playerId}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {player.full_name}
                          <button
                            type="button"
                            onClick={() => togglePlayerSelection(playerId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              padding: '0',
                              marginLeft: '4px'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Teams (optional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search teams to add..."
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                  />
                  {teamSearchTerm && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10
                    }}>
                      {filteredTeams.length > 0 ? (
                        filteredTeams.map(team => (
                          <div
                            key={team.id}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-secondary)',
                              backgroundColor: selectedTeamIds.includes(team.id) ? 'var(--accent-primary-10)' : 'transparent'
                            }}
                            onClick={() => {
                              toggleTeamSelection(team.id)
                              setTeamSearchTerm('')
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{team.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {team.sport}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                          No teams found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedTeamIds.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedTeamIds.map(teamId => {
                      const team = availableTeams.find(t => t.id === teamId) || searchedTeams.find(t => t.id === teamId)
                      return team ? (
                        <span
                          key={teamId}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            backgroundColor: 'var(--accent-success)',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {team.name}
                          <button
                            type="button"
                            onClick={() => toggleTeamSelection(teamId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              padding: '0',
                              marginLeft: '4px'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      {...registerBulk('is_rookie')}
                    />
                    <span className="form-label" style={{ margin: 0 }}>Mark as Rookie Cards</span>
                  </label>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      {...registerBulk('is_first')}
                    />
                    <span className="form-label" style={{ margin: 0 }}>Mark as First Cards</span>
                  </label>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      {...registerBulk('is_autograph')}
                    />
                    <span className="form-label" style={{ margin: 0 }}>Mark as Autograph Cards</span>
                  </label>
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="submit" disabled={isBulkSubmitting} className="btn-primary">
                  {isBulkSubmitting ? 'Updating...' : `Update ${selectedCards.length} Cards`}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowBulkEditForm(false)
                    setSelectedPlayerIds([])
                    setSelectedTeamIds([])
                    setPlayerSearchTerm('')
                    setTeamSearchTerm('')
                    setSearchedPlayers([])
                    setSearchedTeams([])
                    resetBulk()
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(showCreateForm || editingCard) && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setEditingCard(null)
            setShowCreateForm(false)
            setSelectedPlayerIds([])
            setSelectedTeamIds([])
            setSetSearchTerm('')
            setPlayerSearchTerm('')
            setTeamSearchTerm('')
            setShowSetDropdown(false)
            setSearchedSets([])
            setSearchedPlayers([])
            setSearchedTeams([])
            reset()
          }
        }}>
          <div className="modal-content">
            <h2>{editingCard ? 'Edit Card' : 'Create New Card'}</h2>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Set *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search sets..."
                    value={setSearchTerm}
                    onChange={(e) => {
                      setSetSearchTerm(e.target.value)
                      setShowSetDropdown(true)
                    }}
                    onFocus={() => setShowSetDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSetDropdown(false), 200)}
                  />
                  {showSetDropdown && setSearchTerm.trim() && filteredSets.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10
                    }}>
                      {filteredSets.length > 0 ? (
                        filteredSets.map(set => (
                          <div
                            key={set.id}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-secondary)'
                            }}
                            onClick={() => {
                              setValue('set_id', set.id)
                              setSetSearchTerm(`${set.brand.name} ${set.name} ${set.year}`)
                              setShowSetDropdown(false)
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{set.brand.name} {set.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{set.year}</div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                          No sets found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="hidden"
                  {...register('set_id', { required: 'Set is required', valueAsNumber: true })}
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
                <label className="form-label">Players</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search players..."
                    value={playerSearchTerm}
                    onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  />
                  {playerSearchTerm && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10
                    }}>
                      {filteredPlayers.length > 0 ? (
                        filteredPlayers.map(player => (
                          <div
                            key={player.id}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-secondary)',
                              backgroundColor: selectedPlayerIds.includes(player.id) ? 'var(--accent-primary-10)' : 'transparent'
                            }}
                            onClick={() => {
                              togglePlayerSelection(player.id)
                              setPlayerSearchTerm('')
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{player.full_name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {player.team_name} • {player.sport}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                          No players found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedPlayerIds.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedPlayerIds.map(playerId => {
                      const player = availablePlayers.find(p => p.id === playerId) || searchedPlayers.find(p => p.id === playerId)
                      return player ? (
                        <span
                          key={playerId}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {player.full_name}
                          <button
                            type="button"
                            onClick={() => togglePlayerSelection(playerId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              padding: '0',
                              marginLeft: '4px'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Teams</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search teams..."
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                  />
                  {teamSearchTerm && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10
                    }}>
                      {filteredTeams.length > 0 ? (
                        filteredTeams.map(team => (
                          <div
                            key={team.id}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-secondary)',
                              backgroundColor: selectedTeamIds.includes(team.id) ? 'var(--accent-primary-10)' : 'transparent'
                            }}
                            onClick={() => {
                              toggleTeamSelection(team.id)
                              setTeamSearchTerm('')
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{team.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {team.sport}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                          No teams found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedTeamIds.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedTeamIds.map(teamId => {
                      const team = availableTeams.find(t => t.id === teamId) || searchedTeams.find(t => t.id === teamId)
                      return team ? (
                        <span
                          key={teamId}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            backgroundColor: 'var(--accent-success)',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {team.name}
                          <button
                            type="button"
                            onClick={() => toggleTeamSelection(teamId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              padding: '0',
                              marginLeft: '4px'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
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
                    setSelectedPlayerIds([])
                    setSelectedTeamIds([])
                    setSetSearchTerm('')
                    setPlayerSearchTerm('')
                    setTeamSearchTerm('')
                    setShowSetDropdown(false)
                    setSearchedSets([])
                    setSearchedPlayers([])
                    setSearchedTeams([])
                    reset()
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
              <th>Set</th>
              <th>Card #</th>
              <th>Player</th>
              <th>Team</th>
              <th>Type</th>
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
                <td>{card.card_set?.brand?.name} {card.card_set?.name} {card.card_set?.year}</td>
                <td>{card.card_number}</td>
                <td>{card.title || card.players.map(p => p.full_name).join(', ') || 'Untitled'}</td>
                <td>{card.teams.map(t => t.name).join(', ') || 'No Team'}</td>
                <td>{card.card_type}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(card.id)} className="btn-small btn-edit">
                      Edit
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