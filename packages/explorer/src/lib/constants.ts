/**
 * Well-known property IDs for the Knowledge Graph
 * These are common/relation types used throughout the system
 */

// ---------------------------------------------------------------------------
// Core Relation Types
// ---------------------------------------------------------------------------

/**
 * TYPE relation: defines what type an entity is
 * from_id is the entity, to_id is the type entity
 */
export const RELATION_TYPE = 'TYPE'

/**
 * NAME property: human-readable name for an entity
 */
export const PROPERTY_NAME = 'NAME'

/**
 * DESCRIPTION property: longer description text
 */
export const PROPERTY_DESCRIPTION = 'DESCRIPTION'

// ---------------------------------------------------------------------------
// Common Property IDs (may be entity IDs or string identifiers)
// ---------------------------------------------------------------------------

/**
 * Array of well-known property/relation types for display purposes
 */
export const WELL_KNOWN_PROPERTIES = [RELATION_TYPE, PROPERTY_NAME, PROPERTY_DESCRIPTION] as const

/**
 * Check if a property ID is a well-known property
 */
export function isWellKnown(propertyId: string): boolean {
	return WELL_KNOWN_PROPERTIES.includes(propertyId as (typeof WELL_KNOWN_PROPERTIES)[number])
}

/**
 * Format a property ID for display
 * For well-known properties, show the name directly
 * For others, truncate if needed
 */
export function formatPropertyId(propertyId: string, maxLength = 12): string {
	if (isWellKnown(propertyId)) {
		return propertyId
	}
	return propertyId.length > maxLength ? `${propertyId.slice(0, maxLength)}...` : propertyId
}
