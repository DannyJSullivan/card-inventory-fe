const API_BASE = 'http://localhost:8000'

export interface CardSearchFilters {
  search?: string
  brand_name?: string
  set_name?: string
  year?: number
  min_year?: number
  max_year?: number
  sport?: string
  player_name?: string
  team_name?: string
  card_number?: string
  card_type?: string
  subset?: string
  is_rookie?: boolean
  is_first?: boolean
  is_autograph?: boolean
  has_parallel?: boolean
  parallel_type?: string
}

export interface CardSearchRequest {
  filters: CardSearchFilters
  page?: number
  page_size?: number
  sort_by?: 'created_at' | 'updated_at' | 'card_number' | 'year' | 'brand_name' | 'set_name'
  sort_order?: 'asc' | 'desc'
}

export interface Card {
  id: number
  card_number: string
  card_type: string
  title: string
  subset?: string
  notes?: string
  is_rookie: boolean
  is_first: boolean
  is_autograph: boolean
  created_at: string
  updated_at: string
  card_set: {
    id: number
    name: string
    year: number
    sport: string
    brand: {
      id: number
      name: string
    }
  }
  players: Array<{
    id: number
    full_name: string
    sport: string
    team_name?: string
  }>
  teams: Array<{
    id: number
    name: string
    sport: string
  }>
  parallels: Array<{
    id: number
    parallel_type_name: string
    print_run?: number
    original_print_run_text?: string
  }>
}

export interface CardSearchResponse {
  cards: Card[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export const cardService = {
  async searchCards(request: CardSearchRequest): Promise<CardSearchResponse> {
    const response = await fetch(`${API_BASE}/cards/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    return response.json()
  },

  async searchCardsWithURL(filters: CardSearchFilters, page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'desc'): Promise<CardSearchResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })

    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())
    params.append('sort_by', sortBy)
    params.append('sort_order', sortOrder)

    const response = await fetch(`${API_BASE}/cards/search?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    return response.json()
  },

  async getCard(cardId: number): Promise<Card> {
    const response = await fetch(`${API_BASE}/cards/${cardId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch card: ${response.statusText}`)
    }

    return response.json()
  },

  async getSuggestions(type: 'brands' | 'sets' | 'players' | 'teams' | 'card_types' | 'parallels', query: string): Promise<string[]> {
    if (query.length < 2) return []
    
    const response = await fetch(`${API_BASE}/cards/suggestions/${type}?q=${encodeURIComponent(query)}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch suggestions: ${response.statusText}`)
    }

    return response.json()
  }
}