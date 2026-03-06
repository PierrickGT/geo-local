/**
 * Edits API Endpoints
 * Functions for fetching edit history
 */

import { get } from './client'
import type { EditStatus, EditsResponse } from './types'

// ---------------------------------------------------------------------------
// Get Edits
// ---------------------------------------------------------------------------

export interface GetEditsParams {
	status?: EditStatus
	limit?: number
}

/**
 * Fetch edit history, optionally filtered by status.
 *
 * @param params - Optional filter params (status, limit)
 * @returns Edits response
 */
export async function getEdits(params: GetEditsParams = {}): Promise<EditsResponse> {
	const { status, limit } = params

	const searchParams = new URLSearchParams()
	if (status !== undefined) {
		searchParams.set('status', status)
	}
	if (limit !== undefined) {
		searchParams.set('limit', String(limit))
	}

	const queryString = searchParams.toString()
	const path = queryString ? `/edits?${queryString}` : '/edits'

	return get<EditsResponse>(path)
}
