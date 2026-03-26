import { idToHex, serializeValue } from '@geo-runtime/shared'
import type { PropertyValue } from '@geoprotocol/grc-20'
import type pg from 'pg'

/** Ensure an entity row exists (INSERT ... ON CONFLICT DO NOTHING). */
export async function ensureEntity(
	client: pg.PoolClient,
	id: string,
	spaceId?: string,
): Promise<void> {
	if (spaceId) {
		await client.query(
			`INSERT INTO entities (id, space_id) VALUES ($1, $2)
			 ON CONFLICT (id) DO UPDATE SET space_id = COALESCE(entities.space_id, EXCLUDED.space_id)`,
			[id, spaceId],
		)
	} else {
		await client.query(`INSERT INTO entities (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [id])
	}
}

/** Upsert a triple from a PropertyValue. */
export async function upsertTriple(
	client: pg.PoolClient,
	entityId: string,
	pv: PropertyValue,
): Promise<void> {
	const propId = idToHex(pv.property)
	const stored = serializeValue(pv.value)
	const language = pv.value.type === 'text' && pv.value.language ? idToHex(pv.value.language) : ''

	await client.query(
		`INSERT INTO triples (entity_id, property_id, value_type, value, language)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (entity_id, property_id, language)
		 DO UPDATE SET value_type = EXCLUDED.value_type, value = EXCLUDED.value`,
		[entityId, propId, stored.type, JSON.stringify(stored.payload), language],
	)
}

/** Delete an entity if it has no triples and no alive relations. */
export async function deleteEntityIfOrphan(client: pg.PoolClient, entityId: string): Promise<void> {
	await client.query(
		`DELETE FROM entities
		 WHERE id = $1 AND status = 'alive'
		   AND NOT EXISTS (SELECT 1 FROM triples t WHERE t.entity_id = $1)
		   AND NOT EXISTS (SELECT 1 FROM relations r WHERE r.from_id = $1 AND r.status = 'alive')
		   AND NOT EXISTS (SELECT 1 FROM relations r WHERE r.to_id = $1 AND r.status = 'alive')`,
		[entityId],
	)
}
