import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { importService } from '../services/imports'
import type { CardTypePageResponse, CardData, ImportParallelRef, CardRow, CardEditPayload } from '../types/imports'
import { Pagination } from './ui/Pagination'

interface CardTypeSectionProps {
  cardType: string
  batchId: number
  totalCards?: number
  isExpanded: boolean
  onToggle: () => void
  onEditParallels: () => void
  onApproveAll: () => void
  parallelsCount: number
  editCount: number
  unresolvedCount: number
  onApprove: (row: CardRow) => void
  onEdit: (row: CardRow) => void
  cardEdits: Record<number, CardEditPayload>
}

// Helper: parse card number for ordering (copied from ImportResolvePage)
const parseCardNum = (val: string | null | undefined): number => {
  if (!val) return Number.MAX_SAFE_INTEGER
  const m = String(val).match(/\d+/)
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER
}

// Convert CardData to CardRow format for consistency with existing code
const convertToCardRow = (cardData: CardData): CardRow => ({
  row_id: cardData.row_id,
  row_index: cardData.row_index,
  data: {
    row_index: cardData.row_index,
    card_number: cardData.card_number,
    card_type: '',  // Will be set by parent
    title: cardData.title || null,
    subset: null,
    notes: null,
    is_rookie: false,
    is_first: false,
    is_autograph: false,
    players: cardData.players || [],
    parallel_names: [],
    parallels: cardData.parallels || []
  },
  resolution_status: cardData.resolution_status
})

// Helper function to get status badge info
const getStatusInfo = (card: CardRow, existingEdit?: CardEditPayload) => {
  const isResolved = card.resolution_status === 'resolved'
  const hasEdit = !!existingEdit
  
  if (hasEdit && isResolved) return { text: '✏️ Edited & Resolved', class: 'bg-purple-500' }
  if (hasEdit) return { text: '✏️ Edited', class: 'bg-indigo-500' }
  if (isResolved) return { text: '✅ Resolved', class: 'bg-emerald-500' }
  return { text: '⚠️ Unresolved', class: 'bg-amber-500' }
}


export const CardTypeSection = ({
  cardType,
  batchId,
  totalCards = 0,
  isExpanded,
  onToggle,
  onEditParallels,
  onApproveAll,
  parallelsCount,
  editCount,
  unresolvedCount,
  onApprove,
  onEdit,
  cardEdits
}: CardTypeSectionProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 50

  // Only load data when expanded
  const { data: cardTypeData, isLoading, error } = useQuery({
    queryKey: ['import', 'cardType', batchId, cardType, currentPage],
    queryFn: () => importService.getCardTypePage(batchId, cardType, currentPage, perPage),
    enabled: isExpanded,
    placeholderData: (previousData) => previousData // Updated API for keeping previous data
  })

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleToggle = () => {
    // Reset to first page when expanding
    if (!isExpanded) {
      setCurrentPage(1)
    }
    onToggle()
  }

  // Convert CardData to CardRow format
  const cardRows: CardRow[] = (cardTypeData as CardTypePageResponse)?.group?.cards?.map((cardData: CardData) => {
    const cardRow = convertToCardRow(cardData)
    // Set the card type from section
    cardRow.data.card_type = cardType
    return cardRow
  }).sort((a, b) => parseCardNum(a.data.card_number) - parseCardNum(b.data.card_number)) || []

  return (
    <div className={`collapsible-card ${isExpanded ? 'open' : ''}`}>
      <div className="collapsible-card-header">
        <div className="collapsible-card-left">
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            aria-controls={`section-${cardType}`}
            className="collapsible-card-toggle"
            title={isExpanded ? `Collapse ${cardType}` : `Expand ${cardType}`}
          >
            <span className="collapsible-card-toggle-icon">▸</span>
          </button>
          <div className="collapsible-card-title-row">
            <h2 className="collapsible-card-title">{cardType}</h2>
            <span className="collapsible-card-badge">{totalCards || (cardTypeData as CardTypePageResponse)?.group?.total_cards || '...'} cards</span>
            <span className="collapsible-card-badge edits">{editCount} edits</span>
            <span className={`collapsible-card-badge ${unresolvedCount>0 ? 'unresolved' : 'resolved'}`}>
              {unresolvedCount>0 ? `${unresolvedCount} unresolved` : 'All resolved'}
            </span>
            <span className="collapsible-card-badge parallels">{parallelsCount} parallels</span>
          </div>
        </div>
        <div className="collapsible-card-actions">
          <button
            onClick={onEditParallels}
            className="dashboard-card-button small gradient-indigo"
          >
            ⚡ Parallels
          </button>
          <button
            onClick={onApproveAll}
            className="dashboard-card-button small gradient-emerald"
          >
            ✓ Approve All
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div
          id={`section-${cardType}`}
          className="collapsible-card-collapsible"
          role="region"
          aria-label={`${cardType} cards`}
        >
          <div className="collapsible-card-inner">
            {isLoading && (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mr-3" />
                Loading cards...
              </div>
            )}

            {error && (
              <div className="text-red-500 text-center p-8">
                Error loading cards: {error instanceof Error ? error.message : 'Unknown error'}
              </div>
            )}

            {cardTypeData && (
              <>
                {(cardTypeData as CardTypePageResponse)?.group?.parallels && (cardTypeData as CardTypePageResponse).group.parallels.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Parallels for this card type:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(cardTypeData as CardTypePageResponse).group.parallels.map((p: ImportParallelRef) => (
                        <span key={p.name} className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
                          {p.name} {p.print_run && `(${p.print_run})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Card #</th>
                        <th>Player(s)</th>
                        <th>Team(s)</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardRows.map(row => {
                        const base = row.data
                        const playerNames = Array.from(new Set((base.players||[]).map(p => p.name).filter(Boolean)))
                        const teamNames = Array.from(new Set((base.players||[]).map(p => p.team_name).filter(Boolean)))
                        const statusInfo = getStatusInfo(row, cardEdits[row.row_id])
                        
                        return (
                          <tr key={row.row_id}>
                            <td>
                              <strong>#{row.data.card_number || row.row_index}</strong>
                            </td>
                            <td>
                              {playerNames.length > 0 ? (
                                <span>
                                  {playerNames.slice(0, 2).join(', ')}
                                  {playerNames.length > 2 && <span className="text-gray-400"> +{playerNames.length - 2} more</span>}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">No players</span>
                              )}
                            </td>
                            <td>
                              {teamNames.length > 0 ? (
                                <span>
                                  {teamNames.slice(0, 2).join(', ')}
                                  {teamNames.length > 2 && <span className="text-gray-400"> +{teamNames.length - 2} more</span>}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">No teams</span>
                              )}
                            </td>
                            <td>
                              <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${statusInfo.class}`}>
                                {statusInfo.text}
                              </span>
                            </td>
                            <td>
                              <div className="admin-table-actions">
                                <button 
                                  onClick={() => onApprove(row)} 
                                  className="btn-small"
                                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none' }}
                                >
                                  ✓ Approve
                                </button>
                                <button 
                                  onClick={() => onEdit(row)} 
                                  className="btn-small btn-edit"
                                >
                                  ✏️ Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {(cardTypeData as CardTypePageResponse)?.group?.pagination && (
                  <Pagination 
                    pagination={(cardTypeData as CardTypePageResponse).group.pagination}
                    onPageChange={handlePageChange}
                    loading={isLoading}
                  />
                )}
              </>
            )}

            {cardTypeData && cardRows.length === 0 && !isLoading && (
              <div className="text-gray-400 text-center py-12 border border-dashed border-gray-700 rounded-lg">
                No cards found in this section
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}