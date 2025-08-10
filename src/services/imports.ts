import { authService } from './auth'
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

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = authService.getToken()
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const importService = {
  async uploadCsv(metadata: { brand: string; set_name: string; year: number; sport: string; source?: string | null }, file: File): Promise<UploadPreviewResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams({
      brand: metadata.brand,
      set_name: metadata.set_name,
      year: String(metadata.year),
      sport: metadata.sport,
    })
    if (metadata.source) params.append('source', metadata.source)

    const res = await fetch(`${API_BASE_URL}/admin/imports/upload-csv?${params.toString()}`, {
      method: 'POST',
      headers: authHeaders(),
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

  async uploadJson(payload: ImportBatchPayload): Promise<UploadPreviewResponse> {
    const res = await fetch(`${API_BASE_URL}/admin/imports/upload-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'JSON upload failed')
    return res.json()
  },

  async stage(payload: ImportBatchPayload): Promise<{ import_batch_id: number; rows: number }> {
    const res = await fetch(`${API_BASE_URL}/admin/imports/stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'Stage failed')
    return res.json()
  },

  async getPreviewGroups(batchId: number): Promise<PreviewGroups> {
    const res = await fetch(`${API_BASE_URL}/admin/imports/${batchId}/preview-groups`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch preview groups failed')
    return res.json()
  },

  async getCardRows(batchId: number): Promise<{ batch_id: number; rows: CardRow[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/imports/${batchId}/rows`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch card rows failed')
    return res.json()
  },

  async resolve(batchId: number, body: ResolveRequest): Promise<ResolveResponse> {
    const res = await fetch(`${API_BASE_URL}/admin/imports/${batchId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'Resolve failed')
    return res.json()
  },

  async commit(batchId: number): Promise<CommitResult> {
    const res = await fetch(`${API_BASE_URL}/admin/imports/${batchId}/commit`, {
      method: 'POST',
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error((await res.json()).detail || 'Commit failed')
    return res.json()
  },

  async getPendingBatches(): Promise<PendingBatchesResponse> {
    const res = await fetch(`${API_BASE_URL}/admin/imports/pending`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch pending batches failed')
    return res.json()
  },

  async getBatchDetails(batchId: number): Promise<BatchDetailsResponse> {
    const res = await fetch(`${API_BASE_URL}/admin/imports/${batchId}/details`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).detail || 'Fetch batch details failed')
    return res.json()
  },
}
