import { useState, useEffect, useCallback } from 'react'
import { importService } from '../services/imports'
import type { Candidate } from '../types/imports'

interface UseCandidateSearchOptions {
  sport: string
  debounceMs?: number
  limit?: number
}

interface CandidateSearchResult {
  candidates: Candidate[]
  isSearching: boolean
  error: string | null
  search: (query: string) => void
  clearResults: () => void
}

export function usePlayerCandidateSearch({ 
  sport, 
  debounceMs = 500, 
  limit = 10 
}: UseCandidateSearchOptions): CandidateSearchResult {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCandidates([])
      return
    }

    setIsSearching(true)
    setError(null)

    const timeoutId = setTimeout(async () => {
      try {
        const results = await importService.searchPlayerCandidates(searchQuery, sport, limit)
        setCandidates(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setCandidates([])
      } finally {
        setIsSearching(false)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, sport, debounceMs, limit])

  const search = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const clearResults = useCallback(() => {
    setSearchQuery('')
    setCandidates([])
    setError(null)
    setIsSearching(false)
  }, [])

  return { candidates, isSearching, error, search, clearResults }
}

export function useTeamCandidateSearch({ 
  sport, 
  debounceMs = 500, 
  limit = 10 
}: UseCandidateSearchOptions): CandidateSearchResult {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCandidates([])
      return
    }

    setIsSearching(true)
    setError(null)

    const timeoutId = setTimeout(async () => {
      try {
        const results = await importService.searchTeamCandidates(searchQuery, sport, limit)
        setCandidates(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setCandidates([])
      } finally {
        setIsSearching(false)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, sport, debounceMs, limit])

  const search = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const clearResults = useCallback(() => {
    setSearchQuery('')
    setCandidates([])
    setError(null)
    setIsSearching(false)
  }, [])

  return { candidates, isSearching, error, search, clearResults }
}