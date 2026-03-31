import { idToHex } from '@geo-runtime/shared'
import type { CreateEntity } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { upsertTriple } from './shared.js'

export async function createEntity(
	client: pg.PoolClient,
	op: CreateEntity,
	spaceId?: string,
): Promise<void> {
	const id = idToHex(op.id)

	if (spaceId) {
		await client.query(
			`INSERT INTO entities (id, space_id) VALUES ($1, $2)
			 ON CONFLICT (id) DO UPDATE SET updated_at = now(), space_id = COALESCE(entities.space_id, EXCLUDED.space_id)`,
			[id, spaceId],
		)
	} else {
		await client.query(
			`INSERT INTO entities (id) VALUES ($1)
			 ON CONFLICT (id) DO UPDATE SET updated_at = now()`,
			[id],
		)
	}

	for (const pv of op.values) {
		await upsertTriple(client, id, pv)
	}
}
