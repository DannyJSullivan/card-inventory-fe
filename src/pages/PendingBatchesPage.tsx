import { useQuery } from '@tanstack/react-query'
import { importService } from '../services/imports'
import { AppNavbar } from '../components/ui/AppNavbar'
import { useNavigate } from 'react-router-dom'
import type { PendingBatchSummary } from '../types/imports'

export const PendingBatchesPage = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['import','pending-batches'],
    queryFn: () => importService.getPendingBatches(),
    staleTime: 30_000,
  })
  const batches: PendingBatchSummary[] = data?.pending_batches || []
  return (
    <div className="dashboard-container">
      <AppNavbar title="Pending Import Batches" subtitle="Resume staged import batches awaiting resolution & commit" />
      <div className="dashboard-main" style={{ paddingTop: '32px' }}>
        {isLoading && <div className="text-sm">Loading…</div>}
        {error && <div className="text-sm text-red-500">Error loading batches</div>}
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
                  <button
                    className="dashboard-card-button"
                    style={{ marginTop: '20px', background: iconGradient }}
                    onMouseOver={(e)=> e.currentTarget.style.background = 'linear-gradient(135deg,#1d4ed8,#4338ca)'}
                    onMouseOut={(e)=> e.currentTarget.style.background = iconGradient}
                    onClick={() => navigate(`/admin/imports/${b.batch_id}/resolve`)}
                  >Resume</button>
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
      </div>
    </div>
  )
}
