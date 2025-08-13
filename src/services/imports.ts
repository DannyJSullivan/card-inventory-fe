import { apiRequest } from '../utils/api'
import type {
  ImportBatchPayload,
  PreviewGroups,
  ResolveRequest,
  ResolveResponse,
  CommitResult,
  UploadPreviewResponse,
  CardRow,
  PendingBatchesResponse,
  BatchDetailsResponse,
  CardTypePageResponse,
  BatchRowsResponse,
  GroupedPreviewResponse,
  Candidate,
} from '../types/imports'

const API_BASE_URL = 'http://localhost:8000'

export const importService = {
  async uploadCsv(metadata: { brand: string; set_name: string; year: number; sport: string; release_date?: string | null; source?: string | null }, file: File): Promise<UploadPreviewResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams({
      brand: metadata.brand,
      set_name: metadata.set_name,
      year: String(metadata.year),
      sport: metadata.sport,
    })
    if (metadata.release_date) params.append('release_date', metadata.release_date)
    if (metadata.source) params.append('source', metadata.source)

    const res = await apiRequest(`${API_BASE_URL}/admin/imports/upload-csv?${params.toString()}`, {
      method: 'POST',
      headers: {}, // apiRequest will add auth headers, don't add Content-Type for FormData
      body: formData,
    })
    if (!res.ok) {
      let msg = 'CSV upload failed'
      try {
        const data = await res.json()
        if (Array.isArray(data.detail)) {
          msg = data.detail.map((d: any) => d.msg).join('; ')
        } else if (typeof data.detail === 'string') {
          msg = data.detail
        }
      } catch { /* ignore */ }
      throw new Error(msg)
    }
    return res.json()
  },

  async uploadHtml(metadata: { brand: string; set_name: string; year: number; sport: string; release_date?: string | null; source?: string | null }, file: File): Promise<UploadPreviewResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams({
      brand: metadata.brand,
      set_name: metadata.set_name,
      year: String(metadata.year),
      sport: metadata.sport,
    })
    if (metadata.release_date) params.append('release_date', metadata.release_date)
    if (metadata.source) params.append('source', metadata.source)

    const res = await apiRequest(`${API_BASE_URL}/admin/imports/upload-html?${params.toString()}`, {
      method: 'POST',
      headers: {}, // apiRequest will add auth headers, don't add Content-Type for FormData
      body: formData,
    })
    if (!res.ok) {
      let msg = 'HTML upload failed'
      try {
        const data = await res.json()
        if (Array.isArray(data.detail)) {
          msg = data.detail.map((d: any) => d.msg).join('; ')
        } else if (typeof data.detail === 'string') {
          msg = data.detail
        }
      } catch { /* ignore */ }
      throw new Error(msg)
    }
    return res.json()
  },

  async uploadJson(payload: ImportBatchPayload): Promise<UploadPreviewResponse> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/upload-json`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'JSON upload failed')
    return res.json()
  },

  async stage(payload: ImportBatchPayload): Promise<{ import_batch_id: number; rows: number }> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/stage`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'Stage failed')
    return res.json()
  },

  async getPreviewGroups(batchId: number): Promise<PreviewGroups> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/${batchId}/preview-groups`)
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch preview groups failed')
    return res.json()
  },

  async getCardRows(batchId: number): Promise<{ batch_id: number; rows: CardRow[] }> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/${batchId}/rows`)
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch card rows failed')
    return res.json()
  },

  async resolve(batchId: number, body: ResolveRequest): Promise<ResolveResponse> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/${batchId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'Resolve failed')
    return res.json()
  },

  async commit(batchId: number): Promise<CommitResult> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/${batchId}/commit`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'Commit failed')
    return res.json()
  },

  async getPendingBatches(): Promise<PendingBatchesResponse> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/pending`)
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch pending batches failed')
    return res.json()
  },

  async getBatchDetails(batchId: number): Promise<BatchDetailsResponse> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/${batchId}/details`)
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch batch details failed')
    return res.json()
  },

  // New paginated endpoints
  async getCardTypePage(batchId: number, cardType: string, page: number = 1, perPage: number = 50): Promise<CardTypePageResponse> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage)
    })
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/${batchId}/card-type/${encodeURIComponent(cardType)}?${params}`)
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch card type page failed')
    return res.json()
  },

  async getBatchRows(batchId: number, options: { 
    page?: number; 
    perPage?: number; 
    resolutionStatus?: 'resolved' | 'unresolved'; 
    cardType?: string 
  } = {}): Promise<BatchRowsResponse> {
    const params = new URLSearchParams()
    if (options.page) params.set('page', String(options.page))
    if (options.perPage) params.set('per_page', String(options.perPage))
    if (options.resolutionStatus) params.set('resolution_status', options.resolutionStatus)
    if (options.cardType) params.set('card_type', options.cardType)
    
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/${batchId}/rows?${params}`)
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch batch rows failed')
    return res.json()
  },

  // Enhanced preview groups for paginated workflow
  async getPreviewGroupsEnhanced(batchId: number): Promise<GroupedPreviewResponse> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/${batchId}/preview-groups`)
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch enhanced preview groups failed')
    return res.json()
  },

  // Dynamic candidate search endpoints
  async searchPlayerCandidates(query: string, sport: string, limit: number = 10): Promise<Candidate[]> {
    const params = new URLSearchParams({
      query: query.trim(),
      sport,
      limit: String(limit)
    })
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/search-player-candidates?${params}`)
    if (!res.ok) throw new Error((await res.json()).detail || 'Search player candidates failed')
    return res.json()
  },

  async searchTeamCandidates(query: string, sport: string, limit: number = 10): Promise<Candidate[]> {
    const params = new URLSearchParams({
      query: query.trim(),
      sport,
      limit: String(limit)
    })
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/search-team-candidates?${params}`)
    if (!res.ok) throw new Error((await res.json()).detail || 'Search team candidates failed')
    return res.json()
  },

  // Delete import batch
  async deleteBatch(batchId: number): Promise<any> {
    const res = await apiRequest(`${API_BASE_URL}/admin/imports/${batchId}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || 'Delete batch failed')
    }
    return res.json()
  },
}
