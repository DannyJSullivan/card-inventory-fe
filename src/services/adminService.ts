const API_BASE = 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: any;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

class AdminService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData
        };
      }

      // Handle empty responses (common for DELETE operations)
      const text = await response.text();
      if (!text) {
        return { data: null };
      }

      try {
        const data = JSON.parse(text);
        return { data };
      } catch {
        // If it's not JSON, return the text as data
        return { data: text };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.request('/admin/cards/stats');
  }

  // Card Management
  async getCards(skip = 0, limit = 100, sortBy?: string, sortOrder?: string, search?: string): Promise<ApiResponse<PaginatedResponse<any>>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (sortBy) params.set('sort_by', sortBy);
    if (sortOrder) params.set('sort_order', sortOrder);
    if (search && search.trim()) params.set('search', search.trim());
    
    return this.request<PaginatedResponse<any>>(`/admin/cards?${params}`);
  }

  // Comprehensive Card Search
  async searchCards(params: {
    search?: string;
    card_number?: string;
    card_type?: string;
    player_name?: string;
    team_name?: string;
    set_name?: string;
    brand_name?: string;
    year?: number;
    is_rookie?: boolean;
    is_autograph?: boolean;
    has_parallel?: boolean;
    parallel_type?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams();
    
    // Convert page/page_size to skip/limit format
    const page = params.page || 1;
    const pageSize = params.page_size || 20;
    const skip = (page - 1) * pageSize;
    
    searchParams.set('skip', skip.toString());
    searchParams.set('limit', pageSize.toString());
    
    // Add all search parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'page' && key !== 'page_size') {
        searchParams.set(key, value.toString());
      }
    });
    
    return this.request<PaginatedResponse<any>>(`/cards/search?${searchParams}`);
  }

  async getCardForEdit(cardId: number) {
    return this.request(`/admin/cards/${cardId}/edit`);
  }

  async updateCard(cardId: number, updates: any) {
    return this.request(`/admin/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async createCard(cardData: any) {
    return this.request('/admin/cards/', {
      method: 'POST',
      body: JSON.stringify(cardData)
    });
  }

  async deleteCard(cardId: number) {
    return this.request(`/admin/cards/${cardId}`, {
      method: 'DELETE'
    });
  }

  async duplicateCard(cardId: number, newCardNumber: string) {
    return this.request(`/admin/cards/${cardId}/duplicate?new_card_number=${newCardNumber}`, {
      method: 'POST'
    });
  }

  async bulkUpdateCards(cardIds: number[], updates: any) {
    return this.request('/admin/cards/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({
        card_ids: cardIds,
        updates
      })
    });
  }

  // Set Management
  async getSets(skip = 0, limit = 100, sortBy = 'id', sortOrder = 'desc', search?: string): Promise<ApiResponse<PaginatedResponse<any>>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      sort_by: sortBy,
      sort_order: sortOrder
    });
    
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    
    return this.request<PaginatedResponse<any>>(`/admin/sets?${params}`);
  }

  async getSet(setId: number) {
    return this.request(`/admin/sets/${setId}`);
  }

  async createSet(setData: any) {
    return this.request('/admin/sets', {
      method: 'POST',
      body: JSON.stringify(setData)
    });
  }

  async updateSet(setId: number, updates: any) {
    return this.request(`/admin/sets/${setId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteSet(setId: number) {
    return this.request(`/admin/sets/${setId}`, {
      method: 'DELETE'
    });
  }

  // Brand Management
  async getBrands(skip = 0, limit = 100, search?: string): Promise<ApiResponse<PaginatedResponse<any>>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    
    return this.request<PaginatedResponse<any>>(`/admin/brands?${params}`);
  }

  async getBrand(brandId: number) {
    return this.request(`/admin/brands/${brandId}`);
  }

  async createBrand(brandData: any) {
    return this.request('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(brandData)
    });
  }

  async updateBrand(brandId: number, updates: any) {
    return this.request(`/admin/brands/${brandId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteBrand(brandId: number) {
    return this.request(`/admin/brands/${brandId}`, {
      method: 'DELETE'
    });
  }

  // Player Management
  async getPlayers(sport?: string, skip = 0, limit = 100, search?: string) {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (sport) params.set('sport', sport);
    if (search && search.trim()) params.set('search', search.trim());
    return this.request(`/admin/players?${params}`);
  }

  async createPlayer(playerData: any) {
    return this.request('/admin/players', {
      method: 'POST',
      body: JSON.stringify(playerData)
    });
  }

  async updatePlayer(playerId: number, updates: any) {
    return this.request(`/admin/players/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deletePlayer(playerId: number) {
    return this.request(`/admin/players/${playerId}`, {
      method: 'DELETE'
    });
  }

  // Team Management
  async getTeams(sport?: string, skip = 0, limit = 100, search?: string) {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (sport) params.set('sport', sport);
    if (search && search.trim()) params.set('search', search.trim());
    return this.request(`/admin/teams?${params}`);
  }

  async createTeam(teamData: any) {
    return this.request('/admin/teams', {
      method: 'POST',
      body: JSON.stringify(teamData)
    });
  }

  async updateTeam(teamId: number, updates: any) {
    return this.request(`/admin/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteTeam(teamId: number) {
    return this.request(`/admin/teams/${teamId}`, {
      method: 'DELETE'
    });
  }

  // Parallel Management
  async getParallels(skip = 0, limit = 100, search?: string, rarity?: string): Promise<ApiResponse<PaginatedResponse<any>>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    
    if (rarity && rarity.trim()) {
      params.set('rarity_level', rarity.trim());
    }
    
    return this.request<PaginatedResponse<any>>(`/admin/parallels?${params}`);
  }

  async getParallel(parallelId: number) {
    return this.request(`/admin/parallels/${parallelId}`);
  }

  async createParallel(parallelData: any) {
    return this.request('/admin/parallels', {
      method: 'POST',
      body: JSON.stringify(parallelData)
    });
  }

  async updateParallel(parallelId: number, updates: any) {
    return this.request(`/admin/parallels/${parallelId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteParallel(parallelId: number) {
    return this.request(`/admin/parallels/${parallelId}`, {
      method: 'DELETE'
    });
  }

  // Legacy parallel methods (for backwards compatibility)
  async getParallelTypes() {
    return this.request('/admin/parallel-types');
  }

  async getSetParallels(setId: number) {
    return this.request(`/admin/sets/${setId}/parallels`);
  }

  async addParallelToSet(setId: number, parallelData: any) {
    return this.request(`/admin/sets/${setId}/parallels`, {
      method: 'POST',
      body: JSON.stringify(parallelData)
    });
  }
}

export const adminService = new AdminService();