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

      const data = await response.json();
      return { data };
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
  async getCards(skip = 0, limit = 100, sortBy?: string, sortOrder?: string): Promise<ApiResponse<PaginatedResponse<any>>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (sortBy) params.set('sort_by', sortBy);
    if (sortOrder) params.set('sort_order', sortOrder);
    
    return this.request<PaginatedResponse<any>>(`/admin/cards?${params}`);
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
  async getSets(skip = 0, limit = 100, sortBy?: string, sortOrder?: string): Promise<ApiResponse<PaginatedResponse<any>>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (sortBy) params.set('sort_by', sortBy);
    if (sortOrder) params.set('sort_order', sortOrder);
    
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
  async getBrands(skip = 0, limit = 100): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.request<PaginatedResponse<any>>(`/admin/brands?skip=${skip}&limit=${limit}`);
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
  async getPlayers(sport?: string, skip = 0, limit = 100) {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (sport) params.set('sport', sport);
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

  // Team Management
  async getTeams(sport?: string, skip = 0, limit = 100) {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (sport) params.set('sport', sport);
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

  // Parallel Management
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