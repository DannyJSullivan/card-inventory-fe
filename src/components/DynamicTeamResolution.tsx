import { useState } from 'react'
import { useTeamCandidateSearch } from '../hooks/useCandidateSearch'
import type { ResolutionEntryState } from '../types/imports'

interface DynamicTeamResolutionProps {
  teamName: string
  sport: string
  teamState?: ResolutionEntryState
  onSelect: (kind: 'player' | 'team', raw: string, selection: any) => void
  onClear: (kind: 'player' | 'team', raw: string) => void
}

export const DynamicTeamResolution = ({
  teamName,
  sport,
  teamState,
  onSelect,
  onClear
}: DynamicTeamResolutionProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const { candidates, isSearching, error, search, clearResults } = useTeamCandidateSearch({ 
    sport,
    debounceMs: 500,
    limit: 8
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    search(query)
  }

  const handleSelectCandidate = (candidate: any) => {
    onSelect('team', teamName, { 
      kind: 'team', 
      raw: teamName, 
      existingId: candidate.id, 
      canonical: candidate.name 
    })
    setShowSearch(false)
    setSearchQuery('')
    clearResults()
  }

  const handleCreateNew = () => {
    onSelect('team', teamName, { 
      kind: 'team', 
      raw: teamName, 
      create: teamName 
    })
    setShowSearch(false)
    setSearchQuery('')
    clearResults()
  }

  const isLinked = teamState?.selection && 'existingId' in teamState.selection
  const isCreatingNew = teamState?.selection && 'create' in teamState.selection
  const unresolved = !teamState?.selection

  return (
    <div style={{ 
      padding: '12px', 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-primary)', 
      borderRadius: '8px' 
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
          {teamName}
        </span>
        {isLinked && (
          <span style={{ 
            fontSize: '10px', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            backgroundColor: '#059669', 
            color: 'white', 
            fontWeight: '500' 
          }}>
            ✅ Linked
          </span>
        )}
        {isCreatingNew && (
          <span style={{ 
            fontSize: '10px', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            backgroundColor: '#2563eb', 
            color: 'white', 
            fontWeight: '500' 
          }}>
            🆕 New
          </span>
        )}
        {unresolved && (
          <span style={{ 
            fontSize: '10px', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            backgroundColor: '#d97706', 
            color: 'white', 
            fontWeight: '500' 
          }}>
            ⚠️ Pending
          </span>
        )}
      </div>

      {/* Search Input */}
      {!showSearch && unresolved && (
        <button
          onClick={() => setShowSearch(true)}
          style={{
            fontSize: '11px',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500',
            marginBottom: '8px'
          }}
        >
          🔍 Search for Match
        </button>
      )}

      {showSearch && (
        <div style={{ marginBottom: '8px' }}>
          <input
            type="text"
            placeholder={`Search for "${teamName}"...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border-secondary)',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '11px'
            }}
          />
          {isSearching && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Searching...
            </div>
          )}
          {error && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Candidates */}
      {candidates.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {candidates.map((candidate) => (
            <button 
              key={candidate.id}
              onClick={() => handleSelectCandidate(candidate)}
              style={{
                padding: '4px 8px', 
                borderRadius: '6px', 
                fontSize: '11px', 
                border: '1px solid var(--border-secondary)',
                backgroundColor: 'var(--button-bg)',
                color: 'var(--text-tertiary)',
                cursor: 'pointer'
              }}
            >
              {candidate.name} <span style={{ opacity: 0.7 }}>({candidate.score})</span>
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button 
          onClick={handleCreateNew}
          style={{
            fontSize: '11px', 
            padding: '6px 12px', 
            borderRadius: '6px', 
            backgroundColor: '#2563eb', 
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🆕 Create New
        </button>
        {teamState?.selection && (
          <button 
            onClick={() => onClear('team', teamName)}
            style={{
              fontSize: '11px', 
              padding: '6px 12px', 
              borderRadius: '6px', 
              backgroundColor: 'var(--button-bg)', 
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-secondary)',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear
          </button>
        )}
        {showSearch && (
          <button 
            onClick={() => {
              setShowSearch(false)
              setSearchQuery('')
              clearResults()
            }}
            style={{
              fontSize: '11px', 
              padding: '6px 12px', 
              borderRadius: '6px', 
              backgroundColor: 'var(--button-bg)', 
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-secondary)',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}