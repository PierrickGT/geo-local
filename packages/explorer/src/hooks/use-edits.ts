/**
 * Query hook for edits
 * useEdits
 */

import { useQuery } from '@tanstack/react-query'
import { getEdits } from '~/api/edits'
import type { EditStatus, EditsResponse } from '~/api/types'

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const editKeys = {
	all: ['edits'] as const,
	list: (status?: EditStatus, limit?: number) =>
		[...editKeys.all, 'list', { status, limit }] as const,
}

// ---------------------------------------------------------------------------
// useEdits - Edit history with optional status filter
// ---------------------------------------------------------------------------

export interface UseEditsParams {
	status?: EditStatus
	limit?: number
}

export interface UseEditsReturn {
	edits: EditsResponse | undefined
	isLoading: boolean
	isError: boolean
	error: Error | null
}

/**
 * Fetch edit history, optionally filtered by status.
 *
 * @param params - Optional filter params (status, limit)
 * @returns Query result with edits, loading/error states
 */
export function useEdits(params: UseEditsParams = {}): UseEditsReturn {
	const { status, limit } = params

	const query = useQuery({
		queryKey: editKeys.list(status, limit),
		queryFn: () => getEdits({ status, limit }),
	})

	return {
		edits: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
	}
}
