/**
 * API Types for Knowledge Graph Explorer
 * These types match the responses from packages/api/src/routes.ts
 */

// ---------------------------------------------------------------------------
// Entity Types
// ---------------------------------------------------------------------------

export type EntityStatus = 'alive' | 'deleted'

export interface Entity {
	id: string
	status: EntityStatus
	createdAt: string
	updatedAt: string
}

export interface EntitiesResponse {
	entities: Entity[]
	total: number
	limit: number
	offset: number
}

// ---------------------------------------------------------------------------
// Triple Types
// ---------------------------------------------------------------------------

export type ValueType = 'text' | 'number' | 'boolean' | 'reference' | 'json'

/**
 * StoredValue represents the JSON-encoded value in triples.
 * The structure depends on value_type:
 * - text: { value: string }
 * - number: { value: number }
 * - boolean: { value: boolean }
 * - reference: { value: string } (entity ID)
 * - json: { value: unknown }
 */
export interface StoredValue {
	value: string | number | boolean | unknown
}

export interface Triple {
	entityId: string
	propertyId: string
	valueType: ValueType
	value: StoredValue
	language: string | null
}

// ---------------------------------------------------------------------------
// Relation Types
// ---------------------------------------------------------------------------

export interface Relation {
	fromId: string
	toId: string
	relationType: string
	status: EntityStatus
	createdAt: string
}

export interface EntityRelationsResponse {
	relations: Relation[]
}

// ---------------------------------------------------------------------------
// Entity Detail (combines entity with related data)
// ---------------------------------------------------------------------------

export interface EntityDetail extends Entity {
	triples: Triple[]
	outgoing: Relation[]
	incoming: Relation[]
}

export interface EntityResponse {
	entity: EntityDetail
}

// ---------------------------------------------------------------------------
// Search Types
// ---------------------------------------------------------------------------

export interface SearchResult {
	entityId: string
	propertyId: string
	value: StoredValue
	language: string | null
}

export interface SearchResponse {
	results: SearchResult[]
}

// ---------------------------------------------------------------------------
// Edit Types
// ---------------------------------------------------------------------------

export type EditStatus = 'pending' | 'processing' | 'applied' | 'failed'

export interface Edit {
	id: string
	spaceId: string
	author: string
	name: string
	status: EditStatus
	opCount: number
	createdAt: string
	appliedAt: string | null
	errorMsg: string | null
}

export interface EditsResponse {
	edits: Edit[]
}

// ---------------------------------------------------------------------------
// Types (Entity Types from TYPE relations)
// ---------------------------------------------------------------------------

export interface TypesResponse {
	types: string[]
}

// ---------------------------------------------------------------------------
// API Error Response
// ---------------------------------------------------------------------------

export interface ApiErrorResponse {
	error: string
}
