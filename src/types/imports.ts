// Types related to the admin import workflow

export interface ImportBatchMetadata {
  brand: string
  set_name: string
  year: number
  sport: string
  source?: string | null
}

export interface ImportPlayerRef {
  name: string
  team_name: string
}

export interface ImportParallelRef {
  name: string
  print_run?: number | null
  original_print_run_text?: string | null
}

export interface ImportItem {
  row_index?: number | null
  card_number: string // preserve leading zeros
  card_type: string
  title?: string | null
  subset?: string | null
  notes?: string | null
  is_rookie: boolean
  is_first: boolean
  is_autograph: boolean
  players: ImportPlayerRef[]
  parallels: ImportParallelRef[]
}

export interface ImportBatchPayload {
  metadata: ImportBatchMetadata
  items: ImportItem[]
}

// Card row (staged row) returned for editing
export interface CardRow {
  row_id: number
  row_index: number
  data: ImportItem
  resolution_status: string
}

// Partial edit payload for a single card row. Only provided fields are updated.
export interface CardEditPayload {
  row_id: number
  card_number?: string
  card_type?: string
  title?: string | null
  subset?: string | null
  notes?: string | null
  is_rookie?: boolean
  is_first?: boolean
  is_autograph?: boolean
  players?: ImportPlayerRef[]
  parallels?: ImportParallelRef[]
}

export interface ParallelInfo {
  name: string
  print_run?: number | null
  original_print_run_text?: string | null
}

export interface Candidate {
  id: number
  name: string
  score: number // 0-100
}

export interface PreviewData {
  totals: {
    items: number
    players: number
    teams: number
  }
  player_names: string[]
  team_names: string[]
  parallels_by_card_type: Record<string, ParallelInfo[]>
}

export interface UploadPreviewResponse {
  batch: ImportBatchPayload
  preview: PreviewData
}

export interface PreviewGroups {
  metadata: ImportBatchMetadata
  player_names: string[]
  team_names: string[]
  parallels_by_card_type: Record<string, ParallelInfo[]>
  player_candidates: Record<string, Candidate[]>
  team_candidates: Record<string, Candidate[]>
}

export interface ResolveExistingPlayer {
  name: string // raw name
  player_id: number
}
export interface ResolveNewPlayer {
  name: string // raw name
  create_if_missing: { full_name: string }
}
export type ResolvePlayer = ResolveExistingPlayer | ResolveNewPlayer

export interface ResolveExistingTeam {
  name: string
  team_id: number
}
export interface ResolveNewTeam {
  name: string
  create_if_missing: { name: string }
}
export type ResolveTeam = ResolveExistingTeam | ResolveNewTeam

export interface ResolveRequest {
  players?: ResolvePlayer[]
  teams?: ResolveTeam[]
  card_edits?: CardEditPayload[]
}

export interface ResolveResponse {
  players_created: number
  teams_created: number
  aliases_added: number
  cards_edited?: number
}

export interface CommitResult {
  cards: number
  card_players: number
  card_teams: number
  parallels: number
}

// Local UI state types
export type ResolutionSelection =
  | { kind: 'player'; raw: string; existingId: number; canonical?: string }
  | { kind: 'player'; raw: string; create: string }
  | { kind: 'team'; raw: string; existingId: number; canonical?: string }
  | { kind: 'team'; raw: string; create: string }

export interface ResolutionEntryState {
  raw: string
  kind: 'player' | 'team'
  selection?: ResolutionSelection
  dirty: boolean
  error?: string
}

export interface PendingBatchSummary {
  batch_id: number
  brand: string
  set_name: string
  year: number
  sport: string
  source?: string | null
  status: string
  created_at: string
  total_rows: number
  unresolved_rows: number
  resolved_rows: number
  completion_percentage: number
}

export interface PendingBatchesResponse {
  pending_batches: PendingBatchSummary[]
  total_batches: number
}

export interface BatchDetailsResponse {
  batch_id: number
  brand: string
  set_name: string
  year: number
  sport: string
  source?: string | null
  status: string
  created_at: string
  counts: Record<string, number>
  row_status: {
    total_rows: number
    unresolved_rows: number
    resolved_rows: number
    completion_percentage: number
  }
  ready_to_commit: boolean
}
