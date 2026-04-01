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
 * NAME property entity ID (from @geoprotocol/geo-sdk SystemIds)
 * Used to look up the NAME triple in entity data
 */
export const NAME_PROPERTY_ID = 'a126ca530c8e48d5b88882c734c38935'

/**
 * DESCRIPTION property: longer description text
 */
export const PROPERTY_DESCRIPTION = 'DESCRIPTION'

/**
 * DESCRIPTION property entity ID (from @geoprotocol/geo-sdk SystemIds)
 */
export const DESCRIPTION_PROPERTY_ID = '9b1f76ff9711404c861e59dc3fa7d037'

/**
 * TYPES property entity ID (from @geoprotocol/geo-sdk SystemIds)
 * This is the relation type for TYPE relations
 */
export const TYPES_PROPERTY_ID = '8f151ba4de204e3c9cb499ddf96f48f1'

// ---------------------------------------------------------------------------
// Common Property IDs (may be entity IDs or string identifiers)
// ---------------------------------------------------------------------------

/**
 * Array of well-known property/relation types for display purposes
 */
export const WELL_KNOWN_PROPERTIES = [RELATION_TYPE, PROPERTY_NAME, PROPERTY_DESCRIPTION] as const

/**
 * Mapping from system property IDs to their display names
 * These IDs come from @geoprotocol/geo-sdk SystemIds
 *
 * These serve as fallback names when the entity doesn't exist in the DB
 * (usePropertyNames will override these when the entity has a NAME triple).
 */
export const PROPERTY_ID_TO_NAME: Record<string, string> = {
	[NAME_PROPERTY_ID]: 'Name',
	[DESCRIPTION_PROPERTY_ID]: 'Description',
	[TYPES_PROPERTY_ID]: 'Type',
}

/**
 * Check if a property ID is a well-known property
 */
export function isWellKnown(propertyId: string): boolean {
	return WELL_KNOWN_PROPERTIES.includes(propertyId as (typeof WELL_KNOWN_PROPERTIES)[number])
}

/**
 * Format a property ID for display
 * For well-known properties, show the name directly
 * For system property IDs, map to their display names
 * For others, return as-is
 */
export function formatPropertyId(propertyId: string): string {
	if (propertyId in PROPERTY_ID_TO_NAME) {
		return PROPERTY_ID_TO_NAME[propertyId]
	}
	if (isWellKnown(propertyId)) {
		return propertyId.charAt(0).toUpperCase() + propertyId.slice(1).toLowerCase()
	}
	return propertyId
}
