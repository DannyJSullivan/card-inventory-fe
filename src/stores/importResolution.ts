import { create } from 'zustand'
import type { ResolutionEntryState, ResolutionSelection, CardEditPayload } from '../types/imports'

// New parallel resolution types
interface ParallelResolutionEntryState {
  cardType: string
  parallelName: string
  key: string  // Combined key: `${cardType}::${parallelName}`
  kind: 'parallel'
  selection?: ParallelResolutionSelection
  dirty: boolean
  error?: string
}

type ParallelResolutionSelection =
  | { kind: 'parallel'; cardType: string; parallelName: string; existingId: number; canonical?: string }
  | { kind: 'parallel'; cardType: string; parallelName: string; create: string }

interface ImportResolutionState {
  batchId?: number
  players: Record<string, ResolutionEntryState>
  teams: Record<string, ResolutionEntryState>
  parallels: Record<string, ParallelResolutionEntryState>  // Keyed by `${cardType}::${parallelName}`
  cardEdits: Record<number, CardEditPayload>
  initialize: (batchId: number, players: string[], teams: string[], parallels?: { cardType: string; parallelName: string }[]) => void
  select: (kind: 'player' | 'team' | 'parallel', raw: string, selection: ResolutionSelection | ParallelResolutionSelection) => void
  clear: (kind: 'player' | 'team' | 'parallel', raw: string) => void
  bulkSelect: (entries: (ResolutionSelection | ParallelResolutionSelection)[]) => void
  markClean: (kind: 'player' | 'team' | 'parallel', raws: string[]) => void
  unresolvedCount: () => number
  unresolvedByKind: (kind: 'player' | 'team' | 'parallel') => number
  buildResolveRequest: () => { players?: any[]; teams?: any[]; parallels?: any[]; card_edits?: CardEditPayload[] }
  setErrors: (kind: 'player' | 'team' | 'parallel', raws: string[]) => void
  setCardEdit: (rowId: number, edit: CardEditPayload) => void
  removeCardEdit: (rowId: number) => void
  clearCardEdits: () => void
  autoSelectTop: (kind: 'player' | 'team' | 'parallel', candidatesMap: Record<string, { id: number; name: string; score: number }[]>, threshold: number) => number
  reset: () => void
}

