import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { importService } from '../services/imports'
import { useImportResolutionStore } from '../stores/importResolution'
import type { Candidate, CardRow, CardEditPayload, ImportPlayerRef, ImportParallelRef } from '../types/imports'
import { AppNavbar } from '../components/ui/AppNavbar'
import { createPortal } from 'react-dom'

interface NameResolutionListProps {
  kind: 'player' | 'team'
  rawNames: string[]
  candidatesMap: Record<string, Candidate[]>
  onEdit: (kind: 'player' | 'team', raw: string) => void
}

const NameResolutionList = ({ kind, rawNames, candidatesMap, onEdit }: NameResolutionListProps) => {
  const { select, players, teams, clear } = useImportResolutionStore()
  const map = kind === 'player' ? players : teams
  const [filter, setFilter] = useState<'all' | 'unresolved'>('all')
  const [inlineNew, setInlineNew] = useState<Record<string, boolean>>({})
  const filtered = filter === 'unresolved' ? rawNames.filter(r => !map[r]?.selection) : rawNames

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2 text-xs">
          <button
            className={`px-2 py-1 rounded border ${filter==='all' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
            onClick={() => setFilter('all')}
          >All</button>
          <button
            className={`px-2 py-1 rounded border ${filter==='unresolved' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
            onClick={() => setFilter('unresolved')}
          >Unresolved</button>
        </div>
        <div className="text-[11px] text-gray-400">{filtered.length} shown</div>
      </div>
      {filtered.map((raw) => {
        const state = map[raw]
        const candidates = candidatesMap[raw] || []
        const error = state?.error
        const hasSelection = !!state?.selection
        return (
          <div key={raw} className={`p-3 rounded border ${error ? 'border-red-500 bg-red-500/10' : 'border-gray-700 bg-gray-800'}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <button onClick={()=>onEdit(kind, raw)} className="font-medium text-sm flex items-center gap-2 hover:underline">
                  {raw}
                  {hasSelection && <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">Resolved</span>}
                  {!hasSelection && <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-600/30 text-amber-300 border border-amber-500/40">Pending</span>}
                  {error && <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-red-600/40 text-red-200 border border-red-500/40">Error</span>}
                </button>
                {state?.selection && 'create' in state.selection && (
                  <div className="mt-1 text-[11px] text-gray-400">New: {state.selection.create}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={()=>onEdit(kind, raw)}
                  className="text-[10px] px-2 py-1 rounded bg-blue-700/50 hover:bg-blue-600 border border-blue-600 text-blue-100"
                >Edit</button>
                {hasSelection && (
                  <button
                    onClick={() => clear(kind, raw)}
                    className="text-[10px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300"
                  >Clear</button>
                )}
                {!inlineNew[raw] && (
                  <button
                    onClick={() => setInlineNew(prev => ({ ...prev, [raw]: true }))}
                    className="text-[10px] px-2 py-1 rounded bg-emerald-700/40 border border-emerald-600 hover:border-emerald-500 text-emerald-300"
                  >New</button>
                )}
              </div>
            </div>
            {inlineNew[raw] && !hasSelection && (
              <InlineNewForm
                raw={raw}
                kind={kind}
                onCancel={() => setInlineNew(p => { const c={...p}; delete c[raw]; return c })}
                onCreate={(val) => { select(kind, raw, kind==='player' ? { kind: 'player', raw, create: val } : { kind: 'team', raw, create: val }); setInlineNew(p => { const c={...p}; delete c[raw]; return c }) }}
              />
            )}
            <div className="flex flex-wrap gap-2">
              {candidates.map((c) => {
                const selected = state?.selection && 'existingId' in state.selection && state.selection.existingId === c.id
                const selection = kind === 'player'
                  ? { kind: 'player' as const, raw, existingId: c.id, canonical: c.name }
                  : { kind: 'team' as const, raw, existingId: c.id, canonical: c.name }
                return (
                  <button
                    key={c.id}
                    onClick={() => select(kind, raw, selection)}
                    className={`px-2 py-1 rounded text-[11px] border transition ${selected ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600 hover:border-gray-500'}`}
                    title={`Score: ${c.score}`}
                  >
                    {c.name}
                    <span className="ml-1 text-[9px] opacity-60">{c.score}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const InlineNewForm = ({ raw, onCancel, onCreate }: { raw: string; kind: 'player' | 'team'; onCancel: () => void; onCreate: (val: string) => void }) => {
  const [val, setVal] = useState(raw)
  return (
    <div className="mb-2 flex items-center gap-2">
      <input value={val} onChange={(e)=>setVal(e.target.value)} className="form-input text-[12px] py-1" style={{ maxWidth: '220px' }} />
      <button onClick={()=>onCreate(val)} className="text-[11px] px-2 py-1 rounded bg-emerald-600 text-white">Add</button>
      <button onClick={onCancel} className="text-[11px] px-2 py-1 rounded bg-gray-600 text-white">Cancel</button>
    </div>
  )
}

// Player / Team Edit Modal
interface PlayerTeamEditModalProps {
  kind: 'player' | 'team'
  raw: string
  candidates: Candidate[]
  currentSelection?: any
  onSelectExisting: (id: number, name: string) => void
  onCreateNew: (name: string) => void
  onClose: () => void
}
const PlayerTeamEditModal = ({ kind, raw, candidates, currentSelection, onSelectExisting, onCreateNew, onClose }: PlayerTeamEditModalProps) => {
  const [mode, setMode] = useState<'existing' | 'new'>(currentSelection && 'existingId' in currentSelection ? 'existing' : 'new')
  const [newName, setNewName] = useState(currentSelection && 'create' in currentSelection ? currentSelection.create : raw)

  const modalBody = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg w-full max-w-xl p-6 shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit {kind === 'player' ? 'Player' : 'Team'}: <span className="text-blue-400">{raw}</span></h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-sm">Close</button>
        </div>
        <div className="space-y-6">
          <div className="flex gap-4 text-xs">
            <button onClick={()=>setMode('existing')} className={`px-3 py-1.5 rounded border ${mode==='existing' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>Link Existing</button>
            <button onClick={()=>setMode('new')} className={`px-3 py-1.5 rounded border ${mode==='new' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>Create New</button>
          </div>
          {mode === 'existing' && (
            <div className="space-y-3">
              <div className="text-[11px] text-gray-400">Select the best match from candidates (score shows confidence).</div>
              <div className="flex flex-wrap gap-2">
                {candidates.map(c => {
                  const selected = currentSelection && 'existingId' in currentSelection && currentSelection.existingId === c.id
                  return (
                    <button key={c.id} onClick={()=>onSelectExisting(c.id, c.name)} className={`px-2 py-1 rounded text-[11px] border ${selected ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600 hover:border-gray-500'}`}>{c.name}<span className="ml-1 opacity-60">{c.score}</span></button>
                  )
                })}
                {candidates.length===0 && <div className="text-[11px] text-gray-500">No candidates</div>}
              </div>
            </div>
          )}
          {mode === 'new' && (
            <div className="space-y-2">
              <label className="text-[11px] text-gray-400 block">Canonical Name</label>
              <input value={newName} onChange={e=>setNewName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm" />
              <div className="text-[11px] text-gray-500">A new {kind} will be created or alias added on commit.</div>
              <button disabled={!newName.trim()} onClick={()=>onCreateNew(newName.trim())} className="mt-2 px-3 py-2 rounded bg-emerald-600 disabled:opacity-40 text-white text-xs">Use New Name</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
  if (typeof document === 'undefined') return null
  return createPortal(modalBody, document.body)
}

// Card Edit Modal
interface CardEditModalProps {
  row: CardRow
  existingEdit?: CardEditPayload
  onSave: (edit: CardEditPayload) => void
  onRemove?: () => void
  onClose: () => void
}
const CardEditModal = ({ row, existingEdit, onSave, onRemove, onClose }: CardEditModalProps) => {
  const base = row.data
  const [cardNumber, setCardNumber] = useState(existingEdit?.card_number ?? base.card_number)
  const [cardType, setCardType] = useState(existingEdit?.card_type ?? base.card_type)
  const [title, setTitle] = useState(existingEdit?.title ?? base.title ?? '')
  const [subset, setSubset] = useState(existingEdit?.subset ?? base.subset ?? '')
  const [notes, setNotes] = useState(existingEdit?.notes ?? base.notes ?? '')
  const [isRookie, setIsRookie] = useState(existingEdit?.is_rookie ?? base.is_rookie)
  const [isFirst, setIsFirst] = useState(existingEdit?.is_first ?? base.is_first)
  const [isAutograph, setIsAutograph] = useState(existingEdit?.is_autograph ?? base.is_autograph)
  const [players, setPlayers] = useState<ImportPlayerRef[]>(existingEdit?.players ?? base.players)
  const [parallels, setParallels] = useState<ImportParallelRef[]>(existingEdit?.parallels ?? base.parallels)

  const addPlayer = () => setPlayers(p=>[...p,{ name:'', team_name:'' }])
  const updatePlayer = (i:number, field:keyof ImportPlayerRef, value:string) => setPlayers(p=>p.map((pl,idx)=> idx===i? {...pl,[field]:value}:pl))
  const removePlayer = (i:number) => setPlayers(p=>p.filter((_,idx)=>idx!==i))

  const addParallel = () => setParallels(p=>[...p,{ name:'', print_run: undefined }])
  const updateParallel = (i:number, field:keyof ImportParallelRef, value:any) => setParallels(p=>p.map((pl,idx)=> idx===i? {...pl,[field]: value === '' ? undefined : value}:pl))
  const removeParallel = (i:number) => setParallels(p=>p.filter((_,idx)=>idx!==i))

  const buildEdit = (): CardEditPayload => {
    const edit: CardEditPayload = { row_id: row.row_id }
    if (cardNumber !== base.card_number) edit.card_number = cardNumber || undefined
    if (cardType !== base.card_type) edit.card_type = cardType
    if (title !== (base.title||'')) edit.title = title ? title : null
    if (subset !== (base.subset||'')) edit.subset = subset ? subset : null
    if (notes !== (base.notes||'')) edit.notes = notes ? notes : null
    if (isRookie !== base.is_rookie) edit.is_rookie = isRookie
    if (isFirst !== base.is_first) edit.is_first = isFirst
    if (isAutograph !== base.is_autograph) edit.is_autograph = isAutograph
    if (JSON.stringify(players) !== JSON.stringify(base.players)) edit.players = players
    if (JSON.stringify(parallels) !== JSON.stringify(base.parallels)) edit.parallels = parallels
    return edit
  }

  const nothingChanged = useMemo(()=>{
    const e = buildEdit()
    return Object.keys(e).length === 1 // only row_id
  }, [cardNumber, cardType, title, subset, notes, isRookie, isFirst, isAutograph, players, parallels])

  const modalBody = (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl p-6 my-10 shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Card Row #{row.row_index}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-sm">Close</button>
        </div>
        <div className="grid md:grid-cols-2 gap-8 text-sm">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Card Number</label>
              <input value={cardNumber||''} onChange={e=>setCardNumber(e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Card Type</label>
              <input value={cardType} onChange={e=>setCardType(e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Subset</label>
              <input value={subset} onChange={e=>setSubset(e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Notes</label>
              <textarea value={notes||''} onChange={e=>setNotes(e.target.value)} rows={4} className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <label className="flex items-center gap-2 text-[11px] font-medium text-gray-300"><input type="checkbox" checked={isRookie||false} onChange={e=>setIsRookie(e.target.checked)} className="accent-blue-600" /> Rookie</label>
              <label className="flex items-center gap-2 text-[11px] font-medium text-gray-300"><input type="checkbox" checked={isFirst||false} onChange={e=>setIsFirst(e.target.checked)} className="accent-blue-600" /> First</label>
              <label className="flex items-center gap-2 text-[11px] font-medium text-gray-300"><input type="checkbox" checked={isAutograph||false} onChange={e=>setIsAutograph(e.target.checked)} className="accent-blue-600" /> Auto</label>
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Players</h4>
                <button onClick={addPlayer} className="text-[10px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600">Add</button>
              </div>
              <div className="space-y-3 max-h-52 overflow-auto pr-1">
                {players.map((pl,i)=>(
                  <div key={i} className="p-2 rounded bg-gray-800 border border-gray-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={pl.name} onChange={e=>updatePlayer(i,'name',e.target.value)} placeholder="Name" className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[11px]" />
                      <input value={pl.team_name} onChange={e=>updatePlayer(i,'team_name',e.target.value)} placeholder="Team" className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[11px]" />
                      <button onClick={()=>removePlayer(i)} className="text-[10px] px-1.5 py-1 rounded bg-red-600/60 hover:bg-red-600 text-white">✕</button>
                    </div>
                  </div>
                ))}
                {players.length===0 && <div className="text-[11px] text-gray-500">No players</div>}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Parallels</h4>
                <button onClick={addParallel} className="text-[10px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600">Add</button>
              </div>
              <div className="space-y-3 max-h-52 overflow-auto pr-1">
                {parallels.map((pl,i)=>(
                  <div key={i} className="p-2 rounded bg-gray-800 border border-gray-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={pl.name} onChange={e=>updateParallel(i,'name',e.target.value)} placeholder="Name" className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[11px]" />
                      <input value={pl.print_run ?? ''} onChange={e=>updateParallel(i,'print_run', e.target.value===''? '' : Number(e.target.value))} placeholder="Print Run" className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[11px]" />
                      <button onClick={()=>removeParallel(i)} className="text-[10px] px-1.5 py-1 rounded bg-red-600/60 hover:bg-red-600 text-white">✕</button>
                    </div>
                  </div>
                ))}
                {parallels.length===0 && <div className="text-[11px] text-gray-500">No parallels</div>}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <div className="text-[11px] text-gray-500">{nothingChanged ? 'No changes' : 'Unsaved changes ready'}</div>
          <div className="flex gap-3">
            {!!existingEdit && <button onClick={onRemove} className="px-4 py-2 rounded bg-red-600/70 hover:bg-red-600 text-white text-xs">Remove Edit</button>}
            <button disabled={nothingChanged} onClick={()=> onSave(buildEdit())} className="px-4 py-2 rounded bg-blue-600 disabled:opacity-40 text-white text-xs">Save Edit</button>
          </div>
        </div>
      </div>
    </div>
  )
  if (typeof document === 'undefined') return null
  return createPortal(modalBody, document.body)
}

export const ImportResolvePage = () => {
  const { batchId } = useParams<{ batchId: string }>()
  const idNum = Number(batchId)
  const { initialize, players, teams, unresolvedCount, buildResolveRequest, markClean, setErrors, unresolvedByKind, autoSelectTop, setCardEdit, removeCardEdit, cardEdits } = useImportResolutionStore()
  const [showParallels, setShowParallels] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [commitResult, setCommitResult] = useState<any>(null)
  const [activeEdit, setActiveEdit] = useState<{ type: 'player' | 'team' | 'card'; target: any } | null>(null)
  const [autoThreshold, setAutoThreshold] = useState(98)
  const groupsQuery = useQuery({
    queryKey: ['import', 'batch', idNum, 'groups'],
    queryFn: () => importService.getPreviewGroups(idNum),
    enabled: !!idNum,
  })
  const cardRowsQuery = useQuery({
    queryKey: ['import','batch', idNum, 'rows'],
    queryFn: () => importService.getCardRows(idNum),
    enabled: !!idNum,
  })
  useEffect(() => {
    if (groupsQuery.data) {
      initialize(idNum, groupsQuery.data.player_names, groupsQuery.data.team_names)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsQuery.data])

  const resolveMutation = useMutation({
    mutationFn: async () => {
      const body = buildResolveRequest()
      if (!body.players && !body.teams && !body.card_edits) throw new Error('No pending changes')
      return importService.resolve(idNum, body)
    },
    onSuccess: () => {
      const dirtyPlayers = Object.values(players).filter(p => p.dirty).map(p => p.raw)
      const dirtyTeams = Object.values(teams).filter(t => t.dirty).map(t => t.raw)
      markClean('player', dirtyPlayers)
      markClean('team', dirtyTeams)
    },
  })

  const commitMutation = useMutation({
    mutationFn: () => importService.commit(idNum),
    onSuccess: (data) => {
      setCommitResult(data)
      setShowSummary(true)
    },
    onError: async (e: any) => {
      const msg = e.message || 'Commit failed'
      if (/unresolved/i.test(msg)) {
        // try to extract names in brackets or quotes
        const names = msg.match(/\[(.*?)\]/)?.[1]?.split(',').map((s: string) => s.replace(/['"\s]/g,'')) || []
        setErrors('player', names)
        setErrors('team', names)
      }
      alert(msg)
    }
  })

  useEffect(()=>{ if(activeEdit) console.debug('Opening edit modal', activeEdit) }, [activeEdit])

  if (groupsQuery.isLoading) return <div className="p-6">Loading groups...</div>
  if (groupsQuery.error) return <div className="p-6 text-red-500 text-sm">Error loading groups</div>
  if (!groupsQuery.data) return null

  const groups = groupsQuery.data
  const unresolved = unresolvedCount()
  const commitDisabled = unresolved > 0 || resolveMutation.isPending || commitMutation.isPending
  const playerUnresolved = unresolvedByKind('player')
  const teamUnresolved = unresolvedByKind('team')

  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar title="Resolve Import" subtitle={`Batch ${idNum}`} />
      <div className="p-6 max-w-7xl mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Resolve Names</h1>
            <p className="text-sm text-gray-400 mt-1">Batch {idNum} • {groups.metadata.brand} {groups.metadata.set_name} {groups.metadata.year}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => resolveMutation.mutate()} disabled={resolveMutation.isPending} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 text-sm">
              {resolveMutation.isPending ? 'Applying…' : 'Apply Changes'}
            </button>
            <button onClick={() => commitMutation.mutate()} disabled={commitDisabled} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50 text-sm">
              {commitMutation.isPending ? 'Committing…' : `Commit (${unresolved} unresolved)`}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-gray-400">Auto-select threshold</label>
            <input type="number" min={50} max={100} value={autoThreshold} onChange={e=>setAutoThreshold(Number(e.target.value))} className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1" />
            <button
              onClick={() => {
                const p = autoSelectTop('player', groups.player_candidates, autoThreshold)
                const t = autoSelectTop('team', groups.team_candidates, autoThreshold)
                if (!p && !t) alert('No matches met threshold')
              }}
              className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs"
            >Auto-select All</button>
          </div>
          <div className="text-[11px] text-gray-500">High confidence matches (≥ threshold) will be picked.</div>
        </div>

        <div className="grid lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 space-y-12">
            <section>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="font-semibold text-lg">Players <span className="text-sm text-gray-500 font-normal">({playerUnresolved} unresolved)</span></h2>
              </div>
              <NameResolutionList kind="player" rawNames={groups.player_names} candidatesMap={groups.player_candidates} onEdit={(k,raw)=> setActiveEdit({ type: k, target: { raw, selection: (k==='player'?players:teams)[raw]?.selection } })} />
            </section>
            <section>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="font-semibold text-lg">Teams <span className="text-sm text-gray-500 font-normal">({teamUnresolved} unresolved)</span></h2>
              </div>
              <NameResolutionList kind="team" rawNames={groups.team_names} candidatesMap={groups.team_candidates} onEdit={(k,raw)=> setActiveEdit({ type: k, target: { raw, selection: (k==='player'?players:teams)[raw]?.selection } })} />
            </section>
            <section>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="font-semibold text-lg">Card Rows {cardRowsQuery.isLoading && <span className="text-xs text-gray-500">Loading…</span>}</h2>
                {Object.keys(cardEdits).length>0 && <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">{Object.keys(cardEdits).length} edited</span>}
              </div>
              {cardRowsQuery.data && (
                <div className="rounded border border-gray-700 bg-gray-800">
                  <div className="max-h-72 overflow-auto divide-y divide-gray-700 text-xs">
                    {cardRowsQuery.data.rows.map(r => {
                      const edited = !!cardEdits[r.row_id]
                      return (
                        <div key={r.row_id} className="p-2 flex items-center gap-3 hover:bg-gray-700/40">
                          <div className="w-14 text-[11px] text-gray-500">#{r.row_index}</div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-[12px] text-gray-200">{r.data.title || r.data.card_number}</div>
                            <div className="text-[10px] text-gray-500">{r.data.card_type}</div>
                          </div>
                          {edited && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40">Edited</span>}
                          <button onClick={()=> setActiveEdit({ type: 'card', target: r })} className="text-[10px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600">Edit</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
          <aside className="space-y-6">
            <div className="p-4 rounded border border-gray-700 bg-gray-800">
              <h3 className="text-sm font-semibold mb-3">Overview</h3>
              <ul className="text-xs space-y-2 text-gray-300">
                <li><span className="text-gray-400">Players:</span> {groups.player_names.length - playerUnresolved}/{groups.player_names.length} resolved</li>
                <li><span className="text-gray-400">Teams:</span> {groups.team_names.length - teamUnresolved}/{groups.team_names.length} resolved</li>
                <li><span className="text-gray-400">Total unresolved:</span> {unresolved}</li>
              </ul>
              <button
                onClick={() => setShowParallels(v=>!v)}
                className="mt-4 w-full text-xs px-3 py-2 rounded border border-gray-600 bg-gray-700 hover:bg-gray-600"
              >{showParallels ? 'Hide Parallels' : 'Show Parallels'}</button>
            </div>
            {showParallels && (
              <div className="p-4 rounded border border-gray-700 bg-gray-800 max-h-[420px] overflow-auto">
                <h3 className="text-sm font-semibold mb-3">Parallels</h3>
                <div className="space-y-4">
                  {Object.entries(groups.parallels_by_card_type).map(([ct, arr]) => (
                    <div key={ct}>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{ct}</div>
                      <div className="flex flex-wrap gap-1">
                        {arr.map((p,i) => (
                          <span key={ct+i} className="px-2 py-0.5 bg-gray-700 rounded text-[10px] border border-gray-600">{p.name}{p.print_run ? ` (#${p.print_run})` : ''}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="p-4 rounded border border-gray-700 bg-gray-800 text-xs text-gray-300">
              <h3 className="text-sm font-semibold mb-3">Tips</h3>
              <ul className="space-y-2">
                <li>Click a raw name to open its edit modal.</li>
                <li>Card row edits saved via Apply (resolve) before commit.</li>
                <li>Auto-select picks high-confidence matches only.</li>
              </ul>
            </div>
          </aside>
        </div>

        {showSummary && commitResult && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Commit Summary</h2>
              <ul className="text-sm text-gray-300 space-y-2 mb-6">
                <li><span className="text-gray-400">Cards:</span> {commitResult.cards}</li>
                <li><span className="text-gray-400">Parallels:</span> {commitResult.parallels}</li>
                <li><span className="text-gray-400">Players Linked:</span> {commitResult.card_players}</li>
                <li><span className="text-gray-400">Teams Linked:</span> {commitResult.card_teams}</li>
              </ul>
              <div className="flex justify-end gap-3">
                <button onClick={()=>setShowSummary(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">Close</button>
                <button onClick={()=>{ setShowSummary(false); window.location.href='/admin' }} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm">Admin Home</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Editing Modals */}
      {activeEdit && activeEdit.type !== 'card' && (
        <PlayerTeamEditModal
          kind={activeEdit.type as 'player' | 'team'}
          raw={activeEdit.target.raw}
          candidates={activeEdit.type==='player' ? groups.player_candidates[activeEdit.target.raw]||[] : groups.team_candidates[activeEdit.target.raw]||[]}
          currentSelection={activeEdit.target.selection}
          onSelectExisting={(id,name)=>{ useImportResolutionStore.getState().select(activeEdit.type as any, activeEdit.target.raw, { kind: activeEdit.type as any, raw: activeEdit.target.raw, existingId: id, canonical: name }); setActiveEdit(null) }}
          onCreateNew={(name)=>{ useImportResolutionStore.getState().select(activeEdit.type as any, activeEdit.target.raw, { kind: activeEdit.type as any, raw: activeEdit.target.raw, create: name }); setActiveEdit(null) }}
          onClose={()=>setActiveEdit(null)}
        />
      )}
      {activeEdit && activeEdit.type==='card' && (
        <CardEditModal
          row={activeEdit.target as CardRow}
          existingEdit={cardEdits[(activeEdit.target as CardRow).row_id]}
          onSave={(edit)=>{ setCardEdit(edit.row_id, edit); setActiveEdit(null) }}
          onRemove={()=>{ removeCardEdit((activeEdit.target as CardRow).row_id); setActiveEdit(null) }}
          onClose={()=>setActiveEdit(null)}
        />
      )}
    </div>
  )
}
