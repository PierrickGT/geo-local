import type pg from 'pg'
import type { PropertyValue } from '@geoprotocol/grc-20'
import { idToHex, serializeValue } from '@geo-runtime/shared'

/** Ensure an entity row exists (INSERT ... ON CONFLICT DO NOTHING). */
export async function ensureEntity(client: pg.PoolClient, id: string): Promise<void> {
	await client.query(
		`INSERT INTO entities (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
		[id],
	)
}

/** Upsert a triple from a PropertyValue. */
export async function upsertTriple(
	client: pg.PoolClient,
	entityId: string,
	pv: PropertyValue,
): Promise<void> {
	const propId = idToHex(pv.property)
	const stored = serializeValue(pv.value)
	const language = pv.value.type === 'text' && pv.value.language
		? idToHex(pv.value.language)
		: ''

	await client.query(
		`INSERT INTO triples (entity_id, property_id, value_type, value, language)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (entity_id, property_id, language)
		 DO UPDATE SET value_type = EXCLUDED.value_type, value = EXCLUDED.value`,
		[entityId, propId, stored.type, JSON.stringify(stored.payload), language],
	)
}
