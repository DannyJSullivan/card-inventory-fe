import { create } from 'zustand'
import type { ResolutionEntryState, ResolutionSelection, CardEditPayload } from '../types/imports'

interface ImportResolutionState {
  batchId?: number
  players: Record<string, ResolutionEntryState>
  teams: Record<string, ResolutionEntryState>
  cardEdits: Record<number, CardEditPayload>
  initialize: (batchId: number, players: string[], teams: string[]) => void
  select: (kind: 'player' | 'team', raw: string, selection: ResolutionSelection) => void
  clear: (kind: 'player' | 'team', raw: string) => void
  bulkSelect: (entries: ResolutionSelection[]) => void
  markClean: (kind: 'player' | 'team', raws: string[]) => void
  unresolvedCount: () => number
  unresolvedByKind: (kind: 'player' | 'team') => number
  buildResolveRequest: () => { players?: any[]; teams?: any[]; card_edits?: CardEditPayload[] }
  setErrors: (kind: 'player' | 'team', raws: string[]) => void
  setCardEdit: (rowId: number, edit: CardEditPayload) => void
  removeCardEdit: (rowId: number) => void
  clearCardEdits: () => void
  autoSelectTop: (kind: 'player' | 'team', candidatesMap: Record<string, { id: number; name: string; score: number }[]>, threshold: number) => number
  reset: () => void
}

export const useImportResolutionStore = create<ImportResolutionState>((set, get) => ({
  batchId: undefined,
  players: {},
  teams: {},
  cardEdits: {},
  initialize: (batchId, players, teams) => {
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
    })
  },
  select: (kind, raw, selection) => {
    set((state) => ({
      [kind === 'player' ? 'players' : 'teams']: {
        ...(kind === 'player' ? state.players : state.teams),
        [raw]: { ...(kind === 'player' ? state.players[raw] : state.teams[raw]), raw, kind, selection, dirty: true, error: undefined },
      },
    }))
  },
  clear: (kind, raw) => {
    set((state) => ({
      [kind === 'player' ? 'players' : 'teams']: {
        ...(kind === 'player' ? state.players : state.teams),
        [raw]: { raw, kind, dirty: false },
      },
    }))
  },
  bulkSelect: (entries) => {
    set((state) => {
      const players = { ...state.players }
      const teams = { ...state.teams }
      entries.forEach(sel => {
        if (sel.kind === 'player') players[sel.raw] = { ...(players[sel.raw]||{raw:sel.raw,kind:'player',dirty:false}), raw: sel.raw, kind: 'player', selection: sel, dirty: true }
        else teams[sel.raw] = { ...(teams[sel.raw]||{raw:sel.raw,kind:'team',dirty:false}), raw: sel.raw, kind: 'team', selection: sel, dirty: true }
      })
      return { players, teams }
    })
  },
  markClean: (kind, raws) => {
    set((state) => {
      const map = { ...(kind === 'player' ? state.players : state.teams) }
      raws.forEach((r) => {
        if (map[r]) map[r] = { ...map[r], dirty: false }
      })
      return { [kind === 'player' ? 'players' : 'teams']: map } as any
    })
  },
  unresolvedCount: () => {
    const { players, teams } = get()
    return Object.values(players).filter(p => !p.selection).length + Object.values(teams).filter(t => !t.selection).length
  },
  unresolvedByKind: (kind) => {
    const map = kind === 'player' ? get().players : get().teams
    return Object.values(map).filter(e => !e.selection).length
  },
  buildResolveRequest: () => {
    const { players, teams, cardEdits } = get()
    const playerEntries = Object.values(players).filter((p) => p.dirty && p.selection)
    const teamEntries = Object.values(teams).filter((t) => t.dirty && t.selection)

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

    const editsPayload = Object.values(cardEdits)

    const body: any = {}
    if (playersPayload.length) body.players = playersPayload
    if (teamsPayload.length) body.teams = teamsPayload
    if (editsPayload.length) body.card_edits = editsPayload
    return body
  },
  setErrors: (kind, raws) => {
    set((state) => {
      const map = { ...(kind === 'player' ? state.players : state.teams) }
      raws.forEach(r => { if (map[r]) map[r] = { ...map[r], error: 'Unresolved' } })
      return { [kind === 'player' ? 'players' : 'teams']: map } as any
    })
  },
  setCardEdit: (rowId, edit) => set(state => ({ cardEdits: { ...state.cardEdits, [rowId]: edit } })),
  removeCardEdit: (rowId) => set(state => { const ce = { ...state.cardEdits }; delete ce[rowId]; return { cardEdits: ce } }),
  clearCardEdits: () => set({ cardEdits: {} }),
  autoSelectTop: (kind, candidatesMap, threshold) => {
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
  },
  reset: () => set({ batchId: undefined, players: {}, teams: {}, cardEdits: {} }),
}))
