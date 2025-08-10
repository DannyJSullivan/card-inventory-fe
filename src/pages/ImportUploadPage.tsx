import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { importService } from '../services/imports'
import type { ImportBatchPayload, UploadPreviewResponse, ImportBatchMetadata } from '../types/imports'
import { useNavigate } from 'react-router-dom'
import { AppNavbar } from '../components/ui/AppNavbar'

export const ImportUploadPage = () => {
  const navigate = useNavigate()
  const [metadata, setMetadata] = useState<ImportBatchMetadata>({ brand: '', set_name: '', year: new Date().getFullYear(), sport: '' })
  const [source, setSource] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'csv' | 'json'>('csv')
  const [jsonText, setJsonText] = useState('')
  const [preview, setPreview] = useState<UploadPreviewResponse | null>(null)
  const [batchPayload, setBatchPayload] = useState<ImportBatchPayload | null>(null)
  const [stageLoading, setStageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const isJson = mode === 'json'

  const uploadCsvMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected')
      return importService.uploadCsv({ ...metadata, source: source || undefined }, file)
    },
    onSuccess: (data) => { 
      setPreview(data); 
      setBatchPayload(data.batch); 
      const pretty = JSON.stringify(data.batch, null, 2)
      setJsonText(pretty)
      setMode('json') // automatically switch to JSON mode for staging
      setCopyState('idle')
    },
    onError: (e: any) => setError(e.message || 'Upload failed'),
  })

  const uploadJsonMutation = useMutation({
    mutationFn: async () => {
      const payload: ImportBatchPayload = JSON.parse(jsonText)
      return importService.uploadJson(payload)
    },
    onSuccess: (data) => { setPreview(data); setBatchPayload(data.batch); setCopyState('idle') },
    onError: (e: any) => setError(e.message || 'Upload failed'),
  })

  const stageMutation = useMutation({
    mutationFn: async () => {
      if (!batchPayload) throw new Error('No batch payload to stage')
      return importService.stage(batchPayload)
    },
    onSuccess: (data) => navigate(`/admin/imports/${data.import_batch_id}/resolve`),
    onError: (e: any) => setError(e.message || 'Stage failed'),
    onSettled: () => setStageLoading(false),
  })

  const handleUpload = () => {
    setError(null)
    if (isJson) uploadJsonMutation.mutate()
    else uploadCsvMutation.mutate()
  }

  const handleStage = () => {
    setError(null)
    setStageLoading(true)
    stageMutation.mutate()
  }

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(jsonText)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  return (
    <div className="dashboard-container">
      <AppNavbar title="Data Import" subtitle="Upload • Preview • Stage • Resolve • Commit" />
      {/* Main Content */}
      <div className="dashboard-main" style={{ paddingTop: '24px' }}>
        <div className="grid xl:grid-cols-3 gap-10 items-start">
          {/* Left Column (Form + Preview) */}
          <div className="xl:col-span-2 space-y-10">
            <div className="dashboard-card" style={{ cursor: 'default', padding: '36px' }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="dashboard-card-title" style={{ marginBottom: 0, fontSize: '18px' }}>Upload Source</h2>
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
                  <button
                    type="button"
                    onClick={() => setMode('csv')}
                    className={`px-5 py-2 text-sm font-medium transition-colors ${!isJson ? 'bg-blue-600 text-white' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
                  >CSV</button>
                  <button
                    type="button"
                    onClick={() => setMode('json')}
                    className={`px-5 py-2 text-sm font-medium transition-colors ${isJson ? 'bg-blue-600 text-white' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
                  >JSON</button>
                </div>
              </div>

              {!isJson && (
                <>
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <label className="form-label">Brand</label>
                      <input className="form-input" value={metadata.brand} onChange={(e) => setMetadata({ ...metadata, brand: e.target.value })} placeholder="Topps" />
                    </div>
                    <div>
                      <label className="form-label">Set Name</label>
                      <input className="form-input" value={metadata.set_name} onChange={(e) => setMetadata({ ...metadata, set_name: e.target.value })} placeholder="Series 1" />
                    </div>
                    <div>
                      <label className="form-label">Year</label>
                      <input className="form-input" type="number" value={metadata.year} onChange={(e) => setMetadata({ ...metadata, year: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="form-label">Sport</label>
                      <input className="form-input" value={metadata.sport} onChange={(e) => setMetadata({ ...metadata, sport: e.target.value })} placeholder="Baseball" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="form-label">Source (optional)</label>
                      <input className="form-input" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Vendor / Script / Manual" />
                    </div>
                  </div>
                  <div className="mb-8">
                    <label className="form-label">CSV File</label>
                    <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </div>
                </>
              )}

              {isJson && (
                <div className="space-y-3 mb-10">
                  <div className="flex items-center justify-between">
                    <label className="form-label" style={{ marginBottom: 0 }}>ImportBatchPayload JSON</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCopyJSON}
                        disabled={!jsonText}
                        className="text-xs px-3 py-1.5 rounded border border-gray-600 bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                      >{copyState === 'copied' ? 'Copied!' : 'Copy JSON'}</button>
                      {preview && mode==='json' && (
                        <button
                          type="button"
                          onClick={handleStage}
                          disabled={stageMutation.isPending || stageLoading}
                          className="text-xs px-3 py-1.5 rounded border border-emerald-600 bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50"
                        >{stageMutation.isPending || stageLoading ? 'Staging…' : 'Stage'}</button>
                      )}
                    </div>
                  </div>
                  <textarea
                    className="w-full h-80 p-4 rounded bg-[var(--bg-tertiary)] text-sm font-mono border"
                    style={{ borderColor: 'var(--border-primary)', lineHeight: '1.4' }}
                    placeholder={`{\n  "metadata": { ... },\n  "items": []\n}`}
                    value={jsonText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonText(e.target.value)}
                  />
                  <p className="text-xs text-[var(--text-secondary)]">Auto-filled from upload. Edit if necessary before staging.</p>
                </div>
              )}

              <div className="flex gap-4 flex-wrap">
                <button
                  className="dashboard-card-button"
                  style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))', width: 'auto', padding: '12px 26px', fontSize: '13px' }}
                  disabled={uploadCsvMutation.isPending || uploadJsonMutation.isPending}
                  onClick={handleUpload}
                >
                  {uploadCsvMutation.isPending || uploadJsonMutation.isPending ? 'Uploading…' : 'Upload & Preview'}
                </button>
                {/* Stage button moved into JSON header when in JSON mode; keep here as fallback when preview exists and not switched yet */}
                {preview && !isJson && (
                  <button
                    className="dashboard-card-button"
                    style={{ background: 'linear-gradient(135deg, #059669, #047857)', width: 'auto', padding: '12px 26px', fontSize: '13px' }}
                    disabled={stageMutation.isPending || stageLoading}
                    onClick={handleStage}
                  >
                    {stageMutation.isPending || stageLoading ? 'Staging…' : 'Stage Import'}
                  </button>
                )}
              </div>
              {error && <div className="mt-6 alert alert-error text-sm" style={{ marginBottom: 0 }}>{error}</div>}
            </div>

            {preview && (
              <div className="dashboard-card" style={{ cursor: 'default', padding: '36px' }}>
                <h2 className="dashboard-card-title" style={{ marginBottom: '20px', fontSize: '18px' }}>Preview Summary</h2>
                <div className="grid sm:grid-cols-3 gap-6 mb-10">
                  <Stat label="Items" value={preview.preview.totals.items} />
                  <Stat label="Distinct Players" value={preview.preview.player_names.length} />
                  <Stat label="Distinct Teams" value={preview.preview.team_names.length} />
                </div>
                <SectionChips title="Players" values={preview.preview.player_names} />
                <SectionChips title="Teams" values={preview.preview.team_names} className="mt-10" />
                <div className="mt-12">
                  <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-4 tracking-wide uppercase">Parallels By Card Type</h3>
                  <div className="space-y-6">
                    {Object.entries(preview.preview.parallels_by_card_type).map(([ct, arr]) => (
                      <div key={ct}>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-2">{ct}</div>
                        <div className="flex flex-wrap gap-2">
                          {arr.map((p,i) => (
                            <span key={ct + i} className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[11px] font-medium border" style={{ borderColor: 'var(--border-secondary)' }}>
                              {p.name}{p.print_run ? ` (#${p.print_run})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!isJson && <p className="mt-6 text-xs text-amber-500">To continue, switch to JSON mode with a normalized payload.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Workflow + Tips side by side) */}
          <div className="space-y-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="dashboard-card" style={{ cursor: 'default', padding: '28px' }}>
                <h2 className="dashboard-card-title" style={{ marginBottom: '14px', fontSize: '16px' }}>Workflow</h2>
                <ol className="text-sm text-[var(--text-secondary)] list-decimal pl-5 space-y-3">
                  <li>Upload CSV or JSON to generate a preview.</li>
                  <li>Validate distinct player & team names, counts & parallels.</li>
                  <li>Stage (JSON mode) to create a batch.</li>
                  <li>Resolve player & team names on next screen.</li>
                  <li>Commit when all names resolved.</li>
                </ol>
              </div>
              <div className="dashboard-card" style={{ cursor: 'default', padding: '28px' }}>
                <h2 className="dashboard-card-title" style={{ marginBottom: '14px', fontSize: '16px' }}>Tips</h2>
                <ul className="text-sm text-[var(--text-secondary)] space-y-3">
                  <li><strong className="text-[var(--text-tertiary)]">CSV Mode:</strong> Quick raw ingestion; staging requires JSON path.</li>
                  <li><strong className="text-[var(--text-tertiary)]">Dedup:</strong> Parallels auto-dedup per card type.</li>
                  <li><strong className="text-[var(--text-tertiary)]">Idempotent:</strong> Upserts by (set, number, type).</li>
                  <li><strong className="text-[var(--text-tertiary)]">Unresolved:</strong> Commit blocked until all names resolved.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="p-4 rounded-lg border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1">{label}</div>
    <div className="text-lg font-semibold text-[var(--text-primary)]">{value}</div>
  </div>
)

const SectionChips = ({ title, values, className = '' }: { title: string; values: string[]; className?: string }) => (
  <div className={className}>
    <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-3">{title}</h3>
    {values.length === 0 && <div className="text-xs text-[var(--text-secondary)] italic">None</div>}
    <div className="flex flex-wrap gap-2">
      {values.map(v => (
        <span key={v} className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[10px] font-medium border" style={{ borderColor: 'var(--border-secondary)' }}>{v}</span>
      ))}
    </div>
  </div>
)
