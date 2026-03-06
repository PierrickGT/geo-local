/**
 * Search API Endpoints
 * Functions for full-text search across the knowledge graph
 */

import { get } from './client'
import type { SearchResponse } from './types'

// ---------------------------------------------------------------------------
// Search Entities
// ---------------------------------------------------------------------------

export interface SearchEntitiesParams {
	q: string
	limit?: number
}

/**
 * Perform a full-text search across entity triples.
 *
 * @param params - Search params (query required, limit optional)
 * @returns Search results response
 */
export async function searchEntities(params: SearchEntitiesParams): Promise<SearchResponse> {
	const { q, limit } = params

	const searchParams = new URLSearchParams()
	searchParams.set('q', q)
	if (limit !== undefined) {
		searchParams.set('limit', String(limit))
	}

	return get<SearchResponse>(`/search?${searchParams.toString()}`)
}