export const useImportResolutionStore = create<ImportResolutionState>((set, get) => ({
  batchId: undefined,
  players: {},
  teams: {},
  parallels: {},
  cardEdits: {},
  initialize: (batchId, players, teams, parallels) => {
    set({
      batchId,
      players: players.reduce<Record<string, ResolutionEntryState>>((acc, name) => {
        acc[name] = { raw: name, kind: 'player', dirty: false }
        return acc
      }, {}),
      teams: teams.reduce<Record<string, ResolutionEntryState>>((acc, name) => {
        acc[name] = { raw: name, kind: 'team', dirty: false }
        return acc
      }, {}),
      parallels: (parallels || []).reduce<Record<string, ParallelResolutionEntryState>>((acc, { cardType, parallelName }) => {
        const key = `${cardType}::${parallelName}`
        acc[key] = { cardType, parallelName, key, kind: 'parallel', dirty: false }
        return acc
      }, {}),
    })
  },
  select: (kind, raw, selection) => {
    if (kind === 'parallel') {
      const parallelSelection = selection as ParallelResolutionSelection
      set((state) => ({
        parallels: {
          ...state.parallels,
          [raw]: { 
            ...state.parallels[raw], 
            cardType: parallelSelection.cardType,
            parallelName: parallelSelection.parallelName,
            key: raw,
            kind: 'parallel',
            selection: parallelSelection, 
            dirty: true, 
            error: undefined 
          },
        },
      }))
    } else {
      set((state) => ({
        [kind === 'player' ? 'players' : 'teams']: {
          ...(kind === 'player' ? state.players : state.teams),
          [raw]: { ...(kind === 'player' ? state.players[raw] : state.teams[raw]), raw, kind, selection: selection as ResolutionSelection, dirty: true, error: undefined },
        },
      }))
    }
  },
  clear: (kind, raw) => {
    if (kind === 'parallel') {
      set((state) => ({
        parallels: {
          ...state.parallels,
          [raw]: { ...state.parallels[raw], selection: undefined, dirty: false },
        },
      }))
    } else {
      set((state) => ({
        [kind === 'player' ? 'players' : 'teams']: {
          ...(kind === 'player' ? state.players : state.teams),
          [raw]: { raw, kind, dirty: false },
        },
      }))
    }
  },
  bulkSelect: (entries) => {
    set((state) => {
      const players = { ...state.players }
      const teams = { ...state.teams }
      const parallels = { ...state.parallels }
      entries.forEach(sel => {
        if (sel.kind === 'player') {
          const playerSel = sel as ResolutionSelection
          players[playerSel.raw] = { ...(players[playerSel.raw]||{raw:playerSel.raw,kind:'player',dirty:false}), raw: playerSel.raw, kind: 'player', selection: sel as ResolutionSelection, dirty: true }
        } else if (sel.kind === 'team') {
          const teamSel = sel as ResolutionSelection
          teams[teamSel.raw] = { ...(teams[teamSel.raw]||{raw:teamSel.raw,kind:'team',dirty:false}), raw: teamSel.raw, kind: 'team', selection: sel as ResolutionSelection, dirty: true }
        } else if (sel.kind === 'parallel') {
          const parallelSel = sel as ParallelResolutionSelection
          const key = `${parallelSel.cardType}::${parallelSel.parallelName}`
          parallels[key] = { 
            ...(parallels[key] || { cardType: parallelSel.cardType, parallelName: parallelSel.parallelName, key, kind: 'parallel', dirty: false }),
            selection: parallelSel, 
            dirty: true 
          }
        }
      })
      return { players, teams, parallels }
    })
  },
  markClean: (kind, raws) => {
    if (kind === 'parallel') {
      set((state) => {
        const parallels = { ...state.parallels }
        raws.forEach((r) => {
          if (parallels[r]) parallels[r] = { ...parallels[r], dirty: false }
        })
        return { parallels }
      })
    } else {
      set((state) => {
        const map = { ...(kind === 'player' ? state.players : state.teams) }
        raws.forEach((r) => {
          if (map[r]) map[r] = { ...map[r], dirty: false }
        })
        return { [kind === 'player' ? 'players' : 'teams']: map } as any
      })
    }
  },
  unresolvedCount: () => {
    const { players, teams, parallels } = get()
    return Object.values(players).filter(p => !p.selection).length + 
           Object.values(teams).filter(t => !t.selection).length +
           Object.values(parallels).filter(p => !p.selection).length
  },
  unresolvedByKind: (kind) => {
    const map = kind === 'player' ? get().players : kind === 'team' ? get().teams : get().parallels
    return Object.values(map).filter(e => !e.selection).length
  },
  buildResolveRequest: () => {
    const { players, teams, parallels, cardEdits } = get()
    const playerEntries = Object.values(players).filter((p) => p.dirty && p.selection)
    const teamEntries = Object.values(teams).filter((t) => t.dirty && t.selection)
    const parallelEntries = Object.values(parallels).filter((p) => p.dirty && p.selection)

    const playersPayload = playerEntries.map((e) => {
      if (!e.selection) return null
      if ('existingId' in e.selection) return { name: e.raw, player_id: e.selection.existingId }
      if ('create' in e.selection) return { name: e.raw, create_if_missing: { full_name: e.selection.create } }
      return null
    }).filter(Boolean)

    const teamsPayload = teamEntries.map((e) => {
      if (!e.selection) return null
      if ('existingId' in e.selection) return { name: e.raw, team_id: e.selection.existingId }
      if ('create' in e.selection) return { name: e.raw, create_if_missing: { name: e.selection.create } }
      return null
    }).filter(Boolean)

    const parallelsPayload = parallelEntries.map((e) => {
      if (!e.selection) return null
      if ('existingId' in e.selection) return { 
        card_type: e.cardType, 
        name: e.parallelName, 
        parallel_type_id: e.selection.existingId 
      }
      if ('create' in e.selection) return { 
        card_type: e.cardType, 
        name: e.parallelName, 
        create_if_missing: { name: e.selection.create } 
      }
      return null
    }).filter(Boolean)

    const editsPayload = Object.values(cardEdits)

    const body: any = {}
    if (playersPayload.length) body.players = playersPayload
    if (teamsPayload.length) body.teams = teamsPayload
    if (parallelsPayload.length) body.parallels = parallelsPayload
    if (editsPayload.length) body.card_edits = editsPayload
    return body
  },
  setErrors: (kind, raws) => {
    if (kind === 'parallel') {
      set((state) => {
        const parallels = { ...state.parallels }
        raws.forEach(r => { if (parallels[r]) parallels[r] = { ...parallels[r], error: 'Unresolved' } })
        return { parallels }
      })
    } else {
      set((state) => {
        const map = { ...(kind === 'player' ? state.players : state.teams) }
        raws.forEach(r => { if (map[r]) map[r] = { ...map[r], error: 'Unresolved' } })
        return { [kind === 'player' ? 'players' : 'teams']: map } as any
      })
    }
  },
  setCardEdit: (rowId, edit) => set(state => ({ cardEdits: { ...state.cardEdits, [rowId]: edit } })),
  removeCardEdit: (rowId) => set(state => { const ce = { ...state.cardEdits }; delete ce[rowId]; return { cardEdits: ce } }),
  clearCardEdits: () => set({ cardEdits: {} }),
  autoSelectTop: (kind, candidatesMap, threshold) => {
    if (kind === 'parallel') {
      const parallels = get().parallels
      const selections: ParallelResolutionSelection[] = []
      Object.keys(parallels).forEach(key => {
        const entry = parallels[key]
        if (entry.selection) return
        const candidates = candidatesMap[key] || []
        if (!candidates.length) return
        const top = candidates[0]
        const score = top.score <= 1 ? top.score * 100 : top.score
        if (score >= threshold) {
          selections.push({ 
            kind: 'parallel', 
            cardType: entry.cardType, 
            parallelName: entry.parallelName, 
            existingId: top.id, 
            canonical: top.name 
          })
        }
      })
      get().bulkSelect(selections)
      return selections.length
    } else {
      const map = kind === 'player' ? get().players : get().teams
      const selections: ResolutionSelection[] = []
      Object.keys(map).forEach(raw => {
        const entry = map[raw]
        if (entry.selection) return
        const candidates = candidatesMap[raw] || []
        if (!candidates.length) return
        const top = candidates[0]
        const score = top.score <= 1 ? top.score * 100 : top.score
        if (score >= threshold) {
          if (kind === 'player') selections.push({ kind: 'player', raw, existingId: top.id, canonical: top.name })
          else selections.push({ kind: 'team', raw, existingId: top.id, canonical: top.name })
        }
      })
      get().bulkSelect(selections)
      return selections.length
    }
  },
  reset: () => set({ batchId: undefined, players: {}, teams: {}, parallels: {}, cardEdits: {} }),
}))

// Export parallel types for use in other components
export type { ParallelResolutionEntryState, ParallelResolutionSelection }
