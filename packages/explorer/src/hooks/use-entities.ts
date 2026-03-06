/**
 * Query hooks for entities
 * useEntities, useEntity, useEntityRelations, useTypes
 */

import { useQuery } from '@tanstack/react-query'
import { getEntities, getEntity, getEntityRelations, getTypes } from '~/api/entities'
import type { GetEntitiesParams, GetEntityRelationsParams } from '~/api/entities'
import type {
	EntitiesResponse,
	EntityRelationsResponse,
	EntityResponse,
	TypesResponse,
} from '~/api/types'

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const entityKeys = {
	all: ['entities'] as const,
	list: (params: GetEntitiesParams) => [...entityKeys.all, 'list', params] as const,
	detail: (id: string) => [...entityKeys.all, 'detail', id] as const,
	relations: (id: string, params: GetEntityRelationsParams) =>
		[...entityKeys.all, 'relations', id, params] as const,
	types: () => [...entityKeys.all, 'types'] as const,
}

// ---------------------------------------------------------------------------
// useEntities - Paginated entity list with optional type filter
// ---------------------------------------------------------------------------

export interface UseEntitiesParams {
	type?: string
	limit?: number
	offset?: number
}

export interface UseEntitiesReturn {
	entities: EntitiesResponse | undefined
	total: number | undefined
	isLoading: boolean
	isError: boolean
	error: Error | null
}

/**
 * Fetch paginated list of entities.
 *
 * @param params - Optional filter and pagination params
 * @returns Query result with entities, total, loading/error states
 */
export function useEntities(params: UseEntitiesParams = {}): UseEntitiesReturn {
	const { type, limit = 20, offset = 0 } = params

	const query = useQuery({
		queryKey: entityKeys.list({ type, limit, offset }),
		queryFn: () => getEntities({ type, limit, offset }),
	})

	return {
		entities: query.data,
		total: query.data?.total,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
	}
}

// ---------------------------------------------------------------------------
// useEntity - Single entity detail with triples and relations
// ---------------------------------------------------------------------------

export interface UseEntityReturn {
	entity: EntityResponse | undefined
	isLoading: boolean
	isError: boolean
	error: Error | null
}

/**
 * Fetch a single entity with its triples, outgoing relations, and incoming relations.
 *
 * @param id - Entity ID
 * @returns Query result with entity, loading/error states
 */
export function useEntity(id: string): UseEntityReturn {
	const query = useQuery({
		queryKey: entityKeys.detail(id),
		queryFn: () => getEntity(id),
		enabled: Boolean(id),
	})

	return {
		entity: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
	}
}

// ---------------------------------------------------------------------------
// useEntityRelations - Relations for an entity
// ---------------------------------------------------------------------------

export interface UseEntityRelationsParams {
	direction?: 'outgoing' | 'incoming'
	type?: string
}

export interface UseEntityRelationsReturn {
	relations: EntityRelationsResponse | undefined
	isLoading: boolean
	isError: boolean
	error: Error | null
}

/**
 * Fetch relations for an entity, optionally filtered by direction and/or type.
 *
 * @param id - Entity ID
 * @param params - Optional filter params (direction, type)
 * @returns Query result with relations, loading/error states
 */
export function useEntityRelations(
	id: string,
	params: UseEntityRelationsParams = {},
): UseEntityRelationsReturn {
	const { direction, type } = params

	const query = useQuery({
		queryKey: entityKeys.relations(id, { direction, type }),
		queryFn: () => getEntityRelations(id, { direction, type }),
		enabled: Boolean(id),
	})

	return {
		relations: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
	}
}

// ---------------------------------------------------------------------------
// useTypes - Entity types from TYPE relations
// ---------------------------------------------------------------------------

export interface UseTypesReturn {
	types: TypesResponse | undefined
	isLoading: boolean
	isError: boolean
	error: Error | null
}

/**
 * Fetch distinct entity types from TYPE relations.
 *
 * @returns Query result with types, loading/error states
 */
export function useTypes(): UseTypesReturn {
	const query = useQuery({
		queryKey: entityKeys.types(),
		queryFn: () => getTypes(),
	})

	return {
		types: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
	}
}
