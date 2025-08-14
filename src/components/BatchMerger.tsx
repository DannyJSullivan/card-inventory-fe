import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importService } from '../services/imports'
import type { PendingBatchSummary, MergeBatchesRequest, MergeBatchesResponse } from '../types/imports'

interface BatchMergerProps {
  availableBatches: PendingBatchSummary[]
  onMergeComplete: (result: MergeBatchesResponse) => void
  onCancel: () => void
}

export const BatchMerger = ({ availableBatches, onMergeComplete, onCancel }: BatchMergerProps) => {
  const queryClient = useQueryClient()
  const [selectedBatches, setSelectedBatches] = useState<number[]>([])
  const [newBatchName, setNewBatchName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mergeMutation = useMutation({
    mutationFn: (request: MergeBatchesRequest) => importService.mergeBatches(request),
    onSuccess: (result) => {
      // Success! Notify parent and refresh batches
      queryClient.invalidateQueries({ queryKey: ['import', 'pending-batches'] })
      onMergeComplete(result)
      
      // Reset form
      setSelectedBatches([])
      setNewBatchName('')
      setError(null)
    },
    onError: (err: any) => {
      setError(err.message || 'Merge failed')
    }
  })

  const handleMerge = async () => {
    if (selectedBatches.length < 2) {
      setError('Please select at least 2 batches to merge')
      return
    }

    if (!newBatchName.trim()) {
      setError('Please enter a name for the merged batch')
      return
    }

    setError(null)

    mergeMutation.mutate({
      batch_ids: selectedBatches,
      new_batch_name: newBatchName.trim()
    })
  }

  const toggleBatchSelection = (batchId: number) => {
    setSelectedBatches(prev => 
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    )
  }

  // Group batches by brand/set/year for easier selection
  const groupedBatches = availableBatches.reduce((groups, batch) => {
    const key = `${batch.brand} - ${batch.set_name} (${batch.year})`
    if (!groups[key]) groups[key] = []
    groups[key].push(batch)
    return groups
  }, {} as Record<string, PendingBatchSummary[]>)

  // Check if selected batches are compatible (same metadata)
  const getValidationError = () => {
    if (selectedBatches.length < 2) return null
    
    const selectedBatchObjects = availableBatches.filter(b => selectedBatches.includes(b.batch_id))
    const first = selectedBatchObjects[0]
    
    for (const batch of selectedBatchObjects.slice(1)) {
      if (batch.brand !== first.brand || 
          batch.set_name !== first.set_name || 
          batch.year !== first.year || 
          batch.sport !== first.sport) {
        return 'Selected batches must have the same brand, set name, year, and sport'
      }
    }
    
    return null
  }

  const validationError = getValidationError()
  const isFormValid = selectedBatches.length >= 2 && newBatchName.trim() && !validationError

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel()
      }
    }}>
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Merge Import Batches
        </h2>
        
        {error && (
          <div className="alert alert-error text-sm" style={{ marginBottom: '16px' }}>
            ❌ {error}
          </div>
        )}

        {validationError && (
          <div className="alert alert-error text-sm" style={{ marginBottom: '16px' }}>
            ⚠️ {validationError}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Select 2 or more batches with the same brand, set, year, and sport to merge them into a single batch.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Name for merged batch</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g., 2023 Topps Series 1 - Complete Set"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              disabled={mergeMutation.isPending}
            />
          </div>

          {Object.entries(groupedBatches).map(([groupName, batches]) => (
            <div key={groupName} style={{ marginBottom: '16px' }}>
              <h4 style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '8px',
                color: 'var(--text-primary)'
              }}>
                {groupName}
              </h4>
              <div style={{ 
                border: '1px solid var(--border-primary)', 
                borderRadius: '8px',
                backgroundColor: 'var(--bg-tertiary)'
              }}>
                {batches.map(batch => (
                  <label 
                    key={batch.batch_id} 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      borderBottom: '1px solid var(--border-primary)',
                      cursor: batch.status === 'committed' ? 'not-allowed' : 'pointer',
                      opacity: batch.status === 'committed' ? 0.5 : 1
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBatches.includes(batch.batch_id)}
                      onChange={() => toggleBatchSelection(batch.batch_id)}
                      disabled={batch.status === 'committed' || mergeMutation.isPending}
                      style={{ marginRight: '12px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Batch #{batch.batch_id}
                        {batch.source && ` - ${batch.source}`}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {batch.total_rows} cards • {batch.unresolved_rows} unresolved
                        {batch.status === 'committed' && ' • COMMITTED'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {selectedBatches.length > 0 && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--text-primary)',
                fontWeight: '500',
                margin: 0 
              }}>
                Selected {selectedBatches.length} batches for merging
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            onClick={onCancel}
            className="btn-secondary"
            disabled={mergeMutation.isPending}
          >
            Cancel
          </button>
          <button 
            onClick={handleMerge}
            className="btn-primary"
            disabled={!isFormValid || mergeMutation.isPending}
            style={{ 
              backgroundColor: isFormValid ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              borderColor: isFormValid ? 'var(--accent-primary)' : 'var(--border-primary)',
              opacity: !isFormValid ? 0.5 : 1
            }}
          >
            {mergeMutation.isPending ? 'Merging...' : `Merge ${selectedBatches.length} Batches`}
          </button>
        </div>
      </div>
    </div>
  )
}
