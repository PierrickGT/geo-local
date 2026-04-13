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

/**
 * TYPE entity ID (from @geoprotocol/geo-sdk SystemIds)
 * This is the entity that represents the "Type" concept itself.
 * Entities with an outgoing TYPE relation pointing to this ID are themselves types.
 */
export const TYPE_ENTITY_ID = 'e7d737c536764c609fa16aa64a8c90ad'

/**
 * DATA TYPE entity ID (from @geoprotocol/geo-sdk SystemIds)
 * This is the entity that represents the "Data type" category.
 * Data type entities (Text, Checkbox, Integer, etc.) are of this type.
 */
export const DATA_TYPE_ENTITY_ID = 'a35e058b52d148d2b02d773933d90b7e'

/**
 * RENDERABLE TYPE entity ID (from @geoprotocol/geo-sdk SystemIds)
 * This is the entity that represents the "Renderable type" category.
 * Renderable entities (Image, URL) are of this type.
 */
export const RENDERABLE_TYPE_ENTITY_ID = '5338cc2897044e96b5477dfc58da6fc7'

/**
 * RELATION entity ID (from @geoprotocol/geo-sdk SystemIds)
 * This is the entity that represents the "Relation" type.
 * Entities with an outgoing TYPE relation pointing to this ID are relation types.
 */
export const RELATION_ENTITY_ID = '4b6d9fc1fbfe474c861c83398e1b50d9'

/**
 * PROPERTY entity ID (from @geoprotocol/geo-sdk SystemIds)
 * This is the entity that represents the "Property" type.
 * Entities with an outgoing TYPE relation pointing to this ID are property types.
 */
export const PROPERTY_ENTITY_ID = '808a04ceb21c4d888ad12e240613e5ca'

/**
 * DATA_TYPE relation type ID (from @geoprotocol/geo-sdk SystemIds)
 * Used to define the data type of a property (Text, Number, Boolean, etc.)
 */
export const DATA_TYPE_PROPERTY_ID = '6d29d57849bb4959baf72cc696b1671a'

/**
 * PROPERTIES relation type ID (from @geoprotocol/geo-sdk SystemIds)
 * Used to link a Type entity to its Property entities
 */
export const PROPERTIES_PROPERTY_ID = '01412f8381894ab1836565c7fd358cc1'

/**
 * COLLECTION_ITEM relation type ID (from @geoprotocol/geo-sdk SystemIds)
 * Used to denote collection items in data blocks
 */
export const COLLECTION_ITEM_PROPERTY_ID = 'a99f9ce12ffa4dac8c61f6310d46064a'

// ---------------------------------------------------------------------------
// System Entity Names
// ---------------------------------------------------------------------------

/**
 * Well-known system entity names (from @geoprotocol/geo-sdk SystemIds).
 * These entities exist as bare rows without NAME triples, so the explorer
 * cannot resolve their names from the API. This map provides fallback names.
 */
export const SYSTEM_ENTITY_NAMES: Record<string, string> = {
	[TYPE_ENTITY_ID]: 'Type',
	[DATA_TYPE_ENTITY_ID]: 'Data type',
	[RENDERABLE_TYPE_ENTITY_ID]: 'Renderable type',
	'9edb6fcce4544aa5861139d7f024c010': 'Text',
	'808a04ceb21c4d888ad12e240613e5ca': 'Property',
	'7aa4792eeacd41868272fa7fc18298ac': 'Checkbox',
	'149fd752d9d04f80820d1d942eea7841': 'Integer',
	'9b597aaec31c46c88565a370da0c2a65': 'Float',
	a3288c22a0564f6fb409fbcccb2c118c: 'Decimal',
	e661d10292794449a22367dbae1be05a: 'Date',
	ad75102b03c04d59903813ede9482742: 'Time',
	'167664f668f840e1976b20bd16ed8d47': 'Datetime',
	caf4dd12ba4844b99171aff6c1313b50: 'Schedule',
	'66b433247667496899b48a89bd1de22b': 'Bytes',
	f3f790c4c74e4d23a0a91e8ef84e30d9: 'Image',
	'283127c96142468492ed90b0ebc7f29a': 'URL',
	df250d17e364413d97792ddaae841e34: 'Point',
	'4b6d9fc1fbfe474c861c83398e1b50d9': 'Relation',
}

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
	[DATA_TYPE_PROPERTY_ID]: 'Data type',
	[PROPERTIES_PROPERTY_ID]: 'Properties',
	[COLLECTION_ITEM_PROPERTY_ID]: 'Collection item',
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
