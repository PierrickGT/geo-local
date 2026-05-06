/**
 * Query hook for search with debouncing
 * useSearch
 */

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { searchEntities } from '~/api/search'
import type { SearchResponse } from '~/api/types'

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const searchKeys = {
	all: ['search'] as const,
	results: (query: string, limit?: number, sort?: string, order?: string) =>
		[...searchKeys.all, query, limit, sort, order] as const,
}

// ---------------------------------------------------------------------------
// useSearch - Debounced search results
// ---------------------------------------------------------------------------

export interface UseSearchParams {
	q: string
	limit?: number
	sort?: 'updated_at' | 'created_at' | 'properties_text'
	order?: 'asc' | 'desc'
	debounceMs?: number
}

export interface UseSearchReturn {
	results: SearchResponse | undefined
	isLoading: boolean
	isDebouncing: boolean
	isError: boolean
	error: Error | null
	refetch: () => void
}

const DEFAULT_DEBOUNCE_MS = 300

/**
 * Perform a debounced full-text search.
 *
 * @param params - Search params with query, optional limit, and debounce delay
 * @returns Query result with results, loading/error states, and debouncing state
 */
export function useSearch(params: UseSearchParams): UseSearchReturn {
	const { q, limit, sort, order, debounceMs = DEFAULT_DEBOUNCE_MS } = params

	// Debounce the query value
	const [debouncedQuery, setDebouncedQuery] = useState(q)

	useEffect(() => {
		// Don't debounce empty queries - immediately clear
		if (!q.trim()) {
			setDebouncedQuery('')
			return
		}

		const timeoutId = setTimeout(() => {
			setDebouncedQuery(q)
		}, debounceMs)

		return () => clearTimeout(timeoutId)
	}, [q, debounceMs])

	// Determine if we're currently debouncing
	const isDebouncing = q !== debouncedQuery && q.trim() !== ''

	const query = useQuery({
		queryKey: searchKeys.results(debouncedQuery, limit, sort, order),
		queryFn: () => searchEntities({ q: debouncedQuery, limit, sort, order }),
		enabled: Boolean(debouncedQuery.trim()),
	})

	return {
		results: query.data,
		isLoading: query.isLoading,
		isDebouncing,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	}
}
