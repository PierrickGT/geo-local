/**
 * Entity API Endpoints
 * Functions for fetching entities, entity details, and relations
 */

import { get } from './client'
import type { EntitiesResponse, EntityRelationsResponse, EntityResponse, TypeItem } from './types'

// ---------------------------------------------------------------------------
// Get Entities (list with pagination)
// ---------------------------------------------------------------------------

export interface GetEntitiesParams {
	type?: string
	limit?: number
	offset?: number
}

/**
 * Fetch paginated list of entities.
 *
 * @param params - Optional filter and pagination params
 * @returns Entities response with pagination metadata
 */
export async function getEntities(params: GetEntitiesParams = {}): Promise<EntitiesResponse> {
	const { type, limit, offset } = params

	const searchParams = new URLSearchParams()
	if (type !== undefined) {
		searchParams.set('type', type)
	}
	if (limit !== undefined) {
		searchParams.set('limit', String(limit))
	}
	if (offset !== undefined) {
		searchParams.set('offset', String(offset))
	}

	const queryString = searchParams.toString()
	const path = queryString ? `/entities?${queryString}` : '/entities'

	return get<EntitiesResponse>(path)
}

// ---------------------------------------------------------------------------
// Get Entity (detail with triples and relations)
// ---------------------------------------------------------------------------

/**
 * Fetch a single entity with its triples, outgoing relations, and incoming relations.
 *
 * @param id - Entity ID
 * @returns Entity detail response
 */
export async function getEntity(id: string): Promise<EntityResponse> {
	return get<EntityResponse>(`/entities/${encodeURIComponent(id)}`)
}

// ---------------------------------------------------------------------------
// Get Entity Relations
// ---------------------------------------------------------------------------

export interface GetEntityRelationsParams {
	direction?: 'outgoing' | 'incoming'
	type?: string
}

/**
 * Fetch relations for an entity, optionally filtered by direction and/or type.
 *
 * @param id - Entity ID
 * @param params - Optional filter params (direction, type)
 * @returns Relations response
 */
export async function getEntityRelations(
	id: string,
	params: GetEntityRelationsParams = {},
): Promise<EntityRelationsResponse> {
	const { direction, type } = params

	const searchParams = new URLSearchParams()
	if (direction !== undefined) {
		searchParams.set('direction', direction)
	}
	if (type !== undefined) {
		searchParams.set('type', type)
	}

	const queryString = searchParams.toString()
	const path = queryString
		? `/entities/${encodeURIComponent(id)}/relations?${queryString}`
		: `/entities/${encodeURIComponent(id)}/relations`

	return get<EntityRelationsResponse>(path)
}

// ---------------------------------------------------------------------------
// Get Types
// ---------------------------------------------------------------------------

/**
 * Fetch all known entity types (distinct targets of TYPE relations).
 *
 * @returns Array of type objects with id and optional name
 */
export async function getTypes(): Promise<TypeItem[]> {
	return get<TypeItem[]>('/types')
}
