/**
 * Query hooks for entities
 * useEntities, useEntity, useEntityRelations, useTypes
 */

import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getEntities, getEntity, getEntityRelations, getTypes } from '~/api/entities'
import { SYSTEM_ENTITY_NAMES } from '~/lib/constants'
import type { GetEntitiesParams, GetEntityRelationsParams } from '~/api/entities'
import type { EntitiesResponse, EntityRelationsResponse, EntityResponse } from '~/api/types'
import { NAME_PROPERTY_ID } from '~/lib/constants'

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
	sort?: 'updated_at' | 'created_at' | 'properties_text'
	order?: 'asc' | 'desc'
}

export interface UseEntitiesReturn {
	entities: EntitiesResponse | undefined
	total: number | undefined
	isLoading: boolean
	isError: boolean
	error: Error | null
	refetch: () => void
}

/**
 * Fetch paginated list of entities.
 *
 * @param params - Optional filter and pagination params
 * @returns Query result with entities, total, loading/error states, and refetch
 */
export function useEntities(params: UseEntitiesParams = {}): UseEntitiesReturn {
	const { type, limit = 20, offset = 0, sort, order } = params

	const query = useQuery({
		queryKey: entityKeys.list({ type, limit, offset, sort, order }),
		queryFn: () => getEntities({ type, limit, offset, sort, order }),
	})

	return {
		entities: query.data,
		total: query.data?.total,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: () => {
			query.refetch()
		},
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
	refetch: () => void
}

/**
 * Fetch a single entity with its triples, outgoing relations, and incoming relations.
 *
 * @param id - Entity ID
 * @returns Query result with entity, loading/error states, and refetch
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
		refetch: () => {
			query.refetch()
		},
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
	refetch: () => void
}

/**
 * Fetch relations for an entity, optionally filtered by direction and/or type.
 *
 * @param id - Entity ID
 * @param params - Optional filter params (direction, type)
 * @returns Query result with relations, loading/error states, and refetch
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
		refetch: () => {
			query.refetch()
		},
	}
}

// ---------------------------------------------------------------------------
// useTypes - Known entity types (fetched from API)
// ---------------------------------------------------------------------------

export interface UseTypesReturn {
	types: { id: string; name: string | null }[]
	isLoading: boolean
	isError: boolean
	error: Error | null
}

/**
 * Get known entity types for the filter dropdown.
 * Fetches distinct type entities from the /types API endpoint.
 *
 * @returns List of type objects with id and optional name
 */
export function useTypes(): UseTypesReturn {
	const query = useQuery({
		queryKey: entityKeys.types(),
		queryFn: () => getTypes(),
		staleTime: 60_000,
	})

	return {
		types: query.data ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
	}
}

// ---------------------------------------------------------------------------
// usePropertyNames - Resolve property IDs to their NAME values
// ---------------------------------------------------------------------------

export interface UsePropertyNamesReturn {
	names: Map<string, string | undefined>
	isLoading: boolean
}

/**
 * Resolve property/relation type IDs to their human-readable NAME values.
 * Fetches each entity in parallel and extracts its NAME triple.
 *
 * @param ids - Array of entity IDs to resolve
 * @returns Map of ID -> NAME value (undefined if no NAME found or loading)
 */
export function usePropertyNames(ids: string[]): UsePropertyNamesReturn {
	// Deduplicate IDs to avoid redundant fetches
	const uniqueIds = [...new Set(ids)]

	const queries = useQueries({
		queries: uniqueIds.map((id) => ({
			queryKey: entityKeys.detail(id),
			queryFn: () => getEntity(id),
			enabled: Boolean(id),
		})),
	})

	const isLoading = queries.some((q) => q.isLoading)

	// Serialize resolved names to create a stable memoization key.
	// This ensures the Map is recomputed when any query result changes,
	// while preserving reference identity across renders when data is unchanged.
	const resolvedKey = uniqueIds
		.map((id, i) => {
			const entity = queries[i]?.data?.entity
			const nameTriple = entity?.triples.find(
				(t) => t.propertyId === NAME_PROPERTY_ID && t.valueType === 'text',
			)
			return `${id}=${nameTriple?.value.value ?? ''}`
		})
		.join('|')

	const names = useMemo(() => {
		const map = new Map<string, string | undefined>()
		for (let i = 0; i < uniqueIds.length; i++) {
			const entity = queries[i]?.data?.entity
			if (entity) {
				const nameTriple = entity.triples.find(
					(t) => t.propertyId === NAME_PROPERTY_ID && t.valueType === 'text',
				)
				const resolved = nameTriple?.value.value as string | undefined
				map.set(uniqueIds[i], resolved ?? SYSTEM_ENTITY_NAMES[uniqueIds[i]])
			} else {
				map.set(uniqueIds[i], SYSTEM_ENTITY_NAMES[uniqueIds[i]])
			}
		}
		return map
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [resolvedKey])

	return { names, isLoading }
}
