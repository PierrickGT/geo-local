/**
 * Mutation API Client for Knowledge Graph Explorer
 * POSTs mutations to /ingest/edits/build (proxied to ingest server on :3001)
 * Also provides getEdit for polling edit status via /api/edits/:id
 */

import { ApiError, get } from './client'
import type { ApiErrorResponse, Edit, ValueType } from './types'

// ---------------------------------------------------------------------------
// Mutation Payload Types (mirror ingest server's BuildBody & SDK types)
// ---------------------------------------------------------------------------

/**
 * A single mutation in the build request.
 * Mirrors the union type in packages/ingest/src/routes.ts BuildBody.mutations
 */
export type Mutation =
	| { type: 'createEntity'; params: CreateEntityParams }
	| { type: 'updateEntity'; params: UpdateEntityParams }
	| { type: 'deleteEntity'; params: DeleteEntityParams }
	| { type: 'createRelation'; params: CreateRelationParams }
	| { type: 'deleteRelation'; params: DeleteRelationParams }

/**
 * Body sent to POST /ingest/edits/build
 */
export interface BuildBody {
	name?: string
	author?: string
	mutations: Mutation[]
}

/**
 * Response from POST /ingest/edits/build
 */
export interface BuildResponse {
	id: string
	name: string
	opCount: number
	entityIds: string[]
}

// ---------------------------------------------------------------------------
// Entity Mutation Params (simplified subset of SDK EntityParams)
// ---------------------------------------------------------------------------

export interface TypedValueParam {
	type: ValueType
	value: string | number | boolean
}

export type PropertyValueParam = {
	property: string
} & TypedValueParam

export interface CreateEntityParams {
	id?: string
	name?: string
	description?: string
	values?: PropertyValueParam[]
	types?: string[]
}

export interface UpdateEntityParams {
	id: string
	name?: string
	description?: string
	values?: PropertyValueParam[]
	unset?: UnsetPropertyParam[]
}

export interface UnsetPropertyParam {
	property: string
	language?: string
}

export interface DeleteEntityParams {
	id: string
}

// ---------------------------------------------------------------------------
// Relation Mutation Params
// ---------------------------------------------------------------------------

export interface CreateRelationParams {
	id?: string
	fromEntity: string
	toEntity: string
	type: string
}

export interface DeleteRelationParams {
	id: string
}

// ---------------------------------------------------------------------------
// INGEST API Base
// ---------------------------------------------------------------------------

const INGEST_BASE = '/ingest'

/**
 * POST mutations to the ingest server's /edits/build endpoint.
 * Uses the ingest proxy (/ingest) configured in vite.config.ts.
 *
 * @param body - BuildBody with mutations array
 * @returns BuildResponse with edit id and metadata
 * @throws ApiError on non-2xx responses or network errors
 */
export async function submitMutations(body: BuildBody): Promise<BuildResponse> {
	const url = `${INGEST_BASE}/edits/build`

	let response: Response
	try {
		response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
	} catch (error) {
		if (error instanceof TypeError) {
			throw new ApiError(0, 'Network error: Unable to connect to ingest server.', {
				error: 'Network error',
				originalError: error.message,
			} as ApiErrorResponse)
		}
		throw error
	}

	if (!response.ok) {
		let errorData: ApiErrorResponse | unknown = {}
		try {
			errorData = await response.json()
		} catch {
			// Response body isn't valid JSON
		}

		const message = `Ingest API Error: ${response.status} ${response.statusText}`
		throw new ApiError(response.status, message, errorData)
	}

	return response.json() as Promise<BuildResponse>
}

/**
 * Fetch a single edit by ID for polling mutation status.
 * Uses the existing /api proxy to the read API server.
 *
 * @param id - Edit ID (char32 hex)
 * @returns Edit with status, errorMsg, and other fields
 * @throws ApiError on non-2xx responses
 */
export async function getEdit(id: string): Promise<Edit> {
	return get<Edit>(`/edits/${id}`)
}
