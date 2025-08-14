// Types related to the admin import workflow

export interface ImportBatchMetadata {
  brand: string
  set_name: string
  year: number
  sport: string
  release_date?: string | null // ISO date string (YYYY-MM-DD)
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
  // New: pack odds like "1:24" when known
  odds?: string | null
}

// Renamed: ImportItem -> ImportCard
export interface ImportCard {
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
  // Preferred going forward: reference parallels by name from card_types[].parallels
  parallel_names: string[]
  // Back-compat: keep legacy per-card parallels if present
  parallels?: ImportParallelRef[]
}

export interface ImportBatchPayload {
  metadata: ImportBatchMetadata
  // New authoritative list of parallels per card type
  card_types?: CardTypeParallels[]
  // Renamed: items -> cards
  cards: ImportCard[]
}

// Card row (staged row) returned for editing
export interface CardRow {
  row_id: number
  row_index: number
  data: ImportCard
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
  // Prefer setting names; keep legacy parallels for back-compat
  parallel_names?: string[]
  parallels?: ImportParallelRef[]
}

export interface ParallelInfo {
  name: string
  print_run?: number | null
  original_print_run_text?: string | null
  odds?: string | null
}

export interface Candidate {
  id: number
  name: string
  score: number // 0-100
}

export interface CardTypeParallels {
  name: string
  parallels: ImportParallelRef[]
}

export interface PreviewTotals {
  items: number
  // Allow additional counters like distinct_* without strict typing
  [key: string]: number
}

export interface PreviewData {
  // Minimal required: items (counts cards). Extras allowed via index signature.
  totals: PreviewTotals
  // Optional echo of metadata
  metadata?: ImportBatchMetadata
  player_names: string[]
  team_names: string[]
  // New structure
  card_types?: CardTypeParallels[]
  // Back-compat: some older previews may send a map
  parallels_by_card_type?: Record<string, ParallelInfo[]>
  // Optional candidate helpers (present in some previews)
  player_candidates?: Record<string, Candidate[]>
  team_candidates?: Record<string, Candidate[]>
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

// New paginated types
export interface PaginationInfo {
  page: number
  per_page: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface CardData {
  row_id: number
  row_index: number
  card_number: string
  title: string
  players: ImportPlayerRef[]
  parallels: ImportParallelRef[]
  resolution_status: "unresolved" | "resolved"
}

export interface CardTypeGroup {
  card_type: string
  total_cards: number
  parallels: ImportParallelRef[]
  cards: CardData[]
  pagination: PaginationInfo
}

export interface CardTypePageResponse {
  group: CardTypeGroup
}

export interface GroupedPreviewResponse {
  metadata: ImportBatchMetadata
  totals: {
    total_cards: number
    card_types: number
    unique_players: number
    unique_teams: number
  }
  card_types: string[]
  player_names: string[]
  team_names: string[]
  player_candidates: Record<string, Candidate[]>
  team_candidates: Record<string, Candidate[]>
}

export interface RowData {
  row_id: number
  row_index: number
  data: ImportCard
  resolution_status: "unresolved" | "resolved"
}

export interface BatchRowsResponse {
  batch_id: number
  pagination: PaginationInfo
  rows: RowData[]
}

// New card types endpoint response
export interface CardTypeInfo {
  card_type: string
  total_cards: number
  resolved_cards: number
  unresolved_cards: number
  resolution_percentage: number
  parallels: ImportParallelRef[]
}

export interface BatchCardTypesResponse {
  batch_id: number
  card_types: CardTypeInfo[]
  totals: {
    total_card_types: number
    total_cards: number
    total_resolved: number
    total_unresolved: number
    overall_completion: number
  }
}

// Batch merging types
export interface MergeBatchesRequest {
  batch_ids: number[]      // Array of batch IDs to merge (minimum 2)
  new_batch_name: string   // Name for the new merged batch
}1

export interface MergeBatchesResponse {
  new_batch_id: number
  new_batch_name: string
  merged_batches: number
  total_rows: number
  source_batch_ids: number[]
  brand: string
  set_name: string
  year: number
  sport: string
}

// Bulk card operations - updated to match backend
export interface CardEdit {
  row_id: number
  card_number?: string
  card_type?: string
  title?: string
  subset?: string
  notes?: string
  is_rookie?: boolean
  is_first?: boolean
  is_autograph?: boolean
  players?: ImportPlayerRef[]
}

export interface BulkEditResponse {
  updated_count: number
  success: boolean
}

// Card merge operations - updated to match backend
export interface MergedCardData {
  card_number: string
  title?: string
  players: ImportPlayerRef[]
}

export interface MergeCardsRequest {
  target_row_id: number
  source_row_ids: number[]
  merged_card_data: MergedCardData
}

export interface MergeCardsResponse {
  target_row_id: number
  deleted_row_ids: number[]
  success: boolean
}

// Card split operations - updated to match backend
export interface SplitCardData {
  card_number: string
  players: ImportPlayerRef[]
  inherit_attributes?: boolean // defaults to true
}

export interface SplitCardRequest {
  source_row_id: number
  split_cards: SplitCardData[] // minimum 2 cards
}

export interface SplitCardResponse {
  original_row_id: number
  new_row_ids: number[]
  success: boolean
}

// Delete card section operations  
export interface DeleteSectionResponse {
  deleted_count: number
  success: boolean
}
