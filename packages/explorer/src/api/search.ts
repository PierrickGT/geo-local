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
	sort?: 'updated_at' | 'created_at' | 'properties_text'
	order?: 'asc' | 'desc'
}

/**
 * Perform a full-text search across entity triples.
 *
 * @param params - Search params (query required, limit/sort/order optional)
 * @returns Search results response
 */
export async function searchEntities(params: SearchEntitiesParams): Promise<SearchResponse> {
	const { q, limit, sort, order } = params

	const searchParams = new URLSearchParams()
	searchParams.set('q', q)
	if (limit !== undefined) {
		searchParams.set('limit', String(limit))
	}
	if (sort !== undefined) {
		searchParams.set('sort', sort)
	}
	if (order !== undefined) {
		searchParams.set('order', order)
	}

	return get<SearchResponse>(`/search?${searchParams.toString()}`)
}
