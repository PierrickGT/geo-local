/**
 * API Types for Knowledge Graph Explorer
 * These types match the responses from packages/api/src/routes.ts
 */

// ---------------------------------------------------------------------------
// Entity Types
// ---------------------------------------------------------------------------

export interface Entity {
	id: string
	createdAt: string
	updatedAt: string
	propertiesText?: string | null
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

export type ValueType = 'text' | 'number' | 'boolean' | 'reference' | 'json' | 'date'

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
	id: string
	fromId: string
	toId: string
	relationType: string
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

export interface SearchResponse {
	entities: Entity[]
}

// ---------------------------------------------------------------------------
// Edit Types
// ---------------------------------------------------------------------------

export type EditStatus = 'pending' | 'processing' | 'applied' | 'failed'

export interface DecodedOp {
	kind: string
	entityId: string
	propertyId?: string
	before?: unknown
	after?: unknown
	relationType?: string
	toId?: string
	fromId?: string
}

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
	decodedOps: DecodedOp[] | null
}

export interface EditsResponse {
	edits: Edit[]
}

// ---------------------------------------------------------------------------
// Types Endpoint
// ---------------------------------------------------------------------------

export interface TypeItem {
	id: string
	name: string | null
}

// ---------------------------------------------------------------------------
// API Error Response
// ---------------------------------------------------------------------------

export interface ApiErrorResponse {
	error: string
}
