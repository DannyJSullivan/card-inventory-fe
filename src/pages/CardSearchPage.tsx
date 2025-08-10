import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppNavbar } from '../components/ui/AppNavbar'
import { cardService, type CardSearchFilters, type Card, type CardSearchResponse } from '../services/cards'

const CardSearchPage = () => {
  const [filters, setFilters] = useState<CardSearchFilters>({})
  const [debouncedFilters, setDebouncedFilters] = useState<CardSearchFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'card_number' | 'year' | 'brand_name' | 'set_name'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [hasSearched, setHasSearched] = useState(false)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce effect for filters
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    const hasFilters = Object.keys(filters).some(key => filters[key as keyof CardSearchFilters] !== undefined && filters[key as keyof CardSearchFilters] !== '')
    
    if (hasFilters && hasSearched) {
      setIsDebouncing(true)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedFilters(filters)
      setIsDebouncing(false)
      if (hasSearched && hasFilters) {
        // Auto-search when filters change after debounce, but only if we've searched before
        setCurrentPage(1)
      }
    }, 500) // 500ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [filters, hasSearched])

  const searchQuery = useQuery<CardSearchResponse>({
    queryKey: ['cards', 'search', debouncedFilters, currentPage, pageSize, sortBy, sortOrder],
    queryFn: () => cardService.searchCards({
      filters: debouncedFilters,
      page: currentPage,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    enabled: hasSearched && Object.keys(debouncedFilters).some(key => debouncedFilters[key as keyof CardSearchFilters] !== undefined && debouncedFilters[key as keyof CardSearchFilters] !== '')
  })

  const updateFilter = useCallback((key: keyof CardSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }))
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  const handleSearch = useCallback(() => {
    setHasSearched(true)
    setDebouncedFilters(filters) // Immediately update debounced filters on manual search
    setCurrentPage(1)
  }, [filters])

  const clearFilters = useCallback(() => {
    setFilters({})
    setDebouncedFilters({})
    setHasSearched(false)
    setCurrentPage(1)
  }, [])

  return (
    <div className="dashboard-container">
      <AppNavbar title="Search Cards" subtitle="Find cards across your collection" />
      <div className="dashboard-main" style={{ paddingTop: '32px' }}>
        
        {/* Search Form */}
        <div className="dashboard-card" style={{ padding: '24px', marginBottom: '32px' }}>
          <h2 className="dashboard-card-title" style={{ fontSize: '20px', marginBottom: '20px' }}>
            🔍 Search Filters
          </h2>
          
          <div className="space-y-4">
            {/* Main search input */}
            <div>
              <input
                type="text"
                placeholder="Search cards, players, teams..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="form-input w-full"
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Filter grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Topps, Panini"
                  value={filters.brand_name || ''}
                  onChange={(e) => updateFilter('brand_name', e.target.value)}
                  className="form-input w-full"
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Set */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Set</label>
                <input
                  type="text"
                  placeholder="e.g. Chrome, Heritage"
                  value={filters.set_name || ''}
                  onChange={(e) => updateFilter('set_name', e.target.value)}
                  className="form-input w-full"
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2023"
                  value={filters.year || ''}
                  onChange={(e) => updateFilter('year', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="form-input w-full"
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Player */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Player</label>
                <input
                  type="text"
                  placeholder="e.g. Mike Trout"
                  value={filters.player_name || ''}
                  onChange={(e) => updateFilter('player_name', e.target.value)}
                  className="form-input w-full"
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Team */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Team</label>
                <input
                  type="text"
                  placeholder="e.g. Angels"
                  value={filters.team_name || ''}
                  onChange={(e) => updateFilter('team_name', e.target.value)}
                  className="form-input w-full"
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Card Type */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Card Type</label>
                <input
                  type="text"
                  placeholder="e.g. Base, Insert"
                  value={filters.card_type || ''}
                  onChange={(e) => updateFilter('card_type', e.target.value)}
                  className="form-input w-full"
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Boolean filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.is_rookie === true}
                  onChange={(e) => updateFilter('is_rookie', e.target.checked ? true : undefined)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-300">🌟 Rookie Cards Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.is_autograph === true}
                  onChange={(e) => updateFilter('is_autograph', e.target.checked ? true : undefined)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-300">✍️ Autographs Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.has_parallel === true}
                  onChange={(e) => updateFilter('has_parallel', e.target.checked ? true : undefined)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-300">⚡ Has Parallels</span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSearch}
                disabled={isDebouncing}
                className="dashboard-card-button"
                style={{ 
                  background: isDebouncing 
                    ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                    : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  opacity: isDebouncing ? 0.7 : 1
                }}
              >
                {isDebouncing ? '⏳ Searching...' : '🔍 Search Cards'}
              </button>
              <button
                onClick={clearFilters}
                className="dashboard-card-button"
                style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results section */}
        {hasSearched && (
          <>
            {searchQuery.isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Searching cards...</span>
                </div>
              </div>
            )}

            {searchQuery.error && (
              <div className="dashboard-card" style={{ padding: '20px' }}>
                <p className="text-red-400 text-sm">
                  Error searching cards: {searchQuery.error.message}
                </p>
              </div>
            )}

            {searchQuery.data && (
              <>
                {/* Results header */}
                <div className="dashboard-card" style={{ padding: '16px 24px', marginBottom: '24px' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-300">
                        Found {searchQuery.data.total_count} cards
                      </span>
                      {searchQuery.data.total_count > 0 && (
                        <span className="text-sm text-gray-500 ml-2">
                          • Page {searchQuery.data.page} of {searchQuery.data.total_pages}
                        </span>
                      )}
                    </div>
                    
                    {/* Sort controls */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                      >
                        <option value="created_at">Date Added</option>
                        <option value="year">Year</option>
                        <option value="brand_name">Brand</option>
                        <option value="set_name">Set</option>
                        <option value="card_number">Card Number</option>
                      </select>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Results grid */}
                {searchQuery.data.cards.length > 0 ? (
                  <div className="dashboard-grid">
                    {searchQuery.data.cards.map(card => (
                      <CardResultCard key={card.id} card={card} />
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <p className="text-gray-400 text-lg mb-2">No cards found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search filters</p>
                  </div>
                )}

                {/* Pagination */}
                {searchQuery.data.total_pages > 1 && (
                  <PaginationControls
                    searchResults={searchQuery.data}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const CardResultCard = ({ card }: { card: Card }) => {
  const gradient = (() => {
    if (card.is_autograph) return 'linear-gradient(135deg, #db2777, #7c3aed)'
    if (card.is_rookie) return 'linear-gradient(135deg, #2563eb, #4f46e5)'
    if (card.parallels.length > 0) return 'linear-gradient(135deg, #059669, #10b981)'
    return 'linear-gradient(135deg, #374151, #4b5563)'
  })()

  return (
    <div className="dashboard-card hover:shadow-xl transition-all duration-300" style={{ padding: '20px' }}>
      <div className="flex items-start gap-4">
        <div className="dashboard-card-icon flex-shrink-0" style={{ background: gradient, width: '48px', height: '48px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
            {card.card_number.slice(0, 3)}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="dashboard-card-title font-semibold">
                #{card.card_number} {card.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {card.card_set.year} {card.card_set.brand.name} {card.card_set.name}
              </p>
            </div>
          </div>

          {card.players.length > 0 && (
            <div className="text-sm text-gray-400 mb-2">
              <span className="text-gray-500 font-medium">Players:</span>
              <span className="ml-2">{card.players.map(p => p.full_name).join(', ')}</span>
            </div>
          )}

          {card.teams.length > 0 && (
            <div className="text-sm text-gray-400 mb-2">
              <span className="text-gray-500 font-medium">Teams:</span>
              <span className="ml-2">{card.teams.map(t => t.name).join(', ')}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {card.card_type && (
              <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-200 text-xs font-medium">
                {card.card_type}
              </span>
            )}
            {card.is_rookie && (
              <span className="px-2 py-1 rounded-full bg-blue-500 text-white text-xs font-medium">
                🌟 Rookie
              </span>
            )}
            {card.is_autograph && (
              <span className="px-2 py-1 rounded-full bg-pink-500 text-white text-xs font-medium">
                ✍️ Auto
              </span>
            )}
            {card.parallels.length > 0 && (
              <span className="px-2 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
                ⚡ {card.parallels.length} Parallel{card.parallels.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const PaginationControls = ({ 
  searchResults, 
  currentPage, 
  onPageChange 
}: { 
  searchResults: CardSearchResponse
  currentPage: number
  onPageChange: (page: number) => void 
}) => {
  const { total_pages, has_next, has_previous, total_count, page_size } = searchResults
  
  const startItem = ((currentPage - 1) * page_size) + 1
  const endItem = Math.min(currentPage * page_size, total_count)

  return (
    <div className="dashboard-card" style={{ padding: '16px 24px', marginTop: '32px' }}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Showing {startItem} - {endItem} of {total_count} cards
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={!has_previous}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: has_previous ? 'var(--bg-secondary)' : 'transparent',
              borderColor: 'var(--border-primary)',
              color: has_previous ? 'var(--text-primary)' : 'var(--text-tertiary)'
            }}
          >
            Previous
          </button>

          <span className="px-3 py-1 text-sm text-gray-300">
            Page {currentPage} of {total_pages}
          </span>

          <button
            disabled={!has_next}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: has_next ? 'var(--bg-secondary)' : 'transparent',
              borderColor: 'var(--border-primary)',
              color: has_next ? 'var(--text-primary)' : 'var(--text-tertiary)'
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default CardSearchPage