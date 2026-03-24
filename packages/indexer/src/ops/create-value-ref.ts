import { idToHex } from '@geo-runtime/shared'
import type { CreateValueRef } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { ensureEntity } from './shared.js'

export async function createValueRef(client: pg.PoolClient, op: CreateValueRef): Promise<void> {
	const entityId = idToHex(op.entity)

	await ensureEntity(client, entityId)

	await client.query(
		`INSERT INTO value_refs (id, entity_id, property_id, language, space_id)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (id) DO UPDATE SET
		   entity_id = EXCLUDED.entity_id,
		   property_id = EXCLUDED.property_id,
		   language = EXCLUDED.language,
		   space_id = EXCLUDED.space_id`,
		[
			idToHex(op.id),
			entityId,
			idToHex(op.property),
			op.language ? idToHex(op.language) : null,
			op.space ? idToHex(op.space) : null,
		],
	)
}
