import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { importService } from '../services/imports'
import { AppNavbar } from '../components/ui/AppNavbar'
import { useNavigate } from 'react-router-dom'
import { BatchMerger } from '../components/BatchMerger'
import type { PendingBatchSummary, MergeBatchesResponse } from '../types/imports'

export const PendingBatchesPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [batchToDelete, setBatchToDelete] = useState<PendingBatchSummary | null>(null)
  const [showMerger, setShowMerger] = useState(false)
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null)
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['import','pending-batches'],
    queryFn: () => importService.getPendingBatches(),
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: (batchId: number) => importService.deleteBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import','pending-batches'] })
      setBatchToDelete(null)
    },
    onError: (error) => {
      console.error('Delete failed:', error)
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const handleDelete = async (batch: PendingBatchSummary) => {
    setBatchToDelete(batch)
  }

  const confirmDelete = () => {
    if (batchToDelete) {
      deleteMutation.mutate(batchToDelete.batch_id)
    }
  }

  const handleMergeComplete = (result: MergeBatchesResponse) => {
    setShowMerger(false)
    setMergeSuccess(`Successfully merged ${result.merged_batches} batches into "${result.new_batch_name}" (Batch #${result.new_batch_id})`)
    
    // Clear success message after 8 seconds
    setTimeout(() => setMergeSuccess(null), 8000)
  }

  const handleMergeCancel = () => {
    setShowMerger(false)
  }

  const batches: PendingBatchSummary[] = data?.pending_batches || []
  return (
    <div className="dashboard-container">
      <AppNavbar title="Pending Import Batches" subtitle="Resume staged import batches awaiting resolution & commit" />
      <div className="dashboard-main" style={{ paddingTop: '32px' }}>
        {isLoading && <div className="text-sm">Loading…</div>}
        {error && <div className="text-sm text-red-500">Error loading batches</div>}
        
        {/* Success message for merge operations */}
        {mergeSuccess && (
          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '8px',
            border: '1px solid var(--accent-primary)',
            maxWidth: '1100px',
            width: '100%',
            margin: '0 auto 24px auto'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--accent-primary)',
              marginBottom: '4px'
            }}>
              ✅ Batches Merged Successfully!
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {mergeSuccess}
            </div>
          </div>
        )}
        
        {!isLoading && !error && batches.length > 0 && (
          <div style={{ 
            marginBottom: '24px', 
            textAlign: 'center',
            maxWidth: '1100px',
            width: '100%',
            margin: '0 auto 24px auto'
          }}>
            <button
              className="dashboard-card-button"
              onClick={() => setShowMerger(true)}
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #047857, #065f46)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)'}
            >
              Merge Batches
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
            {batches.map(b => {
              const unresolved = b.unresolved_rows
              const iconGradient = 'linear-gradient(135deg,#2563eb,#4f46e5)'
              return (
                <div key={b.batch_id} className="dashboard-card" style={{ display:'flex', flexDirection:'column' }}>
                  <div className="dashboard-card-icon" style={{ background: iconGradient }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{(b.brand || b.set_name || 'B')[0]}</span>
                  </div>
                  <h2 className="dashboard-card-title" style={{ fontSize: '16px', lineHeight: '1.2' }}>{b.brand} {b.set_name}</h2>
                  <p className="dashboard-card-description" style={{ marginTop: '4px', fontSize: '13px' }}>{b.year} • Batch #{b.batch_id}</p>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginTop:'16px', fontSize:'12px' }}>
                    <span className="dashboard-card-description" style={{ fontSize:'12px' }}>Unresolved:</span>
                    <span style={{ fontWeight: 600, color: '#fbbf24', fontSize:'14px' }}>{unresolved}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                    <button
                      className="dashboard-card-button"
                      style={{ flex: 1, background: iconGradient }}
                      onMouseOver={(e)=> e.currentTarget.style.background = 'linear-gradient(135deg,#1d4ed8,#4338ca)'}
                      onMouseOut={(e)=> e.currentTarget.style.background = iconGradient}
                      onClick={() => navigate(`/admin/imports/${b.batch_id}/resolve`)}
                    >
                      Resume
                    </button>
                    <button
                      className="dashboard-card-button"
                      style={{ 
                        flex: '0 0 auto',
                        padding: '8px 4px',
                        background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                        minWidth: 'auto',
                        width: '60px',
                        fontSize: '14px'
                      }}
                      onMouseOver={(e)=> e.currentTarget.style.background = 'linear-gradient(135deg,#b91c1c,#991b1b)'}
                      onMouseOut={(e)=> e.currentTarget.style.background = 'linear-gradient(135deg,#dc2626,#b91c1c)'}
                      onClick={() => handleDelete(b)}
                      title="Delete batch"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
            {batches.length===0 && (
              <div style={{ gridColumn:'1/-1' }} className="dashboard-card" >
                <h2 className="dashboard-card-title" style={{ fontSize:'16px' }}>No Pending Batches</h2>
                <p className="dashboard-card-description" style={{ marginTop:'8px' }}>Upload a new import to begin resolving.</p>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        {batchToDelete && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setBatchToDelete(null)
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
                  <div><strong>{batchToDelete.brand} {batchToDelete.set_name}</strong></div>
                  <div style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {batchToDelete.year} • Batch #{batchToDelete.batch_id}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {batchToDelete.total_rows} cards • {batchToDelete.unresolved_rows} unresolved
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setBatchToDelete(null)}
                  className="btn-secondary"
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
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

        {/* Batch Merger Modal */}
        {showMerger && (
          <BatchMerger
            availableBatches={batches.filter(b => b.status !== 'committed')}
            onMergeComplete={handleMergeComplete}
            onCancel={handleMergeCancel}
          />
        )}
      </div>
    </div>
  )
}
