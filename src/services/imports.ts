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
}
