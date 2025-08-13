import type { PaginationInfo } from '../../types/imports'

interface PaginationProps {
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  loading?: boolean
}

export const Pagination = ({ pagination, onPageChange, loading }: PaginationProps) => {
  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(1)}
        disabled={!pagination.has_prev || loading}
        className="pagination-button"
      >
        First
      </button>
      <button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.has_prev || loading}
        className="pagination-button"
      >
        Previous
      </button>
      <span className="pagination-info">
        Page {pagination.page} of {pagination.total_pages} ({pagination.total_items.toLocaleString()} total cards)
      </span>
      <button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={!pagination.has_next || loading}
        className="pagination-button"
      >
        Next
      </button>
      <button
        onClick={() => onPageChange(pagination.total_pages)}
        disabled={!pagination.has_next || loading}
        className="pagination-button"
      >
        Last
      </button>
    </div>
  )
}